import { createContext, useContext, useState, useCallback } from 'react'
import type { BackendAnalysisResponse } from '../types'
import { uploadAndAnalyze } from '../api/analysis'
import { useToast } from './ToastContext'

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

export interface UploadProgress {
  loaded: number
  total: number
}

interface AnalysisState {
  projectId: number | null
  projectName: string
  status: AnalysisStatus
  result: BackendAnalysisResponse | null
  error: string | null
  uploadProgress: UploadProgress | null
}

interface AnalysisContextValue {
  state: AnalysisState
  run: (projectId: number, projectName: string, file: File) => Promise<void>
  dismiss: () => void
  hasUnread: boolean
  markRead: () => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

const IDLE: AnalysisState = {
  projectId: null,
  projectName: '',
  status: 'idle',
  result: null,
  error: null,
  uploadProgress: null,
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisState>(IDLE)
  const [hasUnread, setHasUnread] = useState(false)
  const { showToast } = useToast()

  const run = useCallback(async (projectId: number, projectName: string, file: File) => {
    setState({ projectId, projectName, status: 'uploading', result: null, error: null, uploadProgress: null })

    try {
      const result = await uploadAndAnalyze(projectId, file, {
        onUploadProgress: (loaded, total) => {
          setState(prev => ({ ...prev, status: 'uploading', uploadProgress: { loaded, total } }))
        },
        onUploadDone: () => {
          setState(prev => ({ ...prev, status: 'analyzing', uploadProgress: null }))
        },
      })

      setState(prev => ({ ...prev, status: 'complete', result, uploadProgress: null }))
      setHasUnread(true)
      showToast(
        `Analyse de "${projectName}" terminée — ${result.filesAnalyzed} fichiers, ${result.classesFound} classes`,
        'ok',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, status: 'error', error: msg, uploadProgress: null }))
      showToast(`Erreur lors de l'analyse : ${msg}`, 'bad')
    }
  }, [showToast])

  const dismiss = useCallback(() => setState(IDLE), [])
  const markRead = useCallback(() => setHasUnread(false), [])

  return (
    <AnalysisContext.Provider value={{ state, run, dismiss, hasUnread, markRead }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider')
  return ctx
}
