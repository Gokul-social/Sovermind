/**
 * Local-only telemetry. Tracks processing metrics on this machine.
 * No data is ever sent anywhere — bytesSentToCloud is hardcoded 0.
 */

interface LocalTelemetry {
  queriesProcessed:      number
  bytesProcessedLocally: number
  readonly bytesSentToCloud: 0
  modelsLoaded:          string[]
  sessionStarted:        string
}

const telemetry: LocalTelemetry = {
  queriesProcessed:      0,
  bytesProcessedLocally: 0,
  bytesSentToCloud:      0,   // always 0
  modelsLoaded:          [],
  sessionStarted:        new Date().toISOString(),
}

export function recordQuery(inputBytes: number, outputBytes: number): void {
  telemetry.queriesProcessed      += 1
  telemetry.bytesProcessedLocally += inputBytes + outputBytes
}

export function recordModelLoaded(name: string): void {
  if (!telemetry.modelsLoaded.includes(name)) {
    telemetry.modelsLoaded.push(name)
  }
}

export function getTelemetry(): Readonly<LocalTelemetry> {
  return telemetry
}
