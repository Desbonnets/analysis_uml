import { Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <span className="current">{title}</span>
        {subtitle && (
          <>
            <span className="sep">·</span>
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{subtitle}</span>
          </>
        )}
      </div>
      <div className="spacer" />
      <div className="search">
        <Search size={12} color="var(--fg-2)" />
        <input placeholder="Chercher un module, une classe..." />
        <span className="kbd">⌘K</span>
      </div>
      {actions}
    </header>
  )
}
