/**
 * QVAC SDK wrapper — all functions are stubbed with mock data.
 * bytesSentToCloud is always 0. No network calls are made.
 * Replace each stub with the real QVAC SDK call as noted in TODO comments.
 */

import type { StreamingResponse, OCREntity, Language } from '../types'

/** Always 0 — SoverMind never sends data externally. */
export const bytesSentToCloud = 0

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Mock response data ──────────────────────────────────────────

const MOCK_RESPONSES: Record<Language, string> = {
  english: `Your local environment is secure. No network anomalies detected. Probability of data leakage is estimated at zero.\n\nContinuous monitoring is running in the background. If any anomalies occur, the system will automatically disconnect network access to preserve isolation integrity.`,
  tamil:   `உங்கள் உள்ளூர் சூழல் பாதுகாப்பாக உள்ளது. நெட்வொர்க் போக்குவரத்தில் எந்த முரண்பாடுகளும் கண்டறியப்படவில்லை. தரவு கசிவுக்கான சாத்தியக்கூறுகள் பூஜ்ஜியமாக மதிப்பிடப்பட்டுள்ளது.\n\nதொடர்ச்சியான கண்காணிப்பு பின்னணியில் இயங்குகிறது. ஏதேனும் முரண்பாடுகள் ஏற்பட்டால், அமைப்பு தானாகவே நெட்வொர்க் அணுகலை துண்டிக்கும்.`,
  hindi:   `आपका स्थानीय वातावरण सुरक्षित है। नेटवर्क ट्रैफ़िक में कोई विसंगतियां नहीं पाई गईं। डेटा लीक की संभावना शून्य आंकी गई है।\n\nनिरंतर निगरानी पृष्ठभूमि में चल रही है। यदि कोई विसंगति उत्पन्न होती है, तो सिस्टम स्वचालित रूप से नेटवर्क एक्सेस को डिस्कनेक्ट कर देगा।`,
  swahili: `Mazingira yako ya ndani yako salama. Hakuna hitilafu zilizogundulika katika trafiki ya mtandao. Uwezekano wa uvujaji wa data unakadiriwa kuwa sifuri.\n\nUfuatiliaji unaendelea kwa kawaida nyuma ya pazia. Iwapo hitilafu yoyote itatokea, mfumo utakata upatikanaji wa mtandao moja kwa moja.`,
}

const MOCK_OCR_ENTITIES: OCREntity[] = [
  {
    id: 'e1',
    name: 'LISINOPRIL 10MG',
    description: 'Identified as an ACE inhibitor. This synthetic compound primarily functions to relax blood vessels, decreasing blood pressure and reducing the overall workload on the cardiovascular system. Commonly prescribed for hypertension or post-myocardial infarction management.',
    confidence: 99.4,
  },
  {
    id: 'e2',
    name: 'METFORMIN HCL 500MG',
    description: 'Classified as a biguanide antihyperglycemic agent. Works by decreasing hepatic glucose production and improving insulin sensitivity by increasing peripheral glucose uptake and utilization. Serves as a baseline metabolic regulator.',
    confidence: 98.1,
    warning: 'Requires renal function monitoring. Contraindicated in severe renal impairment (eGFR < 30).',
  },
  {
    id: 'e3',
    name: 'ATORVASTATIN 20MG',
    description: 'HMG-CoA reductase inhibitor. Mechanism involves lipid lowering by inhibiting the synthesis of cholesterol in the liver. Indicated for prophylactic cardiovascular risk reduction.',
    confidence: 84.2,
  },
]

// ── Exported stubs ──────────────────────────────────────────────

/**
 * Run a local LLM inference query.
 * TODO: replace with @qvac/llm-llamacpp inference call
 *   import { LlamaCpp } from '@qvac/llm-llamacpp'
 *   const llm = new LlamaCpp({ model: 'models/sovermind-7b.gguf' })
 *   return llm.chat(prompt, { language, stream: true })
 */
export async function runLLMQuery(
  prompt: string,
  language: Language,
): Promise<StreamingResponse> {
  void prompt
  await delay(1200 + Math.random() * 600)
  const text = MOCK_RESPONSES[language] ?? MOCK_RESPONSES.english
  return { text, tokens: text.split(' ').length, language }
}

/**
 * Transcribe recorded audio locally using Whisper.cpp.
 * TODO: replace with @qvac/transcription-whispercpp
 *   import { WhisperCpp } from '@qvac/transcription-whispercpp'
 *   const whisper = new WhisperCpp({ model: 'models/whisper-base.bin' })
 *   return whisper.transcribe(audioBlob)
 */
export async function transcribeAudio(_audioBlob: Blob): Promise<string> {
  await delay(1500)
  return 'What are the side effects of Metformin?'
}

/**
 * Run local OCR on an image file using ONNX Runtime.
 * TODO: replace with @qvac/ocr-onnx
 *   import { OnnxOCR } from '@qvac/ocr-onnx'
 *   const ocr = new OnnxOCR({ model: 'models/doctr-db-resnet50.onnx' })
 *   return ocr.extractEntities(imageFile)
 */
export async function runOCR(_imageFile: File): Promise<OCREntity[]> {
  await delay(2000)
  return MOCK_OCR_ENTITIES.map(e => ({ ...e }))
}

/**
 * Translate text locally using NMT.cpp.
 * TODO: replace with @qvac/translation-nmtcpp
 *   import { NmtCpp } from '@qvac/translation-nmtcpp'
 *   const nmt = new NmtCpp({ model: `models/nmt-${targetLang}.bin` })
 *   return nmt.translate(text)
 */
export async function translateText(text: string, targetLang: Language): Promise<string> {
  void targetLang
  await delay(800)
  return `[TRANSLATED] ${text}`
}
