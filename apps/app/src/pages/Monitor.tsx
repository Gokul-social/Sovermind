import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useQVAC } from '../hooks/useQVAC'
import { useSessionLogger } from '../hooks/useSessionLogger'
import SessionLog from '../components/shared/SessionLog'
import PulseIndicator from '../components/shared/PulseIndicator'
import StatusBadge from '../components/shared/StatusBadge'

// ── Voice recording hook ────────────────────────────────────────
function useVoiceRecorder(onResult: (text: string) => void) {
  const { isRecording, setRecording } = useAppStore()
  const logger  = useSessionLogger()
  const { transcribe } = useQVAC()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const SpeechAPI = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

  async function start() {
    if (SpeechAPI) {
      // Browser SpeechRecognition path
      const recog = new SpeechAPI()
      recog.continuous = false
      recog.interimResults = false
      recog.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        onResult(text)
        logger.success(`[AUDIO] Transcribed — "${text}"`)
      }
      recog.onerror = () => {
        setRecording(false)
        logger.error('[AUDIO] SpeechRecognition error.')
      }
      recog.onend = () => setRecording(false)
      setRecording(true)
      logger.info('[AUDIO] Recording started...')
      recog.start()
      return
    }

    // MediaRecorder + QVAC whisper fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        try {
          const text = await transcribe(blob)
          onResult(text)
        } catch { /* ignore */ }
        setRecording(false)
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      logger.info('[AUDIO] Recording started (MediaRecorder)...')
    } catch {
      logger.error('[AUDIO] Microphone access denied.')
    }
  }

  function stop() {
    mediaRef.current?.stop()
    mediaRef.current = null
    setRecording(false)
  }

  return { isRecording, start, stop }
}

// ── System log block ─────────────────────────────────────────────
const SYSTEM_LOG_LINES = [
  '> Initializing deep scan protocol...',
  '> Verifying cryptographic signatures... [OK]',
  '> Analyzing sub-routine variance... [NOMINAL]',
  '> Conclusion: No external observer detected.',
]

// ── Monitor page ─────────────────────────────────────────────────
export default function Monitor() {
  const {
    currentQuery, setCurrentQuery,
    currentResponse, setCurrentResponse,
    isStreaming, queryRef,
    selectedLanguage,
  } = useAppStore()

  const { query: runQuery } = useQVAC()

  const [inputValue, setInputValue] = useState('')
  const [hasQueried, setHasQueried] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Pre-fill input if query was set externally (e.g. from voice on Monitor screen)
  useEffect(() => {
    if (currentQuery && inputRef.current) {
      setInputValue(currentQuery)
    }
  }, [currentQuery])

  const voice = useVoiceRecorder((text) => {
    setInputValue(text)
    setCurrentQuery(text)
    inputRef.current?.focus()
  })

  async function submit() {
    const prompt = inputValue.trim()
    if (!prompt || isStreaming) return
    setCurrentQuery(prompt)
    setCurrentResponse('')
    setHasQueried(true)
    setInputValue('')
    await runQuery(prompt, selectedLanguage)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="flex h-full">
      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-outline-variant">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <PulseIndicator color="teal" />
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-primary">
              Query Ref: {queryRef}
            </span>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        {/* Response area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {!hasQueried && !currentResponse && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <span className="material-symbols-outlined text-[48px] text-primary">mic</span>
              <p className="font-mono text-[12px] text-on-surface-variant uppercase tracking-[0.05em]">
                Awaiting vocal or text input
              </p>
            </div>
          )}

          {(hasQueried || currentResponse) && (
            <>
              {/* Query echo */}
              {currentQuery && (
                <div className="flex items-start gap-3 border-l-2 border-outline-variant pl-4">
                  <span className="font-mono text-[11px] text-on-surface-variant shrink-0 mt-0.5">YOU</span>
                  <p className="font-mono text-[13px] text-on-surface-variant">{currentQuery}</p>
                </div>
              )}

              {/* AI response headline */}
              {currentResponse && (
                <div className="border-l-4 border-primary pl-4 relative scanlines">
                  <h2 className="font-syne font-bold text-2xl text-on-surface mb-3">
                    பகுப்பாய்வு அறிக்கை
                  </h2>
                  <p className={`font-serif text-[17px] text-on-surface-variant leading-relaxed mb-4 ${isStreaming ? 'streaming-caret' : ''}`}>
                    {currentResponse}
                  </p>

                  {/* Embedded system log block */}
                  {!isStreaming && (
                    <div className="border border-outline-variant bg-surface-container-low p-3 font-mono text-[11px] text-on-secondary-container leading-relaxed mb-4">
                      {SYSTEM_LOG_LINES.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-3 border-t border-outline-variant shrink-0">
          {[
            { label: 'Threat Level',   value: 'NIL',    variant: 'teal'  as const },
            { label: 'Data Integrity', value: '100%',   variant: 'teal'  as const },
            { label: 'Local Isolation',value: 'ACTIVE', variant: 'teal'  as const },
          ].map(({ label, value, variant }, i) => (
            <div
              key={label}
              className={`flex flex-col px-4 py-3 ${i < 2 ? 'border-r border-outline-variant' : ''}`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
              </span>
              <StatusBadge label={value} variant={variant} />
            </div>
          ))}
        </div>

        {/* Command input */}
        <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-low shrink-0">
          <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">
            Command Input
          </label>
          <div className="flex items-center gap-3 border-b border-outline-variant focus-within:border-primary transition-colors pb-1">
            <span className="font-mono text-primary select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter query for local AI..."
              disabled={isStreaming}
              className="
                flex-1 bg-transparent border-none outline-none
                font-mono text-[13px] text-on-surface
                placeholder:text-on-surface-variant/40
                disabled:opacity-50 disabled:cursor-wait
              "
            />
            {/* Mic button */}
            <button
              onClick={voice.isRecording ? voice.stop : voice.start}
              className={`
                flex items-center gap-1 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.05em]
                transition-all duration-150
                ${voice.isRecording
                  ? 'text-error border border-error animate-pulse-dot'
                  : 'text-on-surface-variant hover:text-primary border border-outline-variant hover:border-primary'
                }
              `}
            >
              <span className="material-symbols-outlined text-[16px] icon-fill">
                {voice.isRecording ? 'stop_circle' : 'mic'}
              </span>
              {voice.isRecording ? 'Stop' : 'Voice'}
            </button>
            {/* Submit */}
            <button
              onClick={submit}
              disabled={isStreaming || !inputValue.trim()}
              className="
                flex items-center gap-1 px-3 py-1 bg-primary text-on-primary
                font-mono text-[11px] uppercase tracking-[0.05em]
                hover:brightness-110 transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {isStreaming
                ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                : <span className="material-symbols-outlined text-[16px]">send</span>
              }
              {isStreaming ? 'Processing' : 'Send'}
            </button>
          </div>
          {voice.isRecording && (
            <p className="font-mono text-[10px] text-error mt-1.5 flex items-center gap-1">
              <PulseIndicator color="red" size={6} /> Recording... click Stop when done.
            </p>
          )}
        </div>
      </div>

      {/* ── Session logs ──────────────────────────────────────── */}
      <SessionLog />
    </div>
  )
}
