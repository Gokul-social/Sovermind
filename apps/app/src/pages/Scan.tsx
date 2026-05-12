import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useQVAC } from '../hooks/useQVAC'
import type { OCREntity } from '../types'

// ── Corner bracket decoration ────────────────────────────────────
function Brackets() {
  const cls = 'absolute w-4 h-4 border-primary border-2'
  return (
    <>
      <div className={`${cls} top-2 left-2  border-b-0 border-r-0`} />
      <div className={`${cls} top-2 right-2 border-b-0 border-l-0`} />
      <div className={`${cls} bottom-2 left-2  border-t-0 border-r-0`} />
      <div className={`${cls} bottom-2 right-2 border-t-0 border-l-0`} />
    </>
  )
}

// ── Entity card ───────────────────────────────────────────────────
function EntityCard({ entity, index, visible }: { entity: OCREntity; index: number; visible: boolean }) {
  const isLowConf = entity.confidence < 90

  return (
    <article
      className={`
        border border-outline-variant bg-surface-container-low
        transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        ${isLowConf ? 'opacity-70' : ''}
      `}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-highest">
        <h3 className={`font-mono text-[12px] flex items-center gap-2 ${isLowConf ? 'text-on-surface' : 'text-primary'}`}>
          <span className="text-on-surface-variant">[{String(index + 1).padStart(2, '0')}]</span>
          {entity.name}
        </h3>
        <span className={`
          border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em]
          ${entity.confidence >= 95
            ? 'border-primary/40 text-on-secondary-container bg-secondary-container'
            : 'border-outline-variant text-on-surface-variant'
          }
        `}>
          {entity.confidence.toFixed(1)}%
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-3">
        <p className="font-serif text-[14px] text-on-surface leading-relaxed">
          {entity.dosage && <span className="font-mono text-[12px] text-primary mr-2">{entity.dosage}</span>}
          {entity.instructions}
        </p>
        {entity.warning && (
          <div className="mt-2 pt-2 border-t border-dashed border-outline-variant flex items-start gap-2 text-tertiary-fixed-dim">
            <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">warning</span>
            <p className="font-mono text-[11px] leading-snug">{entity.warning}</p>
          </div>
        )}
      </div>
    </article>
  )
}

// ── Scan page ─────────────────────────────────────────────────────
export default function Scan() {
  const { addVaultEntry } = useAppStore()
  const { ocr } = useQVAC()

  const [imageUrl,  setImageUrl]  = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [scanning,  setScanning]  = useState(false)
  const [entities,  setEntities]  = useState<OCREntity[]>([])
  const [revealed,  setRevealed]  = useState(false)
  const [committed, setCommitted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef      = useRef<HTMLDivElement>(null)

  function loadFile(file: File) {
    const url = URL.createObjectURL(file)
    setImageFile(file)
    setImageUrl(url)
    setEntities([])
    setRevealed(false)
    setCommitted(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadFile(file)
  }, [])

  async function handleScan() {
    if (!imageFile || scanning) return
    setScanning(true)
    setEntities([])
    setRevealed(false)
    // Scanning line runs for ~2s before results come back
    const results = await ocr(imageFile)
    setEntities(results)
    setScanning(false)
    // Stagger reveal
    setTimeout(() => setRevealed(true), 80)
  }

  function handleCommit() {
    if (!entities.length || committed) return
    entities.forEach((entity) => {
      addVaultEntry({
        type:       'prescription',
        preview:    `${entity.name} — ${entity.instructions.slice(0, 80)}...`,
        confidence: entity.confidence,
        data:       entity,
      })
    })
    setCommitted(true)
  }

  return (
    <div className="flex h-full">
      {/* ── Left: scanner ──────────────────────────────────────── */}
      <section className="flex-1 flex flex-col border-r border-outline-variant">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">
            Optical Character Recognition
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant">SYS_THREAD_09A</span>
        </div>

        {/* Viewfinder */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative flex-1 bg-surface-container-highest overflow-hidden cursor-pointer"
          onClick={() => !imageUrl && fileInputRef.current?.click()}
        >
          <Brackets />

          {/* Teal overlay tint */}
          <div className="absolute inset-0 bg-primary/5 pointer-events-none z-10 mix-blend-overlay" />

          {/* Scan line */}
          {scanning && <div className="scan-line" />}

          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Document"
              className="w-full h-full object-contain"
              style={{ filter: 'grayscale(1) contrast(1.2) brightness(0.75)' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <span className="material-symbols-outlined text-[48px] text-primary">upload_file</span>
              <p className="font-mono text-[12px] text-on-surface-variant uppercase tracking-[0.06em]">
                Drop document here
              </p>
              <p className="font-mono text-[10px] text-on-surface-variant">or click to browse</p>
            </div>
          )}

          {/* HUD bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-surface-container-low/80 backdrop-blur-sm border-t border-outline-variant z-20">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">adjust</span>
                {scanning ? 'SCANNING...' : imageUrl ? 'TARGET ACQUIRED' : 'ACQUIRING TARGET'}
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">ISO 3200</span>
            </div>
            <span className="font-mono text-[10px] text-primary">FRM: 144</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2 p-3 border-t border-outline-variant bg-surface-container-low shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-outline-variant text-on-surface-variant font-mono text-[11px] uppercase tracking-[0.05em] hover:border-primary hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload
          </button>
          <button
            onClick={handleScan}
            disabled={!imageFile || scanning}
            className="
              flex-1 flex items-center justify-center gap-2
              bg-primary text-on-primary
              font-mono text-[12px] uppercase tracking-[0.05em]
              py-2 hover:brightness-110 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <span className="material-symbols-outlined text-[16px] icon-fill">
              {scanning ? 'sync' : 'document_scanner'}
            </span>
            {scanning ? 'Scanning...' : 'Run OCR Scan'}
          </button>
        </div>
      </section>

      {/* ── Right: extracted entities ──────────────────────────── */}
      <section className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
            Extracted Entities
          </span>
          {entities.length > 0 && (
            <span className="font-mono text-[11px] text-primary">
              [{entities.length}] Detected
            </span>
          )}
        </div>

        {/* Card list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {!entities.length && !scanning && (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">schema</span>
              <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.05em]">
                No entities detected yet
              </p>
            </div>
          )}
          {scanning && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 bg-primary animate-pulse-dot"
                    style={{ height: 24 + i * 8, animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="font-mono text-[11px] text-primary uppercase tracking-[0.05em]">
                Analyzing document...
              </p>
            </div>
          )}
          {entities.map((entity, i) => (
            <EntityCard key={entity.id} entity={entity} index={i} visible={revealed} />
          ))}
        </div>

        {/* Commit button */}
        <div className="p-3 border-t border-outline-variant shrink-0">
          <button
            onClick={handleCommit}
            disabled={!entities.length || committed}
            className="
              w-full flex items-center justify-center gap-2
              bg-primary text-on-primary
              font-mono text-[12px] uppercase tracking-[0.06em]
              py-3 hover:brightness-110 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <span className="material-symbols-outlined text-[18px] icon-fill">
              {committed ? 'check_circle' : 'save'}
            </span>
            {committed ? 'Committed to Vault' : 'Commit to Vault'}
          </button>
        </div>
      </section>
    </div>
  )
}
