interface PulseIndicatorProps {
  color?: 'teal' | 'amber' | 'red'
  size?: number
}

const colorMap = {
  teal:  'bg-primary  shadow-[0_0_6px_#70ffe0]',
  amber: 'bg-tertiary-fixed-dim shadow-[0_0_6px_#ffb94f]',
  red:   'bg-error    shadow-[0_0_6px_#ffb4ab]',
}

export default function PulseIndicator({ color = 'teal', size = 8 }: PulseIndicatorProps) {
  return (
    <span
      className={`inline-block rounded-full animate-pulse-dot ${colorMap[color]}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  )
}
