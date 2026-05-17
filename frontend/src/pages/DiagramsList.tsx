import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, FileCode2, Layers } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { getAnalysisHistory } from '../api/analysis'
import type { AnalysisHistoryEntry, Project } from '../types'

export default function DiagramsList() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    searchParams.get('project') ? Number(searchParams.get('project')) : null,
  )
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getProjects(token)
      .then(setProjects)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoadingProjects(false))
  }, [token])

  useEffect(() => {
    if (!token || !selectedProjectId) {
      setHistory([])
      return
    }
    setLoadingHistory(true)
    setError(null)
    getAnalysisHistory(token, selectedProjectId)
      .then(setHistory)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoadingHistory(false))
  }, [token, selectedProjectId])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div>
      <Header title="Diagrammes UML" />

      <div className="page">
        {/* Sélecteur de projet */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <label style={{ fontSize: 12, color: 'var(--fg-2)', display: 'block', marginBottom: 8 }}>
            Projet à visualiser
          </label>
          {loadingProjects ? (
            <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>Chargement des projets…</div>
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={e => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 6,
                color: 'var(--fg-0)', fontSize: 13, padding: '7px 12px', width: 320,
              }}
            >
              <option value="">— Sélectionnez un projet —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="card" style={{ borderColor: 'var(--bad)', padding: '12px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--bad)' }}>{error}</span>
          </div>
        )}

        {/* Aucun projet sélectionné */}
        {!selectedProjectId && !loadingProjects && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
            <Layers size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Sélectionnez un projet pour afficher l'historique des analyses.</p>
          </div>
        )}

        {/* Historique des analyses */}
        {selectedProjectId && (
          <>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
                Chargement de l'historique…
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
                <FileCode2 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Aucune analyse trouvée pour <strong>{selectedProject?.name}</strong>.</p>
                <p style={{ margin: '8px 0 0', fontSize: 12 }}>Lancez une analyse depuis la page du projet.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date d'analyse</th>
                      <th>Projet</th>
                      <th style={{ textAlign: 'right' }}>Fichiers</th>
                      <th style={{ textAlign: 'right' }}>Classes</th>
                      <th>Langues non supportées</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(entry => (
                      <tr
                        key={entry.recordId}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/diagrams/${selectedProjectId}/${entry.recordId}`)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <td className="mono" style={{ fontSize: 12 }}>
                          {new Date(entry.analyzedAt).toLocaleString('fr-FR', {
                            dateStyle: 'medium', timeStyle: 'short',
                          })}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--fg-0)' }}>{entry.projectName}</td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--fg-1)' }}>
                          {entry.filesAnalyzed}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--fg-1)' }}>
                          {entry.classesFound}
                        </td>
                        <td>
                          {entry.unsupportedLanguages.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {entry.unsupportedLanguages.map(l => (
                                <Pill key={l} tone="warn" square>{l}</Pill>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ChevronRight size={14} style={{ color: 'var(--fg-3)' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
