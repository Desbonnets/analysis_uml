import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, AlertTriangle, BarChart2, Play, Plus } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import projectsData from '../data/projects.json'
import diagramsData from '../data/diagrams.json'
import violationsData from '../data/violations.json'
import type { Project, Diagram, Violation } from '../types'

const projects  = projectsData  as Project[]
const diagrams  = diagramsData  as Diagram[]
const violations = violationsData as Violation[]

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'
const scoreBg    = (s: number) => s >= 80 ? 'var(--ok)'  : s >= 60 ? 'var(--warn)' : 'var(--bad)'

const sevTone: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  critical: 'bad', high: 'warn', medium: 'info', low: 'neutral',
}

const typeTone: Record<string, 'info' | 'ok' | 'warn' | 'neutral'> = {
  class: 'info', dependency: 'neutral', package: 'ok', sequence: 'warn',
}

const statusTone: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  analyzed: 'ok', pending: 'warn', error: 'bad', new: 'neutral',
}

const statusLabel: Record<string, string> = {
  analyzed: 'Analysé', pending: 'En cours', error: 'Erreur', new: 'Nouveau',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const project          = projects.find(p => p.id === id)
  const projectDiagrams  = diagrams.filter(d => d.projectId === id)
  const projectViolations = violations.filter(v => v.projectId === id)

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--fg-2)', fontSize: 14 }}>
      Projet introuvable
    </div>
  )

  return (
    <div>
      <Header
        title={project.name}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill tone={statusTone[project.status]} square dot>{statusLabel[project.status]}</Pill>
            <button className="btn btn-primary"><Play size={13} /> Lancer l'analyse</button>
          </div>
        }
      />

      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Retour */}
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-1)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Retour aux projets
        </Link>

        {/* Score */}
        {project.score > 0 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Score d'architecture</h3>
              <span className="mono tabular" style={{ fontSize: 28, fontWeight: 700, color: scoreColor(project.score) }}>
                {project.score}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-2)' }}>/100</span>
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${project.score}%`, background: scoreBg(project.score), borderRadius: 999 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Principes SOLID', value: 72 },
                { label: 'Couplage', value: 85 },
                { label: 'Cohésion', value: 78 },
                { label: 'Patterns', value: 80 },
              ].map(cat => (
                <div key={cat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--fg-2)', margin: '0 0 4px' }}>{cat.label}</p>
                  <p className="mono tabular" style={{ fontSize: 20, fontWeight: 700, color: scoreColor(cat.value), margin: 0 }}>{cat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Diagrammes */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch size={14} style={{ color: 'var(--accent)' }} /> Diagrammes UML
              </h3>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Plus size={12} /> Nouveau
              </button>
            </div>

            {projectDiagrams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {projectDiagrams.map(d => (
                  <Link key={d.id} to={`/diagrams/${d.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, textDecoration: 'none', transition: 'background 120ms' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch size={13} style={{ color: 'var(--info)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)', marginTop: 1 }}>{d.classes.length} classes · {new Date(d.updatedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Pill tone={typeTone[d.type]} square>{d.type}</Pill>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-2)' }}>
                <GitBranch size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: 12, margin: 0 }}>Aucun diagramme</p>
              </div>
            )}
          </div>

          {/* Violations */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} style={{ color: 'var(--warn)' }} /> Violations ({projectViolations.length})
              </h3>
              <Link to="/analysis" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                Voir l'analyse →
              </Link>
            </div>

            {projectViolations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projectViolations.slice(0, 5).map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 6, background: 'var(--bg-0)' }}>
                    <Pill tone={sevTone[v.severity]} square>{v.severity}</Pill>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--fg-0)' }}>{v.title}</p>
                      <p className="mono" style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.file}:{v.line}
                      </p>
                    </div>
                  </div>
                ))}
                {projectViolations.length > 5 && (
                  <p style={{ fontSize: 11, color: 'var(--fg-2)', textAlign: 'center', margin: '4px 0 0' }}>
                    +{projectViolations.length - 5} autres violations
                  </p>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-2)' }}>
                <BarChart2 size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: 12, margin: 0 }}>Aucune violation détectée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
