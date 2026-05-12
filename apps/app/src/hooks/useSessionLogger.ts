import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { LogType } from '../types'

export function useSessionLogger() {
  const addLog = useAppStore((s) => s.addLog)

  const log = useCallback(
    (message: string, type: LogType = 'info') => addLog(message, type),
    [addLog],
  )

  return {
    info:    (msg: string) => log(msg, 'info'),
    success: (msg: string) => log(msg, 'success'),
    warn:    (msg: string) => log(msg, 'warning'),
    error:   (msg: string) => log(msg, 'error'),
  }
}
