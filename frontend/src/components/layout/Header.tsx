import { Search, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAnalysis } from '../../context/AnalysisContext'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

function NotificationBell() {
  const { hasUnread, state, markRead } = useAnalysis()

  if (!hasUnread || state.projectId === null) return null

  return (
    <Link
      to={`/projects/${state.projectId}`}
      onClick={markRead}
      title={`Analyse de "${state.projectName}" terminée`}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, background: 'var(--bg-2)', color: 'var(--fg-1)', textDecoration: 'none', flexShrink: 0 }}
    >
      <Bell size={14} />
      <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', border: '1.5px solid var(--bg-1)' }} />
    </Link>
  )
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
      <NotificationBell />
      {actions}
    </header>
  )
}
