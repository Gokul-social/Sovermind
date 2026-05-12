import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSessionLogger } from '../hooks/useSessionLogger'
import { unlockPremiumReport } from '../lib/solana'
import type { VaultEntry, VaultType } from '../types'

type Filter = 'all' | VaultType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',          label: 'All'           },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'query',        label: 'Queries'       },
  { key: 'report',       label: 'Reports'       },
]

const TYPE_COLOR: Record<VaultType, string> = {
  prescription: 'border-primary text-primary',
  query:        'border-on-surface-variant text-on-surface-variant',
  report:       'border-tertiary-fixed-dim text-tertiary-fixed-dim',
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function VaultCard({
  entry,
  onDelete,
  onPremiumReport,
}: {
  entry: VaultEntry
  onDelete: () => void
  onPremiumReport: () => Promise<void>
}) {
  const [expanded,    setExpanded]    = useState(false)
  const [confirming,  setConfirming]  = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  return (
    <article className="border border-outline-variant bg-surface-container-low animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-highest">
        <div className="flex items-center gap-3">
          <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] ${TYPE_COLOR[entry.type]}`}>
            {entry.type}
          </span>
          <span className="font-mono text-[11px] text-on-surface-variant">{formatDate(entry.timestamp)}</span>
        </div>
        <div className="flex items-center gap-1">
          {entry.confidence != null && (
            <span className="font-mono text-[10px] text-on-surface-variant mr-2">
              {entry.confidence.toFixed(1)}% conf
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {expanded ? 'unfold_less' : 'unfold_more'}
            </span>
          </button>
          <button
            onClick={async () => {
              setIsUnlocking(true)
              try { await onPremiumReport() } finally { setIsUnlocking(false) }
            }}
            disabled={isUnlocking}
            className="flex items-center gap-1 px-2 py-0.5 border border-tertiary-fixed-dim text-tertiary-fixed-dim font-mono text-[10px] uppercase tracking-[0.05em] hover:bg-tertiary-fixed-dim hover:text-on-surface transition-all disabled:opacity-40 disabled:cursor-wait"
            title="Pay 0.50 USDT on Solana to unlock a premium PDF report"
          >
            <span className="material-symbols-outlined text-[14px]">
              {isUnlocking ? 'hourglass_top' : 'workspace_premium'}
            </span>
            {isUnlocking ? 'Paying…' : 'Premium'}
          </button>
          {confirming ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => { onDelete(); setConfirming(false) }}
                className="px-2 py-0.5 bg-error text-on-primary font-mono text-[10px] uppercase hover:brightness-110 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-0.5 border border-outline-variant text-on-surface-variant font-mono text-[10px] uppercase hover:border-primary hover:text-primary transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="p-1 text-on-surface-variant hover:text-error transition-colors"
              title="Delete"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="px-4 py-3">
        <p className={`font-serif text-[14px] text-on-surface-variant leading-snug ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.preview}
        </p>
        {expanded && entry.data != null && (
          <pre className="mt-3 p-2 bg-surface-container font-mono text-[10px] text-on-surface-variant overflow-x-auto border border-outline-variant">
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        )}
      </div>
    </article>
  )
}

export default function Vault() {
  const { vaultEntries, deleteVaultEntry } = useAppStore()
  const logger = useSessionLogger()
  const [filter, setFilter] = useState<Filter>('all')
  const [view,   setView]   = useState<'list' | 'grid'>('list')

  async function handlePremiumReport(entry: VaultEntry): Promise<void> {
    try {
      logger.info('Initiating Solana payment for premium report…')
      const { signature, explorerUrl } = await unlockPremiumReport(
        entry.id,
        typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data),
      )
      logger.success(`Payment confirmed: ${signature.slice(0, 8)}…`)
      logger.info(`Explorer: ${explorerUrl}`)
    } catch (err) {
      logger.error(`Payment failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const filtered = filter === 'all'
    ? vaultEntries
    : vaultEntries.filter((e) => e.type === filter)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-primary">lock</span>
          <h2 className="font-syne font-bold text-lg text-on-surface">LOCAL VAULT</h2>
          <span className="font-mono text-[11px] text-on-surface-variant">
            {vaultEntries.length} {vaultEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-outline-variant">
          {(['list', 'grid'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`p-1.5 transition-colors ${view === v ? 'bg-secondary-container text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {v === 'list' ? 'view_list' : 'grid_view'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-outline-variant shrink-0">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-4 py-2 font-mono text-[11px] uppercase tracking-[0.05em]
              border-r border-outline-variant transition-colors
              ${filter === key
                ? 'bg-secondary-container text-primary border-b-2 border-b-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">lock</span>
            <p className="font-mono text-[12px] text-on-surface-variant uppercase tracking-[0.06em]">
              {filter === 'all'
                ? 'Vault empty — no data committed'
                : `No ${filter} entries`
              }
            </p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
            {filtered.map((entry) => (
              <VaultCard
                key={entry.id}
                entry={entry}
                onDelete={() => deleteVaultEntry(entry.id)}
                onPremiumReport={() => handlePremiumReport(entry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
