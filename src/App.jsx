import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProjectsProvider, useProjects } from '@/contexts/ProjectsContext';
import { UsersProvider } from '@/contexts/UsersContext';
import { LoginForm } from '@/components/auth/LoginForm';
import SignUpForm from '@/pages/SignUp';
import AuthCallback from '@/pages/AuthCallback';
import ConfirmEmail from '@/pages/ConfirmEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import DashboardNew from '@/pages/DashboardNew';
import Projects from '@/pages/Projects';
import ProjectDetails from '@/pages/ProjectDetails';
import Team from '@/pages/Team';
import Settings from '@/pages/Settings';
import Feedback from '@/pages/Feedback';
import Search from '@/pages/Search';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { InviteUserModal } from '@/components/projects/InviteUserModal';
import { NewProjectModal } from '@/components/projects/NewProjectModal';

// Componente Dashboard para compatibilidade
const Dashboard = () => <DashboardNew />;

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
  const { createProject } = useProjects();
  const navigate = useNavigate();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Abrir modal "Novo Projeto" quando acionado pelo botão na página de Projetos
  useEffect(() => {
    const handler = () => setIsNewProjectModalOpen(true);
    window.addEventListener('open-new-project-modal', handler);
    return () => window.removeEventListener('open-new-project-modal', handler);
  }, []);

  // Se o usuário não estiver autenticado, mostrar apenas o conteúdo da rota
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Layout principal da aplicação quando autenticado
  return (
    <div className="min-h-screen bg-slate-50 font-manrope flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header 
          onNewProject={() => setIsNewProjectModalOpen(true)} 
        />
        
        {/* Conteúdo */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/search" element={<Search />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* Modal de convite */}
      <InviteUserModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUserRole={user?.role}
      />

      {/* Modal de novo projeto */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={(payload) => {
          try {
            const created = createProject(payload);
            toast.success('Projeto criado com sucesso!');
            setIsNewProjectModalOpen(false);
            navigate('/projects');
          } catch (e) {
            console.error(e);
            toast.error('Falha ao criar projeto');
          }
        }}
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
      <UsersProvider>
        <ProjectsProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignUpForm />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
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
        </ProjectsProvider>
      </UsersProvider>
    </AuthProvider>
  );
};

export default App;
