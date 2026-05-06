interface BadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
}

const toneMap: Record<string, string> = {
  success: 'ok',
  warning: 'warn',
  danger:  'bad',
  info:    'info',
  neutral: 'neutral',
  purple:  'info',
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`pill pill-${toneMap[variant]} pill-square`}>
      {label}
    </span>
  )
}
