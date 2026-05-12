import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { translateText } from '../services/translate.service.js'
import { recordQuery } from '../middleware/telemetry.js'
import type { TranslateResponse } from '../types/index.js'

const TranslateSchema = z.object({
  text:           z.string().min(1).max(8192),
  targetLanguage: z.enum(['english', 'tamil', 'hindi', 'swahili']),
  sourceLanguage: z.enum(['english', 'tamil', 'hindi', 'swahili']).optional(),
})

export const translateRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/translate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = TranslateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error:      parsed.error.issues.map((i) => i.message).join('; '),
          code:       'INVALID_INPUT',
          statusCode: 400,
        })
      }

      const { text, targetLanguage, sourceLanguage = 'english' } = parsed.data
      const startedAt = Date.now()

      try {
        const translatedText = await translateText(text, targetLanguage, sourceLanguage)

        recordQuery(
          Buffer.byteLength(text, 'utf8'),
          Buffer.byteLength(translatedText, 'utf8'),
        )

        const body: TranslateResponse = {
          translatedText,
          sourceLanguage,
          targetLanguage,
          processingMs: Date.now() - startedAt,
        }
        return reply.send(body)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? 'TRANSLATION_ERROR'
        if (code === 'MODEL_UNAVAILABLE') {
          return reply.status(503).send({ error: 'Translation model not available', code, statusCode: 503 })
        }
        request.log.error(err, 'Translation error')
        return reply.status(500).send({ error: 'Translation failed', code, statusCode: 500 })
      }
    },
  )
}
