import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, DollarSign, MapPin, Calendar, Users, Plus, X, Edit3, FileText, GripVertical, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CARD_CATALOG = [
  // Campos principais do formulário
  { type: 'name', label: 'Nome do Projeto', icon: FileText },
  { type: 'client', label: 'Cliente Final', icon: FileText },
  { type: 'sector', label: 'Setor de Atuação', icon: Edit3 },
  { type: 'exxataActivities', label: 'Atuação Exxata', icon: Users },
  { type: 'location', label: 'Localização', icon: MapPin },
  { type: 'period', label: 'Período', icon: Calendar },
  { type: 'description', label: 'Descrição do Projeto', icon: Edit3 },
  { type: 'team', label: 'Equipe do Projeto', icon: Users },
  // Financeiro e progresso
  { type: 'contractValue', label: 'Valor do Contrato', icon: DollarSign },
  { type: 'hourlyRate', label: 'Valor do Homem-Hora', icon: DollarSign },
  { type: 'disputedAmount', label: 'Valor em Discussão', icon: DollarSign },
  { type: 'contractSummary', label: 'Título do Contrato', icon: Edit3 },
  { type: 'progress', label: 'Progresso de Prazo', icon: BarChart3 },
  { type: 'billingProgress', label: 'Progresso em Faturamento', icon: BarChart3 },
];

