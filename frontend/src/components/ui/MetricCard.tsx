interface MetricCardProps {
  label: string
  value: string | number
  delta?: string
  deltaTone?: 'ok' | 'bad'
  sparkPoints?: string
  sparkColor?: string
}

export default function MetricCard({
  label,
  value,
  delta,
  deltaTone = 'ok',
  sparkPoints,
  sparkColor = 'var(--accent)',
}: MetricCardProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
          {label}
        </span>
        {delta && <span className={`pill pill-${deltaTone} pill-square`}>{delta}</span>}
      </div>
      <div className="mono tabular" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: 'var(--fg-0)' }}>
        {value}
      </div>
      {sparkPoints && (
        <svg style={{ height: 32, marginTop: 12, width: '100%' }} viewBox="0 0 100 32" preserveAspectRatio="none">
          <polyline points={sparkPoints} fill="none" stroke={sparkColor} strokeWidth="1.5" />
        </svg>
      )}
    </div>
  )
}
