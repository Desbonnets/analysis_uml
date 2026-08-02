import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, RefreshCw, Upload, FileCode2, ClipboardCheck } from 'lucide-react'
import Header from '../components/layout/Header'
import MetricCard from '../components/ui/MetricCard'
import Pill from '../components/ui/Pill'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import { listSavedUmlDiagrams } from '../api/savedUmls'
import violations from '../data/violations.json'
import type { Project, SavedUmlDiagram } from '../types'

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'

const langShort: Record<string, string> = {
  'Spring Boot': 'java', Symfony: 'php', Laravel: 'php', 'Node.js': 'ts',
}

const byUpdatedAtDesc = <T extends { updatedAt: string }>(a: T, b: T) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Dashboard() {
  useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [diagrams, setDiagrams] = useState<SavedUmlDiagram[]>([])

  const load = useCallback(async () => {
    try {
      const [projectList, diagramList] = await Promise.all([getProjects(), listSavedUmlDiagrams()])
      setProjects(projectList)
      setDiagrams(diagramList)
    } catch {
      // keep empty state — metrics show zeros
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const analyzed        = projects.filter(p => p.status === 'analyzed')
  const avgScore        = analyzed.length > 0
    ? Math.round(analyzed.reduce((a, p) => a + p.score, 0) / analyzed.length)
    : 0
  const totalViolations = violations.length

  const recentProjects = [...projects].sort(byUpdatedAtDesc).slice(0, 5)
  const recentDiagrams = [...diagrams].sort(byUpdatedAtDesc).slice(0, 5)

  const projectName = (projectId: number | null): string =>
    projectId == null ? 'Aucun projet' : projects.find(p => p.id === projectId)?.name ?? `Projet #${projectId}`

  const diagramCountFor = (projectId: number): number =>
    diagrams.filter(d => d.projectId === projectId).length

  return (
    <div>
      <Header
        title="Tableau de bord"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => void load()}><RefreshCw size={14} /> Actualiser</button>
            <button className="btn btn-primary"><Upload size={14} /> Importer un dépôt</button>
          </div>
        }
      />

      <div className="page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <MetricCard
            label="Projets analysés"
            value={analyzed.length}
            delta="+2"
            sparkPoints="0,22 14,18 28,16 42,14 56,12 70,10 84,8 100,6"
          />
          <MetricCard
            label="Diagrammes UML enregistrés"
            value={diagrams.length}
            delta="+5"
            sparkPoints="0,20 14,16 28,14 42,12 56,10 70,8 84,6 100,4"
          />
          <MetricCard
            label="Violations actives"
            value={totalViolations}
            delta="-3"
            deltaTone="ok"
            sparkColor="var(--ok)"
            sparkPoints="0,6 14,10 28,14 42,16 56,18 70,20 84,22 100,24"
          />
          <MetricCard
            label="Score moyen"
            value={`${avgScore}/100`}
            delta="+4 pts"
            sparkPoints="0,18 14,16 28,14 42,12 56,10 70,8 84,6 100,4"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Projets récents</h3>
              <Link to="/projects" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                Tout voir →
              </Link>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Lang</th>
                  <th>Diagrammes</th>
                  <th>Violations</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FolderOpen size={14} style={{ color: 'var(--fg-2)' }} />
                        <Link to={`/projects/${p.id}`} style={{ fontWeight: 500, color: 'var(--fg-0)', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.languages.map(l => (
                          <Pill key={l} tone="neutral" square>{langShort[l] ?? l}</Pill>
                        ))}
                      </div>
                    </td>
                    <td className="num">{diagramCountFor(p.id)}</td>
                    <td>
                      {p.violationsCount === 0
                        ? <Pill tone="ok" square>0</Pill>
                        : <Pill tone="warn" square>{p.violationsCount}</Pill>}
                    </td>
                    <td>
                      {p.score > 0
                        ? <span className="num" style={{ color: scoreColor(p.score), fontWeight: 600 }}>{p.score}</span>
                        : <span className="dim">—</span>}
                    </td>
                  </tr>
                ))}
                {recentProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-2)', padding: 24 }}>Aucun projet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Diagrammes UML récents</h3>
              <Link to="/saved-umls" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                Tout voir →
              </Link>
            </div>
            {recentDiagrams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {recentDiagrams.map(d => (
                  <Link key={d.id} to={`/saved-umls/${d.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, textDecoration: 'none' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileCode2 size={13} style={{ color: 'var(--info)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)', marginTop: 1 }}>
                        {projectName(d.projectId)} · {formatDate(d.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--fg-2)' }}>
                <FileCode2 size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: 12, margin: 0 }}>Aucun diagramme enregistré</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-1)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Analyses récentes (conformité / tests)</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--fg-2)' }}>
            <ClipboardCheck size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: 12, margin: 0 }}>Aucune analyse enregistrée pour le moment</p>
            <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.8 }}>
              L'enregistrement des résultats de conformité et de couverture des tests arrive prochainement —
              les 5 dernières analyses enregistrées s'afficheront ici.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
