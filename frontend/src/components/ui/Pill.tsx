interface PillProps {
  tone?: 'ok' | 'warn' | 'bad' | 'info' | 'neutral'
  square?: boolean
  dot?: boolean
  children: React.ReactNode
}

export default function Pill({ tone = 'neutral', square, dot, children }: PillProps) {
  return (
    <span className={`pill pill-${tone}${square ? ' pill-square' : ''}`}>
      {dot && <span className="dot" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  )
}
