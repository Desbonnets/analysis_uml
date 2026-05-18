import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, RefreshCw, Upload } from 'lucide-react'
import Header from '../components/layout/Header'
import MetricCard from '../components/ui/MetricCard'
import Avatar from '../components/ui/Avatar'
import Pill from '../components/ui/Pill'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../api/projects'
import violations from '../data/violations.json'
import type { Project } from '../types'

const scoreColor = (s: number) => s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--bad)'

const langShort: Record<string, string> = {
  'Spring Boot': 'java', Symfony: 'php', Laravel: 'php', 'Node.js': 'ts',
}

const activity = [
  { initials: 'MR', color: '#FF7A59', who: 'Marie R.',  what: 'a poussé un commit',   target: 'auth-gateway',      ago: '4 min' },
  { initials: 'CL', color: '#5BC0BE', who: 'Claire L.', what: 'a commenté',            target: 'PaymentController', ago: '12 min' },
  { initials: 'CI', color: '#A78BFA', who: 'Job CI',    what: 'analyse terminée',      target: 'checkout-service',  ago: '1 h' },
  { initials: 'SK', color: '#3FB984', who: 'Sam K.',    what: 'a résolu une issue',    target: 'storefront-web',    ago: '3 h' },
]

export default function Dashboard() {
  useAuth()
  const [projects, setProjects] = useState<Project[]>([])

  const load = useCallback(async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch {
      // keep empty state — metrics show zeros
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const analyzed      = projects.filter(p => p.status === 'analyzed')
  const avgScore      = analyzed.length > 0
    ? Math.round(analyzed.reduce((a, p) => a + p.score, 0) / analyzed.length)
    : 0
  const totalViolations = violations.length
  const totalDiagrams   = projects.reduce((a, p) => a + p.diagramsCount, 0)

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
            label="Diagrammes UML"
            value={totalDiagrams}
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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
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
                {projects.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FolderOpen size={14} style={{ color: 'var(--fg-2)' }} />
                        <Link to={`/projects/${p.id}`} style={{ fontWeight: 500, color: 'var(--fg-0)', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td><Pill tone="neutral" square>{langShort[p.language] ?? p.language}</Pill></td>
                    <td className="num">{p.diagramsCount}</td>
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
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-2)', padding: 24 }}>Aucun projet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-1)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Activité</h3>
            </div>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 18px', borderBottom: i < activity.length - 1 ? '1px solid var(--line-1)' : 'none' }}>
                <Avatar initials={a.initials} color={a.color} size={28} />
                <div style={{ flex: 1, fontSize: 12 }}>
                  <div style={{ color: 'var(--fg-0)' }}>
                    <span style={{ fontWeight: 600 }}>{a.who}</span>{' '}
                    <span style={{ color: 'var(--fg-1)' }}>{a.what}</span>
                  </div>
                  <div className="mono" style={{ color: 'var(--fg-1)', fontSize: 11, marginTop: 2 }}>{a.target}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--fg-2)', flexShrink: 0 }}>{a.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
