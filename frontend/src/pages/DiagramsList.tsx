import { Link } from 'react-router-dom'
import { GitBranch, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import diagramsData from '../data/diagrams.json'
import projectsData from '../data/projects.json'
import type { Diagram, Project } from '../types'

const diagrams = diagramsData as Diagram[]
const projects = projectsData as Project[]

const typeVariant: Record<string, 'info' | 'purple' | 'success' | 'warning'> = {
  class: 'info', dependency: 'purple', package: 'success', sequence: 'warning',
}

export default function DiagramsList() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Diagrammes UML" subtitle="Visualisez et éditez vos diagrammes d'architecture" />

      <div className="flex-1 px-8 py-6">
        <div className="flex justify-end mb-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
            <Plus size={14} />
            Nouveau diagramme
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {diagrams.map(diagram => {
            const project = projects.find(p => p.id === diagram.projectId)
            return (
              <Link
                key={diagram.id}
                to={`/diagrams/${diagram.id}`}
                className="bg-[#12141c] border border-[#1e2235] rounded-xl overflow-hidden hover:border-violet-600/30 transition-all group"
              >
                {/* Preview */}
                <div className="h-36 bg-[#0a0c12] flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundImage: 'radial-gradient(circle, #1e2235 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  <div className="flex gap-2 scale-75 opacity-60 group-hover:opacity-80 transition-opacity">
                    {diagram.classes.slice(0, 3).map((cls, i) => (
                      <div key={cls.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-lg p-2 w-20" style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
                        <div className="bg-[#1e2235] rounded px-1 py-0.5 text-[7px] text-violet-300 font-mono mb-1 text-center">{cls.name}</div>
                        <div className="space-y-0.5">
                          {cls.attributes.slice(0, 2).map((_a, j) => (
                            <div key={j} className="h-1 bg-slate-700 rounded" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-slate-100 text-sm font-semibold group-hover:text-white leading-tight">{diagram.name}</h3>
                    <Badge label={diagram.type} variant={typeVariant[diagram.type]} />
                  </div>
                  <p className="text-slate-500 text-xs mb-3">{project?.name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <GitBranch size={11} />
                      {diagram.classes.length} classes
                    </span>
                    <span>{new Date(diagram.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
