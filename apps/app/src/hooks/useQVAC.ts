import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionLogger } from './useSessionLogger'
import { runLLMQuery, transcribeAudio, runOCR, translateText } from '../lib/qvac'
import type { Language, OCREntity } from '../types'

export function useQVAC() {
  const { setCurrentResponse, setIsStreaming, selectedLanguage } = useAppStore()
  const logger = useSessionLogger()

  const query = useCallback(
    async (prompt: string, lang?: Language): Promise<string> => {
      const targetLang = lang ?? selectedLanguage
      setIsStreaming(true)
      setCurrentResponse('')
      logger.info(`[LLM] Query dispatched — "${prompt.slice(0, 40)}..."`)

      let accumulated = ''

      try {
        const result = await runLLMQuery(prompt, targetLang, (token, translated) => {
          if (translated) {
            // Translated tokens replace the displayed text
            accumulated += token
          } else {
            accumulated += token
          }
          setCurrentResponse(accumulated)
        })
        logger.success(`[LLM] Response complete — ${result.tokens} tokens.`)
        setIsStreaming(false)
        return result.text
      } catch (err) {
        logger.error(`[LLM] Inference error: ${String(err)}`)
        setIsStreaming(false)
        throw err
      }
    },
    [selectedLanguage, setCurrentResponse, setIsStreaming, logger],
  )

  const transcribe = useCallback(
    async (blob: Blob): Promise<string> => {
      logger.info('[AUDIO] Transcription started...')
      try {
        const text = await transcribeAudio(blob)
        logger.success(`[AUDIO] Transcribed — "${text}"`)
        return text
      } catch (err) {
        logger.error(`[AUDIO] Transcription error: ${String(err)}`)
        throw err
      }
    },
    [logger],
  )

  const ocr = useCallback(
    async (file: File): Promise<OCREntity[]> => {
      logger.info(`[OCR] Scanning document: ${file.name}`)
      try {
        const entities = await runOCR(file)
        logger.success(`[OCR] ${entities.length} entities extracted.`)
        return entities
      } catch (err) {
        logger.error(`[OCR] Scan error: ${String(err)}`)
        throw err
      }
    },
    [logger],
  )

  const translate = useCallback(
    async (text: string, targetLang: Language): Promise<string> => {
      logger.info(`[NMT] Translating to ${targetLang}...`)
      try {
        const result = await translateText(text, targetLang)
        logger.success('[NMT] Translation complete.')
        return result
      } catch (err) {
        logger.error(`[NMT] Translation error: ${String(err)}`)
        throw err
      }
    },
    [logger],
  )

  return { query, transcribe, ocr, translate }
}
