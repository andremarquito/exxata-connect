import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, FolderKanban, Users, Settings, MessageSquareWarning, 
  ChevronLeft, ChevronRight, MoreHorizontal, LogOut, Search, Zap, ChevronDown, ExternalLink 
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { to: '/projects', icon: FolderKanban, label: 'Projetos', permission: 'view_projects' },
  { to: '/search', icon: Search, label: 'Pesquisar', permission: null },
  { to: '/team', icon: Users, label: 'Equipe', permission: 'manage_team' },
  { to: '/settings', icon: Settings, label: 'Configurações', permission: null },
];

const powerApps = [
  { 
    name: 'Extrator de RDO com IA', 
    url: 'https://exxata-extrator-de-rdo-com-ia-690581227740.us-west1.run.app' 
  },
  { 
    name: 'Cronograma Primavera PDF para Excel', 
    url: 'https://extrator-cronograma-primavera-ia-690581227740.us-west1.run.app' 
  },
  { 
    name: 'Simulador de Monte Carlo', 
    url: 'https://exxata-montecarlo.streamlit.app' 
  },
];

const helpItems = [
  { to: '/feedback', icon: MessageSquareWarning, label: 'Feedback' },
];

export function Sidebar() {
  const { user, hasPermission, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPowerAppsOpen, setIsPowerAppsOpen] = useState(false);
  const navigate = useNavigate();

  // Verificar se o usuário pode ver Power Apps (não é Cliente)
  const userRole = (user?.role || '').toLowerCase();
  const canSeePowerApps = userRole !== 'cliente' && userRole !== 'client';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={`bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex items-center justify-between h-16 border-b border-slate-200 px-6">
        {!isCollapsed && (
          <div className="text-xl font-bold text-blue-exxata">
            Exxata <span className="text-exxata-red">Control</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          {isCollapsed ? <ChevronRight className="h-5 w-5 text-slate-600" /> : <ChevronLeft className="h-5 w-5 text-slate-600" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => 
          (item.permission === null || hasPermission(item.permission)) && (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center p-3 text-sm font-medium rounded-xl transition-all duration-200 mx-2 ${
                  isActive
                    ? 'bg-blue-exxata text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-exxata'
                } ${
                  isCollapsed ? 'justify-center' : ''
                }`
              }
            >
              <item.icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        )}

        {/* Exxata Power Apps - Menu Sanfona */}
        {canSeePowerApps && (
          <div className="mx-2">
            <button
              onClick={() => setIsPowerAppsOpen(!isPowerAppsOpen)}
              className={`flex items-center justify-between w-full p-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isCollapsed 
                  ? 'justify-center' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-blue-exxata'
              }`}
            >
              <div className="flex items-center">
                <Zap className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && <span>Exxata Power Apps</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isPowerAppsOpen ? 'rotate-180' : ''
                  }`} 
                />
              )}
            </button>
            
            {/* Submenu de Power Apps */}
            {isPowerAppsOpen && !isCollapsed && (
              <div className="mt-1 ml-4 space-y-1">
                {powerApps.map((app) => (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-blue-exxata rounded-lg transition-colors group"
                  >
                    <span className="truncate">{app.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-2">
        <nav className="space-y-1">
          {helpItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex items-center p-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <item.icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4 relative">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-exxata-blue text-white flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={toggleProfileMenu}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Dropdown do perfil */}
        {isProfileMenuOpen && !isCollapsed && (
          <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl shadow-lg bg-white ring-1 ring-slate-200 focus:outline-none z-50">
            <div className="py-2">
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
    </aside>
  );
}

export default Sidebar;
