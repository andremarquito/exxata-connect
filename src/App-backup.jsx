import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { ProjectDetails } from '@/pages/ProjectDetails';
import { Team } from '@/pages/Team';
import { Settings } from '@/pages/Settings';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { InviteUserModal } from '@/components/projects/InviteUserModal';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-exxata"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente principal da aplicação
const AppContent = () => {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Se o usuário não estiver autenticado, mostrar apenas o conteúdo da rota
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Layout principal da aplicação quando autenticado
  return (
    <div className="min-h-screen bg-off-white font-manrope flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onNewProject={() => setIsInviteModalOpen(true)} />
        
        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-6 bg-off-white">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      
      {/* Modal de convite */}
      <InviteUserModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUserRole={user?.role}
      />
      
      {/* Notificações */}
      <Toaster position="top-right" />
    </div>
  );
};

// Componente principal que envolve a aplicação com o AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
