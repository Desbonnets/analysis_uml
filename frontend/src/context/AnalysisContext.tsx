import { createContext, useContext, useState, useCallback } from 'react'
import type { BackendAnalysisResponse } from '../types'
import { uploadAndAnalyze } from '../api/analysis'
import { useToast } from './ToastContext'

export type AnalysisStatus = 'idle' | 'running' | 'complete' | 'error'

interface AnalysisState {
  projectId: number | null
  projectName: string
  status: AnalysisStatus
  result: BackendAnalysisResponse | null
  error: string | null
}

interface AnalysisContextValue {
  state: AnalysisState
  run: (token: string, projectId: number, projectName: string, file: File) => Promise<void>
  dismiss: () => void
  hasUnread: boolean
  markRead: () => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

const IDLE: AnalysisState = { projectId: null, projectName: '', status: 'idle', result: null, error: null }

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisState>(IDLE)
  const [hasUnread, setHasUnread] = useState(false)
  const { showToast } = useToast()

  const run = useCallback(async (token: string, projectId: number, projectName: string, file: File) => {
    setState({ projectId, projectName, status: 'running', result: null, error: null })
    try {
      const result = await uploadAndAnalyze(token, projectId, file)
      setState(prev => ({ ...prev, status: 'complete', result }))
      setHasUnread(true)
      showToast(
        `Analyse de "${projectName}" terminée — ${result.filesAnalyzed} fichiers, ${result.classesFound} classes`,
        'ok',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, status: 'error', error: msg }))
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
