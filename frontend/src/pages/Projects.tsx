import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, MoreHorizontal, Plus, SlidersHorizontal, Search, X, Check, Users } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import { useAuth } from '../context/AuthContext'
import { getProjects, createProject, deleteProject } from '../api/projects'
import type { Project, ProjectMember, CreateProjectRequest } from '../types'

const langShort: Record<string, string> = {
  'Spring Boot': 'java', Symfony: 'php', Laravel: 'php', 'Node.js': 'ts',
}

const statusLabel: Record<string, string> = {
  analyzed: 'Analysé', pending: 'En cours', error: 'Erreur', new: 'Nouveau',
}

const statusTone: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  analyzed: 'ok', pending: 'warn', error: 'bad', new: 'neutral',
}

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'

const LANGUAGES = ['Spring Boot', 'Symfony', 'Laravel', 'Node.js']

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function MemberAvatars({ members }: { members: ProjectMember[] }) {
  const shown = members.slice(0, 4)
  const rest = members.length - shown.length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Users size={11} style={{ color: 'var(--fg-2)', flexShrink: 0 }} />
      <div style={{ display: 'flex', marginLeft: 2 }}>
        {shown.map(m => (
          <div
            key={m.userEmail}
            title={`${m.userName} (${m.role})`}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: m.role === 'owner' ? 'var(--accent)' : 'var(--bg-3)',
              color: m.role === 'owner' ? '#fff' : 'var(--fg-1)',
              fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: -4, border: '1px solid var(--bg-1)', flexShrink: 0,
            }}
          >
            {initials(m.userName)}
          </div>
        ))}
        {rest > 0 && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-3)',
            color: 'var(--fg-2)', fontSize: 8, fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: -4, border: '1px solid var(--bg-1)', flexShrink: 0,
          }}>
            +{rest}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--fg-2)', marginLeft: 4 }}>
        {members.length} membre{members.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-0)', border: '1px solid var(--line-2)',
  borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--fg-0)',
  outline: 'none', fontFamily: 'var(--font-sans)',
}

interface CreateModalProps {
  token: string
  onClose: () => void
  onCreated: (p: Project) => void
}

function CreateModal({ token, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<CreateProjectRequest>({ name: '', description: '', language: 'Spring Boot' })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectRequest, string>>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Nom requis'
    if (!form.language) next.language = 'Langage requis'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      const created = await createProject(token, form)
      onCreated(created)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg-0)' }}>Nouveau projet</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nom du projet</label>
            <input
              style={{ ...inputStyle, borderColor: errors.name ? 'var(--bad)' : undefined }}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })) }}
              placeholder="ex: EcommerceApp"
            />
            {errors.name && <span style={{ fontSize: 11, color: 'var(--bad)', marginTop: 2 }}>{errors.name}</span>}
          </div>
          <div className="field">
            <label>Description</label>
            <input
              style={inputStyle}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez votre projet..."
            />
          </div>
          <div className="field">
            <label>URL du dépôt <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}>(optionnel)</span></label>
            <input
              style={inputStyle}
              value={form.repositoryUrl ?? ''}
              onChange={e => setForm(f => ({ ...f, repositoryUrl: e.target.value || undefined }))}
              placeholder="https://github.com/org/repo"
            />
          </div>
          <div className="field">
            <label>Langage / Framework</label>
            <select
              style={{ ...inputStyle, borderColor: errors.language ? 'var(--bad)' : undefined }}
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {apiError && (
            <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'rgba(255,90,90,.1)', borderRadius: 6 }}>
              {apiError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const { token, user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await getProjects(token)
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: number) {
    if (!token) return
    await deleteProject(token, id)
    setProjects(prev => prev.filter(p => p.id !== id))
    setDeleteConfirm(null)
  }

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
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Nouveau projet</button>
          </div>
        }
      />

      <div className="page">
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

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,90,90,.1)', color: 'var(--bad)', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-2)', fontSize: 13 }}>Chargement...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {filtered.map(project => (
              <div key={project.id} style={{ position: 'relative' }}>
                <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
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
                      {project.ownerEmail === user?.email && (
                        <button
                          onClick={e => { e.preventDefault(); setDeleteConfirm(deleteConfirm === project.id ? null : project.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', flexShrink: 0 }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      )}
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
                      {project.members && project.members.length > 0
                        ? <MemberAvatars members={project.members} />
                        : <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{project.ownerName}</span>}
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

                {deleteConfirm === project.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 14px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-0)' }}>Supprimer ce projet ?</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '4px 10px', background: 'var(--bad)', color: '#fff', border: 'none', flex: 1 }}
                        onClick={() => handleDelete(project.id)}
                      >
                        <Check size={12} /> Oui
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', flex: 1 }} onClick={() => setDeleteConfirm(null)}>
                        <X size={12} /> Non
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-2)' }}>
            <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: 13, margin: 0 }}>Aucun projet trouvé</p>
          </div>
        )}
      </div>

      {showCreate && token && (
        <CreateModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={p => { setProjects(prev => [...prev, p]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
