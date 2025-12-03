import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, FileText, Download, ExternalLink, Calendar, User, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectsContext';
import { useAuth } from '@/contexts/AuthContext';

// Categorias de documentos (mesmas do ProjectDetails)
const DOCUMENT_CATEGORIES = [
  { value: 'Correspondência', label: 'Correspondência', color: 'bg-blue-100 text-blue-800' },
  { value: 'ATA', label: 'ATA', color: 'bg-purple-100 text-purple-800' },
  { value: 'E-mail', label: 'E-mail', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'RDO', label: 'RDO', color: 'bg-green-100 text-green-800' },
  { value: 'Relatório', label: 'Relatório', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Análise', label: 'Análise', color: 'bg-orange-100 text-orange-800' },
  { value: 'Singularidades', label: 'Singularidades', color: 'bg-red-100 text-red-800' },
  { value: 'Notificação', label: 'Notificação', color: 'bg-pink-100 text-pink-800' },
  { value: 'Plano de Ação', label: 'Plano de Ação', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'Parecer', label: 'Parecer', color: 'bg-violet-100 text-violet-800' },
  { value: 'Checklist', label: 'Checklist', color: 'bg-teal-100 text-teal-800' },
  { value: 'Procedimento', label: 'Procedimento', color: 'bg-lime-100 text-lime-800' },
];

const getCategoryColor = (category) => {
  const cat = DOCUMENT_CATEGORIES.find(c => c.value === category);
  return cat ? cat.color : 'bg-slate-100 text-slate-800';
};

export function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, userCanSeeProject } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Coletar todos os documentos de todos os projetos visíveis
  const allDocuments = useMemo(() => {
    const visibleProjects = projects.filter(p => userCanSeeProject(p));
    const docs = [];
    
    visibleProjects.forEach(project => {
      if (Array.isArray(project.files)) {
        project.files.forEach(file => {
          docs.push({
            ...file,
            projectId: project.id,
            projectName: project.name,
            projectClient: project.client,
          });
        });
      }
    });
    
    return docs;
  }, [projects, userCanSeeProject]);

  // Filtrar documentos
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter(doc => {
      // Filtro de busca por nome
      const matchesSearch = searchTerm === '' || 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.projectClient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de categoria
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      
      // Filtro de data de início
      const matchesStartDate = !startDateFilter || 
        (doc.uploadedAt && new Date(doc.uploadedAt) >= new Date(startDateFilter));
      
      // Filtro de data de fim
      const matchesEndDate = !endDateFilter || 
        (doc.uploadedAt && new Date(doc.uploadedAt) <= new Date(endDateFilter));
      
      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [allDocuments, searchTerm, categoryFilter, startDateFilter, endDateFilter]);

  // Calcular paginação
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? filteredDocuments.length : startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Resetar para primeira página quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, startDateFilter, endDateFilter]);

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value === 'all' ? 'all' : parseInt(value));
    setCurrentPage(1);
  };

  const handleDownload = (file) => {
    if (file.file_path) {
      window.open(file.file_path, '_blank');
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Pesquisar Documentos</h1>
        <p className="text-slate-600">Busque documentos em todos os seus projetos</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Busca</CardTitle>
          <CardDescription>Refine sua pesquisa usando os filtros abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Busca por nome */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Buscar por nome
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Nome do arquivo, projeto, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por categoria */}
            <div className="lg:col-span-1">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Categoria
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período de envio */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Período de Envio
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full"
                  placeholder="De"
                />
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full"
                  placeholder="Até"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Resultados da Busca</CardTitle>
              <CardDescription>
                {filteredDocuments.length} documento(s) encontrado(s)
                {itemsPerPage !== 'all' && ` - Página ${currentPage} de ${totalPages}`}
              </CardDescription>
            </div>
            {searchTerm || categoryFilter !== 'all' || startDateFilter || endDateFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
              >
                Limpar Filtros
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">
                {searchTerm || categoryFilter !== 'all' || startDateFilter || endDateFilter
                  ? 'Nenhum documento encontrado com os filtros aplicados'
                  : 'Nenhum documento disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Informações do documento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="font-medium text-slate-900 truncate">
                          {doc.original_name || doc.name}
                        </h3>
                        {doc.category && (
                          <Badge className={`${getCategoryColor(doc.category)} border-0 text-xs`}>
                            {doc.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FolderOpen className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{doc.projectName}</span>
                        </div>
                        
                        {doc.projectClient && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="truncate">{doc.projectClient}</span>
                          </div>
                        )}
                        
                        {doc.uploadedAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      {doc.uploaded_by_name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Enviado por: {doc.uploaded_by_name}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProject(doc.projectId)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver Projeto
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {filteredDocuments.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
              {/* Seletor de itens por página */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 whitespace-nowrap">Mostrar:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600 whitespace-nowrap">por página</span>
              </div>

              {/* Controles de navegação */}
              {itemsPerPage !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {/* Primeira página */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="text-slate-400">...</span>}
                      </>
                    )}
                    
                    {/* Páginas próximas */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage || 
                               page === currentPage - 1 || 
                               page === currentPage + 1 ||
                               (page === currentPage - 2 && currentPage <= 3) ||
                               (page === currentPage + 2 && currentPage >= totalPages - 2);
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    
                    {/* Última página */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-slate-400">...</span>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Search;
