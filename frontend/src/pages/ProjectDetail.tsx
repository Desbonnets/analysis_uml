import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, AlertTriangle, BarChart2, Play, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import projectsData from '../data/projects.json'
import diagramsData from '../data/diagrams.json'
import violationsData from '../data/violations.json'
import type { Project, Diagram, Violation } from '../types'

const projects = projectsData as Project[]
const diagrams = diagramsData as Diagram[]
const violations = violationsData as Violation[]

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
}
const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
const scoreBg = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const project = projects.find(p => p.id === id)
  const projectDiagrams = diagrams.filter(d => d.projectId === id)
  const projectViolations = violations.filter(v => v.projectId === id)

  if (!project) return (
    <div className="flex items-center justify-center h-screen text-slate-400">
      Projet introuvable
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={project.name} subtitle={project.description} />

      <div className="flex-1 px-8 py-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Link to="/projects" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <ArrowLeft size={15} />
            Retour aux projets
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              label={project.status === 'analyzed' ? 'Analysé' : project.status === 'pending' ? 'En cours' : 'Nouveau'}
              variant={project.status === 'analyzed' ? 'success' : project.status === 'pending' ? 'warning' : 'neutral'}
            />
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
              <Play size={13} />
              Lancer l'analyse
            </button>
          </div>
        </div>

        {/* Score card */}
        {project.score > 0 && (
          <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Score d'architecture</h3>
              <span className={`text-3xl font-bold ${scoreColor(project.score)}`}>{project.score}<span className="text-slate-500 text-lg font-normal">/100</span></span>
            </div>
            <div className="w-full bg-[#1e2235] rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${scoreBg(project.score)}`} style={{ width: `${project.score}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Principes SOLID', value: 72 },
                { label: 'Couplage', value: 85 },
                { label: 'Cohésion', value: 78 },
                { label: 'Patterns', value: 80 },
              ].map(cat => (
                <div key={cat.label} className="text-center">
                  <p className="text-xs text-slate-500 mb-1">{cat.label}</p>
                  <p className={`text-lg font-bold ${scoreColor(cat.value)}`}>{cat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Diagrammes */}
          <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <GitBranch size={15} className="text-violet-400" />
                Diagrammes UML
              </h3>
              <button className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                <Plus size={12} />
                Nouveau
              </button>
            </div>

            {projectDiagrams.length > 0 ? (
              <div className="space-y-2">
                {projectDiagrams.map(d => (
                  <Link
                    key={d.id}
                    to={`/diagrams/${d.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400">
                      <GitBranch size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs font-medium group-hover:text-white truncate">{d.name}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">{d.classes.length} classes · Modifié le {new Date(d.updatedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge label={d.type} variant="info" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <GitBranch size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucun diagramme</p>
              </div>
            )}
          </div>

          {/* Violations */}
          <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                Violations ({projectViolations.length})
              </h3>
              <Link to="/analysis" className="text-xs text-violet-400 hover:text-violet-300">
                Voir l'analyse →
              </Link>
            </div>

            {projectViolations.length > 0 ? (
              <div className="space-y-2">
                {projectViolations.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#0d0f17]">
                    <Badge label={v.severity} variant={severityVariant[v.severity]} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs font-medium">{v.title}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5 font-mono truncate">{v.file}:{v.line}</p>
                    </div>
                  </div>
                ))}
                {projectViolations.length > 5 && (
                  <p className="text-xs text-slate-600 text-center pt-1">+{projectViolations.length - 5} autres violations</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <BarChart2 size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucune violation détectée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
