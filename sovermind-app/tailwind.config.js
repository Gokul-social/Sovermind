/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:                     '#70ffe0',
        background:                  '#0f1511',
        surface:                     '#0f1511',
        'surface-container':         '#1c211d',
        'surface-container-low':     '#181d19',
        'surface-container-high':    '#262b28',
        'surface-container-highest': '#313632',
        'outline-variant':           '#3b4a45',
        outline:                     '#84948f',
        'on-surface':                '#dfe4de',
        'on-surface-variant':        '#b9cac4',
        'secondary-container':       '#354f40',
        'on-secondary-container':    '#a3bfac',
        'on-primary':                '#00382e',
        error:                       '#ffb4ab',
        'error-container':           '#93000a',
        'tertiary-fixed-dim':        '#ffb94f',
        'tertiary-container':        '#ffc064',
      },
      fontFamily: {
        syne:  ['Syne', 'sans-serif'],
        serif: ['"Source Serif 4"', 'serif'],
        mono:  ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm:   '2px',
        md:   '4px',
        lg:   '4px',
        xl:   '4px',
        full: '9999px',
      },
      animation: {
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'slide-in':  'slideIn 0.2s ease forwards',
        'fade-in':   'fadeIn 0.15s ease forwards',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1'   },
          '50%':      { opacity: '0.3' },
        },
        scanLine: {
          '0%':   { top: '0%'   },
          '100%': { top: '100%' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
