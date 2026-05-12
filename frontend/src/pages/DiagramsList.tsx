import { Link } from 'react-router-dom'
import { GitBranch, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import diagramsData from '../data/diagrams.json'
import projectsData from '../data/projects.json'
import type { Diagram } from '../types'

type ProjectJson = { id: string; name: string }

const diagrams = diagramsData as Diagram[]
const projects  = projectsData as unknown as ProjectJson[]

const typeTone: Record<string, 'info' | 'ok' | 'warn' | 'neutral'> = {
  class: 'info', dependency: 'neutral', package: 'ok', sequence: 'warn',
}

export default function DiagramsList() {
  return (
    <div>
      <Header
        title="Canvas UML"
        actions={
          <button className="btn btn-primary">
            <Plus size={14} /> Nouveau diagramme
          </button>
        }
      />

      <div className="page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {diagrams.map(diagram => {
            const project = projects.find(p => p.id === diagram.projectId)
            return (
              <Link key={diagram.id} to={`/diagrams/${diagram.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 120ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-1)'}
                >
                  {/* Aperçu canvas */}
                  <div className="canvas-bg" style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 8, transform: 'scale(0.75)', opacity: 0.7 }}>
                      {diagram.classes.slice(0, 3).map((cls, i) => (
                        <div key={cls.id} style={{ background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '6px 10px', width: 80, transform: `rotate(${(i - 1) * 3}deg)` }}>
                          <div className="mono" style={{ fontSize: 7, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cls.name}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {cls.attributes.slice(0, 2).map((_a, j) => (
                              <div key={j} style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2 }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)', margin: 0, lineHeight: 1.3 }}>{diagram.name}</h3>
                      <Pill tone={typeTone[diagram.type]} square>{diagram.type}</Pill>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg-2)', margin: '0 0 10px' }}>{project?.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GitBranch size={11} />
                        {diagram.classes.length} classes
                      </span>
                      <span>{new Date(diagram.updatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
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
