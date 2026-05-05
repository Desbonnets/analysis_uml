import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useState } from 'react'
import diagramsData from '../data/diagrams.json'
import type { Diagram, DiagramClass } from '../types'

const diagrams = diagramsData as Diagram[]

const typeColors: Record<string, { bg: string; header: string; text: string; badge: string }> = {
  class:     { bg: '#1a1d2e', header: '#1e2235', text: '#e2e8f0', badge: 'bg-sky-500/20 text-sky-300' },
  interface: { bg: '#1a2235', header: '#1e2a40', text: '#93c5fd', badge: 'bg-blue-500/20 text-blue-300' },
  abstract:  { bg: '#1d1a35', header: '#251e40', text: '#c4b5fd', badge: 'bg-violet-500/20 text-violet-300' },
  enum:      { bg: '#1a2a1a', header: '#1e3520', text: '#86efac', badge: 'bg-emerald-500/20 text-emerald-300' },
}

const CARD_W = 220
const CARD_H_BASE = 100

function getCardHeight(cls: DiagramClass) {
  return CARD_H_BASE + cls.attributes.length * 20 + cls.methods.length * 20 + (cls.attributes.length > 0 && cls.methods.length > 0 ? 8 : 0)
}

function ClassBox({ cls }: { cls: DiagramClass; zoom?: number }) {
  const colors = typeColors[cls.type] || typeColors.class
  const h = getCardHeight(cls)

  return (
    <g transform={`translate(${cls.x}, ${cls.y})`}>
      {/* Shadow */}
      <rect x={3} y={3} width={CARD_W} height={h} rx={8} fill="rgba(0,0,0,0.4)" />
      {/* Body */}
      <rect width={CARD_W} height={h} rx={8} fill={colors.bg} stroke="#2a2d3e" strokeWidth={1} />
      {/* Header */}
      <rect width={CARD_W} height={36} rx={8} fill={colors.header} />
      <rect y={28} width={CARD_W} height={8} fill={colors.header} />
      {/* Type badge */}
      <text x={8} y={14} fontSize={8} fill={cls.type === 'class' ? '#7c3aed' : '#3b82f6'} fontFamily="monospace" opacity={0.9}>
        «{cls.type}»
      </text>
      {/* Class name */}
      <text x={CARD_W / 2} y={28} textAnchor="middle" fontSize={12} fontWeight="600" fill={colors.text} fontFamily="system-ui">
        {cls.name}
      </text>

      {/* Separator */}
      <line x1={0} y1={36} x2={CARD_W} y2={36} stroke="#2a2d3e" strokeWidth={1} />

      {/* Attributes */}
      {cls.attributes.map((attr, i) => (
        <text key={i} x={10} y={56 + i * 20} fontSize={10} fill="#94a3b8" fontFamily="monospace">
          {attr.length > 28 ? attr.slice(0, 28) + '…' : attr}
        </text>
      ))}

      {/* Methods separator */}
      {cls.attributes.length > 0 && cls.methods.length > 0 && (
        <line
          x1={0}
          y1={36 + cls.attributes.length * 20 + 12}
          x2={CARD_W}
          y2={36 + cls.attributes.length * 20 + 12}
          stroke="#2a2d3e"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      )}

      {/* Methods */}
      {cls.methods.map((method, i) => {
        const yOffset = 56 + cls.attributes.length * 20 + (cls.attributes.length > 0 ? 8 : 0) + i * 20
        return (
          <text key={i} x={10} y={yOffset} fontSize={10} fill="#c084fc" fontFamily="monospace">
            {method.length > 28 ? method.slice(0, 28) + '…' : method}
          </text>
        )
      })}
    </g>
  )
}

function RelationArrow({ from, to, relationType }: {
  from: DiagramClass; to: DiagramClass; relationType: string
}) {
  const fx = from.x + CARD_W / 2
  const fy = from.y + getCardHeight(from) / 2
  const tx = to.x + CARD_W / 2
  const ty = to.y + getCardHeight(to) / 2

  const mx = (fx + tx) / 2
  const my = (fy + ty) / 2

  const colors: Record<string, string> = {
    extends: '#c084fc', implements: '#60a5fa', uses: '#94a3b8', aggregates: '#34d399',
  }
  const color = colors[relationType] || '#94a3b8'

  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={1.5} strokeDasharray={relationType === 'uses' ? '6,3' : undefined} opacity={0.6} />
      <text x={mx} y={my - 4} textAnchor="middle" fontSize={9} fill={color} opacity={0.8}>{relationType}</text>
    </g>
  )
}

export default function DiagramEditor() {
  const { id } = useParams<{ id: string }>()
  const [zoom, setZoom] = useState(1)
  const diagram = diagrams.find(d => d.id === id) || diagrams[0]

  if (!diagram) return <div className="flex items-center justify-center h-screen text-slate-400">Diagramme introuvable</div>

  const canvasW = 1000
  const canvasH = 700

  return (
    <div className="flex flex-col h-screen bg-[#0d0f17]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#12141c] border-b border-[#1e2235]">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h2 className="text-white text-sm font-semibold">{diagram.name}</h2>
            <p className="text-slate-500 text-xs">{diagram.classes.length} classes · {diagram.relations.length} relations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e2235] text-slate-400 hover:text-slate-200 transition-colors">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e2235] text-slate-400 hover:text-slate-200 transition-colors">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => setZoom(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e2235] text-slate-400 hover:text-slate-200 transition-colors">
            <Maximize2 size={14} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors ml-2">
            <Download size={13} />
            Exporter
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-[#0a0c12]"
        style={{ backgroundImage: 'radial-gradient(circle, #1e2235 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', padding: 40 }}>
          <svg width={canvasW} height={canvasH}>
            {/* Relations */}
            {diagram.relations.map((rel, i) => {
              const fromCls = diagram.classes.find(c => c.id === rel.from)
              const toCls = diagram.classes.find(c => c.id === rel.to)
              if (!fromCls || !toCls) return null
              return <RelationArrow key={i} from={fromCls} to={toCls} relationType={rel.type} />
            })}
            {/* Classes */}
            {diagram.classes.map(cls => (
              <ClassBox key={cls.id} cls={cls} zoom={zoom} />
            ))}
          </svg>
        </div>
      </div>

      {/* Bottom legend */}
      <div className="flex items-center gap-6 px-6 py-2 bg-[#12141c] border-t border-[#1e2235]">
        {[
          { color: '#c084fc', label: 'extends' },
          { color: '#60a5fa', label: 'implements' },
          { color: '#94a3b8', label: 'uses' },
          { color: '#34d399', label: 'aggregates' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
