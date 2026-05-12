import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import websocketPlugin from '@fastify/websocket'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

import { config } from './config.js'
import { vault } from './lib/vaultStore.js'
import { loadAllModels, getSystemStatus } from './lib/modelLoader.js'
import { healthRoute }     from './routes/health.js'
import { llmRoute }        from './routes/llm.js'
import { ocrRoute }        from './routes/ocr.js'
import { transcribeRoute } from './routes/transcribe.js'
import { translateRoute }  from './routes/translate.js'
import { vaultRoute }      from './routes/vault.js'
import { llmStreamRoute }  from './ws/llmStream.js'

// ── Create temp dir ────────────────────────────────────────────────
const TMP_DIR = path.join(os.tmpdir(), 'sovermind')

// ── Build Fastify instance ─────────────────────────────────────────
const fastify = Fastify({
  logger: {
    level:     config.LOG_LEVEL,
    transport: process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
  },
  trustProxy: false,
})

// ── Bootstrap ──────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // 1. Temp directory
  await fs.mkdir(TMP_DIR, { recursive: true })

  // 2. Vault
  await vault.init()
  fastify.log.info('VaultStore initialised')

  // 3. QVAC models
  await loadAllModels((msg) => fastify.log.info(msg))

  // 4. Plugins
  await fastify.register(cors, {
    origin:      config.ALLOWED_ORIGIN,
    methods:     ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: false,
  })

  await fastify.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 },   // 50 MB global max
  })

  await fastify.register(websocketPlugin)

  // Serve Vite build in production
  if (process.env['NODE_ENV'] === 'production') {
    const { default: staticPlugin } = await import('@fastify/static')
    const frontendDist = path.resolve('../app/dist')
    await fastify.register(staticPlugin, {
      root:   frontendDist,
      prefix: '/',
    })
  }

  // 5. Routes
  await fastify.register(healthRoute)           // GET  /health
  await fastify.register(llmRoute,        { prefix: '/api' })  // POST /api/llm/query
  await fastify.register(ocrRoute,        { prefix: '/api' })  // POST /api/ocr/scan
  await fastify.register(transcribeRoute, { prefix: '/api' })  // POST /api/transcribe
  await fastify.register(translateRoute,  { prefix: '/api' })  // POST /api/translate
  await fastify.register(vaultRoute,      { prefix: '/api' })  // CRUD /api/vault
  await fastify.register(llmStreamRoute)        // WS   /ws/llm/stream

  // 6. Listen — strictly 127.0.0.1, never 0.0.0.0
  await fastify.listen({ port: config.PORT, host: '127.0.0.1' })

  // 7. Startup banner
  const caps = getSystemStatus()
  const tick  = (v: boolean) => (v ? '✓ LOADED  ' : '✗ MISSING ')
  const lines = [
    '╔══════════════════════════════════╗',
    '║  SOVERMIND BACKEND ACTIVE        ║',
    `║  http://127.0.0.1:${config.PORT}         ║`,
    '║                                  ║',
    `║  LLM:           ${tick(caps.llm)}║`,
    `║  OCR:           ${tick(caps.ocr)}║`,
    `║  TRANSCRIPTION: ${tick(caps.transcription)}║`,
    `║  TRANSLATION:   ${tick(caps.translation)}║`,
    `║  VAULT:         ✓ READY   ║`,
    '║  BYTES TO CLOUD: 0               ║',
    '╚══════════════════════════════════╝',
  ]
  console.log('\n' + lines.join('\n') + '\n')
}

// ── Graceful shutdown ──────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  fastify.log.info(`Received ${signal} — shutting down`)
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT',  () => shutdown('SIGINT').catch(console.error))
process.on('SIGTERM', () => shutdown('SIGTERM').catch(console.error))

// ── Run ────────────────────────────────────────────────────────────
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
