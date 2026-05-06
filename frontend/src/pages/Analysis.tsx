import { useState } from 'react'
import { AlertTriangle, ChevronDown, FileCode, Download, Play } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import violationsData from '../data/violations.json'
import projectsData from '../data/projects.json'
import type { Violation, Project } from '../types'

const violations = violationsData as Violation[]
const projects   = projectsData as Project[]

const sevTone: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  critical: 'bad', high: 'warn', medium: 'info', low: 'neutral',
}
const typeTone: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  SOLID: 'info', DEPENDENCY: 'warn', ARCHITECTURE: 'bad', PATTERN: 'neutral',
}
const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Analysis() {
  const [projectFilter,  setProjectFilter]  = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter,     setTypeFilter]     = useState('all')
  const [expanded,       setExpanded]       = useState<string | null>(null)

  const filtered = violations
    .filter(v => projectFilter  === 'all' || v.projectId === projectFilter)
    .filter(v => severityFilter === 'all' || v.severity  === severityFilter)
    .filter(v => typeFilter     === 'all' || v.type      === typeFilter)
    .sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity])

  const stats = {
    critical: violations.filter(v => v.severity === 'critical').length,
    high:     violations.filter(v => v.severity === 'high').length,
    medium:   violations.filter(v => v.severity === 'medium').length,
    low:      violations.filter(v => v.severity === 'low').length,
  }

  const sevIcon = (sev: string) => {
    const color = sev === 'critical' ? 'var(--bad)' : sev === 'high' ? 'var(--warn)' : 'var(--fg-2)'
    return <AlertTriangle size={15} style={{ color, flexShrink: 0 }} />
  }

  return (
    <div>
      <Header
        title="Analyse & Issues"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary"><Download size={14} /> Exporter</button>
            <button className="btn btn-primary"><Play size={14} /> Re-analyser</button>
          </div>
        }
      />

      <div className="page">
        {/* Compteurs sévérité */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Critiques',    count: stats.critical, color: 'var(--bad)',   bg: 'var(--bad-soft)' },
            { label: 'Importantes', count: stats.high,     color: 'var(--warn)',  bg: 'var(--warn-soft)' },
            { label: 'Moyennes',    count: stats.medium,   color: 'var(--info)',  bg: 'var(--info-soft)' },
            { label: 'Mineures',    count: stats.low,      color: 'var(--fg-1)', bg: 'var(--bg-3)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ borderColor: s.bg.includes('bad') ? 'rgba(229,72,77,0.2)' : undefined }}>
              <p style={{ color: 'var(--fg-2)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                {s.label}
              </p>
              <p className="mono tabular" style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0 }}>
                {s.count}
              </p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--fg-0)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          >
            <option value="all">Tous les projets</option>
            {projects.filter(p => p.status === 'analyzed').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--fg-0)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          >
            <option value="all">Toutes les sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Importante</option>
            <option value="medium">Moyenne</option>
            <option value="low">Mineure</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--fg-0)', outline: 'none', fontFamily: 'var(--font-sans)' }}
          >
            <option value="all">Tous les types</option>
            <option value="SOLID">SOLID</option>
            <option value="DEPENDENCY">Dépendance</option>
            <option value="ARCHITECTURE">Architecture</option>
            <option value="PATTERN">Pattern</option>
          </select>
          <span className="dim" style={{ fontSize: 12 }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Liste violations */}
        <div className="card" style={{ padding: 0 }}>
          {filtered.map(violation => {
            const project = projects.find(p => p.id === violation.projectId)
            const isOpen  = expanded === violation.id

            return (
              <div key={violation.id} style={{ borderBottom: '1px solid var(--line-1)' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : violation.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {sevIcon(violation.severity)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{violation.title}</span>
                      <Pill tone={sevTone[violation.severity]} square>{violation.severity}</Pill>
                      <Pill tone={typeTone[violation.type]}    square>{violation.type}</Pill>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{project?.name}</span>
                      <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--fg-2)' }}>
                        <FileCode size={11} />
                        {violation.file.split('/').pop()}:{violation.line}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--fg-2)', flexShrink: 0, transition: 'transform 200ms', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px 44px', borderTop: '1px solid var(--line-1)' }}>
                    <p style={{ fontSize: 13, color: 'var(--fg-1)', marginTop: 12, lineHeight: 1.6 }}>{violation.description}</p>
                    <code className="mono" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 8px', borderRadius: 4 }}>
                      {violation.file}:{violation.line}
                    </code>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-2)' }}>
              <AlertTriangle size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: 13, margin: 0 }}>Aucune violation trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
