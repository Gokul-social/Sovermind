import { config } from '../config.js'
import { recordModelLoaded } from '../middleware/telemetry.js'
import type {
  ModelType,
  SystemStatus,
  QVACLLMModel,
  QVACWhisperModel,
  QVACOCRModel,
  QVACTranslationModel,
  LLMCompletionOptions,
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
    const { LlamaCpp } = await import('@qvac/llm-llamacpp')
    const llamaCpp = new LlamaCpp()
    await llamaCpp.load({
      modelPath,
      contextSize: config.CONTEXT_WINDOW,
      gpuLayers: 'auto',
      threads: 4,
    })

    cache.llm = {
      async complete(prompt: string, opts: LLMCompletionOptions = {}) {
        const { maxTokens, temperature, onToken, signal } = opts

        if (onToken) {
          // Use streaming interface to drive the onToken callback
          let text = ''
          let tokensUsed = 0
          for await (const chunk of llamaCpp.stream({
            prompt,
            maxTokens,
            temperature,
            signal,
          })) {
            onToken(chunk.token)
            text += chunk.token
            tokensUsed++
          }
          return { text, tokensUsed }
        }

        const result = await llamaCpp.generate({
          prompt,
          maxTokens,
          temperature,
          stopSequences: ['</s>', '[INST]', '[/INST]'],
        })
        return { text: result.text, tokensUsed: result.tokensGenerated }
      },
    }

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
    const { WhisperCpp } = await import('@qvac/transcription-whispercpp')
    const whisperCpp = new WhisperCpp()
    await whisperCpp.load({
      modelPath,
      language: 'auto',
    })

    cache.whisper = {
      async transcribe(audioPath: string, opts?: { language?: string }) {
        const result = await whisperCpp.transcribe({
          audioPath,
          language: opts?.language ?? 'auto',
          diarize: false,
        })
        return {
          text:       result.text.trim(),
          language:   result.language,
          durationMs: result.audioDurationMs,
        }
      },
    }

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
    const { OcrOnnx } = await import('@qvac/ocr-onnx')
    const ocrOnnx = new OcrOnnx()
    await ocrOnnx.load({
      modelPath,
    })

    cache.ocr = {
      async scan(imagePath: string) {
        const result = await ocrOnnx.recognize({
          imagePath,
          language: 'eng',
          detectOrientation: true,
        })
        return {
          text:       result.text,
          confidence: result.confidence,
        }
      },
    }

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
    const { NmtCpp } = await import('@qvac/translation-nmtcpp')
    const nmtCpp = new NmtCpp()
    await nmtCpp.load({
      modelPath,
    })

    // Adapter: translate.service passes ISO-639-1 codes ('ta', 'en', etc.)
    cache.translation = {
      async translate(text: string, targetLanguage: string, sourceLanguage?: string) {
        const result = await nmtCpp.translate({
          text,
          sourceLang: sourceLanguage ?? 'en',
          targetLang: targetLanguage,
        })
        return { translatedText: result.translatedText }
      },
    }

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
