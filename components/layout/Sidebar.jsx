import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  Users as UsersIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  MessageSquare,
  Calendar,
  HelpCircle
} from 'lucide-react'
import { Button } from '../ui/button'

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, hasPermission, PERMISSIONS } = useAuth()
  const location = useLocation()

  const navItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/',
      permission: PERMISSIONS.VIEW_PROJECT
    },
    {
      title: 'Projetos',
      icon: <FolderKanban className="h-5 w-5" />,
      path: '/projects',
      permission: PERMISSIONS.VIEW_PROJECT
    },
    {
      title: 'Equipe',
      icon: <UsersIcon className="h-5 w-5" />,
      path: '/team',
      permission: PERMISSIONS.INVITE_USERS
    },
    {
      title: 'Documentos',
      icon: <FileText className="h-5 w-5" />,
      path: '/documents',
      permission: PERMISSIONS.VIEW_PROJECT
    },
    {
      title: 'Relatórios',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/reports',
      permission: PERMISSIONS.VIEW_ANALYTICS
    },
    {
      title: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
      permission: PERMISSIONS.MANAGE_USERS
    }
  ]

  const bottomNavItems = [
    {
      title: 'Ajuda',
      icon: <HelpCircle className="h-5 w-5" />,
      path: '/help'
    },
    {
      title: 'Feedback',
      icon: <MessageSquare className="h-5 w-5" />,
      path: '/feedback'
    }
  ]

  return (
    <div 
      className={`h-screen bg-white border-r border-grey-sky/30 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'} h-16 border-b border-grey-sky/30`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-exxata rounded-md flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-blue-exxata">Exxata</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-grey-sky" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-grey-sky" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null
            }
            
            const isActive = location.pathname === item.path
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-3 rounded-md mx-2 text-sm font-medium transition-colors ${isActive ? 'bg-blue-exxata/10 text-blue-exxata' : 'text-grey-sky hover:bg-grey-sky/10'}`}
              >
                <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                  {React.cloneElement(item.icon, {
                    className: `h-5 w-5 ${isActive ? 'text-blue-exxata' : 'text-grey-sky'}`
                  })}
                </span>
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* User & Bottom Navigation */}
      <div className="border-t border-grey-sky/30 p-4">
        {/* User Profile */}
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-grey-sky/10 transition-colors">
            <div className="h-8 w-8 bg-blue-exxata rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-exxata truncate">{user.name}</p>
              <p className="text-xs text-grey-sky truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="mt-4 pt-4 border-t border-grey-sky/20">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} py-2 rounded-md text-sm font-medium text-grey-sky hover:bg-grey-sky/10`}
            >
              <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                {React.cloneElement(item.icon, {
                  className: 'h-5 w-5 text-grey-sky'
                })}
              </span>
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
