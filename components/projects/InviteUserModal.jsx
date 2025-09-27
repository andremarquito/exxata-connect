import React, { useState } from 'react'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx'
import { Badge } from '../ui/badge.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import {
  X,
  Mail,
  UserPlus,
  Building2,
  Users,
  Send,
  Check
} from 'lucide-react'

export const InviteUserModal = ({ isOpen, onClose, projectId, projectName }) => {
  const { USER_ROLES, getRoleDisplayName, mockUsers } = useAuth()
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.COLLABORATOR)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState([])

  const handleInvite = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular envio de convite
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newInvite = {
      id: Date.now(),
      email,
      role: selectedRole,
      status: 'pending',
      invitedAt: new Date().toISOString()
    }

    setInvitedUsers([...invitedUsers, newInvite])
    setEmail('')
    setMessage('')
    setIsLoading(false)
  }

  const suggestedUsers = mockUsers.filter(user => 
    !invitedUsers.some(invite => invite.email === user.email)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-grey-sky/30">
          <div>
            <h2 className="text-xl font-semibold text-blue-exxata">Convidar Usuários</h2>
            <p className="text-sm text-grey-sky mt-1">
              Projeto: <span className="font-medium">{projectName}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-grey-sky hover:text-blue-exxata"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Formulário de Convite */}
          <Card className="border-grey-sky/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-exxata">
                <UserPlus className="h-5 w-5" />
                <span>Novo Convite</span>
              </CardTitle>
              <CardDescription>
                Convide novos usuários para colaborar neste projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do usuário</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-grey-sky" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função no projeto</Label>
                    <select
                      id="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-grey-sky/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-corp"
                    >
                      <option value={USER_ROLES.COLLABORATOR}>
                        {getRoleDisplayName(USER_ROLES.COLLABORATOR)}
                      </option>
                      <option value={USER_ROLES.MANAGER}>
                        {getRoleDisplayName(USER_ROLES.MANAGER)}
                      </option>
                      <option value={USER_ROLES.CLIENT}>
                        {getRoleDisplayName(USER_ROLES.CLIENT)}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
                  <textarea
                    id="message"
                    placeholder="Adicione uma mensagem personalizada ao convite..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-20 px-3 py-2 border border-grey-sky/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-corp resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-exxata-red hover:bg-dark-red text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Enviando convite...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Usuários Sugeridos */}
          {suggestedUsers.length > 0 && (
            <Card className="border-grey-sky/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-exxata">
                  <Users className="h-5 w-5" />
                  <span>Usuários Sugeridos</span>
                </CardTitle>
                <CardDescription>
                  Usuários da sua organização que podem ser adicionados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-grey-sky/30 rounded-lg hover:bg-grey-sky/5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-exxata rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-exxata">{user.name}</p>
                        <p className="text-sm text-grey-sky">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-corp/10 text-blue-corp text-xs">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          <span className="text-xs text-grey-sky">• {user.company}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmail(user.email)}
                      className="border-grey-sky/30 text-blue-corp hover:bg-blue-corp/10"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Convidar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Convites Enviados */}
          {invitedUsers.length > 0 && (
            <Card className="border-grey-sky/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-exxata">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Convites Enviados</span>
                </CardTitle>
                <CardDescription>
                  Usuários que foram convidados para este projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invitedUsers.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border border-grey-sky/30 rounded-lg bg-green-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-exxata">{invite.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-corp/10 text-blue-corp text-xs">
                            {getRoleDisplayName(invite.role)}
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Pendente
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-grey-sky">
                      Enviado agora
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-grey-sky/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-grey-sky/30"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
