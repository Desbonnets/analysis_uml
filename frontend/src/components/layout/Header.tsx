import { Search, Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[#1e2235] bg-[#0d0f17]">
      <div>
        <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 w-56">
          <Search size={14} className="text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1d27] border border-[#2a2d3e] text-slate-400 hover:text-slate-200 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500" />
        </button>
      </div>
    </header>
  )
}
