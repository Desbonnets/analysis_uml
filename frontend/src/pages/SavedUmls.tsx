import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileCode2, Plus, X } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import { deleteSavedUmlDiagram, listSavedUmlDiagrams } from '../api/savedUmls'
import { getProjects } from '../api/projects'
import type { Project, SavedUmlDiagram } from '../types'

export default function SavedUmls() {
  const navigate = useNavigate()
  const [diagrams, setDiagrams] = useState<SavedUmlDiagram[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [diagramList, projectList] = await Promise.all([listSavedUmlDiagrams(), getProjects()])
      setDiagrams(diagramList)
      setProjects(projectList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: number) {
    await deleteSavedUmlDiagram(id)
    setDiagrams(prev => prev.filter(d => d.id !== id))
    setDeleteConfirm(null)
  }

  function projectName(projectId: number | null): string {
    if (projectId == null) return 'Aucun'
    return projects.find(p => p.id === projectId)?.name ?? `Projet #${projectId}`
  }

  return (
    <div>
      <Header
        title="UML enregistrés"
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/saved-umls/new')}>
            <Plus size={14} /> Nouveau diagramme UML
          </button>
        }
      />

      <div className="page">
        {error && (
          <div className="card" style={{ borderColor: 'var(--bad)', padding: '12px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--bad)' }}>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-2)', fontSize: 13 }}>Chargement...</div>
        ) : diagrams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-2)' }}>
            <FileCode2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: 13, margin: 0 }}>Aucun diagramme UML enregistré</p>
            <p style={{ fontSize: 12, margin: '6px 0 0' }}>
              Créez un diagramme de référence en PlantUML pour le réutiliser lors des contrôles de conformité.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Projet</th>
                  <th>Mis à jour</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {diagrams.map(diagram => (
                  <tr
                    key={diagram.id}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => navigate(`/saved-umls/${diagram.id}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <td style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 600 }}>{diagram.name}</td>
                    <td>
                      <Pill tone={diagram.projectId == null ? 'neutral' : 'info'} square>{projectName(diagram.projectId)}</Pill>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--fg-1)' }}>
                      {new Date(diagram.updatedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {deleteConfirm === diagram.id ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm"
                            style={{ padding: '4px 10px', background: 'var(--bad)', color: '#fff', border: 'none' }}
                            onClick={() => handleDelete(diagram.id)}
                          >
                            <Check size={12} /> Oui
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }} onClick={() => setDeleteConfirm(null)}>
                            <X size={12} /> Non
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(diagram.id)}>
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
