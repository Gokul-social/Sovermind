import { useAppStore } from '../../store/useAppStore'
import PulseIndicator from '../shared/PulseIndicator'
import type { Language } from '../../types'
import { LANGUAGE_LABELS } from '../../types'

const LANGUAGES = Object.entries(LANGUAGE_LABELS) as [Language, { label: string; flag: string }][]

export default function Header() {
  const { selectedLanguage, setLanguage, systemStatus, bytesSentToCloud } = useAppStore()

  return (
    <header className="fixed top-0 left-64 right-0 h-16 flex items-center justify-between px-5 z-30 bg-surface-container-low border-b border-outline-variant">
      {/* Left: watermark */}
      <span className="font-syne font-black text-xl tracking-widest text-primary opacity-20 select-none">
        SOVERMIND
      </span>

      {/* Center: bytes badge */}
      <div className="flex items-center gap-2 border border-primary/40 px-3 py-1">
        <span className="material-symbols-outlined text-[16px] text-primary">cloud_off</span>
        <span className="font-mono text-[11px] text-primary uppercase tracking-[0.05em]">
          ⊘ {bytesSentToCloud} bytes sent to cloud
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        {/* Language selector */}
        <div className="flex items-center gap-1 border border-outline-variant px-2 py-1 bg-surface-container">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">translate</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-none text-on-surface-variant font-mono text-[11px] uppercase tracking-[0.05em] outline-none cursor-pointer appearance-none pr-1"
          >
            {LANGUAGES.map(([code, { label, flag }]) => (
              <option key={code} value={code} className="bg-surface-container-highest text-on-surface">
                {flag} {label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant pointer-events-none">
            arrow_drop_down
          </span>
        </div>

        {/* System status */}
        <div className="flex items-center gap-2">
          <PulseIndicator color={systemStatus === 'optimal' ? 'teal' : systemStatus === 'warning' ? 'amber' : 'red'} />
          <span className="font-mono text-[11px] text-primary uppercase tracking-[0.05em]">
            System {systemStatus}
          </span>
        </div>

        {/* Icon buttons */}
        <div className="flex items-center gap-1">
          {(['wifi_off', 'enhanced_encryption', 'settings'] as const).map((icon) => (
            <button
              key={icon}
              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
