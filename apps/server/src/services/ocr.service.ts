import { getModel } from '../lib/modelLoader.js'
import type { OCRScanResult } from '../types/index.js'

export async function scanImage(imagePath: string): Promise<OCRScanResult> {
  const ocr = getModel('ocr')
  if (!ocr) throw Object.assign(new Error('OCR model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  return ocr.scan(imagePath)
}
