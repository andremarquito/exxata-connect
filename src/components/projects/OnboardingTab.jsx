import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText,
  AlertCircle,
  X as CloseIcon,
  Download
} from 'lucide-react';
import { onboardingService } from '@/services/onboardingService';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export function OnboardingTab({ projectId, userId, canEdit }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    phase: 'A',
    phase_name: 'Fase Pré-Contratual',
    code: '',
    description: '',
    observation: '',
    motivation: ''
  });

  // Carregar documentos
  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await onboardingService.getProjectDocuments(projectId);
      setDocuments(data);
      setIsInitialized(data.length > 0);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos de onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar documentos padrão
  const handleInitializeDocuments = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar');
      return;
    }

    try {
      await onboardingService.initializeDefaultDocuments(projectId, userId);
      toast.success('Documentos padrão inicializados com sucesso!');
      loadDocuments();
    } catch (error) {
      console.error('Erro ao inicializar documentos:', error);
      toast.error('Erro ao inicializar documentos');
    }
  };

  // Toggle status de completude
  const handleToggleComplete = async (doc) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar');
      return;
    }

    try {
      await onboardingService.toggleComplete(doc.id, !doc.is_complete, userId);
      setDocuments(prev => 
        prev.map(d => d.id === doc.id ? { ...d, is_complete: !d.is_complete } : d)
      );
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Abrir modal de edição
  const handleOpenEdit = (doc) => {
    setEditingDocument(doc);
    setFormData({
      phase: doc.phase,
      phase_name: doc.phase_name,
      code: doc.code,
      description: doc.description,
      observation: doc.observation || '',
      motivation: doc.motivation || ''
    });
    setIsEditModalOpen(true);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    try {
      await onboardingService.updateDocument(editingDocument.id, formData, userId);
      toast.success('Documento atualizado!');
      loadDocuments();
      setIsEditModalOpen(false);
      setEditingDocument(null);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      toast.error('Erro ao atualizar documento');
    }
  };

  // Adicionar novo documento
  const handleAddDocument = async () => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar');
      return;
    }

    if (!formData.code.trim() || !formData.description.trim()) {
      toast.error('Código e descrição são obrigatórios');
      return;
    }

    try {
      await onboardingService.addDocument(projectId, formData, userId);
      toast.success('Documento adicionado!');
      loadDocuments();
      setIsAddModalOpen(false);
      setFormData({
        phase: 'A',
        phase_name: 'Fase Pré-Contratual',
        code: '',
        description: '',
        observation: '',
        motivation: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      toast.error('Erro ao adicionar documento');
    }
  };

  // Deletar documento
  const handleDelete = async (docId) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este documento?')) {
      return;
    }

    try {
      await onboardingService.deleteDocument(docId);
      toast.success('Documento deletado!');
      loadDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao deletar documento');
    }
  };

  // Exportar para Excel
  const handleExportToExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = [];
      
      // Cabeçalho
      exportData.push(['DOCUMENTOS DE ONBOARDING', '', '', '', '']);
      exportData.push(['Projeto ID:', projectId, '', '', '']);
      exportData.push(['Data de Exportação:', new Date().toLocaleDateString('pt-BR'), '', '', '']);
      exportData.push([]); // Linha vazia
      
      // Cabeçalhos das colunas
      exportData.push(['Código', 'Descrição', 'Documentação Completa', 'Observação', 'Motivação']);
      
      // Ordenar documentos por fase e código
      const sortedDocs = [...documents].sort((a, b) => {
        if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
        return a.code.localeCompare(b.code);
      });
      
      // Agrupar por fase e adicionar dados
      let currentPhase = '';
      sortedDocs.forEach(doc => {
        // Adicionar cabeçalho da fase se mudou
        if (doc.phase !== currentPhase) {
          exportData.push([]); // Linha vazia
          exportData.push([`${doc.phase}. ${doc.phase_name}`, '', '', '', '']);
          currentPhase = doc.phase;
        }
        
        // Adicionar linha do documento
        exportData.push([
          doc.code,
          doc.description,
          doc.is_complete ? 'Sim' : 'Não',
          doc.observation || '',
          doc.motivation || ''
        ]);
      });
      
      // Adicionar estatísticas
      exportData.push([]); // Linha vazia
      exportData.push(['ESTATÍSTICAS', '', '', '', '']);
      const totalDocs = documents.length;
      const completeDocs = documents.filter(d => d.is_complete).length;
      const incompleteDocs = totalDocs - completeDocs;
      const percentComplete = totalDocs > 0 ? ((completeDocs / totalDocs) * 100).toFixed(1) : 0;
      
      exportData.push(['Total de Documentos:', totalDocs, '', '', '']);
      exportData.push(['Documentos Completos:', completeDocs, '', '', '']);
      exportData.push(['Documentos Incompletos:', incompleteDocs, '', '', '']);
      exportData.push(['Percentual de Conclusão:', `${percentComplete}%`, '', '', '']);
      
      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 10 },  // Código
        { wch: 50 },  // Descrição
        { wch: 20 },  // Documentação Completa
        { wch: 40 },  // Observação
        { wch: 50 }   // Motivação
      ];
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Onboarding');
      
      // Gerar nome do arquivo
      const fileName = `Onboarding_Projeto_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Fazer download
      XLSX.writeFile(wb, fileName);
      
      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar planilha');
    }
  };

  // Agrupar documentos por fase
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.phase]) {
      acc[doc.phase] = {
        name: doc.phase_name,
        docs: []
      };
    }
    acc[doc.phase].docs.push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-exxata mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Onboarding do Projeto
          </CardTitle>
          <CardDescription>
            Inicialize a lista de documentos necessários para o onboarding do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Clique no botão abaixo para inicializar a lista padrão de documentos de onboarding
            </p>
            {canEdit && (
              <Button onClick={handleInitializeDocuments}>
                <Plus className="h-4 w-4 mr-2" />
                Inicializar Documentos Padrão
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const totalDocs = documents.length;
  const completeDocs = documents.filter(d => d.is_complete).length;
  const percentComplete = totalDocs > 0 ? ((completeDocs / totalDocs) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos de Onboarding
              </CardTitle>
              <CardDescription>
                Controle de documentação necessária para o projeto
              </CardDescription>
              {totalDocs > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {completeDocs} de {totalDocs} documentos completos ({percentComplete}%)
                    </span>
                    <div className="flex-1 max-w-xs">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {documents.length > 0 && (
                <Button variant="outline" onClick={handleExportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Documento
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabelas por fase */}
      {Object.entries(groupedDocuments).sort().map(([phase, { name, docs }]) => (
        <Card key={phase}>
          <CardHeader>
            <CardTitle className="text-lg">
              {phase}. {name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Código</TableHead>
                    <TableHead className="min-w-[250px]">Descrição</TableHead>
                    <TableHead className="w-32 text-center">Documentação Completa</TableHead>
                    <TableHead className="min-w-[200px]">Observação</TableHead>
                    <TableHead className="min-w-[250px]">Motivação</TableHead>
                    {canEdit && <TableHead className="w-24 text-center">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.code}</TableCell>
                      <TableCell>{doc.description}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleComplete(doc)}
                          disabled={!canEdit}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                          }`}
                        >
                          {doc.is_complete ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.observation || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.motivation || '-'}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(doc)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modal de Adicionar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              onClick={() => setIsAddModalOpen(false)}
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>Adicionar Novo Documento</CardTitle>
              <CardDescription>
                Preencha as informações do novo documento de onboarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-phase">Fase</Label>
                <select
                  id="add-phase"
                  className="w-full border border-slate-200 rounded-md p-2"
                  value={formData.phase}
                  onChange={(e) => {
                    const phase = e.target.value;
                    let phaseName = '';
                    if (phase === 'A') phaseName = 'Fase Pré-Contratual';
                    else if (phase === 'B') phaseName = 'Fase de Formalização Contratual';
                    else if (phase === 'C') phaseName = 'Fase de Execução';
                    setFormData({ ...formData, phase, phase_name: phaseName });
                  }}
                >
                  <option value="A">A - Fase Pré-Contratual</option>
                  <option value="B">B - Fase de Formalização Contratual</option>
                  <option value="C">C - Fase de Execução</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-code">Código *</Label>
                <Input
                  id="add-code"
                  placeholder="Ex: A.1, B.2, C.3"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Descrição *</Label>
              <Input
                id="add-description"
                placeholder="Descrição do documento"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-observation">Observação</Label>
              <Textarea
                id="add-observation"
                placeholder="Observações sobre o documento"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-motivation">Motivação</Label>
              <Textarea
                id="add-motivation"
                placeholder="Motivação para este documento"
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDocument}>
                Adicionar
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Editar */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              onClick={() => setIsEditModalOpen(false)}
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>Editar Documento</CardTitle>
              <CardDescription>
                Atualize as informações do documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fase</Label>
                <Input value={`${formData.phase} - ${formData.phase_name}`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={formData.code} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-observation">Observação</Label>
              <Textarea
                id="edit-observation"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-motivation">Motivação</Label>
              <Textarea
                id="edit-motivation"
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default OnboardingTab;
