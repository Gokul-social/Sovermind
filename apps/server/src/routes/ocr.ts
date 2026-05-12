import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import type { MultipartFile } from '@fastify/multipart'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { nanoid } from 'nanoid'
import { scanImage } from '../services/ocr.service.js'
import { extractJSONFromText } from '../services/llm.service.js'
import { recordQuery } from '../middleware/telemetry.js'
import type { OCREntity, OCRScanResponse } from '../types/index.js'

const TMP_DIR = path.join(os.tmpdir(), 'sovermind')
const MAX_FILE_SIZE = 10 * 1024 * 1024   // 10 MB

const OCR_EXTRACTION_PROMPT = `Extract all medicine names, dosages, and instructions from this prescription text.
Return a JSON array with this exact shape:
[{"name":"string","dosage":"string","instructions":"string","category":"string","confidence":number,"warning":"string or null"}]
Only return the JSON array, no explanation.`

function parseMockOCREntities(raw: string, ocrConfidence: number): OCREntity[] {
  try {
    const parsed = JSON.parse(raw) as Array<{
      name?:         string
      dosage?:       string
      instructions?: string
      category?:     string
      confidence?:   number
      warning?:      string | null
    }>
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      id:           nanoid(),
      name:         item.name         ?? 'UNKNOWN',
      dosage:       item.dosage       ?? '',
      instructions: item.instructions ?? '',
      category:     item.category     ?? 'medication',
      confidence:   Math.min(item.confidence ?? ocrConfidence, 100),
      warning:      item.warning ?? undefined,
    }))
  } catch {
    return []
  }
}

export const ocrRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/ocr/scan',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await fs.mkdir(TMP_DIR, { recursive: true })

      let tmpPath: string | null = null

      try {
        let file: MultipartFile | undefined
        try {
          file = await request.file({ limits: { fileSize: MAX_FILE_SIZE } })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('size')) {
            return reply.status(413).send({ error: 'Image exceeds 10 MB limit', code: 'FILE_TOO_LARGE', statusCode: 413 })
          }
          throw err
        }

        if (!file) {
          return reply.status(400).send({ error: 'No file uploaded', code: 'INVALID_INPUT', statusCode: 400 })
        }

        const ext     = path.extname(file.filename) || '.jpg'
        tmpPath = path.join(TMP_DIR, `ocr-${Date.now()}${ext}`)
        const buffer  = await file.toBuffer()
        await fs.writeFile(tmpPath, buffer)

        const startedAt = Date.now()

        // 1. Run OCR
        const ocrResult = await scanImage(tmpPath)

        // 2. Extract structured entities via LLM
        let entities: OCREntity[] = []
        try {
          const jsonRaw = await extractJSONFromText(ocrResult.text, OCR_EXTRACTION_PROMPT)
          entities = parseMockOCREntities(jsonRaw, ocrResult.confidence)
        } catch {
          // LLM extraction failed — return raw OCR text with no entities
        }

        recordQuery(
          buffer.byteLength,
          Buffer.byteLength(JSON.stringify(entities), 'utf8'),
        )

        const body: OCRScanResponse = {
          entities,
          rawText:      ocrResult.text,
          processingMs: Date.now() - startedAt,
        }
        return reply.send(body)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? 'OCR_ERROR'
        if (code === 'MODEL_UNAVAILABLE') {
          return reply.status(503).send({ error: 'OCR model not available', code, statusCode: 503 })
        }
        request.log.error(err, 'OCR error')
        return reply.status(500).send({ error: 'OCR scan failed', code, statusCode: 500 })
      } finally {
        if (tmpPath) {
          await fs.rm(tmpPath, { force: true }).catch(() => void 0)
        }
      }
    },
  )
}
