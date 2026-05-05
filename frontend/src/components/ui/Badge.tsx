interface BadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
}

const styles = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/15 text-red-400 border-red-500/20',
  info:    'bg-sky-500/15 text-sky-400 border-sky-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  purple:  'bg-violet-500/15 text-violet-400 border-violet-500/20',
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  )
}
