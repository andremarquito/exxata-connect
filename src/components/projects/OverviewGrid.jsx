import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { 
  BarChart3, DollarSign, MapPin, Calendar, Users, Plus, X, Edit3
} from 'lucide-react';

// import '@/styles/grid-layout.css'; // Temporariamente comentado para debug

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const CARD_CATALOG = [
  { type: 'billingProgress', label: 'Progresso em Faturamento', icon: BarChart3 },
  { type: 'progress', label: 'Progresso de Prazo', icon: BarChart3 },
  { type: 'contractValue', label: 'Valor do Contrato', icon: DollarSign },
  { type: 'exxataActivities', label: 'Atuação Exxata', icon: Edit3 },
  { type: 'sector', label: 'Setor de Atuação', icon: MapPin },
  { type: 'location', label: 'Localização', icon: MapPin },
  { type: 'period', label: 'Período', icon: Calendar },
  { type: 'description', label: 'Descrição do Projeto', icon: Edit3 },
  { type: 'hourlyRate', label: 'Valor do Homem-Hora', icon: DollarSign },
  { type: 'disputedAmount', label: 'Valor em Discussão', icon: DollarSign },
  { type: 'contractSummary', label: 'Título do Contrato', icon: Edit3 },
];

function getDefaultSize(type) {
  switch (type) {
    case 'description':
    case 'exxataActivities':
      return { w: 6, h: 3 };
    case 'period':
    case 'contractSummary':
    case 'sector':
      return { w: 4, h: 2 };
    default:
      return { w: 3, h: 2 }; // cards numéricos/percentuais
  }
}

