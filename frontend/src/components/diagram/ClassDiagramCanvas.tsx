import type { DiagramEdge, DiagramNode } from '../../types'

// ─── Types internes ────────────────────────────────────────────────────────────

interface PositionedNode extends DiagramNode {
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

const typeColors: Record<string, { bg: string; header: string; text: string; badge: string }> = {
  class:          { bg: '#11161D', header: '#1A222C', text: '#E6EDF3', badge: '#5BC0BE' },
  interface:      { bg: '#0F1820', header: '#162030', text: '#60A5FA', badge: '#60A5FA' },
  abstract_class: { bg: '#13101D', header: '#1B1530', text: '#A78BFA', badge: '#A78BFA' },
  enum:           { bg: '#0F1A12', header: '#152018', text: '#3FB984', badge: '#3FB984' },
}

const edgeColors: Record<string, string> = {
  EXTENDS: '#A78BFA', IMPLEMENTS: '#60A5FA', USES: '#6E7A88',
  DEPENDS_ON: '#3FB984',
  MANY_TO_ONE: '#F59E0B', ONE_TO_MANY: '#F59E0B',
  MANY_TO_MANY: '#EF4444', ONE_TO_ONE: '#10B981',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nodeHeight(node: DiagramNode): number {
  return 100 + node.fields.length * 20 + node.methods.length * 20 +
    (node.fields.length > 0 && node.methods.length > 0 ? 8 : 0)
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

function svgSize(nodes: PositionedNode[]): { w: number; h: number } {
  if (nodes.length === 0) return { w: 800, h: 400 }
  const maxX = Math.max(...nodes.map(n => n.x + CARD_W))
  const maxY = Math.max(...nodes.map(n => n.y + nodeHeight(n)))
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

// ─── Composant composite ────────────────────────────────────────────────────────

export interface ClassDiagramCanvasProps {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export default function ClassDiagramCanvas({ nodes, edges }: ClassDiagramCanvasProps) {
  const positioned = layoutNodes(nodes)
  const { w, h } = svgSize(positioned)
  return (
    <svg width={w} height={h}>
      {edges.map((edge, i) => (
        <Arrow key={i} nodes={positioned} edge={edge} />
      ))}
      {positioned.map(node => <ClassBox key={node.id} node={node} />)}
    </svg>
  )
}
