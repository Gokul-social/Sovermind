export type Page     = 'monitor' | 'scan' | 'vault'
export type Language = 'english' | 'tamil' | 'hindi' | 'swahili'
export type Status   = 'optimal' | 'warning' | 'critical'
export type LogType  = 'info' | 'success' | 'warning' | 'error'
export type VaultType = 'prescription' | 'query' | 'report'

export interface LogEntry {
  id:        string
  timestamp: string
  message:   string
  type:      LogType
}

export interface OCREntity {
  id:          string
  name:        string
  description: string
  confidence:  number
  warning?:    string
}

export interface VaultEntry {
  id:          string
  type:        VaultType
  timestamp:   string
  preview:     string
  confidence?: number
  data:        unknown
}

export interface StreamingResponse {
  text:     string
  tokens:   number
  language: Language
}

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string }> = {
  english: { label: 'English',  flag: '🇬🇧' },
  tamil:   { label: 'Tamil',    flag: '🇮🇳' },
  hindi:   { label: 'Hindi',    flag: '🇮🇳' },
  swahili: { label: 'Swahili',  flag: '🇰🇪' },
}
