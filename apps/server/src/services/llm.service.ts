import { getModel } from '../lib/modelLoader.js'
import { config } from '../config.js'
import type { Language, LLMCompletionResult } from '../types/index.js'

const SYSTEM_PROMPT = (language: Language) =>
  `You are SoverMind, a private offline health assistant. ` +
  `You run entirely on the user's local device. No data leaves this machine. ` +
  `Answer health questions clearly and concisely. ` +
  `Always recommend consulting a real doctor for diagnosis or treatment. ` +
  `Respond in ${language}. Keep responses under 300 words.`

function buildPrompt(system: string, user: string): string {
  switch (config.MODEL_TEMPLATE) {
    case 'llama3':
      return (
        `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n` +
        `${system}<|eot_id|>` +
        `<|start_header_id|>user<|end_header_id|>\n` +
        `${user}<|eot_id|>` +
        `<|start_header_id|>assistant<|end_header_id|>\n`
      )
    case 'phi3':
      return `<|system|>\n${system}<|end|>\n<|user|>\n${user}<|end|>\n<|assistant|>\n`
    case 'mistral':
    default:
      return `<s>[INST] <<SYS>>\n${system}\n<</SYS>>\n\n${user} [/INST]`
  }
}

export async function runInference(
  prompt:        string,
  language:      Language,
  systemContext?: string,
  onToken?:      (token: string) => void,
  signal?:       AbortSignal,
): Promise<LLMCompletionResult> {
  const llm = getModel('llm')
  if (!llm) throw Object.assign(new Error('LLM model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  const systemPrompt = systemContext ?? SYSTEM_PROMPT(language)
  const fullPrompt   = buildPrompt(systemPrompt, prompt)

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

  const prompt = `${extractionPrompt}\n\nText to analyze:\n${rawText}`
  const fullPrompt = `<s>[INST] ${prompt} [/INST]`

  const result = await llm.complete(fullPrompt, {
    maxTokens:      512,
    temperature:    0.1,
    stopSequences:  ['</s>'],
  })
  return result.text.trim()
}
