import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Header from '../components/layout/Header'
import { renderPlantUml } from '../api/diagrams'
import { createSavedUmlDiagram, deleteSavedUmlDiagram, getSavedUmlDiagram, updateSavedUmlDiagram } from '../api/savedUmls'
import { getProjects } from '../api/projects'
import type { Project } from '../types'

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-0)', border: '1px solid var(--line-2)',
  borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--fg-0)',
  outline: 'none', fontFamily: 'var(--font-sans)',
}

export default function SavedUmlEditor() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id != null
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [previewSvg, setPreviewSvg] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getSavedUmlDiagram(Number(id))
      .then(d => {
        setName(d.name)
        setProjectId(d.projectId)
        setSource(d.plantUmlSource)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  useEffect(() => {
    if (!source.trim()) {
      setPreviewSvg(null)
      setPreviewError(null)
      return
    }
    setPreviewLoading(true)
    const timer = setTimeout(() => {
      renderPlantUml(source)
        .then(({ svg }) => { setPreviewSvg(svg); setPreviewError(null) })
        .catch(e => setPreviewError((e as Error).message))
        .finally(() => setPreviewLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [source])

  function handlePlantUmlFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSource(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  async function handleSave() {
    if (!name.trim() || !source.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = { name: name.trim(), projectId, source }
      if (isEdit) {
        await updateSavedUmlDiagram(Number(id), payload)
      } else {
        await createSavedUmlDiagram(payload)
      }
      navigate('/saved-umls')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    await deleteSavedUmlDiagram(Number(id))
    navigate('/saved-umls')
  }

  if (loading) {
    return (
      <div>
        <Header title="UML enregistrés" />
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-2)', fontSize: 13 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={isEdit ? 'Modifier le diagramme UML' : 'Nouveau diagramme UML'}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/saved-umls')}>
              <ArrowLeft size={14} /> Retour
            </button>
            {isEdit && (
              deleteConfirm ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--bad)', color: '#fff', border: 'none' }} onClick={handleDelete}>
                    Confirmer
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Annuler</button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 size={14} /> Supprimer
                </button>
              )
            )}
            <button className="btn btn-primary" disabled={saving || !name.trim() || !source.trim()} onClick={handleSave}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        }
      />

      <div className="page">
        {error && (
          <div className="card" style={{ borderColor: 'var(--bad)', padding: '12px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--bad)' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Colonne édition */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label style={{ fontSize: 12, color: 'var(--fg-2)', display: 'block', marginBottom: 4 }}>Nom</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="ex: Architecture cible - module Commande" />
            </div>

            <div className="field">
              <label style={{ fontSize: 12, color: 'var(--fg-2)', display: 'block', marginBottom: 4 }}>
                Projet <span style={{ fontWeight: 400 }}>(optionnel)</span>
              </label>
              <select
                style={inputStyle}
                value={projectId ?? ''}
                onChange={e => setProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Aucun —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label style={{ fontSize: 12, color: 'var(--fg-2)', display: 'block', marginBottom: 4 }}>PlantUML</label>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--fg-2)' }}>
                Syntaxe PlantUML complète prise en charge (visibilité, membres statiques/abstraits,
                génériques, tous les types de relations, notes, packages, couleurs, hide/show…).
              </p>
              <textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder={'class Order\ninterface Shippable\nOrder ..|> Shippable'}
                rows={16}
                style={{
                  width: '100%',
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
              <input
                type="file"
                accept=".puml,.txt,.plantuml"
                onChange={e => handlePlantUmlFile(e.target.files?.[0])}
                style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 8 }}
              />
            </div>
          </div>

          {/* Colonne aperçu */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--fg-2)' }}>Aperçu</label>
              {previewLoading && <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>Génération…</span>}
            </div>
            {previewError && (
              <p style={{ fontSize: 12, color: 'var(--bad)' }}>{previewError}</p>
            )}
            {!previewSvg ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--fg-2)', fontSize: 12 }}>
                L'aperçu s'affiche au fur et à mesure de la saisie.
              </div>
            ) : (
              <div
                style={{ overflow: 'auto', maxHeight: 640, background: '#fff', borderRadius: 6, padding: 12 }}
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
