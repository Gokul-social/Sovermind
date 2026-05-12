import { getModel } from '../lib/modelLoader.js'
import { config } from '../config.js'
import type { Language, LLMCompletionResult } from '../types/index.js'

const SYSTEM_PROMPT_TEMPLATE = (language: Language) =>
  `You are a private, offline health information assistant. ` +
  `Answer in ${language}. ` +
  `Be concise and clear. ` +
  `Never diagnose or prescribe — always direct the user to consult a qualified doctor for medical decisions. ` +
  `Never suggest emergency procedures.`

export async function runInference(
  prompt:        string,
  language:      Language,
  systemContext?: string,
  onToken?:      (token: string) => void,
  signal?:       AbortSignal,
): Promise<LLMCompletionResult> {
  const llm = getModel('llm')
  if (!llm) throw Object.assign(new Error('LLM model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  const systemPrompt = systemContext ?? SYSTEM_PROMPT_TEMPLATE(language)
  const fullPrompt   = `<|system|>\n${systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>\n`

  return llm.complete(fullPrompt, {
    maxTokens:   config.MAX_TOKENS,
    temperature: config.LLM_TEMPERATURE,
    onToken,
    signal,
  })
}

export async function extractJSONFromText(
  rawText: string,
  extractionPrompt: string,
): Promise<string> {
  const llm = getModel('llm')
  if (!llm) throw Object.assign(new Error('LLM model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  const prompt = `${extractionPrompt}\n\nText to analyze:\n${rawText}\n\nRespond with valid JSON only, no explanation.`

  const result = await llm.complete(prompt, {
    maxTokens:   512,
    temperature: 0.1,   // low temp for structured extraction
  })
  return result.text.trim()
}
