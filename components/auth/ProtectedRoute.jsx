import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Header } from '../layout/Header'
import { Sidebar } from '../layout/Sidebar'

export const ProtectedRoute = () => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen bg-off-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-off-white">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
