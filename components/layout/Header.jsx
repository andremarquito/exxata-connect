import React, { useState } from 'react'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import {
  Building2,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronDown
} from 'lucide-react'

export const Header = ({ onNewProject }) => {
  const { user, logout, getRoleDisplayName, hasPermission, PERMISSIONS } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-grey-sky/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-exxata-red" />
              <div>
                <h1 className="text-xl font-bold text-blue-exxata">
                  Exxata <span className="text-exxata-red">Connect</span>
                </h1>
                <p className="text-xs text-grey-sky">Gestão Inteligente de Projetos</p>
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grey-sky" />
              <input
                type="text"
                placeholder="Buscar projetos, documentos..."
                className="w-full pl-10 pr-4 py-2 border border-grey-sky/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-corp focus:border-transparent"
              />
            </div>
          </div>

          {/* Ações e Perfil */}
          <div className="flex items-center space-x-4">
            {/* Botão Novo Projeto */}
            {hasPermission(PERMISSIONS.CREATE_PROJECT) && (
              <Button
                onClick={onNewProject}
                className="bg-exxata-red hover:bg-dark-red text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            )}

            {/* Notificações */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-grey-sky" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-exxata-red rounded-full text-xs"></span>
            </Button>

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-grey-sky/10 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-exxata rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-blue-exxata">{user?.name}</p>
                    <p className="text-xs text-grey-sky">{user?.company}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-grey-sky" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-grey-sky/30 py-2 z-50">
                  {/* Informações do Usuário */}
                  <div className="px-4 py-3 border-b border-grey-sky/30">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-exxata rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-exxata">{user?.name}</p>
                        <p className="text-sm text-grey-sky">{user?.email}</p>
                        <Badge className="mt-1 bg-blue-corp/10 text-blue-corp text-xs">
                          {getRoleDisplayName(user?.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-blue-exxata hover:bg-grey-sky/10 flex items-center space-x-3">
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-blue-exxata hover:bg-grey-sky/10 flex items-center space-x-3">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-grey-sky/30 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para fechar menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
