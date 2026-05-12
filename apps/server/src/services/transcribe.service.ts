import { getModel } from '../lib/modelLoader.js'
import type { TranscriptionResult } from '../types/index.js'

export async function transcribeAudio(
  audioPath: string,
  language?:  string,
): Promise<TranscriptionResult> {
  const whisper = getModel('whisper')
  if (!whisper) throw Object.assign(new Error('Whisper model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  return whisper.transcribe(audioPath, { language })
}
