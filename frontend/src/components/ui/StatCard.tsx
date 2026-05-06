import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'purple' | 'emerald' | 'amber' | 'sky'
}

const iconColor: Record<string, string> = {
  purple:  'var(--accent)',
  emerald: 'var(--ok)',
  amber:   'var(--warn)',
  sky:     'var(--info)',
}

const iconBg: Record<string, string> = {
  purple:  'var(--accent-soft)',
  emerald: 'var(--ok-soft)',
  amber:   'var(--warn-soft)',
  sky:     'var(--info-soft)',
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'purple' }: StatCardProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--fg-2)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, margin: '0 0 8px' }}>
            {label}
          </p>
          <p className="mono tabular" style={{ color: 'var(--fg-0)', fontSize: 28, fontWeight: 700, lineHeight: 1, margin: 0 }}>
            {value}
          </p>
          {trend && (
            <p style={{ fontSize: 11, marginTop: 6, color: trendUp ? 'var(--ok)' : 'var(--bad)', margin: '6px 0 0' }}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg[color], display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor[color], flexShrink: 0 }}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  )
}
