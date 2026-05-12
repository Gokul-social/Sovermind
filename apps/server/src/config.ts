import { config as loadDotenv } from 'dotenv'
import path from 'path'
import os from 'os'

loadDotenv()

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = parseInt(raw, 10)
  return isNaN(parsed) ? fallback : parsed
}

function resolvePath(raw: string): string {
  return raw.startsWith('~')
    ? path.join(os.homedir(), raw.slice(1))
    : path.resolve(raw)
}

export const config = {
  PORT:    optionalInt('PORT', 3001),
  HOST:    optional('HOST', '127.0.0.1'),

  // Model paths (optional — server degrades gracefully if missing)
  LLM_MODEL_PATH:         optional('LLM_MODEL_PATH', ''),
  WHISPER_MODEL_PATH:     optional('WHISPER_MODEL_PATH', ''),
  OCR_MODEL_PATH:         optional('OCR_MODEL_PATH', ''),
  TRANSLATION_MODEL_PATH: optional('TRANSLATION_MODEL_PATH', ''),

  // Inference
  MAX_TOKENS:      optionalInt('MAX_TOKENS', 1024),
  CONTEXT_WINDOW:  optionalInt('CONTEXT_WINDOW', 4096),
  LLM_TEMPERATURE: parseFloat(optional('LLM_TEMPERATURE', '0.7')),

  // Vault
  VAULT_PATH: resolvePath(optional('VAULT_PATH', '~/.sovermind/vault.json')),

  // Logging
  LOG_LEVEL: optional('LOG_LEVEL', 'info') as
    'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',

  // Security
  ALLOWED_ORIGIN: optional('ALLOWED_ORIGIN', 'http://localhost:5173'),

  // LLM prompt template — must match the downloaded model family
  // 'mistral' | 'llama3' | 'phi3'
  MODEL_TEMPLATE: optional('MODEL_TEMPLATE', 'mistral') as 'mistral' | 'llama3' | 'phi3',

  // Resolved model paths (only if set)
  resolvedLLMPath():         string | null { return this.LLM_MODEL_PATH         ? resolvePath(this.LLM_MODEL_PATH)         : null },
  resolvedWhisperPath():     string | null { return this.WHISPER_MODEL_PATH     ? resolvePath(this.WHISPER_MODEL_PATH)     : null },
  resolvedOCRPath():         string | null { return this.OCR_MODEL_PATH         ? resolvePath(this.OCR_MODEL_PATH)         : null },
  resolvedTranslationPath(): string | null { return this.TRANSLATION_MODEL_PATH ? resolvePath(this.TRANSLATION_MODEL_PATH) : null },
} as const
