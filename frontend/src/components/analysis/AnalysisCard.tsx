import { useRef, useState } from 'react'
import { Upload, Play, CheckCircle, AlertCircle, FileCode, X } from 'lucide-react'
import { useAnalysis } from '../../context/AnalysisContext'
import { useAuth } from '../../context/AuthContext'

interface Props {
  projectId: number
  projectName: string
  onViewResult: () => void
}

function fmt(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function ProgressBar({ pct, indeterminate }: { pct?: number; indeterminate?: boolean }) {
  return (
    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden', position: 'relative' }}>
      {indeterminate ? (
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(90deg, var(--accent) 0px, var(--accent) 20px, var(--accent-soft) 20px, var(--accent-soft) 40px)`,
          backgroundSize: '40px 100%',
          animation: 'progress-stripe 0.7s linear infinite',
        }} />
      ) : (
        <div style={{
          height: '100%',
          width: `${pct ?? 0}%`,
          background: 'var(--accent)',
          borderRadius: 999,
          transition: 'width 120ms linear',
        }} />
      )}
    </div>
  )
}

export default function AnalysisCard({ projectId, projectName, onViewResult }: Props) {
  const { state, run, dismiss } = useAnalysis()
  const { token } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isThisProject = state.projectId === projectId
  const isUploading  = isThisProject && state.status === 'uploading'
  const isAnalyzing  = isThisProject && state.status === 'analyzing'
  const isComplete   = isThisProject && state.status === 'complete'
  const isError      = isThisProject && state.status === 'error'
  const isOtherBusy  = (state.status === 'uploading' || state.status === 'analyzing') && state.projectId !== projectId

  const handleRun = () => {
    if (!token || !selectedFile) return
    void run(token, projectId, projectName, selectedFile)
  }

  // ── Phase 1 : upload ──────────────────────────────────────────────────────
  if (isUploading) {
    const prog = state.uploadProgress
    const pct = prog ? Math.round((prog.loaded / prog.total) * 100) : 0
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>
            Upload en cours...
          </p>
          <span className="mono tabular" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
            {pct}%
          </span>
        </div>
        <ProgressBar pct={pct} />
        {prog && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>
            {fmt(prog.loaded)} / {fmt(prog.total)}
          </p>
        )}
      </div>
    )
  }

  // ── Phase 2 : serveur analyse ─────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>
            Analyse en cours...
          </p>
          <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>ZIP reçu — extraction des classes</span>
        </div>
        <ProgressBar indeterminate />
      </div>
    )
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (isComplete && state.result) {
    const r = state.result
    return (
      <div
        className="card"
        style={{ cursor: 'pointer' }}
        onClick={onViewResult}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onViewResult()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} style={{ color: 'var(--ok)' }} />
            Analyse terminée
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>Voir le détail →</span>
            <button
              onClick={e => { e.stopPropagation(); dismiss() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}
              title="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--bg-0)', borderRadius: 6, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>Fichiers analysés</p>
            <p className="mono tabular" style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: 'var(--fg-0)' }}>
              {r.filesAnalyzed}
            </p>
          </div>
          <div style={{ background: 'var(--bg-0)', borderRadius: 6, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-2)' }}>Classes trouvées</p>
            <p className="mono tabular" style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: 'var(--fg-0)' }}>
              {r.classesFound}
            </p>
          </div>
        </div>
        {r.message && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--fg-2)' }}>{r.message}</p>
        )}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} style={{ color: 'var(--bad)', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>Échec de l'analyse</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-2)' }}>{state.error}</p>
            </div>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileCode size={14} style={{ color: 'var(--accent)' }} />
        Analyser le code source
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <button
          className="btn btn-secondary"
          onClick={() => fileRef.current?.click()}
          disabled={isOtherBusy}
        >
          <Upload size={13} />
          {selectedFile ? selectedFile.name : 'Choisir un ZIP'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={!selectedFile || isOtherBusy}
        >
          <Play size={13} /> Analyser
        </button>
      </div>
      {selectedFile && (
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--fg-2)' }}>
          {selectedFile.name} · {fmt(selectedFile.size)}
        </p>
      )}
      {isOtherBusy && (
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--warn)' }}>
          Une analyse est déjà en cours pour "{state.projectName}".
        </p>
      )}
    </div>
  )
}
