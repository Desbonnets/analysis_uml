import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, GitBranch, BarChart2,
  Sparkles, Settings, ChevronRight, Layers
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projets' },
  { to: '/diagrams', icon: GitBranch, label: 'Diagrammes' },
  { to: '/analysis', icon: BarChart2, label: 'Analyse' },
  { to: '/ai', icon: Sparkles, label: 'Assistant IA' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-[#12141c] border-r border-[#1e2235] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e2235]">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Layers size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">ArchitectAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={13} className="ml-auto text-violet-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-[#1e2235] pt-4 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
              isActive
                ? 'bg-violet-600/20 text-violet-300 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`
          }
        >
          <Settings size={16} className="text-slate-500 group-hover:text-slate-300" />
          <span>Paramètres</span>
        </NavLink>

        {/* User avatar */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-white/5">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-semibold">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-200 font-medium truncate">Alice Martin</p>
            <p className="text-[10px] text-violet-400 font-medium">Pro</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
