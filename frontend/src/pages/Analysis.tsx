import { useState } from 'react'
import { AlertTriangle, Filter, ChevronDown, FileCode } from 'lucide-react'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import violationsData from '../data/violations.json'
import projectsData from '../data/projects.json'
import type { Violation, Project } from '../types'

const violations = violationsData as Violation[]
const projects = projectsData as Project[]

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
}
const typeVariant: Record<string, 'danger' | 'purple' | 'warning' | 'info'> = {
  SOLID: 'purple', DEPENDENCY: 'warning', ARCHITECTURE: 'danger', PATTERN: 'info',
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Analysis() {
  const [projectFilter, setProjectFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = violations
    .filter(v => projectFilter === 'all' || v.projectId === projectFilter)
    .filter(v => severityFilter === 'all' || v.severity === severityFilter)
    .filter(v => typeFilter === 'all' || v.type === typeFilter)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const stats = {
    critical: violations.filter(v => v.severity === 'critical').length,
    high: violations.filter(v => v.severity === 'high').length,
    medium: violations.filter(v => v.severity === 'medium').length,
    low: violations.filter(v => v.severity === 'low').length,
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Analyse & Violations" subtitle="Détection des problèmes d'architecture et violations SOLID" />

      <div className="flex-1 px-8 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Critiques', count: stats.critical, color: 'border-red-500/30 bg-red-500/10', text: 'text-red-400' },
            { label: 'Importantes', count: stats.high, color: 'border-amber-500/30 bg-amber-500/10', text: 'text-amber-400' },
            { label: 'Moyennes', count: stats.medium, color: 'border-sky-500/30 bg-sky-500/10', text: 'text-sky-400' },
            { label: 'Mineures', count: stats.low, color: 'border-slate-500/30 bg-slate-500/10', text: 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
              <p className="text-slate-400 text-xs mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.text}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={14} className="text-slate-500" />

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-[#12141c] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
          >
            <option value="all">Tous les projets</option>
            {projects.filter(p => p.status === 'analyzed').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-[#12141c] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
          >
            <option value="all">Toutes les sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Importante</option>
            <option value="medium">Moyenne</option>
            <option value="low">Mineure</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#12141c] border border-[#2a2d3e] rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500"
          >
            <option value="all">Tous les types</option>
            <option value="SOLID">SOLID</option>
            <option value="DEPENDENCY">Dépendance</option>
            <option value="ARCHITECTURE">Architecture</option>
            <option value="PATTERN">Pattern</option>
          </select>

          <span className="text-xs text-slate-500 ml-1">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Violations list */}
        <div className="space-y-2">
          {filtered.map(violation => {
            const project = projects.find(p => p.id === violation.projectId)
            const isOpen = expanded === violation.id

            return (
              <div key={violation.id} className="bg-[#12141c] border border-[#1e2235] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : violation.id)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <AlertTriangle size={15} className={
                    violation.severity === 'critical' ? 'text-red-400 mt-0.5 shrink-0' :
                    violation.severity === 'high' ? 'text-amber-400 mt-0.5 shrink-0' : 'text-slate-500 mt-0.5 shrink-0'
                  } />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-slate-100 text-sm font-medium">{violation.title}</span>
                      <Badge label={violation.severity} variant={severityVariant[violation.severity]} />
                      <Badge label={violation.type} variant={typeVariant[violation.type]} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{project?.name}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                        <FileCode size={11} />
                        {violation.file.split('/').pop()}:{violation.line}
                      </span>
                    </div>
                  </div>

                  <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 mt-0.5 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-[#1e2235]">
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{violation.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="text-xs text-violet-300 bg-violet-500/10 px-2 py-1 rounded font-mono">
                        {violation.file}:{violation.line}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune violation trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