export default function OverviewGridSimple({ project, user, canEdit, updateProject }) {
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const isCollaborator = userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant';
  const canManage = isAdmin || isManager;
  const [isEditing, setIsEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  
  const config = useMemo(() => {
    return project?.overviewConfig && typeof project.overviewConfig === 'object'
      ? project.overviewConfig
      : { widgets: [], layouts: {} };
  }, [project]);

  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const existingTypes = new Set(widgets.map(w => w.type));
  const availableToAdd = CARD_CATALOG.filter(c => !existingTypes.has(c.type));

  // DnD handlers (somente em modo edição)
  const handleDragStart = (id, e) => {
    if (!isEditing) return;
    setDraggingId(id);
    try { e.dataTransfer.setData('text/plain', String(id)); } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (id, e) => {
    if (!isEditing) return;
    e.preventDefault();
    setDragOverId(id);
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (targetId, e) => {
    if (!isEditing) return;
    e.preventDefault();
    const sourceId = draggingId ?? e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const list = Array.isArray(widgets) ? [...widgets] : [];
    const fromIndex = list.findIndex(w => w.id === sourceId);
    const toIndex = list.findIndex(w => w.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = list.splice(fromIndex, 1);
    const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    list.splice(insertIndex, 0, moved);
    updateProject(project.id, { overviewConfig: { widgets: list, layouts: {} } });
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  // Função para adicionar widget
  const addWidget = (type) => {
    const id = 'w_' + Math.floor(Date.now() + Math.random()*1000);
    const nextWidgets = [...widgets, { id, type }];
    updateProject(project.id, { overviewConfig: { widgets: nextWidgets, layouts: {} } });
    setShowAdd(false);
  };

  // Função para remover widget
  const removeWidget = (id) => {
    const nextWidgets = widgets.filter(w => w.id !== id);
    updateProject(project.id, { overviewConfig: { widgets: nextWidgets, layouts: {} } });
  };

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    const exportData = [];
    
    // Adicionar informações básicas do projeto
    exportData.push(['DADOS DO PROJETO', '']);
    exportData.push(['Nome do Projeto', project.name || '']);
    exportData.push(['ID do Projeto', project.id || '']);
    exportData.push(['Data de Exportação', new Date().toLocaleDateString('pt-BR')]);
    exportData.push(['']); // Linha em branco
    
    // Coletar dados de todos os widgets visíveis
    exportData.push(['DADOS DA VISÃO GERAL', '']);
    
    widgets.forEach(widget => {
      const cardInfo = CARD_CATALOG.find(c => c.type === widget.type);
      const label = cardInfo?.label || widget.type;
      
      switch (widget.type) {
        case 'name':
          exportData.push(['Nome do Projeto', project.name || '']);
          break;
        case 'client':
          exportData.push(['Cliente Final', project.client || '']);
          break;
        case 'sector':
          exportData.push(['Setor de Atuação', project.sector || '']);
          break;
        case 'exxataActivities':
          const activities = Array.isArray(project.exxataActivities) 
            ? project.exxataActivities.join(', ') 
            : '';
          exportData.push(['Atuação Exxata', activities]);
          break;
        case 'location':
          exportData.push(['Localização', project.location || '']);
          break;
        case 'period':
          const period = `${project.startDate || ''} — ${project.endDate || ''}`;
          exportData.push(['Período', period]);
          exportData.push(['Data de Início', project.startDate || '']);
          exportData.push(['Data de Fim', project.endDate || '']);
          break;
        case 'description':
          exportData.push(['Descrição do Projeto', project.description || '']);
          break;
        case 'team':
          const teamMembers = Array.isArray(project.team) 
            ? project.team.map(u => u.name).join(', ') 
            : '';
          exportData.push(['Equipe do Projeto', teamMembers]);
          break;
        case 'contractValue':
          exportData.push(['Valor do Contrato', project.contractValue || '']);
          break;
        case 'hourlyRate':
          const hourlyRate = project.hourlyRate 
            ? `R$ ${Number(project.hourlyRate).toFixed(2).replace('.', ',')}`
            : '';
          exportData.push(['Valor do Homem-Hora', hourlyRate]);
          break;
        case 'disputedAmount':
          const disputedAmount = project.disputedAmount 
            ? `R$ ${Number(project.disputedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '';
          exportData.push(['Valor em Discussão', disputedAmount]);
          break;
        case 'contractSummary':
          exportData.push(['Título do Contrato', project.contractSummary || '']);
          break;
        case 'progress':
          exportData.push(['Progresso de Prazo (%)', `${Number(project.progress || 0)}%`]);
          break;
        case 'billingProgress':
          exportData.push(['Progresso em Faturamento (%)', `${Number(project.billingProgress || 0)}%`]);
          break;
        default:
          exportData.push([label, 'Dados não disponíveis']);
      }
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    
    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 25 }, // Coluna A - Labels
      { wch: 50 }  // Coluna B - Valores
    ];
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Visão Geral');
    
    // Gerar nome do arquivo
    const projectName = project.name || 'Projeto';
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `${sanitizedName}_Visao_Geral_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Fazer download do arquivo
    XLSX.writeFile(wb, fileName);
  };

  // Placeholder para quando não há cards configurados
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-slate-400 mb-4">
          <Plus className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Adicione os campos que deseja visualizar</p>
          <p className="text-sm text-muted-foreground">Configure os cards da visão geral do projeto</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAdd(true)} className="mt-4 bg-exxata-red hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Card
          </Button>
        )}
        
        {/* Modal para adicionar cards */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Adicionar Card</CardTitle>
                <CardDescription>Escolha um card para adicionar à visão geral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {CARD_CATALOG.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Button
                      key={card.type}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addWidget(card.type)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {card.label}
                    </Button>
                  );
                })}
                <Button variant="ghost" onClick={() => setShowAdd(false)} className="w-full mt-4">
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Controles de edição e exportação */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Card
              </Button>
              {isEditing ? (
                <Button onClick={() => setIsEditing(false)} className="bg-exxata-red hover:bg-red-700">
                  Finalizar Edição
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Cards
                </Button>
              )}
            </>
          )}
        </div>
        
        {/* Botão de exportar sempre visível quando há dados */}
        {widgets.length > 0 && (
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Grid simples responsivo alinhado ao formulário (2 colunas em md, espaçamento gap-4) */}
      <div className="grid md:grid-cols-2 gap-4">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(widget.id, e)}
            onDragOver={(e) => handleDragOver(widget.id, e)}
            onDrop={(e) => handleDrop(widget.id, e)}
            onDragEnd={handleDragEnd}
            className={`${dragOverId === widget.id ? 'ring-2 ring-exxata-red/40 rounded-lg' : ''}`}
            title={isEditing ? 'Arraste para reordenar' : undefined}
          >
            {renderCard(widget, isEditing, removeWidget, updateProject, project, canEdit)}
          </div>
        ))}
      </div>

      {/* Modal para adicionar cards */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Adicionar Card</CardTitle>
              <CardDescription>Escolha um card para adicionar à visão geral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableToAdd.map((card) => {
                const Icon = card.icon;
                return (
                  <Button
                    key={card.type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addWidget(card.type)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {card.label}
                  </Button>
                );
              })}
              {availableToAdd.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Todos os cards já foram adicionados
                </p>
              )}
              <Button variant="ghost" onClick={() => setShowAdd(false)} className="w-full mt-4">
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Função para renderizar cada tipo de card
function renderCard(widget, isEditing, removeWidget, updateProject, project, canEdit) {
  const type = widget.type;
  
  const headerActions = isEditing ? (
    <div className="flex items-center gap-2 select-none">
      <GripVertical className="h-4 w-4 text-slate-400 cursor-move" title="Arraste para reordenar" />
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600"
        onClick={() => removeWidget(widget.id)}
        title="Remover"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  switch (type) {
    case 'name':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nome do Projeto</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input
                defaultValue={project.name}
                onBlur={(e) => updateProject(project.id, { name: e.target.value })}
              />
            ) : (
              <div className="text-2xl font-bold">{project.name || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'client':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliente Final</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input
                defaultValue={project.client}
                onBlur={(e) => updateProject(project.id, { client: e.target.value })}
              />
            ) : (
              <div className="text-lg font-medium">{project.client || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'sector':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setor de Atuação</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Select value={project.sector || ''} onValueChange={(v) => updateProject(project.id, { sector: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="Aeroportos">Aeroportos</SelectItem>
                  <SelectItem value="Condomínios, Edifícios Residenciais e Comerciais">Condomínios, Edifícios Residenciais e Comerciais</SelectItem>
                  <SelectItem value="Energia">Energia</SelectItem>
                  <SelectItem value="Ferrovias">Ferrovias</SelectItem>
                  <SelectItem value="Hospitais">Hospitais</SelectItem>
                  <SelectItem value="Hotéis">Hotéis</SelectItem>
                  <SelectItem value="Indústrias">Indústrias</SelectItem>
                  <SelectItem value="Instalações Petrolíferas e Petroquímicas">Instalações Petrolíferas e Petroquímicas</SelectItem>
                  <SelectItem value="Linhas de Transmissão">Linhas de Transmissão</SelectItem>
                  <SelectItem value="Metrôs">Metrôs</SelectItem>
                  <SelectItem value="Movimentações de Terra">Movimentações de Terra</SelectItem>
                  <SelectItem value="Oleodutos e Gasodutos">Oleodutos e Gasodutos</SelectItem>
                  <SelectItem value="Pontes e Viadutos">Pontes e Viadutos</SelectItem>
                  <SelectItem value="Portos">Portos</SelectItem>
                  <SelectItem value="Rodovias">Rodovias</SelectItem>
                  <SelectItem value="Saneamento">Saneamento</SelectItem>
                  <SelectItem value="Shopping Centers">Shopping Centers</SelectItem>
                  <SelectItem value="Túneis">Túneis</SelectItem>
                  <SelectItem value="Usinas Hidrelétricas Barragens">Usinas Hidrelétricas Barragens</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-lg font-medium">{project.sector || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'exxataActivities':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atuação Exxata</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                'Administração Contratual Backoffice',
                'Administração Contratual In Loco',
                'Agente de Confiança',
                'Assistência Técnica em Arbitragem',
                'Assistência Técnica em Justiça',
                'Negociações, Conciliações e Mediações',
                'Apoio em Licitações e Concorrências',
                'Laudos e Pareceres Técnicos',
                'Optikon Exxata',
              ].map((opt) => {
                const selected = Array.isArray(project.exxataActivities) && project.exxataActivities.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    disabled={!canEdit}
                    onClick={() => {
                      const prev = Array.isArray(project.exxataActivities) ? project.exxataActivities : [];
                      const next = prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt];
                      updateProject(project.id, { exxataActivities: next });
                    }}
                    className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                      selected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {Array.isArray(project.exxataActivities) && project.exxataActivities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {project.exxataActivities.map((act) => (
                  <Badge key={act} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {act}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'progress':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Prazo</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit && (
              <div className="flex items-center gap-3 mb-2">
                <Input 
                  type="number" 
                  defaultValue={Number(project.progress || 0)} 
                  onBlur={(e) => updateProject(project.id, { progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                  className="w-24" 
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
            <div className="text-2xl font-bold">{Number(project.progress || 0)}%</div>
            <Progress value={Number(project.progress || 0)} className="h-2 mt-2" />
          </CardContent>
        </Card>
      );
      
    case 'contractValue':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Contrato</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input 
                defaultValue={project.contractValue} 
                onBlur={(e) => updateProject(project.id, { contractValue: e.target.value })} 
              />
            ) : (
              <div className="text-2xl font-bold">{project.contractValue}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Contrato assinado</p>
          </CardContent>
        </Card>
      );
      
    case 'hourlyRate':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Homem-Hora</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input 
                type="number"
                step="0.01"
                min="0"
                defaultValue={project.hourlyRate || ''} 
                onBlur={(e) => updateProject(project.id, { hourlyRate: e.target.value })} 
                placeholder="Ex.: 150.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {project.hourlyRate ? `R$ ${Number(project.hourlyRate).toFixed(2).replace('.', ',')}` : '—'}
              </div>
            )}
          </CardContent>
        </Card>
      );
      
    case 'disputedAmount':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Discussão</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input 
                type="number"
                step="0.01"
                min="0"
                defaultValue={project.disputedAmount || ''} 
                onBlur={(e) => updateProject(project.id, { disputedAmount: e.target.value })} 
                placeholder="Ex.: 50000.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {project.disputedAmount ? `R$ ${Number(project.disputedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </div>
            )}
          </CardContent>
        </Card>
      );
      
    case 'billingProgress':
      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso em Faturamento</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.billingProgress || 0)} 
                    onBlur={(e) => updateProject(project.id, { billingProgress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.billingProgress || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-exxata-red transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.billingProgress || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'location':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localização</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input
                defaultValue={project.location || ''}
                onBlur={(e) => updateProject(project.id, { location: e.target.value })}
              />
            ) : (
              <div className="text-lg font-medium">{project.location || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'period':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Início</label>
                  <Input type="date" defaultValue={project.startDate || ''} onBlur={(e) => updateProject(project.id, { startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Fim</label>
                  <Input type="date" defaultValue={project.endDate || ''} onBlur={(e) => updateProject(project.id, { endDate: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="text-lg font-medium">{(project.startDate || '—') + ' — ' + (project.endDate || '—')}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'description':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descrição do Projeto</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <textarea
                defaultValue={project.description || ''}
                onBlur={(e) => updateProject(project.id, { description: e.target.value })}
                className="w-full min-h-[100px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{project.description || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'team':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe do Projeto</CardTitle>
            {headerActions}
          </CardHeader>
        <CardContent className="p-6 pt-0">
          {Array.isArray(project.team) && project.team.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.team.map((u) => (
                <Badge key={u.id} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                  {u.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum membro adicionado.</p>
          )}
          {canEdit && (
            <p className="text-xs text-slate-500 mt-2">Gerencie a equipe na aba "Equipe".</p>
          )}
        </CardContent>
        </Card>
      );

    case 'contractSummary':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Título do Contrato</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input
                defaultValue={project.contractSummary || ''}
                onBlur={(e) => updateProject(project.id, { contractSummary: e.target.value })}
                placeholder="Ex.: CT - 684N"
              />
            ) : (
              <div className="text-sm">{project.contractSummary || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{type}</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-lg font-medium">Card: {type}</div>
            <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
          </CardContent>
        </Card>
      );
  }
}
