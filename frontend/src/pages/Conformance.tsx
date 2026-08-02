import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import { toggleBtnStyle } from '../components/ui/toggleBtnStyle'
import { getProjects } from '../api/projects'
import { getAnalysisHistory } from '../api/analysis'
import { checkConformance } from '../api/diagrams'
import { getSavedUmlDiagram, listSavedUmlDiagrams } from '../api/savedUmls'
import type { AnalysisHistoryEntry, ConformanceReportDto, Project, SavedUmlDiagram } from '../types'

export default function Conformance() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [savedUmls, setSavedUmls] = useState<SavedUmlDiagram[]>([])
  const [selectedSavedUmlId, setSelectedSavedUmlId] = useState('')
  const [source, setSource] = useState('')
  const [entitiesOnly, setEntitiesOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [packageFilterInput, setPackageFilterInput] = useState('')
  const [packageFilter, setPackageFilter] = useState('')
  const [checkFields, setCheckFields] = useState(false)
  const [checkMethods, setCheckMethods] = useState(false)
  const [report, setReport] = useState<ConformanceReportDto | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(e => setLoadError((e as Error).message))
      .finally(() => setLoadingProjects(false))
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setHistory([])
      return
    }
    setLoadingHistory(true)
    setLoadError(null)
    getAnalysisHistory(selectedProjectId)
      .then(setHistory)
      .catch(e => setLoadError((e as Error).message))
      .finally(() => setLoadingHistory(false))
  }, [selectedProjectId])

  useEffect(() => {
    listSavedUmlDiagrams().then(setSavedUmls).catch(() => {})
  }, [])

  function selectRecord(recordId: string) {
    setSelectedRecordId(recordId)
    setReport(null)
  }

  function handlePlantUmlFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSource(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function loadSavedUml(id: string) {
    setSelectedSavedUmlId(id)
    if (!id) return
    getSavedUmlDiagram(Number(id))
      .then(d => setSource(d.plantUmlSource))
      .catch(e => setCheckError((e as Error).message))
  }

  function toggleType(t: string) {
    setReport(null)
    setTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function runCheck() {
    if (!selectedProjectId || !selectedRecordId || !source.trim()) return
    setChecking(true)
    setCheckError(null)
    checkConformance(selectedProjectId, selectedRecordId, source, {
      filter: entitiesOnly ? 'entities' : undefined,
      types: typeFilter.size > 0 ? Array.from(typeFilter) : undefined,
      packageContains: packageFilter || undefined,
      checkFields,
      checkMethods,
    })
      .then(setReport)
      .catch(e => setCheckError((e as Error).message))
      .finally(() => setChecking(false))
  }

  return (
    <div>
      <Header title="Conformité" subtitle="Compare le code analysé à un diagramme de référence" />

      <div className="page">
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <label style={{ fontSize: 12, color: 'var(--fg-2)', display: 'block', marginBottom: 8 }}>
            Projet à vérifier
          </label>
          {loadingProjects ? (
            <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>Chargement des projets…</div>
          ) : (
            <select
              value={selectedProjectId ?? ''}
              onChange={e => {
                setSelectedProjectId(e.target.value ? Number(e.target.value) : null)
                setSelectedRecordId(null)
                setReport(null)
              }}
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

        {loadError && (
          <div className="card" style={{ borderColor: 'var(--bad)', padding: '12px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--bad)' }}>{loadError}</span>
          </div>
        )}

        {selectedProjectId && (
          <>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
                Chargement de l'historique…
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
                Aucune analyse trouvée pour ce projet.
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date d'analyse</th>
                      <th style={{ textAlign: 'right' }}>Fichiers</th>
                      <th style={{ textAlign: 'right' }}>Classes</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(entry => (
                      <tr
                        key={entry.recordId}
                        style={{ cursor: 'pointer', background: selectedRecordId === entry.recordId ? 'var(--bg-2)' : undefined }}
                        onClick={() => selectRecord(entry.recordId)}
                      >
                        <td className="mono" style={{ fontSize: 12 }}>
                          {new Date(entry.analyzedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--fg-1)' }}>{entry.filesAnalyzed}</td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--fg-1)' }}>{entry.classesFound}</td>
                        <td style={{ textAlign: 'right' }}>
                          {selectedRecordId === entry.recordId && <Pill tone="info">Sélectionnée</Pill>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!selectedProjectId && !loadingProjects && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--fg-2)', fontSize: 13 }}>
            <ShieldCheck size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Sélectionne un projet puis une analyse pour lancer un contrôle de conformité.</p>
          </div>
        )}

        {selectedRecordId && (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-2)' }}>
                Colle un diagramme de référence au format PlantUML (ou importe un fichier .puml) décrivant
                l'architecture attendue. L'application le compare au code réellement analysé et liste les écarts.
              </p>
              {savedUmls.length > 0 && (
                <select
                  value={selectedSavedUmlId}
                  onChange={e => loadSavedUml(e.target.value)}
                  style={{
                    fontSize: 12, padding: '7px 10px', borderRadius: 6,
                    border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg-1)',
                  }}
                >
                  <option value="">— Charger un UML enregistré —</option>
                  {savedUmls.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Classes vérifiées :</span>
                <button
                  onClick={() => { setReport(null); setEntitiesOnly(v => !v) }}
                  style={{ ...toggleBtnStyle(entitiesOnly), fontSize: 11, padding: '5px 10px' }}
                >
                  Entités seules (BDD)
                </button>

                {([
                  ['class', 'Classes'],
                  ['abstract_class', 'Abstraites'],
                  ['interface', 'Interfaces'],
                  ['enum', 'Enums'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleType(value)}
                    style={{ ...toggleBtnStyle(typeFilter.has(value)), fontSize: 11, padding: '5px 10px' }}
                  >
                    {label}
                  </button>
                ))}

                <input
                  value={packageFilterInput}
                  onChange={e => setPackageFilterInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setReport(null); setPackageFilter(packageFilterInput.trim()) } }}
                  onBlur={() => { setReport(null); setPackageFilter(packageFilterInput.trim()) }}
                  placeholder="Filtrer par package…"
                  style={{
                    fontSize: 11, padding: '5px 10px', borderRadius: 6,
                    border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg-1)', width: 140,
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Précision :</span>
                <button
                  onClick={() => { setReport(null); setCheckFields(v => !v) }}
                  style={{ ...toggleBtnStyle(checkFields), fontSize: 11, padding: '5px 10px' }}
                >
                  Attributs
                </button>
                <button
                  onClick={() => { setReport(null); setCheckMethods(v => !v) }}
                  style={{ ...toggleBtnStyle(checkMethods), fontSize: 11, padding: '5px 10px' }}
                >
                  Méthodes
                </button>
                <button
                  disabled
                  title="Nécessite d'abord la capture des exceptions/throws côté analysis-service (voir diagram-service/docs/conformance-precision.md)"
                  style={{ ...toggleBtnStyle(false), fontSize: 11, padding: '5px 10px', opacity: 0.4, cursor: 'not-allowed' }}
                >
                  Exceptions
                </button>
              </div>

              <textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder={'class Order\ninterface Shippable\nOrder ..|> Shippable'}
                rows={10}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, padding: 10, borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg-1)', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="file"
                  accept=".puml,.txt,.plantuml"
                  onChange={e => handlePlantUmlFile(e.target.files?.[0])}
                  style={{ fontSize: 12, color: 'var(--fg-2)' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={checking || !source.trim()}
                  onClick={runCheck}
                  style={{ marginLeft: 'auto' }}
                >
                  {checking ? 'Vérification…' : 'Vérifier'}
                </button>
              </div>
            </div>

            {checkError && (
              <div className="card" style={{ borderColor: 'var(--bad)', padding: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{checkError}</p>
              </div>
            )}

            {report && (
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>
                  {report.expectedClassCount} classe(s) attendue(s) · {report.actualClassCount} classe(s) réelle(s)
                </p>
                {report.violations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ok)' }}>Le code respecte le diagramme de référence.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {report.violations.map((v, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Pill tone={v.severity === 'ERROR' ? 'bad' : 'info'}>{v.type}</Pill>
                        <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{v.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
