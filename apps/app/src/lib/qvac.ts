import type { StreamingResponse, OCREntity, Language } from '../types'

const BASE_URL = 'http://127.0.0.1:3001'
const WS_URL   = 'ws://127.0.0.1:3001'
const IS_DEMO  = import.meta.env.VITE_DEMO_MODE === 'true'

/** Always 0 — SoverMind never sends data externally. */
export const bytesSentToCloud = 0

// ── Session ID (stable per browser tab) ────────────────────────────

let _sessionId: string | null = null

function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return _sessionId
}

// ── Demo-mode mock responses ────────────────────────────────────────

const MOCK_RESPONSES: Record<string, string> = {
  medication:
    'Medication identified. Local protocols suggest consulting your physician ' +
    'before adjusting dosage. All analysis performed on-device using QVAC inference engine. ' +
    'Zero bytes sent to cloud.',
  symptom:
    'Symptom assessment complete. Local model analysis indicates monitoring is advised. ' +
    'Please consult a healthcare professional for diagnosis. ' +
    'This response was generated entirely offline.',
  default:
    'Based on local analysis, your query has been processed entirely on-device. ' +
    'No data has been transmitted. This response demonstrates SoverMind\'s offline AI capabilities ' +
    'powered by the QVAC inference engine running on your local GPU via Vulkan.',
}

function getMockResponse(prompt: string): string {
  const p = prompt.toLowerCase()
  if (p.includes('medic') || p.includes('dose') || p.includes('drug')) return MOCK_RESPONSES.medication!
  if (p.includes('pain') || p.includes('symptom') || p.includes('fever')) return MOCK_RESPONSES.symptom!
  return MOCK_RESPONSES.default!
}

async function runDemoLLMQuery(
  prompt:  string,
  language: Language,
  onToken: (token: string, translated: boolean) => void,
): Promise<StreamingResponse> {
  const text   = getMockResponse(prompt)
  const words  = text.split(' ')
  let fullText = ''

  for (const word of words) {
    const token = word + ' '
    onToken(token, false)
    fullText += token
    await new Promise<void>((r) => setTimeout(r, 60))
  }

  return { text: fullText.trim(), tokens: words.length, language }
}

// ── LLM streaming via WebSocket ─────────────────────────────────────

export async function runLLMQuery(
  prompt:   string,
  language: Language,
  onToken:  (token: string, translated: boolean) => void,
): Promise<StreamingResponse> {
  if (IS_DEMO) return runDemoLLMQuery(prompt, language, onToken)

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

// ── Transcription ────────────────────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (IS_DEMO) {
    await new Promise<void>((r) => setTimeout(r, 1500))
    return 'What are the side effects of Metformin?'
  }

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

// ── OCR ──────────────────────────────────────────────────────────────

export async function runOCR(imageFile: File): Promise<OCREntity[]> {
  if (IS_DEMO) {
    await new Promise<void>((r) => setTimeout(r, 2000))
    return [
      { id: 'demo-1', name: 'Lisinopril',  dosage: '10mg',  instructions: 'Once daily',         category: 'ACE Inhibitor',    confidence: 96, warning: undefined },
      { id: 'demo-2', name: 'Metformin',   dosage: '500mg', instructions: 'Twice daily with food', category: 'Biguanide',      confidence: 94, warning: undefined },
      { id: 'demo-3', name: 'Atorvastatin',dosage: '20mg',  instructions: 'Once daily at bedtime', category: 'Statin',         confidence: 91, warning: 'Avoid grapefruit juice' },
    ]
  }

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

// ── Translation ──────────────────────────────────────────────────────

export async function translateText(text: string, targetLang: Language): Promise<string> {
  if (IS_DEMO) {
    await new Promise<void>((r) => setTimeout(r, 800))
    const prefixes: Record<Language, string> = {
      tamil:   '[தமிழ்] ',
      hindi:   '[हिंदी] ',
      swahili: '[Kiswahili] ',
      english: '',
    }
    return (prefixes[targetLang] ?? '') + text
  }

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

// ── Health check ──────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'optimal' | 'degraded' | 'critical'
  capabilities: {
    llm:           boolean
    ocr:           boolean
    transcription: boolean
    translation:   boolean
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  if (IS_DEMO) {
    return {
      status: 'optimal',
      capabilities: { llm: true, ocr: true, transcription: true, translation: true },
    }
  }

  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error(`Health check failed (${res.status})`)
  return res.json() as Promise<HealthStatus>
}
