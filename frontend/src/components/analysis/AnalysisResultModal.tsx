import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Copy, Check, LayoutTemplate } from 'lucide-react'
import type { BackendAnalysisResponse } from '../../types'

interface Props {
  result: BackendAnalysisResponse
  onClose: () => void
}

type Format = 'json' | 'xml' | 'text'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function toXml(r: BackendAnalysisResponse): string {
  const unitsXml = r.codeUnits.map(cu => {
    const classesXml = cu.classes.map(cls => {
      const fields = cls.fields.map(f =>
        `      <field name="${esc(f.name)}" type="${esc(f.type)}" visibility="${esc(f.visibility)}" static="${f.isStatic}" final="${f.isFinal}" />`
      ).join('\n')
      const methods = cls.methods.map(m =>
        `      <method name="${esc(m.name)}" returnType="${esc(m.returnType)}" visibility="${esc(m.visibility)}" static="${m.isStatic}" abstract="${m.isAbstract}" params="${esc(m.parameterTypes.join(', '))}" />`
      ).join('\n')
      const deps = cls.dependencies.map(d => `      <dep>${esc(d)}</dep>`).join('\n')
      const ifaces = cls.interfaces.map(i => `      <interface>${esc(i)}</interface>`).join('\n')
      return `    <class name="${esc(cls.name)}" qualifiedName="${esc(cls.qualifiedName)}" type="${esc(cls.type)}" visibility="${esc(cls.visibility)}"${cls.superClass ? ` extends="${esc(cls.superClass)}"` : ''}>
${ifaces ? `      <implements>\n${ifaces}\n      </implements>` : ''}
      <fields count="${cls.fields.length}">
${fields}
      </fields>
      <methods count="${cls.methods.length}">
${methods}
      </methods>
      <dependencies>
${deps}
      </dependencies>
    </class>`
    }).join('\n')
    return `  <codeUnit file="${esc(cu.fileName)}" package="${esc(cu.packageName)}" language="${esc(cu.language)}">
${classesXml}
  </codeUnit>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<analysisResult projectId="${r.projectId}" status="${esc(r.status)}" filesAnalyzed="${r.filesAnalyzed}" classesFound="${r.classesFound}">
  <storageKey>${esc(r.storageKey)}</storageKey>
  <message>${esc(r.message)}</message>
  <codeUnits count="${r.codeUnits.length}">
${unitsXml}
  </codeUnits>
</analysisResult>`
}

function toText(r: BackendAnalysisResponse): string {
  const lines: string[] = [
    "RAPPORT D'ANALYSE",
    '=================',
    `Projet ID   : ${r.projectId}`,
    `Statut      : ${r.status}`,
    `Message     : ${r.message}`,
    `Fichiers    : ${r.filesAnalyzed}`,
    `Classes     : ${r.classesFound}`,
    `Stockage    : ${r.storageKey}`,
    '',
    'DÉTAIL DES CLASSES',
    '------------------',
  ]
  for (const cu of r.codeUnits) {
    lines.push(`\n[${cu.language}] ${cu.fileName}`)
    if (cu.packageName) lines.push(`  package : ${cu.packageName}`)
    for (const cls of cu.classes) {
      lines.push(`\n  ${cls.type} ${cls.qualifiedName} (${cls.visibility})`)
      if (cls.superClass) lines.push(`    extends     : ${cls.superClass}`)
      if (cls.interfaces.length) lines.push(`    implements  : ${cls.interfaces.join(', ')}`)
      if (cls.fields.length) {
        lines.push(`    Champs (${cls.fields.length}) :`)
        cls.fields.forEach(f => lines.push(`      ${f.visibility}${f.isStatic ? ' static' : ''}${f.isFinal ? ' final' : ''} ${f.type} ${f.name}`))
      }
      if (cls.methods.length) {
        lines.push(`    Méthodes (${cls.methods.length}) :`)
        cls.methods.forEach(m => lines.push(`      ${m.visibility}${m.isStatic ? ' static' : ''}${m.isAbstract ? ' abstract' : ''} ${m.returnType} ${m.name}(${m.parameterTypes.join(', ')})`))
      }
      if (cls.dependencies.length) lines.push(`    Dépendances : ${cls.dependencies.join(', ')}`)
    }
  }
  return lines.join('\n')
}

export default function AnalysisResultModal({ result, onClose }: Props) {
  const [format, setFormat] = useState<Format>('json')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const content =
    format === 'json' ? JSON.stringify(result, null, 2)
    : format === 'xml' ? toXml(result)
    : toText(result)

  const handleCopy = () => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-1)', borderRadius: 10, border: '1px solid var(--line-1)', width: '82vw', maxWidth: 960, maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--line-1)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', flex: 1 }}>
            Résultat de l'analyse — projet {result.projectId}
          </h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['json', 'xml', 'text'] as Format[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-mono)', fontWeight: 500, background: format === f ? 'var(--accent)' : 'var(--bg-3)', color: format === f ? '#fff' : 'var(--fg-1)' }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            style={{ background: 'var(--bg-3)', border: 'none', cursor: 'pointer', color: copied ? 'var(--ok)' : 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 4, fontSize: 12 }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} Copier
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex', padding: 4 }}
            title="Fermer (Echap)"
          >
            <X size={16} />
          </button>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 18px', borderBottom: '1px solid var(--line-1)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Fichiers : <strong style={{ color: 'var(--fg-0)' }}>{result.filesAnalyzed}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Classes : <strong style={{ color: 'var(--fg-0)' }}>{result.classesFound}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Statut : <strong style={{ color: 'var(--ok)' }}>{result.status}</strong></span>
          {result.message && <span style={{ fontSize: 12, color: 'var(--fg-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.message}</span>}
          {result.recordId && (
            <button
              onClick={() => { onClose(); navigate(`/diagrams/${result.projectId}/${result.recordId}`) }}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
            >
              <LayoutTemplate size={13} /> Voir le diagramme UML
            </button>
          )}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
          <pre style={{ margin: 0, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-0)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}
