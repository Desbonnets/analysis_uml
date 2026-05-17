import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getClassDiagram, getDependencyGraph, getPackageDiagram } from '../api/diagrams'
import type { ClassDiagramDto, DependencyGraphDto, DiagramEdge, DiagramNode, PackageDiagramDto, PackageNode } from '../types'

// ─── Types internes ────────────────────────────────────────────────────────────

interface PositionedNode extends DiagramNode {
  x: number
  y: number
}

interface PositionedPackage extends PackageNode {
  x: number
  y: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CARD_W = 220
const COLS = 4
const COL_W = 260
const ROW_PAD = 30
const START_X = 40
const START_Y = 40
const PKG_W = 200
const PKG_COLS = 3
const PKG_COL_W = 240

const typeColors: Record<string, { bg: string; header: string; text: string; badge: string }> = {
  class:          { bg: '#11161D', header: '#1A222C', text: '#E6EDF3', badge: '#5BC0BE' },
  interface:      { bg: '#0F1820', header: '#162030', text: '#60A5FA', badge: '#60A5FA' },
  abstract_class: { bg: '#13101D', header: '#1B1530', text: '#A78BFA', badge: '#A78BFA' },
  enum:           { bg: '#0F1A12', header: '#152018', text: '#3FB984', badge: '#3FB984' },
}

const edgeColors: Record<string, string> = {
  EXTENDS: '#A78BFA', IMPLEMENTS: '#60A5FA', USES: '#6E7A88',
  DEPENDS_ON: '#3FB984',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeHeight(node: DiagramNode): number {
  return 100 + node.fields.length * 20 + node.methods.length * 20 +
    (node.fields.length > 0 && node.methods.length > 0 ? 8 : 0)
}

function packageHeight(pkg: PackageNode): number {
  return 40 + Math.max(pkg.classes.length, 1) * 16 + 10
}

function layoutNodes(nodes: DiagramNode[]): PositionedNode[] {
  const rows = Math.ceil(nodes.length / COLS)
  const rowHeights = Array.from({ length: rows }, (_, r) => {
    const rowNodes = nodes.slice(r * COLS, (r + 1) * COLS)
    return Math.max(...rowNodes.map(nodeHeight), 120)
  })
  return nodes.map((node, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const y = START_Y + rowHeights.slice(0, row).reduce((a, b) => a + b + ROW_PAD, 0)
    return { ...node, x: START_X + col * COL_W, y }
  })
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

function svgSize(nodes: PositionedNode[]): { w: number; h: number } {
  if (nodes.length === 0) return { w: 800, h: 400 }
  const maxX = Math.max(...nodes.map(n => n.x + CARD_W))
  const maxY = Math.max(...nodes.map(n => n.y + nodeHeight(n)))
  return { w: maxX + START_X, h: maxY + START_Y }
}

function svgSizePkg(pkgs: PositionedPackage[]): { w: number; h: number } {
  if (pkgs.length === 0) return { w: 800, h: 400 }
  const maxX = Math.max(...pkgs.map(p => p.x + PKG_W))
  const maxY = Math.max(...pkgs.map(p => p.y + packageHeight(p)))
  return { w: maxX + START_X, h: maxY + START_Y }
}

// ─── Composants SVG ───────────────────────────────────────────────────────────

function ClassBox({ node }: { node: PositionedNode }) {
  const key = node.type.toLowerCase().replace('abstract_class', 'abstract_class')
  const colors = typeColors[key] ?? typeColors.class
  const h = nodeHeight(node)
  const badge = node.type.toLowerCase().replace('_', ' ')

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect x={3} y={3} width={CARD_W} height={h} rx={8} fill="rgba(0,0,0,0.35)" />
      <rect width={CARD_W} height={h} rx={8} fill={colors.bg} stroke="#2E3A48" strokeWidth={1} />
      <rect width={CARD_W} height={36} rx={8} fill={colors.header} />
      <rect y={28} width={CARD_W} height={8} fill={colors.header} />
      <text x={8} y={14} fontSize={8} fill={colors.badge} fontFamily="monospace" opacity={0.9}>
        «{badge}»
      </text>
      <text x={CARD_W / 2} y={28} textAnchor="middle" fontSize={12} fontWeight="600" fill={colors.text} fontFamily="Inter, system-ui">
        {node.name.length > 22 ? node.name.slice(0, 22) + '…' : node.name}
      </text>
      <line x1={0} y1={36} x2={CARD_W} y2={36} stroke="#2E3A48" strokeWidth={1} />
      {node.fields.map((f, i) => (
        <text key={i} x={10} y={56 + i * 20} fontSize={10} fill="#6E7A88" fontFamily="JetBrains Mono, monospace">
          {f.length > 28 ? f.slice(0, 28) + '…' : f}
        </text>
      ))}
      {node.fields.length > 0 && node.methods.length > 0 && (
        <line x1={0} y1={36 + node.fields.length * 20 + 12} x2={CARD_W} y2={36 + node.fields.length * 20 + 12} stroke="#2E3A48" strokeWidth={1} strokeDasharray="4,4" />
      )}
      {node.methods.map((m, i) => {
        const yOff = 56 + node.fields.length * 20 + (node.fields.length > 0 ? 8 : 0) + i * 20
        return (
          <text key={i} x={10} y={yOff} fontSize={10} fill="#5BC0BE" fontFamily="JetBrains Mono, monospace">
            {m.length > 28 ? m.slice(0, 28) + '…' : m}
          </text>
        )
      })}
    </g>
  )
}

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

function Arrow({ nodes, edge }: { nodes: PositionedNode[]; edge: DiagramEdge }) {
  const from = nodes.find(n => n.id === edge.from)
  const to = nodes.find(n => n.id === edge.to)
  if (!from || !to) return null
  const fx = from.x + CARD_W / 2
  const fy = from.y + nodeHeight(from) / 2
  const tx = to.x + CARD_W / 2
  const ty = to.y + nodeHeight(to) / 2
  const color = edgeColors[edge.type] ?? '#6E7A88'
  const dashed = edge.type === 'USES'
  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? '6,3' : undefined} opacity={0.65} />
      <text x={(fx + tx) / 2} y={(fy + ty) / 2 - 4} textAnchor="middle" fontSize={9} fill={color} opacity={0.85}>
        {edge.type.toLowerCase()}
      </text>
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

type Tab = 'class' | 'dependencies' | 'packages'

export default function DiagramEditor() {
  const { projectId, recordId } = useParams<{ projectId: string; recordId: string }>()
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('class')
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classDiagram, setClassDiagram] = useState<ClassDiagramDto | null>(null)
  const [depGraph, setDepGraph] = useState<DependencyGraphDto | null>(null)
  const [pkgDiagram, setPkgDiagram] = useState<PackageDiagramDto | null>(null)

  useEffect(() => {
    if (!token || !projectId || !recordId) return

    const pid = Number(projectId)

    if (tab === 'class' && !classDiagram) {
      setLoading(true)
      setError(null)
      getClassDiagram(token, pid, recordId)
        .then(setClassDiagram)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    } else if (tab === 'dependencies' && !depGraph) {
      setLoading(true)
      setError(null)
      getDependencyGraph(token, pid, recordId)
        .then(setDepGraph)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    } else if (tab === 'packages' && !pkgDiagram) {
      setLoading(true)
      setError(null)
      getPackageDiagram(token, pid, recordId)
        .then(setPkgDiagram)
        .catch(e => setError((e as Error).message))
        .finally(() => setLoading(false))
    }
  }, [token, projectId, recordId, tab, classDiagram, depGraph, pkgDiagram])

  // Compute layout
  const classNodes = classDiagram ? layoutNodes(classDiagram.nodes) : []
  const depNodes = depGraph ? layoutNodes(depGraph.nodes) : []
  const pkgNodes = pkgDiagram ? layoutPackages(pkgDiagram.packages) : []

  const { w: svgW, h: svgH } = tab === 'packages'
    ? svgSizePkg(pkgNodes)
    : tab === 'dependencies'
      ? svgSize(depNodes)
      : svgSize(classNodes)

  const currentData = tab === 'class' ? classDiagram : tab === 'dependencies' ? depGraph : pkgDiagram
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
              {nodeCount} {tab === 'packages' ? 'packages' : 'classes'} · {edgeCount} relations
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginRight: 12 }}>
            {(['class', 'dependencies', 'packages'] as Tab[]).map(t => (
              <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
                {t === 'class' ? 'Classe UML' : t === 'dependencies' ? 'Dépendances' : 'Packages'}
              </button>
            ))}
          </div>

          {/* Zoom */}
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
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 4 }}>
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-bg" style={{ flex: 1, overflow: 'auto' }}>
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
              <svg width={svgW} height={svgH}>
                {classDiagram.edges.map((edge, i) => (
                  <Arrow key={i} nodes={classNodes} edge={edge} />
                ))}
                {classNodes.map(node => <ClassBox key={node.id} node={node} />)}
              </svg>
            )}
            {tab === 'dependencies' && depGraph && (
              <svg width={svgW} height={svgH}>
                {depGraph.edges.map((edge, i) => (
                  <Arrow key={i} nodes={depNodes} edge={edge} />
                ))}
                {depNodes.map(node => <ClassBox key={node.id} node={node} />)}
              </svg>
            )}
            {tab === 'packages' && pkgDiagram && (
              <svg width={svgW} height={svgH}>
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
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 20px', background: 'var(--bg-1)', borderTop: '1px solid var(--line-1)', flexShrink: 0 }}>
        {tab !== 'packages' ? (
          [
            { color: '#A78BFA', label: 'extends' },
            { color: '#60A5FA', label: 'implements' },
            { color: '#6E7A88', label: 'uses' },
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
    </div>
  )
}
