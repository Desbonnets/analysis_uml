import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import {
  checkConformance,
  exportClassDiagram,
  exportDependencyGraph,
  exportPackageDiagram,
  getClassDiagram,
  getDependencyGraph,
  getPackageDiagram,
} from '../api/diagrams'
import { getSavedUmlDiagram, listSavedUmlDiagrams } from '../api/savedUmls'
import type { ClassDiagramDto, ConformanceReportDto, DependencyGraphDto, DiagramEdge, PackageDiagramDto, PackageNode, SavedUmlDiagram } from '../types'
import Pill from '../components/ui/Pill'
import ClassDiagramCanvas from '../components/diagram/ClassDiagramCanvas'

// ─── Types internes ────────────────────────────────────────────────────────────

interface PositionedPackage extends PackageNode {
  x: number
  y: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PKG_W = 200
const PKG_COLS = 3
const PKG_COL_W = 240
const ROW_PAD = 30
const START_X = 40
const START_Y = 40

// ─── Helpers ──────────────────────────────────────────────────────────────────

function packageHeight(pkg: PackageNode): number {
  return 40 + Math.max(pkg.classes.length, 1) * 16 + 10
}

function layoutPackages(pkgs: PackageNode[]): PositionedPackage[] {
  const rows = Math.ceil(pkgs.length / PKG_COLS)
  const rowHeights = Array.from({ length: rows }, (_, r) => {
    const rowPkgs = pkgs.slice(r * PKG_COLS, (r + 1) * PKG_COLS)
    return Math.max(...rowPkgs.map(packageHeight), 80)
  })
  return pkgs.map((pkg, i) => {
    const col = i % PKG_COLS
    const row = Math.floor(i / PKG_COLS)
    const y = START_Y + rowHeights.slice(0, row).reduce((a, b) => a + b + ROW_PAD, 0)
    return { ...pkg, x: START_X + col * PKG_COL_W, y }
  })
}

function svgSizePkg(pkgs: PositionedPackage[]): { w: number; h: number } {
  if (pkgs.length === 0) return { w: 800, h: 400 }
  const maxX = Math.max(...pkgs.map(p => p.x + PKG_W))
  const maxY = Math.max(...pkgs.map(p => p.y + packageHeight(p)))
  return { w: maxX + START_X, h: maxY + START_Y }
}

// ─── Composants SVG ───────────────────────────────────────────────────────────

function PackageBox({ pkg }: { pkg: PositionedPackage }) {
  const h = packageHeight(pkg)
  return (
    <g transform={`translate(${pkg.x}, ${pkg.y})`}>
      <rect x={3} y={3} width={PKG_W} height={h} rx={8} fill="rgba(0,0,0,0.35)" />
      <rect width={PKG_W} height={h} rx={8} fill="#0F1E30" stroke="#2E3A48" strokeWidth={1} />
      <rect width={PKG_W} height={30} rx={8} fill="#132540" />
      <rect y={22} width={PKG_W} height={8} fill="#132540" />
      <text x={8} y={20} fontSize={9} fill="#5BC0BE" fontFamily="JetBrains Mono, monospace" fontWeight="600">
        {pkg.name.length > 28 ? '…' + pkg.name.slice(-26) : pkg.name}
      </text>
      <line x1={0} y1={30} x2={PKG_W} y2={30} stroke="#2E3A48" strokeWidth={1} />
      {pkg.classes.map((cls, i) => (
        <text key={i} x={8} y={46 + i * 16} fontSize={9} fill="#6E7A88" fontFamily="JetBrains Mono, monospace">
          {cls.length > 24 ? cls.slice(0, 24) + '…' : cls}
        </text>
      ))}
    </g>
  )
}

function PackageArrow({ pkgs, edge }: { pkgs: PositionedPackage[]; edge: DiagramEdge }) {
  const from = pkgs.find(p => p.name === edge.from)
  const to = pkgs.find(p => p.name === edge.to)
  if (!from || !to) return null
  const fx = from.x + PKG_W / 2
  const fy = from.y + packageHeight(from) / 2
  const tx = to.x + PKG_W / 2
  const ty = to.y + packageHeight(to) / 2
  return (
    <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="#3FB984" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const toolbarBtn: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line-2)',
  color: 'var(--fg-1)', cursor: 'pointer',
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
  borderRadius: 6, border: '1px solid',
  borderColor: active ? 'var(--accent)' : 'var(--line-2)',
  background: active ? 'rgba(91,192,190,0.12)' : 'var(--bg-2)',
  color: active ? 'var(--accent)' : 'var(--fg-1)',
})

// ─── Page principale ──────────────────────────────────────────────────────────

