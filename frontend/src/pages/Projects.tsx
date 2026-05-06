import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, MoreHorizontal, Plus, SlidersHorizontal, Search } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import projectsData from '../data/projects.json'
import type { Project } from '../types'

const projects = projectsData as Project[]

const langShort: Record<string, string> = {
  'Spring Boot': 'java', 'Symfony': 'php', 'Laravel': 'php', 'Node.js': 'ts',
}

const statusLabel: Record<string, string> = {
  analyzed: 'Analysé', pending: 'En cours', error: 'Erreur', new: 'Nouveau',
}

const statusTone: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  analyzed: 'ok', pending: 'warn', error: 'bad', new: 'neutral',
}

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'

export default function Projects() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <Header
        title="Projets"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary"><SlidersHorizontal size={14} /> Filtrer</button>
            <button className="btn btn-primary"><Plus size={14} /> Nouveau projet</button>
          </div>
        }
      />

      <div className="page">
        {/* Barre de recherche + filtres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-2)' }} />
            <input
              style={{ background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 6, padding: '7px 10px 7px 30px', fontSize: 12, color: 'var(--fg-0)', outline: 'none', fontFamily: 'var(--font-sans)', width: 240 }}
              placeholder="Rechercher un projet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {['all', 'analyzed', 'pending', 'new'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12,
                fontFamily: 'var(--font-sans)', cursor: 'pointer',
                border: '1px solid', transition: 'all 120ms',
                background: filter === f ? 'var(--bg-2)' : 'transparent',
                borderColor: filter === f ? 'var(--line-2)' : 'var(--line-1)',
                color: filter === f ? 'var(--fg-0)' : 'var(--fg-1)',
              }}
            >
              {f === 'all' ? 'Tous' : statusLabel[f]}
            </button>
          ))}
          <span className="dim" style={{ fontSize: 12, marginLeft: 4 }}>
            {filtered.length} projet{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 120ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-1)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FolderOpen size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>{project.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-1)', marginTop: 2, lineHeight: 1.4 }}>{project.description}</div>
                    </div>
                  </div>
                  <MoreHorizontal size={16} style={{ color: 'var(--fg-2)', flexShrink: 0 }} />
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Pill tone="neutral" square>{langShort[project.language] ?? project.language}</Pill>
                  <Pill tone={statusTone[project.status]} square dot>{statusLabel[project.status]}</Pill>
                  <Pill tone="neutral" square>{project.diagramsCount} diagrammes</Pill>
                  {project.violationsCount > 0
                    ? <Pill tone="warn" square>{project.violationsCount} violations</Pill>
                    : <Pill tone="ok" square>0 violation</Pill>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-1)' }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{project.language}</span>
                  {project.score > 0 ? (
                    <span className="num" style={{ fontSize: 13, fontWeight: 600, color: scoreColor(project.score) }}>
                      {project.score}<span style={{ color: 'var(--fg-2)', fontWeight: 400 }}>/100</span>
                    </span>
                  ) : (
                    <span className="dim" style={{ fontSize: 12 }}>Non analysé</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-2)' }}>
            <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: 13, margin: 0 }}>Aucun projet trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
