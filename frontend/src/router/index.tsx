import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminRoute from '../components/auth/AdminRoute'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/Dashboard'
import Projects from '../pages/Projects'
import ProjectDetail from '../pages/ProjectDetail'
import DiagramsList from '../pages/DiagramsList'
import DiagramEditor from '../pages/DiagramEditor'
import SavedUmls from '../pages/SavedUmls'
import SavedUmlEditor from '../pages/SavedUmlEditor'
import Analysis from '../pages/Analysis'
import AIAssistant from '../pages/AIAssistant'
import Settings from '../pages/Settings'
import AdminUsers from '../pages/admin/Users'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'projects', element: <Projects /> },
          { path: 'projects/:id', element: <ProjectDetail /> },
          { path: 'diagrams', element: <DiagramsList /> },
          { path: 'diagrams/:projectId/:recordId', element: <DiagramEditor /> },
          { path: 'saved-umls', element: <SavedUmls /> },
          { path: 'saved-umls/new', element: <SavedUmlEditor /> },
          { path: 'saved-umls/:id', element: <SavedUmlEditor /> },
          { path: 'analysis', element: <Analysis /> },
          { path: 'ai', element: <AIAssistant /> },
          { path: 'settings', element: <Settings /> },
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [
              { path: 'users', element: <AdminUsers /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
