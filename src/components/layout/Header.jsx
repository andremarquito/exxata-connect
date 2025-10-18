import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Settings } from 'lucide-react';

export function Header({ onNewProject }) {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Verificar permissões do usuário
  const userRole = (user?.role || '').toLowerCase();
  const isClient = (userRole === 'client' || userRole === 'cliente');
  const isCollaborator = (userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant');
  const isRestricted = isClient || isCollaborator;
  const isManager = (userRole === 'manager' || userRole === 'gerente');
  const isAdmin = (userRole === 'admin' || userRole === 'administrador');

  const handleNewProject = () => {
    if (isRestricted) {
      alert('Você não possui permissão para criar novos projetos. Entre em contato com o administrador.');
      return;
    }
    onNewProject();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logotipo Exxata */}
          <div className="flex-1 max-w-lg">
            <div className="flex items-center">
              <img
                src="/Assinatura-de-Marca---Exxata_01.png"
                alt="Exxata"
                className="h-8 w-auto cursor-pointer select-none"
                onClick={() => navigate('/')}
              />
            </div>
          </div>

          {/* Área de ações */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            {/* Novo Projeto */}
            <Button 
              onClick={handleNewProject}
              className={`rounded-lg px-4 py-2 ${
                isRestricted
                  ? 'bg-slate-400 hover:bg-slate-500 text-white cursor-not-allowed'
                  : 'bg-exxata-red hover:bg-red-700 text-white'
              }`}
              title={isRestricted ? 'Sem permissão para criar projetos' : 'Criar novo projeto'}
            >
              Novo Projeto
            </Button>

            {/* Menu do usuário */}
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-exxata text-white flex items-center justify-center text-sm font-medium">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden md:block">
                  {user?.name}
                </span>
              </button>

              {/* Dropdown do perfil */}
              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-slate-200 focus:outline-none z-50">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <div className="font-medium text-slate-900">{user?.name}</div>
                      <div className="text-sm text-slate-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Configurações
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
