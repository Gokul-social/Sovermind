import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { runInference } from '../services/llm.service.js'
import { translateText } from '../services/translate.service.js'
import { recordQuery } from '../middleware/telemetry.js'
import type { Language, LLMQueryResponse } from '../types/index.js'

const LLMQuerySchema = z.object({
  prompt:        z.string().min(1, 'prompt is required').max(4096),
  language:      z.enum(['english', 'tamil', 'hindi', 'swahili']),
  systemContext: z.string().max(2048).optional(),
})

const WORDS = ['ALPHA', 'BETA', 'DELTA', 'GAMMA', 'SIGMA', 'THETA', 'OMEGA']
function makeQueryRef(): string {
  const num  = Math.floor(Math.random() * 9000 + 1000)
  const word = WORDS[Math.floor(Math.random() * WORDS.length)] ?? 'ALPHA'
  return `SQ-${num}-${word}`
}

export const llmRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/llm/query',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = LLMQuerySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error:      parsed.error.issues.map((i) => i.message).join('; '),
          code:       'INVALID_INPUT',
          statusCode: 400,
        })
      }

      const { prompt, language, systemContext } = parsed.data
      const startedAt = Date.now()

      try {
        let result = await runInference(prompt, language, systemContext)

        // Translate if non-English
        if (language !== 'english') {
          result = {
            ...result,
            text: await translateText(result.text, language as Language, 'english'),
          }
        }

        recordQuery(
          Buffer.byteLength(prompt, 'utf8'),
          Buffer.byteLength(result.text, 'utf8'),
        )

        const body: LLMQueryResponse = {
          queryRef:     makeQueryRef(),
          response:     result.text,
          language:     language as Language,
          tokensUsed:   result.tokensUsed,
          processingMs: Date.now() - startedAt,
        }
        return reply.send(body)
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? 'INFERENCE_ERROR'
        if (code === 'MODEL_UNAVAILABLE') {
          return reply.status(503).send({ error: 'LLM model not available', code, statusCode: 503 })
        }
        request.log.error(err, 'LLM inference error')
        return reply.status(500).send({ error: 'Inference failed', code, statusCode: 500 })
      }
    },
  )
}
