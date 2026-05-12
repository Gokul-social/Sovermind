import type { StreamingResponse, OCREntity, Language } from '../types'

const BASE_URL = 'http://127.0.0.1:3001'
const WS_URL   = 'ws://127.0.0.1:3001'

/** Always 0 — SoverMind never sends data externally. */
export const bytesSentToCloud = 0

// ── Session ID (stable per browser tab) ────────────────────────

let _sessionId: string | null = null

function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return _sessionId
}

// ── LLM streaming via WebSocket ─────────────────────────────────

export async function runLLMQuery(
  prompt: string,
  language: Language,
  onToken: (token: string, translated: boolean) => void,
): Promise<StreamingResponse> {
  return new Promise<StreamingResponse>((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/ws/llm/stream`)

    let fullText      = ''
    let translatedText = ''
    let tokensUsed    = 0
    let inTranslation = false

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type:      'query',
        prompt,
        language,
        sessionId: getSessionId(),
      }))
    })

    ws.addEventListener('message', (event: MessageEvent<string>) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(event.data) as Record<string, unknown>
      } catch {
        return
      }

      switch (msg['type']) {
        case 'token': {
          const token      = String(msg['token'] ?? '')
          const translated = Boolean(msg['translated'])
          if (translated) {
            translatedText += token
            inTranslation   = true
          } else {
            fullText += token
          }
          onToken(token, translated)
          break
        }
        case 'done': {
          tokensUsed = Number(msg['tokensUsed'] ?? 0)
          ws.close()
          resolve({
            text:     inTranslation ? translatedText : fullText,
            tokens:   tokensUsed,
            language,
          })
          break
        }
        case 'error': {
          ws.close()
          reject(new Error(String(msg['message'] ?? 'LLM error')))
          break
        }
      }
    })

    ws.addEventListener('error', () => {
      reject(new Error('WebSocket connection failed'))
    })

    ws.addEventListener('close', (event: CloseEvent) => {
      if (!event.wasClean && tokensUsed === 0) {
        reject(new Error('WebSocket closed unexpectedly'))
      }
    })
  })
}

// ── Transcription ────────────────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')

  const res = await fetch(`${BASE_URL}/api/transcribe`, { method: 'POST', body: form })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error(String(err['error'] ?? `Transcription failed (${res.status})`))
  }

  const data = await res.json() as { transcript: string }
  return data.transcript
}

// ── OCR ──────────────────────────────────────────────────────────

export async function runOCR(imageFile: File): Promise<OCREntity[]> {
  const form = new FormData()
  form.append('image', imageFile)

  const res = await fetch(`${BASE_URL}/api/ocr/scan`, { method: 'POST', body: form })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error(String(err['error'] ?? `OCR failed (${res.status})`))
  }

  const data = await res.json() as { entities: OCREntity[] }
  return data.entities
}

// ── Translation ──────────────────────────────────────────────────

export async function translateText(text: string, targetLang: Language): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/translate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text, targetLanguage: targetLang }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error(String(err['error'] ?? `Translation failed (${res.status})`))
  }

  const data = await res.json() as { translatedText: string }
  return data.translatedText
}

// ── Health check ─────────────────────────────────────────────────

export interface HealthStatus {
  status: 'optimal' | 'degraded' | 'critical'
  capabilities: {
    llm:          boolean
    ocr:          boolean
    transcription: boolean
    translation:  boolean
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error(`Health check failed (${res.status})`)
  return res.json() as Promise<HealthStatus>
}
