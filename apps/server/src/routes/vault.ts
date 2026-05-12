import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { vault } from '../lib/vaultStore.js'
import type { VaultListResponse, VaultType } from '../types/index.js'

const VAULT_TYPES: VaultType[] = ['prescription', 'query', 'report']

const CreateSchema = z.object({
  type:     z.enum(['prescription', 'query', 'report']),
  title:    z.string().min(1).max(256),
  content:  z.string().min(1).max(1_000_000),
  metadata: z.record(z.unknown()).optional(),
  tags:     z.array(z.string().max(64)).max(20).optional(),
})

export const vaultRoute: FastifyPluginAsync = async (fastify) => {
  // ── GET /api/vault ────────────────────────────────────────────
  fastify.get(
    '/vault',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string>

      const rawType   = query['type']
      const type      = VAULT_TYPES.includes(rawType as VaultType) ? (rawType as VaultType) : undefined
      const limit     = Math.min(parseInt(query['limit']  ?? '50',  10), 200)
      const offset    = Math.max(parseInt(query['offset'] ?? '0',   10), 0)

      try {
        const allFiltered = await vault.getAll({ type })
        const entries     = allFiltered.slice(offset, offset + limit)

        const body: VaultListResponse = { entries, total: allFiltered.length }
        return reply.send(body)
      } catch (err) {
        request.log.error(err, 'Vault list error')
        return reply.status(500).send({ error: 'Vault read failed', code: 'VAULT_ERROR', statusCode: 500 })
      }
    },
  )

  // ── POST /api/vault ───────────────────────────────────────────
  fastify.post(
    '/vault',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error:      parsed.error.issues.map((i) => i.message).join('; '),
          code:       'INVALID_INPUT',
          statusCode: 400,
        })
      }

      try {
        const entry = await vault.add(parsed.data)
        return reply.status(201).send({ id: entry.id, createdAt: entry.createdAt })
      } catch (err) {
        request.log.error(err, 'Vault create error')
        return reply.status(500).send({ error: 'Vault write failed', code: 'VAULT_ERROR', statusCode: 500 })
      }
    },
  )

  // ── DELETE /api/vault/purge ───────────────────────────────────
  // Must come before /:id to avoid route collision
  fastify.delete(
    '/vault/purge',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await vault.purge()
        return reply.send({ success: true, message: 'Vault purged' })
      } catch (err) {
        request.log.error(err, 'Vault purge error')
        return reply.status(500).send({ error: 'Purge failed', code: 'VAULT_ERROR', statusCode: 500 })
      }
    },
  )

  // ── DELETE /api/vault/:id ─────────────────────────────────────
  fastify.delete(
    '/vault/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      try {
        const deleted = await vault.delete(id)
        if (!deleted) {
          return reply.status(404).send({ error: 'Entry not found', code: 'NOT_FOUND', statusCode: 404 })
        }
        return reply.send({ success: true })
      } catch (err) {
        request.log.error(err, 'Vault delete error')
        return reply.status(500).send({ error: 'Vault delete failed', code: 'VAULT_ERROR', statusCode: 500 })
      }
    },
  )
}
