import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { BarChart3, Calendar, Clock, FolderKanban, Users, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const Dashboard = () => {
  const { user } = useAuth()

  // Dados mockados para o dashboard
  const stats = [
    { name: 'Projetos Ativos', value: '12', icon: <FolderKanban className="h-6 w-6 text-blue-exxata" />, change: '+2', changeType: 'increase' },
    { name: 'Tarefas Pendentes', value: '8', icon: <Clock className="h-6 w-6 text-yellow-500" />, change: '-3', changeType: 'decrease' },
    { name: 'Membros da Equipe', value: '24', icon: <Users className="h-6 w-6 text-green-500" />, change: '+5', changeType: 'increase' },
    { name: 'Documentos', value: '156', icon: <FileText className="h-6 w-6 text-purple-500" />, change: '+12', changeType: 'increase' },
  ]

  const recentProjects = [
    { id: 1, name: 'Otimização de Contratos - Ferrovia', client: 'Vale S.A.', progress: 75, dueDate: '15/10/2023' },
    { id: 2, name: 'Análise de Riscos - Usina', client: 'Eletrobras', progress: 45, dueDate: '30/10/2023' },
    { id: 3, name: 'Plano de Manutenção - Rodovia', client: 'CCR', progress: 90, dueDate: '05/11/2023' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-exxata">Bem-vindo, {user?.name}</h1>
          <p className="text-grey-sky">Aqui está um resumo das suas atividades e projetos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-grey-sky/30">
            <Calendar className="h-4 w-4 mr-2" />
            Ver Calendário
          </Button>
          <Button className="bg-exxata-red hover:bg-dark-red">
            <FolderKanban className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-grey-sky/30 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-grey-sky">{stat.name}</p>
                  <p className="text-2xl font-bold text-blue-exxata mt-1">{stat.value}</p>
                  <p className={`text-xs mt-2 ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.changeType === 'increase' ? '↑' : '↓'} {stat.change} do último mês
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-exxata/10 rounded-full flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-grey-sky/30">
            <CardHeader className="border-b border-grey-sky/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-exxata">Projetos Recentes</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-exxata hover:text-blue-exxata/80">
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-grey-sky/20">
                {recentProjects.map((project) => (
                  <div key={project.id} className="p-4 hover:bg-grey-sky/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-blue-exxata">{project.name}</h3>
                        <p className="text-sm text-grey-sky mt-1">{project.client}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-grey-sky mb-1">
                            <span>Progresso</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-grey-sky/20 rounded-full h-2">
                            <div 
                              className="bg-blue-exxata h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-grey-sky">Entrega</p>
                        <p className="text-sm font-medium text-blue-exxata">{project.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-grey-sky/30 h-full">
            <CardHeader className="border-b border-grey-sky/30">
              <CardTitle className="text-blue-exxata">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-blue-exxata/10 rounded-full flex items-center justify-center mt-1">
                      <BarChart3 className="h-4 w-4 text-blue-exxata" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-exxata">Atualização do projeto</p>
                      <p className="text-xs text-grey-sky mt-1">Há 2 horas</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-grey-sky/30">
                Ver todas as atividades
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
