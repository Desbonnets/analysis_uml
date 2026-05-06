import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useState } from 'react'
import diagramsData from '../data/diagrams.json'
import type { Diagram, DiagramClass } from '../types'

const diagrams = diagramsData as Diagram[]

const typeColors: Record<string, { bg: string; header: string; text: string; badge: string }> = {
  class:     { bg: '#11161D', header: '#1A222C', text: '#E6EDF3', badge: '#5BC0BE' },
  interface: { bg: '#0F1820', header: '#162030', text: '#60A5FA', badge: '#60A5FA' },
  abstract:  { bg: '#13101D', header: '#1B1530', text: '#A78BFA', badge: '#A78BFA' },
  enum:      { bg: '#0F1A12', header: '#152018', text: '#3FB984', badge: '#3FB984' },
}

const CARD_W      = 220
const CARD_H_BASE = 100

function getCardHeight(cls: DiagramClass) {
  return CARD_H_BASE + cls.attributes.length * 20 + cls.methods.length * 20 + (cls.attributes.length > 0 && cls.methods.length > 0 ? 8 : 0)
}

function ClassBox({ cls }: { cls: DiagramClass }) {
  const colors = typeColors[cls.type] ?? typeColors.class
  const h      = getCardHeight(cls)

  return (
    <g transform={`translate(${cls.x}, ${cls.y})`}>
      <rect x={3} y={3} width={CARD_W} height={h} rx={8} fill="rgba(0,0,0,0.35)" />
      <rect width={CARD_W} height={h} rx={8} fill={colors.bg} stroke="#2E3A48" strokeWidth={1} />
      <rect width={CARD_W} height={36} rx={8} fill={colors.header} />
      <rect y={28} width={CARD_W} height={8} fill={colors.header} />
      <text x={8} y={14} fontSize={8} fill={colors.badge} fontFamily="monospace" opacity={0.9}>
        «{cls.type}»
      </text>
      <text x={CARD_W / 2} y={28} textAnchor="middle" fontSize={12} fontWeight="600" fill={colors.text} fontFamily="Inter, system-ui">
        {cls.name}
      </text>
      <line x1={0} y1={36} x2={CARD_W} y2={36} stroke="#2E3A48" strokeWidth={1} />
      {cls.attributes.map((attr, i) => (
        <text key={i} x={10} y={56 + i * 20} fontSize={10} fill="#6E7A88" fontFamily="JetBrains Mono, monospace">
          {attr.length > 28 ? attr.slice(0, 28) + '…' : attr}
        </text>
      ))}
      {cls.attributes.length > 0 && cls.methods.length > 0 && (
        <line x1={0} y1={36 + cls.attributes.length * 20 + 12} x2={CARD_W} y2={36 + cls.attributes.length * 20 + 12} stroke="#2E3A48" strokeWidth={1} strokeDasharray="4,4" />
      )}
      {cls.methods.map((method, i) => {
        const yOffset = 56 + cls.attributes.length * 20 + (cls.attributes.length > 0 ? 8 : 0) + i * 20
        return (
          <text key={i} x={10} y={yOffset} fontSize={10} fill="#5BC0BE" fontFamily="JetBrains Mono, monospace">
            {method.length > 28 ? method.slice(0, 28) + '…' : method}
          </text>
        )
      })}
    </g>
  )
}

function RelationArrow({ from, to, relationType }: { from: DiagramClass; to: DiagramClass; relationType: string }) {
  const fx = from.x + CARD_W / 2
  const fy = from.y + getCardHeight(from) / 2
  const tx = to.x + CARD_W / 2
  const ty = to.y + getCardHeight(to) / 2

  const relColors: Record<string, string> = {
    extends: '#A78BFA', implements: '#60A5FA', uses: '#6E7A88', aggregates: '#3FB984',
  }
  const color = relColors[relationType] ?? '#6E7A88'

  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={1.5} strokeDasharray={relationType === 'uses' ? '6,3' : undefined} opacity={0.65} />
      <text x={(fx + tx) / 2} y={(fy + ty) / 2 - 4} textAnchor="middle" fontSize={9} fill={color} opacity={0.85}>{relationType}</text>
    </g>
  )
}

const toolbarBtnStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line-2)',
  color: 'var(--fg-1)', cursor: 'pointer', transition: 'all 120ms',
}

export default function DiagramEditor() {
  const { id } = useParams<{ id: string }>()
  const [zoom, setZoom] = useState(1)
  const diagram = diagrams.find(d => d.id === id) ?? diagrams[0]

  if (!diagram) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--fg-2)', fontSize: 14 }}>
      Diagramme introuvable
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-0)' }}>
      {/* Barre d'outils */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/diagrams" style={{ color: 'var(--fg-2)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>{diagram.name}</h2>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>{diagram.classes.length} classes · {diagram.relations.length} relations</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={toolbarBtnStyle} onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>
            <ZoomOut size={14} />
          </button>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', width: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button style={toolbarBtnStyle} onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn size={14} />
          </button>
          <button style={toolbarBtnStyle} onClick={() => setZoom(1)}>
            <Maximize2 size={14} />
          </button>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 6 }}>
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-bg" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', padding: 40 }}>
          <svg width={1000} height={700}>
            {diagram.relations.map((rel, i) => {
              const fromCls = diagram.classes.find(c => c.id === rel.from)
              const toCls   = diagram.classes.find(c => c.id === rel.to)
              if (!fromCls || !toCls) return null
              return <RelationArrow key={i} from={fromCls} to={toCls} relationType={rel.type} />
            })}
            {diagram.classes.map(cls => <ClassBox key={cls.id} cls={cls} />)}
          </svg>
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 20px', background: 'var(--bg-1)', borderTop: '1px solid var(--line-1)', flexShrink: 0 }}>
        {[
          { color: '#A78BFA', label: 'extends' },
          { color: '#60A5FA', label: 'implements' },
          { color: '#6E7A88', label: 'uses' },
          { color: '#3FB984', label: 'aggregates' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 1.5, backgroundColor: l.color }} />
            <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
