import { useAppStore } from '../../store/useAppStore'
import type { Page } from '../../types'

interface NavItem {
  page:  Page
  label: string
  icon:  string
}

const NAV_ITEMS: NavItem[] = [
  { page: 'monitor', label: 'Monitor', icon: 'mic'              },
  { page: 'scan',    label: 'Scan',    icon: 'document_scanner' },
  { page: 'vault',   label: 'Vault',   icon: 'lock'             },
]

export default function Sidebar() {
  const activePage   = useAppStore((s) => s.activePage)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const emergencyPurge = useAppStore((s) => s.emergencyPurge)

  function handlePurge() {
    if (window.confirm('EMERGENCY PURGE: This will delete all session data and vault entries. Continue?')) {
      emergencyPurge()
    }
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-64 flex flex-col bg-surface-container-low border-r border-outline-variant z-40">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-outline-variant">
        <h1 className="font-syne font-extrabold text-2xl tracking-tighter text-primary leading-none">
          SOVERMIND
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant mt-1">
          Local System Active
        </p>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1 flex-grow px-2 pt-3">
        {NAV_ITEMS.map(({ page, label, icon }) => {
          const isActive = activePage === page
          return (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`
                flex items-center gap-3 px-3 py-3 w-full text-left
                font-mono text-[13px] uppercase tracking-[0.05em]
                transition-all duration-150 border-r-2
                ${isActive
                  ? 'bg-secondary-container text-primary border-primary nav-glow'
                  : 'text-on-surface-variant border-transparent hover:bg-surface-container-highest hover:text-primary'
                }
              `}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill' : ''}`}>
                {icon}
              </span>
              {label}
            </button>
          )
        })}
      </div>

      {/* Emergency Purge */}
      <div className="px-3 py-4 border-t border-outline-variant">
        <button
          onClick={handlePurge}
          className="
            w-full flex items-center justify-center gap-2
            border border-error text-error
            font-mono text-[11px] uppercase tracking-[0.08em]
            py-2 px-3
            hover:bg-error hover:text-on-primary
            transition-all duration-150
          "
        >
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Emergency Purge
        </button>
      </div>
    </nav>
  )
}
