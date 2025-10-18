import React, { useState } from 'react'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error)
    }
  }

  const demoUsers = [
    { email: 'andre@exxata.com.br', role: 'Administrador', company: 'Exxata' },
    { email: 'maria@exxata.com.br', role: 'Gerente', company: 'Exxata' },
    { email: 'joao@exxata.com.br', role: 'Colaborador', company: 'Exxata' },
    { email: 'carlos@vale.com', role: 'Cliente', company: 'Vale S.A.' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-exxata to-blue-corp flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Título */}
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/Assinatura-de-Marca---Exxata_01.png"
              alt="Exxata"
              className="h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Exxata <span className="text-exxata-red">Connect</span>
          </h1>
          <p className="text-blue-corp/80">
            Gestão Inteligente de Projetos de Consultoria
          </p>
        </div>

        {/* Formulário de Login */}
        <Card className="border-grey-sky/30 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-exxata">Acesse sua conta</CardTitle>
            <CardDescription className="text-grey-sky">
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-exxata">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-grey-sky" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-grey-sky/30 focus:border-blue-corp"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-exxata">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-grey-sky" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-grey-sky/30 focus:border-blue-corp"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-grey-sky hover:text-blue-corp"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-exxata-red hover:bg-dark-red !text-[#eeeeee] font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Usuários Demo */}
        <Card className="border-grey-sky/30 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm text-blue-exxata">Usuários de Demonstração</CardTitle>
            <CardDescription className="text-xs text-grey-sky">
              Use qualquer email abaixo com a senha: <strong>123456</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => setEmail(user.email)}
                className="w-full text-left p-2 rounded-md hover:bg-grey-sky/10 transition-colors border border-grey-sky/20"
              >
                <div className="text-sm text-blue-exxata font-medium">{user.email}</div>
                <div className="text-xs text-grey-sky">{user.role} - {user.company}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white/80 text-sm">
          <p>© 2024 Exxata Consultoria. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
