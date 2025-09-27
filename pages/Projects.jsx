import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, MapPin, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Dados mockados para demonstração - adaptados para Exxata
  const projects = [
    {
      id: 1,
      name: "Otimização de Contratos - Projeto Ferroviário Carajás",
      client: "Vale S.A.",
      status: "Em Andamento",
      progress: 75,
      startDate: "2024-02-01",
      endDate: "2025-01-31",
      contractValue: "R$ 15.000.000",
      location: "Parauapebas, PA",
      phase: "Contratual"
    },
    {
      id: 2,
      name: "Gestão de Riscos - Empreendimento de Saneamento Básico",
      client: "Concessionária Águas Limpas",
      status: "Planejamento",
      progress: 30,
      startDate: "2024-04-10",
      endDate: "2025-03-30",
      contractValue: "R$ 8.500.000",
      location: "São José dos Campos, SP",
      phase: "Pré-contratual"
    },
    {
      id: 3,
      name: "Revisão Contratual - Complexo Minerário Itabira",
      client: "Vale S.A.",
      status: "Concluído",
      progress: 100,
      startDate: "2023-09-15",
      endDate: "2024-03-15",
      contractValue: "R$ 5.200.000",
      location: "Itabira, MG",
      phase: "Pós-contratual"
    },
    {
      id: 4,
      name: "Due Diligence - Projeto Rodoviário BR-101",
      client: "Construtora Rodovia Segura",
      status: "Em Andamento",
      progress: 55,
      startDate: "2024-01-20",
      endDate: "2024-11-30",
      contractValue: "R$ 12.000.000",
      location: "Região Sul, BR",
      phase: "Contratual"
    }
  ];

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

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleNewProject = () => {
    // Lógica para criar um novo projeto
    console.log('Novo projeto criado');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meus Projetos</h2>
          <p className="text-muted-foreground">
            Gerencie seus projetos de consultoria com a metodologia Exxata
          </p>
        </div>
        {user?.permissions?.includes('create_project') && (
          <Button onClick={handleNewProject} className="bg-exxata-red hover:bg-dark-red">
            <Building2 className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProjectClick(project.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.client} • {project.location}
                  </CardDescription>
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
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{project.contractValue}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{project.location}</span>
                  </div>
                </div>
                <div className="w-48">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Projects;
