import type { FastifyPluginAsync } from 'fastify'
import type { SocketStream } from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { runInference } from '../services/llm.service.js'
import { translateText } from '../services/translate.service.js'
import { recordQuery } from '../middleware/telemetry.js'
import type { WSQueryMessage, WSServerMessage, Language } from '../types/index.js'

// ── Session tracking — at most one inference per sessionId ─────────
const activeSessions = new Map<string, AbortController>()

function send(socket: WebSocket, msg: WSServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(msg))
  }
}

const WORDS = ['ALPHA', 'BETA', 'DELTA', 'GAMMA', 'SIGMA', 'THETA', 'OMEGA']
function makeQueryRef(): string {
  const num  = Math.floor(Math.random() * 9000 + 1000)
  const word = WORDS[Math.floor(Math.random() * WORDS.length)] ?? 'ALPHA'
  return `SQ-${num}-${word}`
}

const VALID_LANGUAGES: Language[] = ['english', 'tamil', 'hindi', 'swahili']

function isValidLanguage(v: unknown): v is Language {
  return VALID_LANGUAGES.includes(v as Language)
}

// ── Handler ───────────────────────────────────────────────────────

async function handleMessage(
  socket:  WebSocket,
  rawData: Buffer | string,
): Promise<void> {
  let msg: WSQueryMessage
  try {
    msg = JSON.parse(rawData.toString()) as WSQueryMessage
  } catch {
    send(socket, { type: 'error', message: 'Invalid JSON', code: 'INVALID_INPUT' })
    return
  }

  if (msg.type !== 'query') {
    send(socket, { type: 'error', message: 'Unknown message type', code: 'INVALID_INPUT' })
    return
  }

  const { prompt, language, sessionId } = msg

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    send(socket, { type: 'error', message: 'prompt is required', code: 'INVALID_INPUT' })
    return
  }

  if (!isValidLanguage(language)) {
    send(socket, { type: 'error', message: 'Unsupported language', code: 'INVALID_INPUT' })
    return
  }

  if (!sessionId || typeof sessionId !== 'string') {
    send(socket, { type: 'error', message: 'sessionId is required', code: 'INVALID_INPUT' })
    return
  }

  // Abort any in-progress inference for this session
  const existing = activeSessions.get(sessionId)
  if (existing) {
    existing.abort()
    activeSessions.delete(sessionId)
  }

  const controller = new AbortController()
  activeSessions.set(sessionId, controller)

  const queryRef  = makeQueryRef()
  const startedAt = Date.now()

  send(socket, { type: 'ack', queryRef, timestamp: new Date().toISOString() })

  let tokenIndex    = 0
  let tokensUsed    = 0
  const tokenBuffer: string[] = []

  try {
    const result = await runInference(
      prompt,
      language,
      undefined,
      (token) => {
        tokenBuffer.push(token)
        send(socket, { type: 'token', token, index: tokenIndex++ })
      },
      controller.signal,
    )
    tokensUsed = result.tokensUsed

    // Translate if not English
    if (language !== 'english') {
      const englishText = tokenBuffer.join('')
      send(socket, { type: 'translating', message: `Translating to ${language}...` })
      try {
        const translated = await translateText(englishText, language, 'english')
        const words = translated.split(/(\s+)/)
        tokenIndex = 0
        for (const word of words) {
          send(socket, { type: 'token', token: word, index: tokenIndex++, translated: true })
        }
      } catch {
        // Translation unavailable — English response is already streamed above
        send(socket, {
          type: 'error',
          message: 'Translation service unavailable — showing English response',
          code: 'MODEL_UNAVAILABLE',
        })
      }
    }

    const processingMs = Date.now() - startedAt
    recordQuery(
      Buffer.byteLength(prompt, 'utf8'),
      Buffer.byteLength(tokenBuffer.join(''), 'utf8'),
    )

    send(socket, { type: 'done', tokensUsed, processingMs, queryRef })
  } catch (err: unknown) {
    const aborted = controller.signal.aborted
    if (!aborted) {
      const code    = (err as { code?: string }).code ?? 'INFERENCE_ERROR'
      const message = err instanceof Error ? err.message : String(err)
      send(socket, { type: 'error', message, code })
    }
  } finally {
    activeSessions.delete(sessionId)
  }
}

// ── Fastify plugin ────────────────────────────────────────────────

export const llmStreamRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ws/llm/stream', { websocket: true }, (connection: SocketStream) => {
    const socket: WebSocket = connection.socket

    // Heartbeat — keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.ping()
      } else {
        clearInterval(heartbeat)
      }
    }, 30_000)

    socket.on('message', (data: Buffer | string) => {
      handleMessage(socket, data).catch((err) => {
        console.error('[WS] Unhandled error in message handler:', err)
      })
    })

    socket.on('close', () => {
      clearInterval(heartbeat)
    })

    socket.on('error', (err: Error) => {
      clearInterval(heartbeat)
      console.error('[WS] Socket error:', err)
    })
  })
}
