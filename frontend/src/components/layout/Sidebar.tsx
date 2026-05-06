import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, GitBranch, AlertTriangle, Sparkles, Settings, LogOut } from 'lucide-react'
import Logo from '../ui/Logo'
import Avatar from '../ui/Avatar'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/projects',  icon: FolderOpen,       label: 'Projets',          count: 12 },
  { to: '/diagrams',  icon: GitBranch,         label: 'Canvas' },
  { to: '/analysis',  icon: AlertTriangle,     label: 'Issues',           count: 7 },
  { to: '/ai',        icon: Sparkles,          label: 'Assistant IA' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={22} />
        <span className="name">UML Analysis</span>
      </div>

      <div className="label">Espace</div>

      {nav.map(({ to, icon: Icon, label, count }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
        >
          <Icon size={16} className="icon" />
          <span>{label}</span>
          {count != null && <span className="count">{count}</span>}
        </NavLink>
      ))}

      <div className="footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
        >
          <Settings size={16} className="icon" />
          <span>Paramètres</span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6, marginTop: 2 }}>
          <Avatar initials="AM" color="var(--accent)" size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-0)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Alice Martin
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent)' }}>Pro</div>
          </div>
          <LogOut size={14} style={{ color: 'var(--fg-2)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  )
}
