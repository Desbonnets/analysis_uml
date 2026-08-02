import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import Header from '../components/layout/Header'
import Pill from '../components/ui/Pill'
import { getProjects } from '../api/projects'
import { getAnalysisHistory } from '../api/analysis'
import { checkTestCoverage } from '../api/diagrams'
import type { AnalysisHistoryEntry, Project, TestCoverageReportDto } from '../types'

export default function TestCoverage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [requirements, setRequirements] = useState('')
  const [report, setReport] = useState<TestCoverageReportDto | null>(null)
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

  function selectRecord(recordId: string) {
    setSelectedRecordId(recordId)
    setReport(null)
  }

  function handleRequirementsFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRequirements(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function runCheck() {
    if (!selectedProjectId || !selectedRecordId || !requirements.trim()) return
    setChecking(true)
    setCheckError(null)
    checkTestCoverage(selectedProjectId, selectedRecordId, requirements)
      .then(setReport)
      .catch(e => setCheckError((e as Error).message))
      .finally(() => setChecking(false))
  }

  return (
    <div>
      <Header title="Couverture des tests" subtitle="Compare les tests détectés à un référentiel d'exigences" />

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
            <ListChecks size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Sélectionne un projet puis une analyse pour vérifier la couverture des tests.</p>
          </div>
        )}

        {selectedRecordId && (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-2)' }}>
                Colle ton référentiel d'exigences (ou importe un fichier .md/.txt) : une exigence par ligne,
                au format "N. Titre — description". L'application recherche les tests qui s'en réclament
                (tag/annotation avec l'ID) et, à défaut, par recoupement de mots-clés (marqué comme non fiable).
                Ceci prouve qu'un test existe et prétend couvrir l'exigence — pas qu'il teste le bon comportement.
              </p>

              <textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder={'1. Connexion utilisateur — se connecter avec email/mot de passe\n2. Inscription — créer un compte'}
                rows={10}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, padding: 10, borderRadius: 6,
                  border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg-1)', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={e => handleRequirementsFile(e.target.files?.[0])}
                  style={{ fontSize: 12, color: 'var(--fg-2)' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={checking || !requirements.trim()}
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
                  {report.coveredCount}/{report.requirementCount} exigence(s) couverte(s) · {report.uncoveredCount} non couverte(s)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.coverage.map(c => (
                    <div key={c.requirementId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Pill tone={c.status === 'COVERED_CONFIRMED' ? 'ok' : c.status === 'COVERED_HEURISTIC' ? 'warn' : 'bad'}>
                          {c.status === 'COVERED_CONFIRMED' ? 'Confirmé' : c.status === 'COVERED_HEURISTIC' ? '⚠ Heuristique' : 'Non couverte'}
                        </Pill>
                        <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{c.requirementId}. {c.title}</span>
                      </div>
                      {c.matchedTests.length > 0 && (
                        <ul style={{ margin: '0 0 0 24px', padding: 0, fontSize: 11, color: 'var(--fg-2)' }}>
                          {c.matchedTests.map((t, i) => (
                            <li key={i}>
                              {t.className}.{t.methodName}
                              {t.confidence === 'HEURISTIC' && t.matchedKeywords && (
                                <> — correspondance approximative sur : {t.matchedKeywords.join(', ')}</>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report && report.orphanTestCount > 0 && (
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>
                  {report.orphanTestCount} test(s) détecté(s) dans le code sans lien avec une exigence du référentiel
                  (ni par tag/annotation, ni par mots-clés) — à rattacher à une exigence existante ou à ajouter
                  au référentiel si l'exigence qu'ils couvrent n'y figure pas encore.
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 12, color: 'var(--fg-1)' }}>
                  {report.orphanTests.map((t, i) => (
                    <li key={i}>{t.className}.{t.methodName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
