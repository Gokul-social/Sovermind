import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { transcribeAudio } from '../services/transcribe.service.js'
import { recordQuery } from '../middleware/telemetry.js'
import type { TranscribeResponse } from '../types/index.js'

const TMP_DIR      = path.join(os.tmpdir(), 'sovermind')
const MAX_AUDIO_SIZE = 50 * 1024 * 1024   // 50 MB (audio can be large)

export const transcribeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/transcribe',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await fs.mkdir(TMP_DIR, { recursive: true })

      let tmpPath: string | null = null

      try {
        let file
        try {
          file = await request.file({ limits: { fileSize: MAX_AUDIO_SIZE } })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('size')) {
            return reply.status(413).send({ error: 'Audio exceeds 50 MB limit', code: 'FILE_TOO_LARGE', statusCode: 413 })
          }
          throw err
        }

        if (!file) {
          return reply.status(400).send({ error: 'No audio file uploaded', code: 'INVALID_INPUT', statusCode: 400 })
        }

        const ext  = path.extname(file.filename) || '.webm'
        tmpPath = path.join(TMP_DIR, `audio-${Date.now()}${ext}`)
        const buffer = await file.toBuffer()
        await fs.writeFile(tmpPath, buffer)

        const startedAt = Date.now()
        const result    = await transcribeAudio(tmpPath)

        recordQuery(buffer.byteLength, Buffer.byteLength(result.text, 'utf8'))

        const body: TranscribeResponse = {
          transcript:   result.text,
          language:     result.language,
          durationMs:   result.durationMs,
          processingMs: Date.now() - startedAt,
        }
        return reply.send(body)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? 'TRANSCRIPTION_ERROR'
        if (code === 'MODEL_UNAVAILABLE') {
          return reply.status(503).send({ error: 'Whisper model not available', code, statusCode: 503 })
        }
        request.log.error(err, 'Transcription error')
        return reply.status(500).send({ error: 'Transcription failed', code, statusCode: 500 })
      } finally {
        if (tmpPath) {
          await fs.rm(tmpPath, { force: true }).catch(() => void 0)
        }
      }
    },
  )
}
