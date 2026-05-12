const GITHUB_URL =
  import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/YOUR_USERNAME/sovermind'

export function DemoBanner() {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null

  return (
    <div
      style={{
        position:       'fixed',
        bottom:         0,
        left:           '256px',
        right:          0,
        zIndex:         100,
        background:     '#1c211d',
        borderTop:      '1px solid #3b4a45',
        padding:        '6px 20px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
      }}
    >
      <span
        style={{
          fontFamily:    'IBM Plex Mono, monospace',
          fontSize:      '12px',
          color:         '#ffb94f',
          letterSpacing: '0.05em',
        }}
      >
        ⚠ DEMO MODE — QVAC RESPONSES SIMULATED. Real app runs fully offline on your device.
      </span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily:     'IBM Plex Mono, monospace',
          fontSize:       '12px',
          color:          '#70ffe0',
          textDecoration: 'none',
          letterSpacing:  '0.05em',
          whiteSpace:     'nowrap',
        }}
      >
        DOWNLOAD FOR REAL LOCAL AI →
      </a>
    </div>
  )
}
