import { getModel } from '../lib/modelLoader.js'
import type { Language } from '../types/index.js'

// ISO 639-1 codes for the languages SoverMind supports
const LANG_CODES: Record<string, string> = {
  tamil:   'ta',
  hindi:   'hi',
  swahili: 'sw',
  english: 'en',
}

export async function translateText(
  text:           string,
  targetLanguage: Language,
  sourceLanguage: Language = 'english',
): Promise<string> {
  if (targetLanguage === sourceLanguage) return text

  const translation = getModel('translation')
  if (!translation) throw Object.assign(new Error('Translation model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  const sourceLang = LANG_CODES[sourceLanguage] ?? 'en'
  const targetLang = LANG_CODES[targetLanguage] ?? 'en'

  const result = await translation.translate(text, targetLang, sourceLang)
  return result.translatedText
}
