import { createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import App from '../App'
import { LoginForm } from '../components/auth/LoginForm'
import { Dashboard } from '../pages/Dashboard'
import { Projects } from '../pages/Projects'
import { ProjectDetails } from '../pages/ProjectDetails'
import { Team } from '../pages/Team'
import { Settings } from '../pages/Settings'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
    children: [
      {
        path: 'login',
        element: <LoginForm />
      },
      {
        path: '',
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: <Dashboard />
          },
          {
            path: 'projects',
            element: <Projects />
          },
          {
            path: 'projects/:projectId',
            element: <ProjectDetails />
          },
          {
            path: 'team',
            element: <Team />
          },
          {
            path: 'settings',
            element: <Settings />
          }
        ]
      }
    ]
  }
])
