import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AnalysisProvider } from './context/AnalysisContext'
import { router } from './router'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AnalysisProvider>
          <RouterProvider router={router} />
        </AnalysisProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
