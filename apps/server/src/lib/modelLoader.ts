import { config } from '../config.js'
import { recordModelLoaded } from '../middleware/telemetry.js'
import type {
  ModelType,
  SystemStatus,
  QVACLLMModel,
  QVACWhisperModel,
  QVACOCRModel,
  QVACTranslationModel,
} from '../types/index.js'

// ── In-memory model cache ──────────────────────────────────────────

interface ModelCache {
  llm:         QVACLLMModel         | null
  whisper:     QVACWhisperModel     | null
  ocr:         QVACOCRModel         | null
  translation: QVACTranslationModel | null
}

const cache: ModelCache = {
  llm:         null,
  whisper:     null,
  ocr:         null,
  translation: null,
}

// ── Per-model loaders ──────────────────────────────────────────────

async function loadLLM(log: (msg: string) => void): Promise<void> {
  const modelPath = config.resolvedLLMPath()
  if (!modelPath) {
    log('⚠  LLM_MODEL_PATH not set — LLM capability disabled')
    return
  }
  const t0 = Date.now()
  try {
    // TODO: replace with real SDK import once @qvac/llm-llamacpp is installed
    // const { LlamaCpp } = await import('@qvac/llm-llamacpp')
    // cache.llm = new LlamaCpp({ modelPath, contextSize: config.CONTEXT_WINDOW })
    // await cache.llm.load()

    // ── Stub: remove when SDK is available ──
    cache.llm = {
      async complete(prompt, opts = {}) {
        void prompt
        await new Promise<void>(r => setTimeout(r, 800))
        const text = `[STUB] Local LLM response for: "${prompt.slice(0, 40)}..."`
        return { text, tokensUsed: text.split(' ').length }
      },
    }
    // ── End stub ──

    recordModelLoaded('llm')
    log(`✓  LLM loaded in ${Date.now() - t0}ms`)
  } catch (err) {
    log(`✗  LLM failed to load: ${String(err)}`)
  }
}

async function loadWhisper(log: (msg: string) => void): Promise<void> {
  const modelPath = config.resolvedWhisperPath()
  if (!modelPath) {
    log('⚠  WHISPER_MODEL_PATH not set — transcription capability disabled')
    return
  }
  const t0 = Date.now()
  try {
    // TODO: replace with real SDK import once @qvac/transcription-whispercpp is installed
    // const { WhisperCpp } = await import('@qvac/transcription-whispercpp')
    // cache.whisper = new WhisperCpp({ modelPath })
    // await cache.whisper.load()

    // ── Stub ──
    cache.whisper = {
      async transcribe(_audioPath, _opts) {
        await new Promise<void>(r => setTimeout(r, 1200))
        return {
          text:       'What are the side effects of Metformin?',
          language:   'en',
          durationMs: 3400,
        }
      },
    }
    // ── End stub ──

    recordModelLoaded('whisper')
    log(`✓  Whisper loaded in ${Date.now() - t0}ms`)
  } catch (err) {
    log(`✗  Whisper failed to load: ${String(err)}`)
  }
}

async function loadOCR(log: (msg: string) => void): Promise<void> {
  const modelPath = config.resolvedOCRPath()
  if (!modelPath) {
    log('⚠  OCR_MODEL_PATH not set — OCR capability disabled')
    return
  }
  const t0 = Date.now()
  try {
    // TODO: replace with real SDK import once @qvac/ocr-onnx is installed
    // const { OnnxOCR } = await import('@qvac/ocr-onnx')
    // cache.ocr = new OnnxOCR({ modelPath })
    // await cache.ocr.load()

    // ── Stub ──
    cache.ocr = {
      async scan(_imagePath) {
        await new Promise<void>(r => setTimeout(r, 1500))
        return {
          text: 'LISINOPRIL 10MG\nMetformin HCL 500MG\nTake twice daily with food\nATORVASTATIN 20MG\nRefill: 2 times',
          confidence: 94.2,
        }
      },
    }
    // ── End stub ──

    recordModelLoaded('ocr')
    log(`✓  OCR loaded in ${Date.now() - t0}ms`)
  } catch (err) {
    log(`✗  OCR failed to load: ${String(err)}`)
  }
}

async function loadTranslation(log: (msg: string) => void): Promise<void> {
  const modelPath = config.resolvedTranslationPath()
  if (!modelPath) {
    log('⚠  TRANSLATION_MODEL_PATH not set — translation capability disabled')
    return
  }
  const t0 = Date.now()
  try {
    // TODO: replace with real SDK import once @qvac/translation-nmtcpp is installed
    // const { NmtCpp } = await import('@qvac/translation-nmtcpp')
    // cache.translation = new NmtCpp({ modelDir: modelPath })
    // await cache.translation.load()

    // ── Stub ──
    cache.translation = {
      async translate(text, targetLanguage, _sourceLanguage) {
        await new Promise<void>(r => setTimeout(r, 600))
        return { translatedText: `[${targetLanguage.toUpperCase()}] ${text}` }
      },
    }
    // ── End stub ──

    recordModelLoaded('translation')
    log(`✓  Translation loaded in ${Date.now() - t0}ms`)
  } catch (err) {
    log(`✗  Translation failed to load: ${String(err)}`)
  }
}

// ── Public API ─────────────────────────────────────────────────────

export async function loadAllModels(
  log: (msg: string) => void = console.log,
): Promise<void> {
  log('Loading QVAC models...')
  await Promise.all([
    loadLLM(log),
    loadWhisper(log),
    loadOCR(log),
    loadTranslation(log),
  ])
  log('Model loading complete.')
}

export function getModel(type: 'llm'):         QVACLLMModel         | null
export function getModel(type: 'whisper'):     QVACWhisperModel     | null
export function getModel(type: 'ocr'):         QVACOCRModel         | null
export function getModel(type: 'translation'): QVACTranslationModel | null
export function getModel(type: ModelType) {
  return cache[type === 'whisper' ? 'whisper' : type]
}

export function getSystemStatus(): SystemStatus {
  return {
    llm:          cache.llm         !== null,
    ocr:          cache.ocr         !== null,
    transcription:cache.whisper     !== null,
    translation:  cache.translation !== null,
  }
}
