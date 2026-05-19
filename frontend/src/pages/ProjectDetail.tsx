import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, AlertTriangle, BarChart2, Link2, Copy, Check, RefreshCw } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import AnalysisCard from '../components/analysis/AnalysisCard'
import AnalysisResultModal from '../components/analysis/AnalysisResultModal'
import { useAuth } from '../context/AuthContext'
import { useAnalysis } from '../context/AnalysisContext'
import { getProjectById, generateProjectToken } from '../api/projects'
import { getAnalysisHistory } from '../api/analysis'
import type { Project, AnalysisHistoryEntry } from '../types'

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'
const scoreBg    = (s: number) => s >= 80 ? 'var(--ok)'  : s >= 60 ? 'var(--warn)' : 'var(--bad)'

const statusTone: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  analyzed: 'ok', pending: 'warn', error: 'bad', new: 'neutral',
}

const statusLabel: Record<string, string> = {
  analyzed: 'Analysé', pending: 'En cours', error: 'Erreur', new: 'Nouveau',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { state: analysisState } = useAnalysis()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([])
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  useEffect(() => {
    if (!id) return
    getProjectById(parseInt(id, 10))
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getAnalysisHistory(parseInt(id, 10))
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [id])

  const handleGenerateToken = useCallback(async () => {
    if (!id) return
    setTokenLoading(true)
    try {
      const res = await generateProjectToken(parseInt(id, 10))
      setApiToken(res.token)
      setProject(p => p ? { ...p, hasApiToken: true } : p)
    } finally {
      setTokenLoading(false)
    }
  }, [id])

  const copyToClipboard = useCallback((text: string, key: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--fg-2)', fontSize: 14 }}>
      Chargement...
    </div>
  )

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
          <Pill tone={statusTone[project.status]} square dot>{statusLabel[project.status]}</Pill>
        }
      />

      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-1)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Retour aux projets
        </Link>

        <AnalysisCard
          projectId={project.id}
          projectName={project.name}
          onViewResult={() => setShowResultModal(true)}
        />

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
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch size={14} style={{ color: 'var(--accent)' }} /> Diagrammes UML
              </h3>
              {history.length > 0 && (
                <Link to={`/diagrams`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                  Voir tout →
                </Link>
              )}
            </div>

            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {history.slice(0, 5).map(entry => (
                  <Link key={entry.recordId} to={`/diagrams/${id}/${entry.recordId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, textDecoration: 'none', transition: 'background 120ms' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch size={13} style={{ color: 'var(--info)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Analyse du {new Date(entry.analyzedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)', marginTop: 1 }}>
                        {entry.filesAnalyzed} fichiers · {entry.classesFound} classes
                      </p>
                    </div>
                    <Pill tone="info" square>UML</Pill>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-2)' }}>
                <GitBranch size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: 12, margin: 0 }}>Aucune analyse — uploadez un ZIP pour générer les diagrammes</p>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} style={{ color: 'var(--warn)' }} /> Violations
              </h3>
            </div>
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-2)' }}>
              <BarChart2 size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: 12, margin: 0 }}>Disponible prochainement avec SonarQube</p>
            </div>
          </div>
        </div>
        {project.ownerEmail === user?.email && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={14} style={{ color: 'var(--accent)' }} /> Intégration CI
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {project.repositoryUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-2)', flexShrink: 0 }}>Dépôt :</span>
                  <a href={project.repositoryUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.repositoryUrl}
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-2)', flexShrink: 0 }}>Token API :</span>
                {apiToken ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-0)', padding: '4px 8px', borderRadius: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-0)' }}>
                      {apiToken}
                    </code>
                    <button
                      onClick={() => copyToClipboard(apiToken, 'token')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'token' ? 'var(--ok)' : 'var(--fg-2)', flexShrink: 0 }}
                    >
                      {copied === 'token' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                    {project.hasApiToken ? '••••••••••••••••••••••••••••••••••••' : 'Aucun token généré'}
                  </span>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateToken}
                  disabled={tokenLoading}
                  style={{ flexShrink: 0 }}
                >
                  <RefreshCw size={12} /> {project.hasApiToken ? 'Regénérer' : 'Générer'}
                </button>
              </div>

              {(project.hasApiToken || apiToken) && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--fg-1)', margin: '0 0 8px' }}>
                    Ajoute ce step dans ton workflow GitHub Actions :
                  </p>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ margin: 0, padding: '12px 36px 12px 14px', background: 'var(--bg-0)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-1)', overflow: 'auto', lineHeight: 1.6, border: '1px solid var(--line-1)' }}>
{`- name: Send analysis to UML Analysis
  uses: actions/github-script@v7
  with:
    script: |
      const res = await fetch(
        'http://your-platform/projects/${id}/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Token': '\${{ secrets.UML_PROJECT_TOKEN }}'
          },
          body: JSON.stringify({
            score: \${{ env.ANALYSIS_SCORE }},
            violationsCount: \${{ env.VIOLATIONS_COUNT }},
            diagramsCount: \${{ env.DIAGRAMS_COUNT }},
            status: 'analyzed'
          })
        }
      )
      if (!res.ok) core.setFailed('Analysis report failed')`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(
                        `- name: Send analysis to UML Analysis\n  uses: actions/github-script@v7\n  with:\n    script: |\n      const res = await fetch(\n        'http://your-platform/projects/${id}/report',\n        {\n          method: 'POST',\n          headers: {\n            'Content-Type': 'application/json',\n            'X-Project-Token': '\${{ secrets.UML_PROJECT_TOKEN }}'\n          },\n          body: JSON.stringify({\n            score: \${{ env.ANALYSIS_SCORE }},\n            violationsCount: \${{ env.VIOLATIONS_COUNT }},\n            diagramsCount: \${{ env.DIAGRAMS_COUNT }},\n            status: 'analyzed'\n          })\n        }\n      )\n      if (!res.ok) core.setFailed('Analysis report failed')`,
                        'yaml'
                      )}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', color: copied === 'yaml' ? 'var(--ok)' : 'var(--fg-2)' }}
                    >
                      {copied === 'yaml' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--fg-2)', margin: '8px 0 0' }}>
                    Configure le secret <code style={{ fontFamily: 'var(--font-mono)' }}>UML_PROJECT_TOKEN</code> dans les Settings de ton dépôt GitHub.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showResultModal && analysisState.result && analysisState.projectId === project.id && (
        <AnalysisResultModal
          result={analysisState.result}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  )
}
