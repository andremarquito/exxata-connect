import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, DollarSign, Clock, CheckCircle, Search, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
 

// Projects come from ProjectsContext

export function Projects() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { projects, userCanSeeProject, updateProject } = useProjects();
  
  // Verificar permissões do usuário
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const canManage = isAdmin || isManager;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  // Função para formatar valores monetários
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'R$ 0,00';
    
    // Se já é número (como vem do Supabase para campos NUMERIC), usar direto
    if (typeof val === 'number' && Number.isFinite(val)) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    let s = String(val).trim();
    // Remover símbolo e espaços
    s = s.replace(/R\$\s?/g, '').replace(/\s/g, '');

    // Caso BR: usa vírgula como decimal
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      if (isNaN(n)) return 'R$ 0,00';
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Caso haja apenas pontos mas não representem decimal no final (ex: 15.000.000)
    if (s.includes('.') && !/\.\d{1,2}$/.test(s)) {
      s = s.replace(/\./g, '');
    }

    // Remover possíveis separadores de milhar em estilo EN
    s = s.replace(/,/g, '');
    const n = Number(s);
    if (isNaN(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Normaliza e cores para os status
  const normalizeStatus = (s) => {
    const t = (s || '').toString().toLowerCase();
    if (t.includes('conclu')) return 'Concluído';
    return 'Em andamento';
  };

  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s.includes('conclu')) return 'bg-green-600';
    return 'bg-blue-600';
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s.includes('conclu')) return <CheckCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Fase não é mais exibida

  const visibleProjects = projects.filter((p) => userCanSeeProject(p));
  const filteredAndSortedProjects = visibleProjects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(project => 
      statusFilter === 'all' || normalizeStatus(project.status) === statusFilter
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'progress-asc':
          return a.progress - b.progress;
        case 'progress-desc':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleNewProject = () => {
    // Dispara evento global para o App abrir o modal de Novo Projeto
    window.dispatchEvent(new Event('open-new-project-modal'));
  };

  // Sem menu de ajustes/exclusão nesta visão

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho da página com melhor espaçamento e contraste */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Projetos
            </h2>
            <p className="text-gray-600 text-lg">
              Gerencie seus projetos de consultoria com a metodologia Exxata
            </p>
          </div>
          {hasPermission('create_project') && (
            <Button onClick={handleNewProject} className="bg-exxata-red hover:bg-dark-red">
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Buscar projetos..."
                  className="w-full sm:w-64 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="progress-desc">Progresso (Maior)</SelectItem>
                  <SelectItem value="progress-asc">Progresso (Menor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedProjects.map((project) => (
              <Card 
                key={project.id} 
                className="bg-white hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.client} • {project.location}
                      </CardDescription>
                      {(project.sector || (project.exxataActivities && project.exxataActivities.length > 0)) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {project.sector && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                              {project.sector}
                            </Badge>
                          )}
                          {Array.isArray(project.exxataActivities) && project.exxataActivities.map((act) => (
                            <Badge key={act} className="bg-blue-50 text-blue-700 border border-blue-200">
                              {act}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex items-center gap-2">
                      {canManage ? (
                        <Select
                          value={normalizeStatus(project.status)}
                          onValueChange={(v) => updateProject(project.id, { status: v })}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status do projeto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`${getStatusColor(project.status)} text-white`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1">{normalizeStatus(project.status)}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-slate-500" />
                        <span>{formatCurrency(project.contractValue)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-slate-500" />
                        <span>{project.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Projects;
