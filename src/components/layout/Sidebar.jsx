import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, FolderKanban, Users, Settings, LifeBuoy, MessageSquareWarning, 
  ChevronLeft, ChevronRight, MoreHorizontal 
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { to: '/projects', icon: FolderKanban, label: 'Projetos', permission: 'view_projects' },
  { to: '/team', icon: Users, label: 'Equipe', permission: 'manage_team' },
  { to: '/settings', icon: Settings, label: 'Configurações', permission: null },
];

const helpItems = [
  { to: '/help', icon: LifeBuoy, label: 'Ajuda' },
  { to: '/feedback', icon: MessageSquareWarning, label: 'Feedback' },
];

export function Sidebar() {
  const { user, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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
            Exxata <span className="text-exxata-red">Connect</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          {isCollapsed ? <ChevronRight className="h-5 w-5 text-slate-600" /> : <ChevronLeft className="h-5 w-5 text-slate-600" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
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

      <div className="border-t border-gray-200 p-4">
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
            <button className="p-1 rounded-md hover:bg-gray-100">
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
