import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Tipos de usuário e suas permissões
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  COLLABORATOR: 'collaborator',
  CLIENT: 'client'
}

export const PERMISSIONS = {
  CREATE_PROJECT: 'create_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',
  VIEW_PROJECT: 'view_project',
  INVITE_USERS: 'invite_users',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  UPLOAD_DOCUMENTS: 'upload_documents',
  DOWNLOAD_DOCUMENTS: 'download_documents'
}

// Mapeamento de permissões por role
const rolePermissions = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS
  ],
  [USER_ROLES.COLLABORATOR]: [
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS
  ],
  [USER_ROLES.CLIENT]: [
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.DOWNLOAD_DOCUMENTS
  ]
}

// Usuários mockados para demonstração
const mockUsers = [
  {
    id: 1,
    name: 'André Dias',
    email: 'andre@exxata.com.br',
    role: USER_ROLES.ADMIN,
    avatar: null,
    company: 'Exxata Consultoria',
    department: 'Administração'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@exxata.com.br',
    role: USER_ROLES.MANAGER,
    avatar: null,
    company: 'Exxata Consultoria',
    department: 'Projetos'
  },
  {
    id: 3,
    name: 'João Silva',
    email: 'joao@exxata.com.br',
    role: USER_ROLES.COLLABORATOR,
    avatar: null,
    company: 'Exxata Consultoria',
    department: 'Engenharia'
  },
  {
    id: 4,
    name: 'Carlos Oliveira',
    email: 'carlos@vale.com',
    role: USER_ROLES.CLIENT,
    avatar: null,
    company: 'Vale S.A.',
    department: 'Operações'
  }
]

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular verificação de token/sessão
    const savedUser = localStorage.getItem('exxata_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    
    // Simular autenticação
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const foundUser = mockUsers.find(u => u.email === email)
    if (foundUser && password === '123456') {
      setUser(foundUser)
      localStorage.setItem('exxata_user', JSON.stringify(foundUser))
      setIsLoading(false)
      return { success: true }
    }
    
    setIsLoading(false)
    return { success: false, error: 'Credenciais inválidas' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('exxata_user')
  }

  const hasPermission = (permission) => {
    if (!user) return false
    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes(permission)
  }

  const canAccessProject = (project) => {
    if (!user) return false
    
    // Admin e Manager podem acessar todos os projetos
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER) {
      return true
    }
    
    // Colaboradores e clientes só podem acessar projetos onde estão incluídos
    return project.teamMembers?.some(member => member.id === user.id) || false
  }

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [USER_ROLES.ADMIN]: 'Administrador',
      [USER_ROLES.MANAGER]: 'Gerente',
      [USER_ROLES.COLLABORATOR]: 'Colaborador',
      [USER_ROLES.CLIENT]: 'Cliente'
    }
    return roleNames[role] || role
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    canAccessProject,
    getRoleDisplayName,
    mockUsers,
    USER_ROLES,
    PERMISSIONS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
