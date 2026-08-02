import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, GitBranch, FileCode2, ShieldCheck, ListChecks, AlertTriangle, Sparkles, Settings, LogOut, Users } from 'lucide-react'
import Logo from '../ui/Logo'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/projects',  icon: FolderOpen,       label: 'Projets',          count: 12 },
  { to: '/diagrams',  icon: GitBranch,         label: 'Canvas' },
  { to: '/saved-umls', icon: FileCode2,       label: 'UML enregistrés' },
  { to: '/conformance', icon: ShieldCheck,    label: 'Conformité' },
  { to: '/test-coverage', icon: ListChecks,   label: 'Couverture des tests' },
  { to: '/analysis',  icon: AlertTriangle,     label: 'Issues',           count: 7 },
  { to: '/ai',        icon: Sparkles,          label: 'Assistant IA' },
]

function toInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

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

      {user?.role === 'admin' && (
        <>
          <div className="label" style={{ marginTop: 12 }}>Administration</div>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
          >
            <Users size={16} className="icon" />
            <span>Utilisateurs</span>
          </NavLink>
        </>
      )}

      <div className="footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
        >
          <Settings size={16} className="icon" />
          <span>Paramètres</span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6, marginTop: 2 }}>
          <Avatar initials={user ? toInitials(user.name) : '?'} color="var(--accent)" size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-0)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? ''}
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'capitalize' }}>{user?.plan ?? ''}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Se déconnecter"
          >
            <LogOut size={14} style={{ color: 'var(--fg-2)' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
