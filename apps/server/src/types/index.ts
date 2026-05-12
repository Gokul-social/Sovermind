// ══════════════════════════════════════════════════════════════════
// Domain types
// ══════════════════════════════════════════════════════════════════

export type Language    = 'english' | 'tamil' | 'hindi' | 'swahili'
export type ModelType   = 'llm' | 'whisper' | 'ocr' | 'translation'
export type VaultType   = 'prescription' | 'query' | 'report'
export type SystemStatusValue = 'optimal' | 'degraded' | 'critical'

// ── QVAC model interfaces ──────────────────────────────────────────
// These mirror the real @qvac/* SDK surface.
// Replace the implementations in modelLoader.ts when the SDK is available.

export interface LLMCompletionOptions {
  maxTokens?:      number
  temperature?:    number
  systemPrompt?:   string
  stopSequences?:  string[]
  onToken?:        (token: string) => void
  signal?:         AbortSignal
}

export interface LLMCompletionResult {
  text:       string
  tokensUsed: number
}

export interface QVACLLMModel {
  complete(prompt: string, opts?: LLMCompletionOptions): Promise<LLMCompletionResult>
}

export interface TranscriptionResult {
  text:       string
  language:   string
  durationMs: number
}

export interface QVACWhisperModel {
  transcribe(audioPath: string, opts?: { language?: string }): Promise<TranscriptionResult>
}

export interface OCRScanResult {
  text:       string
  confidence: number
}

export interface QVACOCRModel {
  scan(imagePath: string): Promise<OCRScanResult>
}

export interface TranslationResult {
  translatedText: string
}

export interface QVACTranslationModel {
  translate(
    text:           string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<TranslationResult>
}

export type QVACModel =
  | QVACLLMModel
  | QVACWhisperModel
  | QVACOCRModel
  | QVACTranslationModel

// ── System status ──────────────────────────────────────────────────

export interface SystemStatus {
  llm:          boolean
  ocr:          boolean
  transcription:boolean
  translation:  boolean
}

export interface HealthResponse {
  status:            SystemStatusValue
  capabilities:      SystemStatus
  bytesSentToCloud:  0
  bytesProcessedLocally: number
  queriesProcessed:  number
  uptime:            number
  timestamp:         string
}

// ── LLM ───────────────────────────────────────────────────────────

export interface LLMQueryRequest {
  prompt:         string
  language:       Language
  systemContext?: string
}

export interface LLMQueryResponse {
  queryRef:     string
  response:     string
  language:     Language
  tokensUsed:   number
  processingMs: number
}

// ── OCR ───────────────────────────────────────────────────────────

export interface OCREntity {
  id:           string
  name:         string
  dosage:       string
  instructions: string
  category:     string
  confidence:   number
  warning?:     string
}

export interface OCRScanResponse {
  entities:     OCREntity[]
  rawText:      string
  processingMs: number
}

// ── Transcription ─────────────────────────────────────────────────

export interface TranscribeResponse {
  transcript:   string
  language:     string
  durationMs:   number
  processingMs: number
}

// ── Translation ───────────────────────────────────────────────────

export interface TranslateRequest {
  text:           string
  targetLanguage: Language
  sourceLanguage?: Language
}

export interface TranslateResponse {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  processingMs:   number
}

// ── Vault ─────────────────────────────────────────────────────────

export interface VaultEntry {
  id:        string
  type:      VaultType
  title:     string
  content:   string
  metadata?: Record<string, unknown>
  createdAt: string
  tags?:     string[]
}

export interface VaultListResponse {
  entries: VaultEntry[]
  total:   number
}

export interface VaultCreateRequest {
  type:      VaultType
  title:     string
  content:   string
  metadata?: Record<string, unknown>
  tags?:     string[]
}

// ── WebSocket messages ────────────────────────────────────────────

export interface WSQueryMessage {
  type:      'query'
  prompt:    string
  language:  Language
  sessionId: string
}

export type WSServerMessage =
  | { type: 'ack';        queryRef: string;   timestamp: string }
  | { type: 'token';      token: string;      index: number; translated?: boolean }
  | { type: 'translating'; message: string }
  | { type: 'done';       tokensUsed: number; processingMs: number; queryRef: string }
  | { type: 'error';      message: string;    code: string }

// ── Error response ────────────────────────────────────────────────

export interface ErrorResponse {
  error:      string
  code:       string
  statusCode: number
}
