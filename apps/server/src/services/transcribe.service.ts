import fs from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { getModel } from '../lib/modelLoader.js'
import type { TranscriptionResult } from '../types/index.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

async function convertToWav(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.\w+$/, '.wav')
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
  })
}

export async function transcribeAudio(
  audioPath: string,
  language?:  string,
): Promise<TranscriptionResult> {
  const whisper = getModel('whisper')
  if (!whisper) throw Object.assign(new Error('Whisper model not loaded'), { code: 'MODEL_UNAVAILABLE' })

  // WhisperCpp requires 16 kHz mono WAV; convert from .webm or any other format
  const isWav = audioPath.toLowerCase().endsWith('.wav')
  const wavPath = isWav ? audioPath : await convertToWav(audioPath)

  try {
    return await whisper.transcribe(wavPath, { language })
  } finally {
    // Delete the converted WAV temp file (the original is cleaned up by the route)
    if (!isWav) {
      await fs.rm(wavPath, { force: true }).catch(() => void 0)
    }
  }
}