export default function OverviewGrid({ project, user, canEdit, updateProject, updateProjectBackend }) {
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const isCollaborator = userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant';
  const canManage = isAdmin || isManager;
  const [isEditing, setIsEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  const config = useMemo(() => {
    return project?.overviewConfig && typeof project.overviewConfig === 'object'
      ? project.overviewConfig
      : { widgets: [], layouts: {} };
  }, [project]);

  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const layouts = (config.layouts && typeof config.layouts === 'object') ? config.layouts : {};

  const existingTypes = new Set(widgets.map(w => w.type));
  const availableToAdd = CARD_CATALOG.filter(c => !existingTypes.has(c.type));

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
          <Button onClick={() => setShowAdd(true)} className="mt-4">
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

  // Função para adicionar widget
  const addWidget = (type) => {
    const id = 'w_' + Math.floor(Date.now() + Math.random()*1000);
    const base = getDefaultSize(type);
    const nextWidgets = [...widgets, { id, type }];

    // Construir layouts por breakpoint
    const nextLayouts = { ...layouts };
    Object.keys(cols).forEach(bp => {
      const arr = Array.isArray(nextLayouts[bp]) ? [...nextLayouts[bp]] : [];
      const maxCols = cols[bp] || 12;
      const w = Math.min(base.w, maxCols);
      arr.push({ i: id, x: 0, y: Infinity, w, h: base.h });
      nextLayouts[bp] = arr;
    });

    setShowAdd(false);

    // Salvar no backend
    updateProject(project.id, { overviewConfig: { widgets: nextWidgets, layouts: nextLayouts } });
  };

  return (
    <div>
      {/* Controles de edição para admin e gerente */}
      {canManage && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Card
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Cards
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(false)} className="bg-red-600 hover:bg-red-700">
                Finalizar Edição
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Grid responsivo */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={90}
        isDraggable={isEditing && canManage}
        isResizable={isEditing && canManage}
        onLayoutChange={(layout, allLayouts) => {
          if (isEditing) {
            const next = { ...config, layouts: allLayouts };
            // Usar updateProjectBackend para salvar no Supabase
            updateProject(project.id, { overviewConfig: next });
          }
        }}
        draggableHandle=".drag-handle"
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            {renderCard(widget, isEditing, updateProject, project, canEdit)}
          </div>
        ))}
      </ResponsiveGridLayout>

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
function renderCard(widget, isEditing, updateProject, project, canEdit) {
  const type = widget.type;
  
  const removeWidget = (id) => {
    const currentConfig = project?.overviewConfig || { widgets: [], layouts: {} };
    const nextWidgets = currentConfig.widgets.filter(w => w.id !== id);
    const nextLayouts = {};
    Object.keys(cols).forEach(bp => {
      const arr = Array.isArray(currentConfig.layouts[bp]) ? currentConfig.layouts[bp].filter(l => l.i !== id) : [];
      nextLayouts[bp] = arr;
    });
    // Salvar no backend
    updateProject(project.id, { overviewConfig: { widgets: nextWidgets, layouts: nextLayouts } });
  };
  
  const headerActions = isEditing ? (
    <button
      type="button"
      className="text-slate-400 hover:text-slate-600"
      onClick={() => removeWidget(widget.id)}
      title="Remover"
    >
      <X className="h-4 w-4" />
    </button>
  ) : null;

  switch (type) {
    case 'progress':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Progresso de Prazo</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Valor do Contrato</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <Input 
                type="number"
                step="0.01"
                min="0"
                defaultValue={project.contract_value || project.contractValue || ''} 
                onBlur={(e) => updateProject(project.id, { contract_value: e.target.value })} 
                placeholder="Ex.: 15000000.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {(project.contract_value || project.contractValue) 
                  ? `R$ ${Number(project.contract_value || project.contractValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : '—'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Contrato assinado</p>
          </CardContent>
        </Card>
      );
      
    case 'location':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Localização</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <Input 
                defaultValue={project.location} 
                onBlur={(e) => updateProject(project.id, { location: e.target.value })} 
              />
            ) : (
              <div className="text-lg font-bold">{project.location || '—'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Área de atuação</p>
          </CardContent>
        </Card>
      );
      
    case 'period':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <div className="space-y-2">
                <Input 
                  type="date" 
                  defaultValue={project.startDate || ''} 
                  onBlur={(e) => updateProject(project.id, { startDate: e.target.value })} 
                  className="h-9"
                />
                <Input 
                  type="date" 
                  defaultValue={project.endDate || ''} 
                  onBlur={(e) => updateProject(project.id, { endDate: e.target.value })} 
                  className="h-9"
                />
              </div>
            ) : (
              <div className="text-sm font-medium">
                {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : '--'} - {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : '--'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Duração do contrato</p>
          </CardContent>
        </Card>
      );
      
    case 'description':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle>Descrição do Projeto</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <textarea 
                defaultValue={project.description} 
                onBlur={(e) => updateProject(project.id, { description: e.target.value })} 
                className="w-full min-h-[100px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            ) : (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </CardContent>
        </Card>
      );
      
    case 'team':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <div>
              <CardTitle>Equipe do Projeto</CardTitle>
              <CardDescription>Equipe gerenciada na aba Equipe</CardDescription>
            </div>
            {headerActions}
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-4">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Gerencie a equipe na aba "Equipe"</p>
            </div>
          </CardContent>
        </Card>
      );
      
    case 'hourlyRate':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Valor do Homem-Hora</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Valor em Discussão</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
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
      
    case 'contractSummary':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Título do Contrato</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <Input 
                defaultValue={project.contractSummary || ''} 
                onBlur={(e) => updateProject(project.id, { contractSummary: e.target.value })} 
                placeholder="Ex.: CT - 684N"
              />
            ) : (
              <div className="text-sm font-medium">{project.contractSummary || '—'}</div>
            )}
          </CardContent>
        </Card>
      );
      
    case 'billingProgress':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Progresso em Faturamento</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit && (
              <div className="flex items-center gap-3 mb-2">
                <Input 
                  type="number" 
                  defaultValue={Number(project.billing_progress || project.billingProgress || 0)} 
                  onBlur={(e) => updateProject(project.id, { billing_progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                  className="w-24" 
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
            <div className="text-2xl font-bold">{Number(project.billing_progress || project.billingProgress || 0)}%</div>
            <Progress value={Number(project.billing_progress || project.billingProgress || 0)} className="h-2 mt-2" />
          </CardContent>
        </Card>
      );
      
    case 'sector':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">Setor de Atuação</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <Select 
                value={project.sector || ''} 
                onValueChange={(value) => updateProjectBackend(project.id, { sector: value })}
              >
                <SelectTrigger className="w-full">
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
              <div className="text-sm font-medium">{project.sector || '—'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Segmento de atuação</p>
          </CardContent>
        </Card>
      );
      
    case 'exxataActivities':
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle>Atuação Exxata</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
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
                    const currentActivities = Array.isArray(project.exxata_activities) ? project.exxata_activities : 
                                             Array.isArray(project.exxataActivities) ? project.exxataActivities : [];
                    const selected = currentActivities.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          const newActivities = selected 
                            ? currentActivities.filter(a => a !== opt)
                            : [...currentActivities, opt];
                          updateProject(project.id, { exxataActivities: newActivities });
                        }}
                        className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                          selected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(Array.isArray(project.exxata_activities) ? project.exxata_activities : 
                    Array.isArray(project.exxataActivities) ? project.exxataActivities : []).map((activity) => (
                    <span 
                      key={activity} 
                      className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(project.exxata_activities) ? project.exxata_activities : 
                  Array.isArray(project.exxataActivities) ? project.exxataActivities : []).map((activity, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {activity}
                  </span>
                ))}
                {(!project.exxata_activities || project.exxata_activities.length === 0) && 
                 (!project.exxataActivities || project.exxataActivities.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhuma atividade cadastrada</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
      
    default:
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle">
            <CardTitle className="text-sm font-medium">{type}</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Card: {type}</div>
          </CardContent>
        </Card>
      );
  }
}
