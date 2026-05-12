interface StatusBadgeProps {
  label: string
  variant?: 'teal' | 'amber' | 'red' | 'muted'
}

const variantMap = {
  teal:  'border-primary text-primary',
  amber: 'border-tertiary-fixed-dim text-tertiary-fixed-dim',
  red:   'border-error text-error',
  muted: 'border-outline-variant text-on-surface-variant',
}

export default function StatusBadge({ label, variant = 'muted' }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center border px-2 py-0.5
        font-mono text-[11px] uppercase tracking-[0.05em]
        ${variantMap[variant]}
      `}
    >
      {label}
    </span>
  )
}