type Tab = 'class' | 'dependencies' | 'packages' | 'conformance'

export default function DiagramEditor() {
  const { projectId, recordId } = useParams<{ projectId: string; recordId: string }>()
  const [tab, setTab] = useState<Tab>('class')
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classDiagram, setClassDiagram] = useState<ClassDiagramDto | null>(null)
  const [depGraph, setDepGraph] = useState<DependencyGraphDto | null>(null)
  const [pkgDiagram, setPkgDiagram] = useState<PackageDiagramDto | null>(null)
  const [entitiesOnly, setEntitiesOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [packageFilterInput, setPackageFilterInput] = useState('')
  const [packageFilter, setPackageFilter] = useState('')

  const [conformanceSource, setConformanceSource] = useState('')
  const [conformanceReport, setConformanceReport] = useState<ConformanceReportDto | null>(null)
  const [conformanceChecking, setConformanceChecking] = useState(false)
  const [conformanceError, setConformanceError] = useState<string | null>(null)
  const [conformanceEntitiesOnly, setConformanceEntitiesOnly] = useState(false)
  const [conformanceTypeFilter, setConformanceTypeFilter] = useState<Set<string>>(new Set())
  const [conformancePackageFilterInput, setConformancePackageFilterInput] = useState('')
  const [conformancePackageFilter, setConformancePackageFilter] = useState('')
  const [checkFields, setCheckFields] = useState(false)
  const [checkMethods, setCheckMethods] = useState(false)
  const [savedUmls, setSavedUmls] = useState<SavedUmlDiagram[]>([])
  const [selectedSavedUmlId, setSelectedSavedUmlId] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !recordId) return

    const pid = Number(projectId)

    if (tab === 'class' && !classDiagram) {
      setLoading(true)
      setError(null)
      getClassDiagram(pid, recordId, {
        filter: entitiesOnly ? 'entities' : undefined,
        types: typeFilter.size > 0 ? Array.from(typeFilter) : undefined,
        packageContains: packageFilter || undefined,
      })
        .then(setClassDiagram)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    } else if (tab === 'dependencies' && !depGraph) {
      setLoading(true)
      setError(null)
      getDependencyGraph(pid, recordId)
        .then(setDepGraph)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    } else if (tab === 'packages' && !pkgDiagram) {
      setLoading(true)
      setError(null)
      getPackageDiagram(pid, recordId)
        .then(setPkgDiagram)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    }
  }, [projectId, recordId, tab, classDiagram, depGraph, pkgDiagram, entitiesOnly, typeFilter, packageFilter])

  // Reset class diagram when a filter changes so it re-fetches
  useEffect(() => {
    setClassDiagram(null)
  }, [entitiesOnly, typeFilter, packageFilter])

  useEffect(() => {
    if (tab !== 'conformance' || savedUmls.length > 0) return
    listSavedUmlDiagrams().then(setSavedUmls).catch(() => {})
  }, [tab, savedUmls.length])

  function handlePlantUmlFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setConformanceSource(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function loadSavedUml(id: string) {
    setSelectedSavedUmlId(id)
    if (!id) return
    getSavedUmlDiagram(Number(id))
      .then(d => setConformanceSource(d.plantUmlSource))
      .catch(e => setConformanceError((e as Error).message))
  }

  function runConformanceCheck() {
    if (!projectId || !recordId || !conformanceSource.trim()) return
    setConformanceChecking(true)
    setConformanceError(null)
    checkConformance(Number(projectId), recordId, conformanceSource, {
      filter: conformanceEntitiesOnly ? 'entities' : undefined,
      types: conformanceTypeFilter.size > 0 ? Array.from(conformanceTypeFilter) : undefined,
      packageContains: conformancePackageFilter || undefined,
      checkFields,
      checkMethods,
    })
      .then(setConformanceReport)
      .catch(e => setConformanceError((e as Error).message))
      .finally(() => setConformanceChecking(false))
  }

  function downloadPlantUml(source: string, filename: string) {
    const blob = new Blob([source], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleExport() {
    if (!projectId || !recordId || tab === 'conformance') return
    setExporting(true)
    setExportError(null)
    const pid = Number(projectId)
    const promise =
      tab === 'class'
        ? exportClassDiagram(pid, recordId, {
            filter: entitiesOnly ? 'entities' : undefined,
            types: typeFilter.size > 0 ? Array.from(typeFilter) : undefined,
            packageContains: packageFilter || undefined,
          })
        : tab === 'dependencies'
          ? exportDependencyGraph(pid, recordId)
          : exportPackageDiagram(pid, recordId)
    promise
      .then(dto => downloadPlantUml(dto.source, `${tab}-${dto.recordId}.puml`))
      .catch(e => setExportError((e as Error).message))
      .finally(() => setExporting(false))
  }

  function toggleType(t: string) {
    setTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function toggleConformanceType(t: string) {
    setConformanceReport(null)
    setConformanceTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  // Compute layout
  const pkgNodes = pkgDiagram ? layoutPackages(pkgDiagram.packages) : []
  const { w: pkgSvgW, h: pkgSvgH } = svgSizePkg(pkgNodes)

  const currentData = tab === 'class' ? classDiagram : tab === 'dependencies' ? depGraph : tab === 'packages' ? pkgDiagram : null
  const nodeCount = tab === 'packages'
    ? (pkgDiagram?.packages.length ?? 0)
    : (currentData as ClassDiagramDto | null)?.nodes.length ?? 0
  const edgeCount = currentData?.edges.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-0)' }}>
      {/* Barre d'outils */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/diagrams" style={{ color: 'var(--fg-2)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>
              Analyse {recordId}
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>
              {tab === 'conformance'
                ? (conformanceReport
                    ? `${conformanceReport.errorCount} erreur(s) · ${conformanceReport.infoCount} info(s)`
                    : 'Diagramme de référence non vérifié')
                : `${nodeCount} ${tab === 'packages' ? 'packages' : 'classes'} · ${edgeCount} relations`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginRight: 12 }}>
            {(['class', 'dependencies', 'packages', 'conformance'] as Tab[]).map(t => (
              <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
                {t === 'class' ? 'Classe UML' : t === 'dependencies' ? 'Dépendances' : t === 'packages' ? 'Packages' : 'Conformité'}
              </button>
            ))}
          </div>

          {/* Filtres (onglet Classe UML uniquement) */}
          {tab === 'class' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <button
                onClick={() => setEntitiesOnly(v => !v)}
                style={{ ...tabBtn(entitiesOnly), fontSize: 11, padding: '5px 10px' }}
              >
                Entités seules
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
                  style={{ ...tabBtn(typeFilter.has(value)), fontSize: 11, padding: '5px 10px' }}
                >
                  {label}
                </button>
              ))}

              <input
                value={packageFilterInput}
                onChange={e => setPackageFilterInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setPackageFilter(packageFilterInput.trim()) }}
                onBlur={() => setPackageFilter(packageFilterInput.trim())}
                placeholder="Filtrer par package…"
                style={{
                  fontSize: 11,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--line-2)',
                  background: 'var(--bg-2)',
                  color: 'var(--fg-1)',
                  width: 140,
                }}
              />
            </div>
          )}

          {/* Zoom */}
          {tab !== 'conformance' && (
            <>
              <button style={toolbarBtn} onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}>
                <ZoomOut size={14} />
              </button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', width: 40, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button style={toolbarBtn} onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                <ZoomIn size={14} />
              </button>
              <button style={toolbarBtn} onClick={() => setZoom(1)}>
                <Maximize2 size={14} />
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 4 }}
                disabled={exporting || !currentData}
                onClick={handleExport}
                title="Exporter ce diagramme au format PlantUML (.puml)"
              >
                <Download size={13} /> {exporting ? 'Export…' : 'Exporter'}
              </button>
            </>
          )}
        </div>
      </div>

      {exportError && tab !== 'conformance' && (
        <div style={{ padding: '8px 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-1)' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{exportError}</p>
        </div>
      )}

      {/* Canvas */}
      <div className="canvas-bg" style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'conformance' ? (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  onClick={() => { setConformanceReport(null); setConformanceEntitiesOnly(v => !v) }}
                  style={{ ...tabBtn(conformanceEntitiesOnly), fontSize: 11, padding: '5px 10px' }}
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
                    onClick={() => toggleConformanceType(value)}
                    style={{ ...tabBtn(conformanceTypeFilter.has(value)), fontSize: 11, padding: '5px 10px' }}
                  >
                    {label}
                  </button>
                ))}

                <input
                  value={conformancePackageFilterInput}
                  onChange={e => setConformancePackageFilterInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setConformanceReport(null); setConformancePackageFilter(conformancePackageFilterInput.trim()) } }}
                  onBlur={() => { setConformanceReport(null); setConformancePackageFilter(conformancePackageFilterInput.trim()) }}
                  placeholder="Filtrer par package…"
                  style={{
                    fontSize: 11,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--line-2)',
                    background: 'var(--bg-2)',
                    color: 'var(--fg-1)',
                    width: 140,
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Précision :</span>
                <button
                  onClick={() => { setConformanceReport(null); setCheckFields(v => !v) }}
                  style={{ ...tabBtn(checkFields), fontSize: 11, padding: '5px 10px' }}
                >
                  Attributs
                </button>
                <button
                  onClick={() => { setConformanceReport(null); setCheckMethods(v => !v) }}
                  style={{ ...tabBtn(checkMethods), fontSize: 11, padding: '5px 10px' }}
                >
                  Méthodes
                </button>
                <button
                  disabled
                  title="Nécessite d'abord la capture des exceptions/throws côté analysis-service (voir diagram-service/docs/conformance-precision.md)"
                  style={{ ...tabBtn(false), fontSize: 11, padding: '5px 10px', opacity: 0.4, cursor: 'not-allowed' }}
                >
                  Exceptions
                </button>
              </div>

              <textarea
                value={conformanceSource}
                onChange={e => setConformanceSource(e.target.value)}
                placeholder={'class Order\ninterface Shippable\nOrder ..|> Shippable'}
                rows={10}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid var(--line-2)',
                  background: 'var(--bg-2)',
                  color: 'var(--fg-1)',
                  resize: 'vertical',
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
                  disabled={conformanceChecking || !conformanceSource.trim()}
                  onClick={runConformanceCheck}
                  style={{ marginLeft: 'auto' }}
                >
                  {conformanceChecking ? 'Vérification…' : 'Vérifier'}
                </button>
              </div>
            </div>

            {conformanceError && (
              <div className="card" style={{ borderColor: 'var(--bad)', padding: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{conformanceError}</p>
              </div>
            )}

            {conformanceReport && (
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>
                  {conformanceReport.expectedClassCount} classe(s) attendue(s) · {conformanceReport.actualClassCount} classe(s) réelle(s)
                </p>
                {conformanceReport.violations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ok)' }}>Le code respecte le diagramme de référence.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {conformanceReport.violations.map((v, i) => (
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
        ) : (
        <>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-2)', fontSize: 13 }}>
            Génération du diagramme…
          </div>
        )}
        {error && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="card" style={{ borderColor: 'var(--bad)', padding: '20px 24px', maxWidth: 440, textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--bad)', fontWeight: 600 }}>Impossible de charger le diagramme</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-2)' }}>
                {error.toLowerCase().includes('not found') || error.toLowerCase().includes('introuvable')
                  ? "L'analyse demandée est introuvable. Vérifiez que le diagram-service est démarré (docker-compose up --build diagram-service)."
                  : error.toLowerCase().includes('indisponible') || error.toLowerCase().includes('unavailable')
                    ? "Le diagram-service n'est pas joignable. Lancez : docker-compose up --build diagram-service"
                    : error}
              </p>
            </div>
          </div>
        )}
        {!loading && !error && (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', padding: 40 }}>
            {tab === 'class' && classDiagram && (
              <ClassDiagramCanvas nodes={classDiagram.nodes} edges={classDiagram.edges} />
            )}
            {tab === 'dependencies' && depGraph && (
              <ClassDiagramCanvas nodes={depGraph.nodes} edges={depGraph.edges} />
            )}
            {tab === 'packages' && pkgDiagram && (
              <svg width={pkgSvgW} height={pkgSvgH}>
                {pkgDiagram.edges.map((edge, i) => (
                  <PackageArrow key={i} pkgs={pkgNodes} edge={edge} />
                ))}
                {pkgNodes.map(pkg => <PackageBox key={pkg.name} pkg={pkg} />)}
              </svg>
            )}
            {!loading && !error && !currentData && (
              <div style={{ color: 'var(--fg-2)', fontSize: 13, padding: 40 }}>Aucune donnée.</div>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Légende */}
      {tab !== 'conformance' && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 20px', background: 'var(--bg-1)', borderTop: '1px solid var(--line-1)', flexShrink: 0 }}>
        {tab !== 'packages' ? (
          [
            { color: '#A78BFA', label: 'extends' },
            { color: '#60A5FA', label: 'implements' },
            { color: '#6E7A88', label: 'uses' },
            ...(tab === 'class' ? [
              { color: '#F59E0B', label: 'many-to-one / one-to-many' },
              { color: '#EF4444', label: 'many-to-many' },
              { color: '#10B981', label: 'one-to-one' },
            ] : []),
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 1.5, backgroundColor: l.color }} />
              <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{l.label}</span>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 1.5, backgroundColor: '#3FB984', borderTop: '1.5px dashed #3FB984' }} />
            <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>dépend de</span>
          </div>
        )}
        <span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 'auto' }}>
          Analyse : {recordId}
        </span>
      </div>
      )}
    </div>
  )
}
