import { getModel } from '../lib/modelLoader.js'
import type { Language } from '../types/index.js'

export async function translateText(
  text:           string,
  targetLanguage: Language,
  sourceLanguage: Language = 'english',
): Promise<string> {
  if (targetLanguage === sourceLanguage) return text

  const translation = getModel('translation')
  if (!translation) throw Object.assign(new Error('Translation model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  const result = await translation.translate(text, targetLanguage, sourceLanguage)
  return result.translatedText
}
