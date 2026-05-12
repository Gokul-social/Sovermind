import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Page, Language, Status, LogEntry, VaultEntry, LogType } from '../types'

interface AppState {
  // navigation
  activePage:        Page
  // settings
  selectedLanguage:  Language
  systemStatus:      Status
  bytesSentToCloud:  number
  // recording
  isRecording:       boolean
  // current session
  currentQuery:      string
  currentResponse:   string
  isStreaming:       boolean
  queryRef:          string
  // logs
  sessionLogs:       LogEntry[]
  // vault
  vaultEntries:      VaultEntry[]

  // actions
  setActivePage:       (page: Page) => void
  setLanguage:         (lang: Language) => void
  setSystemStatus:     (s: Status) => void
  setRecording:        (v: boolean) => void
  setCurrentQuery:     (q: string) => void
  setCurrentResponse:  (r: string) => void
  setIsStreaming:      (v: boolean) => void
  addLog:              (message: string, type?: LogType) => void
  clearLogs:           () => void
  addVaultEntry:       (entry: Omit<VaultEntry, 'id' | 'timestamp'>) => void
  deleteVaultEntry:    (id: string) => void
  emergencyPurge:      () => void
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function makeTimestamp() {
  const d = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

function makeQueryRef() {
  return `SQ-${Math.floor(Math.random() * 9000 + 1000)}-ALPHA`
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activePage:       'monitor',
      selectedLanguage: 'english',
      systemStatus:     'optimal',
      bytesSentToCloud: 0,
      isRecording:      false,
      currentQuery:     '',
      currentResponse:  '',
      isStreaming:      false,
      queryRef:         makeQueryRef(),
      sessionLogs:      [],
      vaultEntries:     [],

      setActivePage:  (activePage) => set({ activePage }),
      setLanguage:    (selectedLanguage) => set({ selectedLanguage }),
      setSystemStatus:(systemStatus) => set({ systemStatus }),
      setRecording:   (isRecording) => set({ isRecording }),
      setCurrentQuery:(currentQuery) => set({ currentQuery }),
      setIsStreaming:  (isStreaming) => set({ isStreaming }),
      setCurrentResponse: (currentResponse) =>
        set({ currentResponse }),

      addLog: (message, type = 'info') =>
        set((s) => ({
          sessionLogs: [
            { id: makeId(), timestamp: makeTimestamp(), message, type },
            ...s.sessionLogs,
          ].slice(0, 100),
        })),

      clearLogs: () => set({ sessionLogs: [] }),

      addVaultEntry: (entry) =>
        set((s) => ({
          vaultEntries: [
            {
              ...entry,
              id: makeId(),
              timestamp: new Date().toISOString(),
            },
            ...s.vaultEntries,
          ],
        })),

      deleteVaultEntry: (id) =>
        set((s) => ({
          vaultEntries: s.vaultEntries.filter((e) => e.id !== id),
        })),

      emergencyPurge: () =>
        set({
          sessionLogs:     [],
          vaultEntries:    [],
          currentQuery:    '',
          currentResponse: '',
          isStreaming:     false,
          isRecording:     false,
          queryRef:        makeQueryRef(),
        }),
    }),
    {
      name: 'sovermind_vault',
      partialize: (s) => ({
        vaultEntries:     s.vaultEntries,
        selectedLanguage: s.selectedLanguage,
      }),
    },
  ),
)
