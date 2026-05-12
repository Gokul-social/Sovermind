import { useAppStore } from '../../store/useAppStore'
import type { LogEntry } from '../../types'

function LogRow({ entry }: { entry: LogEntry }) {
  const isWarning = entry.type === 'warning' || entry.type === 'error'

  return (
    <div
      className={`
        flex flex-col border p-2 animate-slide-in
        ${isWarning
          ? 'border-tertiary-fixed-dim bg-tertiary-fixed-dim/5 border-l-2 border-l-tertiary-fixed-dim'
          : 'border-outline-variant bg-surface-container-low'
        }
      `}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className={`font-mono text-[10px] ${isWarning ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>
          {entry.timestamp}
        </span>
        <span className={`material-symbols-outlined text-[14px] ${
          entry.type === 'success' ? 'text-primary' :
          entry.type === 'warning' ? 'text-tertiary-fixed-dim' :
          entry.type === 'error'   ? 'text-error' :
          'text-on-surface-variant'
        }`}>
          {entry.type === 'success' ? 'check_circle' :
           entry.type === 'warning' ? 'warning'      :
           entry.type === 'error'   ? 'error'        :
           'info'}
        </span>
      </div>
      <span className={`font-mono text-[11px] leading-snug ${isWarning ? 'text-tertiary-fixed-dim' : 'text-on-surface'}`}>
        {entry.message}
      </span>
    </div>
  )
}

export default function SessionLog() {
  const logs = useAppStore((s) => s.sessionLogs)

  return (
    <aside className="w-72 border-l border-outline-variant flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-on-surface-variant">
          Session Logs
        </span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">terminal</span>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-2">
        {logs.length === 0 ? (
          <p className="font-mono text-[11px] text-on-surface-variant text-center mt-8">
            NO LOGS YET
          </p>
        ) : (
          logs.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </aside>
  )
}
