import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Calendar, DollarSign, FileText, MapPin, Users, 
  BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, Brain, 
  Download, Upload, Zap, Target, Shield, ArrowLeft, Settings, UserPlus, FilePlus2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Dados mockados - em uma aplicação real, isso viria de uma API
  const project = {
    id: projectId,
    name: "Otimização de Contratos - Projeto Ferroviário Carajás",
    client: "Vale S.A.",
    finalClient: "Divisão de Ferrovias",
    status: "Em Andamento",
    progress: 75,
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    contractValue: "R$ 15.000.000",
    location: "Parauapebas, PA",
    description: "Análise e otimização de contratos de construção e manutenção da malha ferroviária de Carajás, visando a redução de pleitos e a eficiência operacional com a aplicação da Inteligência Humana Exxata.",
    phase: "Contratual",
    team: [
      { id: 1, name: "Carlos Silva", role: "Gerente de Projeto", email: "carlos.silva@exxata.com" },
      { id: 2, name: "Ana Oliveira", role: "Especialista Jurídica", email: "ana.oliveira@exxata.com" },
      { id: 3, name: "Pedro Santos", role: "Engenheiro de Contratos", email: "pedro.santos@exxata.com" },
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-600';
      case 'Planejamento': return 'bg-yellow-600';
      case 'Concluído': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Em Andamento': return <Clock className="h-4 w-4" />;
      case 'Planejamento': return <AlertCircle className="h-4 w-4" />;
      case 'Concluído': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'Pré-contratual': return 'bg-orange-100 text-orange-800';
      case 'Contratual': return 'bg-blue-100 text-blue-800';
      case 'Pós-contratual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddTeamMember = () => {
    // Lógica para adicionar membro à equipe
    console.log('Adicionar membro à equipe');
  };

  const handleUploadDocument = () => {
    // Lógica para upload de documento
    console.log('Upload de documento');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-muted-foreground">{project.client}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge className={getPhaseColor(project.phase)}>
            {project.phase}
          </Badge>
          <Badge className={`${getStatusColor(project.status)} text-white`}>
            {getStatusIcon(project.status)}
            <span className="ml-1">{project.status}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="ai-insights">Inteligência Humana</TabsTrigger>
          </TabsList>
          
          {activeTab === 'documents' && (
            <Button onClick={handleUploadDocument} size="sm" className="gap-1">
              <FilePlus2 className="h-4 w-4" />
              Novo Documento
            </Button>
          )}
          
          {activeTab === 'team' && user?.permissions?.includes('manage_team') && (
            <Button onClick={handleAddTeamMember} size="sm" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <Progress value={project.progress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor do Contrato</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.contractValue}</div>
                <p className="text-xs text-muted-foreground">Contrato assinado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Localização</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.location}</div>
                <p className="text-xs text-muted-foreground">Área de atuação</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Período</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(project.startDate).toLocaleDateString('pt-BR')} - {new Date(project.endDate).toLocaleDateString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Duração do contrato</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Descrição do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Equipe do Projeto</CardTitle>
                <CardDescription>{project.team.length} membros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-medium text-muted-foreground">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium leading-none">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos do Projeto</CardTitle>
              <CardDescription>Gerencie os documentos relacionados a este projeto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Contrato Principal.pdf</p>
                      <p className="text-sm text-muted-foreground">2.4 MB • Atualizado em 15/03/2024</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
                <div className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Relatório de Análise Inicial.pdf</p>
                      <p className="text-sm text-muted-foreground">1.8 MB • Atualizado em 10/03/2024</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Equipe do Projeto</CardTitle>
              <CardDescription>Gerencie os membros da equipe e suas permissões.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {project.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-medium text-muted-foreground">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>Acompanhe as últimas atualizações do projeto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Reunião de alinhamento realizada</p>
                    <p className="text-sm text-muted-foreground">
                      Reunião com o cliente para alinhamento das próximas etapas do projeto.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Hoje • 14:30 - 15:45
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Documento aprovado</p>
                    <p className="text-sm text-muted-foreground">
                      O cliente aprovou o relatório de análise inicial.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Ontem • 11:20
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-exxata-red" />
                  Análise Preditiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    Com base na experiência Exxata, o projeto tem <strong>85% de probabilidade</strong> de ser concluído dentro do prazo, 
                    com redução de <strong>40% no risco de pleitos contratuais</strong> em obras de infraestrutura.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-exxata-red" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-exxata-red"></div>
                    </div>
                    <p className="text-sm">Revisar cláusula 5.2 do contrato para evitar ambiguidades</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-exxata-red"></div>
                    </div>
                    <p className="text-sm">Agendar reunião com o time jurídico para análise de riscos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectDetails;
