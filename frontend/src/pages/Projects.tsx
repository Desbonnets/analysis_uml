import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, Search, Upload, AlertTriangle, GitBranch } from 'lucide-react'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import projectsData from '../data/projects.json'
import type { Project } from '../types'

const projects = projectsData as Project[]

const statusLabel: Record<string, string> = {
  analyzed: 'Analysé', pending: 'En cours', error: 'Erreur', new: 'Nouveau',
}
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  analyzed: 'success', pending: 'warning', error: 'danger', new: 'neutral',
}
const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'

export default function Projects() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Projets" subtitle="Gérez et analysez vos projets logiciels" />

      <div className="flex-1 px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#12141c] border border-[#1e2235] rounded-lg px-3 py-2 w-60">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
              />
            </div>

            {/* Filters */}
            {['all', 'analyzed', 'pending', 'new'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'Tous' : statusLabel[f]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2d3e] text-slate-400 hover:text-slate-200 text-sm transition-colors hover:bg-white/5">
              <Upload size={14} />
              Importer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
              <Plus size={14} />
              Nouveau projet
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5 hover:border-violet-600/30 hover:bg-[#14162000] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
                  <FolderOpen size={18} />
                </div>
                <Badge label={statusLabel[project.status]} variant={statusVariant[project.status]} />
              </div>

              <h3 className="text-slate-100 font-semibold text-sm group-hover:text-white mb-1">{project.name}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{project.description}</p>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <GitBranch size={11} />
                  {project.diagramsCount} diagrammes
                </span>
                {project.violationsCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <AlertTriangle size={11} />
                    {project.violationsCount} violations
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1e2235]">
                <span className="text-xs text-slate-600">{project.language}</span>
                {project.score > 0 ? (
                  <span className={`text-sm font-bold ${scoreColor(project.score)}`}>
                    {project.score}<span className="text-slate-600 font-normal text-xs">/100</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">Non analysé</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun projet trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
