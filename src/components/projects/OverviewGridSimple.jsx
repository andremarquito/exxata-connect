import React, { useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, DollarSign, MapPin, Calendar, Users, Plus, X, Edit3, FileText, GripVertical, Download, Upload, CalendarCheck, Maximize2, Minimize2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CARD_CATALOG = [
  // Campos principais do formulário
  { type: 'name', label: 'Nome do Projeto', icon: FileText },
  { type: 'client', label: 'Cliente Final', icon: FileText },
  { type: 'sector', label: 'Setor de Atuação', icon: Edit3 },
  { type: 'exxataActivities', label: 'Atuação Exxata', icon: Users },
  { type: 'location', label: 'Localização', icon: MapPin },
  { type: 'period', label: 'Período de Vigência', icon: Calendar },
  { type: 'executionPeriod', label: 'Período de Execução', icon: Calendar },
  { type: 'description', label: 'Descrição do Projeto', icon: Edit3 },
  { type: 'team', label: 'Equipe do Projeto', icon: Users },
  // Datas importantes
  { type: 'contractSignatureDate', label: 'Data de Assinatura do Contrato', icon: CalendarCheck },
  { type: 'osSignatureDate', label: 'Data de Assinatura da OS', icon: CalendarCheck },
  { type: 'reportCutoffDate', label: 'Data de Corte do Relatório', icon: CalendarCheck },
  // Financeiro e progresso
  { type: 'contractValue', label: 'Valor do Contrato', icon: DollarSign },
  { type: 'measuredValue', label: 'Valor Medido (R$)', icon: DollarSign },
  { type: 'hourlyRate', label: 'Valor do Homem-Hora', icon: DollarSign },
  { type: 'disputedAmount', label: 'Valor em Discussão', icon: DollarSign },
  { type: 'contractSummary', label: 'Título do Contrato', icon: Edit3 },
  { type: 'progress', label: 'Progresso de Prazo', icon: BarChart3 },
  { type: 'physicalProgressReal', label: 'Progresso de Avanço Físico Real', icon: BarChart3 },
  { type: 'physicalProgressContract', label: 'Progresso de Avanço Físico Contratado', icon: BarChart3 },
  { type: 'billingProgress', label: 'Progresso em Faturamento Real', icon: BarChart3 },
  { type: 'billingProgressContract', label: 'Progresso em Faturamento Contratado', icon: BarChart3 },
];

export default function OverviewGridSimple({ project, user, canEdit, viewAsClient, updateProject, updateProjectBackend, teamMembers }) {
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const isCollaborator = userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant';
  const canManage = !viewAsClient && (isAdmin || isManager);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const importInputRef = useRef(null);
  
  const config = useMemo(() => {
    return project?.overviewConfig && typeof project.overviewConfig === 'object'
      ? project.overviewConfig
      : { widgets: [], layouts: {} };
  }, [project]);

  const widgets = Array.isArray(config.widgets) ? config.widgets : [];
  const existingTypes = new Set(widgets.map(w => w.type));
  const availableToAdd = CARD_CATALOG.filter(c => !existingTypes.has(c.type));

  // Renderizar o modal (usado em ambos os casos: com e sem cards)
  const renderModal = () => {
    if (!showAdd) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-md max-h-[85vh] min-h-[400px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header fixo com botão X */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b px-6 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Adicionar Card</CardTitle>
                <CardDescription className="mt-1">Escolha um card para adicionar à visão geral</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowAdd(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>

          {/* Conteúdo com scroll suave e elegante */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            <CardContent className="space-y-2.5 py-5 px-6">
            {availableToAdd.length > 0 && (
              <Button
                variant="default"
                className="w-full mb-4 bg-exxata-red hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all"
                onClick={addAllWidgets}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Todos ({availableToAdd.length})
              </Button>
            )}
            {availableToAdd.map((card) => {
              const Icon = card.icon;
              return (
                <Button
                  key={card.type}
                  variant="outline"
                  className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  onClick={() => addWidget(card.type)}
                >
                  <Icon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                  {card.label}
                </Button>
              );
            })}
            {availableToAdd.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Todos os cards já foram adicionados
              </p>
            )}
            </CardContent>
          </div>
        </Card>
      </div>
    );
  };

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
  const handleDrop = async (targetId, e) => {
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

    const newConfig = { widgets: list, layouts: {} };

    // Atualizar estado local imediatamente
    updateProject(project.id, { overviewConfig: newConfig });

    // Salvar no backend
    try {
      await updateProjectBackend(project.id, { overviewConfig: newConfig });
    } catch (error) {
      console.error('Erro ao salvar reordenação no backend:', error);
      // Reverter mudança local em caso de erro
      updateProject(project.id, { overviewConfig: config });
      alert('Erro ao salvar reordenação. Tente novamente.');
    }
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  // Função para adicionar widget
  const addWidget = async (type) => {
    const id = 'w_' + Math.floor(Date.now() + Math.random()*1000);
    const nextWidgets = [...widgets, { id, type }];
    const newConfig = { widgets: nextWidgets, layouts: {} };

    // Atualizar estado local imediatamente
    updateProject(project.id, { overviewConfig: newConfig });

    // Salvar no backend
    try {
      await updateProjectBackend(project.id, { overviewConfig: newConfig });
    } catch (error) {
      console.error('Erro ao salvar configuração no backend:', error);
      // Reverter mudança local em caso de erro
      updateProject(project.id, { overviewConfig: config });
      alert('Erro ao salvar configuração. Tente novamente.');
    }

    setShowAdd(false);
  };

  // Função para adicionar todos os widgets disponíveis de uma vez
  const addAllWidgets = async () => {
    if (availableToAdd.length === 0) return;
    
    const newWidgets = availableToAdd.map(card => ({
      id: 'w_' + Math.floor(Date.now() + Math.random()*1000) + '_' + card.type,
      type: card.type
    }));
    const nextWidgets = [...widgets, ...newWidgets];
    const newConfig = { widgets: nextWidgets, layouts: {} };

    // Atualizar estado local imediatamente
    updateProject(project.id, { overviewConfig: newConfig });

    // Salvar no backend
    try {
      await updateProjectBackend(project.id, { overviewConfig: newConfig });
    } catch (error) {
      console.error('Erro ao salvar configuração no backend:', error);
      // Reverter mudança local em caso de erro
      updateProject(project.id, { overviewConfig: config });
      alert('Erro ao salvar configuração. Tente novamente.');
    }

    setShowAdd(false);
  };

  // Função para remover widget
  const removeWidget = async (id) => {
    const nextWidgets = widgets.filter(w => w.id !== id);
    const newConfig = { widgets: nextWidgets, layouts: {} };

    // Atualizar estado local imediatamente
    updateProject(project.id, { overviewConfig: newConfig });

    // Salvar no backend
    try {
      await updateProjectBackend(project.id, { overviewConfig: newConfig });
    } catch (error) {
      console.error('Erro ao salvar configuração no backend:', error);
      // Reverter mudança local em caso de erro
      updateProject(project.id, { overviewConfig: config });
      alert('Erro ao salvar configuração. Tente novamente.');
    }
  };

  // Função para alternar tamanho do widget (1 coluna ou 2 colunas)
  const toggleWidgetSize = async (id) => {
    const nextWidgets = widgets.map(w => {
      if (w.id === id) {
        return {
          ...w,
          size: w.size === 'large' ? 'normal' : 'large'
        };
      }
      return w;
    });
    const newConfig = { widgets: nextWidgets, layouts: {} };

    // Atualizar estado local imediatamente
    updateProject(project.id, { overviewConfig: newConfig });

    // Salvar no backend
    try {
      await updateProjectBackend(project.id, { overviewConfig: newConfig });
    } catch (error) {
      console.error('Erro ao salvar tamanho do card no backend:', error);
      // Reverter mudança local em caso de erro
      updateProject(project.id, { overviewConfig: config });
      alert('Erro ao salvar configuração. Tente novamente.');
    }
  };

  // Função para exportar dados para Excel
  const exportToExcel = () => {
    const exportData = [];
    
    // Adicionar informações básicas do projeto
    exportData.push(['DADOS DO PROJETO', '', '']);
    exportData.push(['Nome do Projeto', project.name || '', '']);
    exportData.push(['ID do Projeto', project.id || '', '']);
    exportData.push(['Data de Exportação', new Date().toLocaleDateString('pt-BR'), '']);
    exportData.push(['', '', '']); // Linha em branco
    
    // Coletar dados de todos os widgets visíveis
    exportData.push(['DADOS DA VISÃO GERAL', '', '']);
    exportData.push(['Campo', 'Valor', 'Tamanho']); // Cabeçalho
    
    widgets.forEach(widget => {
      const cardInfo = CARD_CATALOG.find(c => c.type === widget.type);
      const label = cardInfo?.label || widget.type;
      const size = widget.size === 'large' ? '2 colunas' : '1 coluna';
      
      switch (widget.type) {
        case 'name':
          exportData.push(['Nome do Projeto', project.name || '', size]);
          break;
        case 'client':
          exportData.push(['Cliente Final', project.client || '', size]);
          break;
        case 'sector':
          exportData.push(['Setor de Atuação', project.sector || '', size]);
          break;
        case 'exxataActivities':
          const activities = Array.isArray(project.exxataActivities) 
            ? project.exxataActivities.join(', ') 
            : '';
          exportData.push(['Atuação Exxata', activities, size]);
          break;
        case 'location':
          exportData.push(['Localização', project.location || '', size]);
          break;
        case 'period':
          const period = `${project.startDate || ''} — ${project.endDate || ''}`;
          exportData.push(['Período de Vigência', period, size]);
          exportData.push(['Data de Início', project.startDate || '', size]);
          exportData.push(['Data de Fim', project.endDate || '', size]);
          break;
        case 'executionPeriod':
          const execPeriod = `${project.executionStartDate || ''} — ${project.executionEndDate || ''}`;
          exportData.push(['Período de Execução', execPeriod, size]);
          exportData.push(['Data de Início da Execução', project.executionStartDate || '', size]);
          exportData.push(['Data de Fim da Execução', project.executionEndDate || '', size]);
          break;
        case 'contractSignatureDate':
          exportData.push(['Data de Assinatura do Contrato', project.contractSignatureDate || '', size]);
          break;
        case 'osSignatureDate':
          exportData.push(['Data de Assinatura da OS', project.osSignatureDate || '', size]);
          break;
        case 'reportCutoffDate':
          exportData.push(['Data de Corte do Relatório', project.reportCutoffDate || '', size]);
          break;
        case 'description':
          exportData.push(['Descrição do Projeto', project.description || '', size]);
          break;
        case 'team':
          const teamMembers = Array.isArray(project.team) 
            ? project.team.map(u => u.name).join(', ') 
            : '';
          exportData.push(['Equipe do Projeto', teamMembers, size]);
          break;
        case 'contractValue':
          exportData.push(['Valor do Contrato', project.contractValue || '', size]);
          break;
        case 'measuredValue':
          const measuredValue = project.measuredValue 
            ? `R$ ${Number(project.measuredValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '';
          exportData.push(['Valor Medido (R$)', measuredValue, size]);
          break;
        case 'hourlyRate':
          const hourlyRate = project.hourlyRate 
            ? `US$ ${Number(project.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '';
          exportData.push(['Valor do Homem-Hora', hourlyRate, size]);
          break;
        case 'disputedAmount':
          const disputedAmount = project.disputedAmount 
            ? `R$ ${Number(project.disputedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '';
          exportData.push(['Valor em Discussão', disputedAmount, size]);
          break;
        case 'contractSummary':
          exportData.push(['Título do Contrato', project.contractSummary || '', size]);
          break;
        case 'progress':
          exportData.push(['Progresso de Prazo (%)', `${Number(project.progress || 0)}%`, size]);
          break;
        case 'physicalProgressReal':
          exportData.push(['Progresso de Avanço Físico Real (%)', `${Number(project.physicalProgressReal || 0)}%`, size]);
          break;
        case 'physicalProgressContract':
          exportData.push(['Progresso de Avanço Físico Contratado (%)', `${Number(project.physicalProgressContract || 0)}%`, size]);
          break;
        case 'billingProgress':
          exportData.push(['Progresso em Faturamento Real (%)', `${Number(project.billingProgress || 0)}%`, size]);
          break;
        case 'billingProgressContract':
          exportData.push(['Progresso em Faturamento Contratado (%)', `${Number(project.billingProgressContract || 0)}%`, size]);
          break;
        default:
          exportData.push([label, 'Dados não disponíveis', size]);
      }
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    
    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 25 }, // Coluna A - Labels
      { wch: 50 }, // Coluna B - Valores
      { wch: 12 }  // Coluna C - Tamanho
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

  // Função para importar dados do Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log('📥 Dados importados do Excel:', jsonData);

      // Processar dados importados
      const updates = {};
      const newWidgetsOrder = []; // Para preservar a ordem dos cards
      const widgetSizes = {}; // Para armazenar tamanhos dos cards
      
      // Função auxiliar para processar percentuais
      const parsePercentage = (value) => {
        if (typeof value === 'number') {
          // Se vier como decimal (0.4 = 40%), multiplicar por 100
          if (value > 0 && value <= 1) {
            return Math.round(value * 100);
          }
          // Se vier como número inteiro (40), usar direto
          return Math.round(value);
        }
        // Se vier como string "40%" ou "40"
        const str = String(value).replace('%', '').trim();
        return parseInt(str) || 0;
      };

      // Função auxiliar para processar valores monetários
      const parseCurrency = (value) => {
        if (typeof value === 'number') {
          return value;
        }
        // Remove tudo exceto números, vírgulas e pontos
        const str = String(value).replace(/[^\d,.]/g, '');
        // Substitui vírgula por ponto
        const normalized = str.replace(',', '.');
        return parseFloat(normalized) || 0;
      };
      
      // Mapeamento de labels para tipos de cards
      const labelToCardType = {
        'Nome do Projeto': 'name',
        'Cliente Final': 'client',
        'Setor de Atuação': 'sector',
        'Atuação Exxata': 'exxataActivities',
        'Localização': 'location',
        'Período de Vigência': 'period',
        'Data de Início': 'startDate',
        'Data de Fim': 'endDate',
        'Período de Execução': 'executionPeriod',
        'Data de Início da Execução': 'executionStartDate',
        'Data de Fim da Execução': 'executionEndDate',
        'Descrição do Projeto': 'description',
        'Equipe do Projeto': 'team',
        'Data de Assinatura do Contrato': 'contractSignatureDate',
        'Data de Assinatura da OS': 'osSignatureDate',
        'Data de Corte do Relatório': 'reportCutoffDate',
        'Valor do Contrato': 'contractValue',
        'Valor Medido (R$)': 'measuredValue',
        'Valor do Homem-Hora': 'hourlyRate',
        'Valor em Discussão': 'disputedAmount',
        'Título do Contrato': 'contractSummary',
        'Progresso de Prazo (%)': 'progress',
        'Progresso de Avanço Físico Real (%)': 'physicalProgressReal',
        'Progresso de Avanço Físico Contratado (%)': 'physicalProgressContract',
        'Progresso em Faturamento Real (%)': 'billingProgress',
        'Progresso em Faturamento Contratado (%)': 'billingProgressContract',
      };
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;
        
        const label = String(row[0] || '').trim();
        const value = row[1];
        const sizeValue = row[2]; // Terceira coluna: Tamanho
        
        console.log(`  📋 ${label}: ${value} (tipo: ${typeof value})`);
        
        // Adicionar à ordem dos cards
        const cardType = labelToCardType[label];
        if (cardType) {
          newWidgetsOrder.push(cardType);
          
          // Processar tamanho do card
          if (sizeValue) {
            const sizeStr = String(sizeValue).toLowerCase();
            widgetSizes[cardType] = sizeStr.includes('2') ? 'large' : 'normal';
          }
        }
        
        // Mapear labels para campos do projeto
        if (label === 'Nome do Projeto') {
          updates.name = String(value || '');
        } else if (label === 'Cliente Final') {
          updates.client = String(value || '');
        } else if (label === 'Setor de Atuação') {
          updates.sector = String(value || '');
        } else if (label === 'Localização') {
          updates.location = String(value || '');
        } else if (label === 'Descrição do Projeto') {
          updates.description = String(value || '');
        } else if (label === 'Título do Contrato') {
          updates.contractSummary = String(value || '');
        } else if (label === 'Progresso de Prazo (%)') {
          updates.progress = parsePercentage(value);
        } else if (label === 'Progresso de Avanço Físico Real (%)') {
          updates.physicalProgressReal = parsePercentage(value);
        } else if (label === 'Progresso de Avanço Físico Contratado (%)') {
          updates.physicalProgressContract = parsePercentage(value);
        } else if (label === 'Progresso em Faturamento Real (%)') {
          updates.billingProgress = parsePercentage(value);
        } else if (label === 'Progresso em Faturamento Contratado (%)') {
          updates.billingProgressContract = parsePercentage(value);
        } else if (label === 'Valor do Contrato') {
          updates.contractValue = parseCurrency(value);
        } else if (label === 'Valor Medido (R$)') {
          updates.measuredValue = parseCurrency(value);
        } else if (label === 'Valor do Homem-Hora') {
          updates.hourlyRate = parseCurrency(value);
        } else if (label === 'Valor em Discussão') {
          updates.disputedAmount = parseCurrency(value);
        }
      }

      console.log('💾 Atualizações a serem aplicadas:', updates);
      console.log('📑 Nova ordem dos cards:', newWidgetsOrder);

      if (Object.keys(updates).length === 0 && newWidgetsOrder.length === 0) {
        alert('Nenhum dado válido encontrado no arquivo. Verifique se o formato está correto.');
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
        return;
      }

      // Atualizar a ordem dos cards se houver
      if (newWidgetsOrder.length > 0) {
        const newWidgets = newWidgetsOrder.map(type => {
          // Tentar encontrar widget existente para manter o ID
          const existing = widgets.find(w => w.type === type);
          if (existing) {
            // Atualizar tamanho se foi especificado no Excel
            return {
              ...existing,
              size: widgetSizes[type] || existing.size || 'normal'
            };
          }
          // Criar novo widget se não existir
          return {
            id: 'w_' + Math.floor(Date.now() + Math.random()*1000) + '_' + type,
            type: type,
            size: widgetSizes[type] || 'normal'
          };
        });

        const newConfig = { widgets: newWidgets, layouts: {} };
        updates.overviewConfig = newConfig;
        
        console.log('🔄 Nova configuração de cards:', newConfig);
      }

      // Atualizar projeto no estado local
      updateProject(project.id, updates);

      // Salvar no Supabase
      await updateProjectBackend(project.id, updates);

      console.log('✅ Dados salvos com sucesso!');
      const message = `Dados importados com sucesso!\n${Object.keys(updates).length} campos atualizados.${newWidgetsOrder.length > 0 ? `\n${newWidgetsOrder.length} cards reordenados.` : ''}`;
      alert(message);
      
      // Limpar input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ Erro ao importar Excel:', error);
      alert('Erro ao importar arquivo. Verifique se o formato está correto.\n\nDetalhes: ' + error.message);
      
      // Limpar input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  // Placeholder para quando não há cards configurados
  if (widgets.length === 0) {
    return (
      <>
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
        </div>
        {renderModal()}
      </>
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
        
        {/* Botões de exportar e importar sempre visíveis quando há dados */}
        {widgets.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => importInputRef.current?.click()}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Grid simples responsivo alinhado ao formulário (2 colunas em md, espaçamento gap-4) */}
      <div className="grid md:grid-cols-2 gap-4 pb-8">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(widget.id, e)}
            onDragOver={(e) => handleDragOver(widget.id, e)}
            onDrop={(e) => handleDrop(widget.id, e)}
            onDragEnd={handleDragEnd}
            className={`
              ${widget.size === 'large' ? 'md:col-span-2' : 'md:col-span-1'}
              ${dragOverId === widget.id ? 'ring-2 ring-exxata-red/40 rounded-lg' : ''}
            `}
            title={isEditing ? 'Arraste para reordenar' : undefined}
          >
            {renderWidgetCard(widget, isEditing, removeWidget, toggleWidgetSize, updateProjectBackend, project, canEdit, teamMembers)}
          </div>
        ))}
      </div>

      {/* Modal para adicionar cards */}
      {renderModal()}
    </div>
  );
}

// Função para renderizar cada tipo de card
function renderWidgetCard(widget, isEditing, removeWidget, toggleWidgetSize, updateProjectBackend, project, canEdit, teamMembers) {
  const type = widget.type;
  
  const headerActions = isEditing ? (
    <div className="flex items-center gap-2 select-none">
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 transition-colors"
        onClick={() => toggleWidgetSize(widget.id)}
        title={widget.size === 'large' ? 'Reduzir para 1 coluna' : 'Expandir para 2 colunas'}
      >
        {widget.size === 'large' ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
      <GripVertical className="h-4 w-4 text-slate-400 cursor-move" title="Arraste para reordenar" />
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 transition-colors"
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
                onBlur={(e) => updateProjectBackend(project.id, { name: e.target.value })}
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
                onBlur={(e) => updateProjectBackend(project.id, { client: e.target.value })}
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
              <Select value={project.sector || ''} onValueChange={(v) => updateProjectBackend(project.id, { sector: v })}>
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
      const allActivities = [
        'Administração Contratual Backoffice',
        'Administração Contratual In Loco',
        'Agente de Confiança',
        'Assistência Técnica em Arbitragem',
        'Assistência Técnica em Justiça',
        'Negociações, Conciliações e Mediações',
        'Apoio em Licitações e Concorrências',
        'Laudos e Pareceres Técnicos',
        'Optikon Exxata',
      ];
      
      const selectedActivities = Array.isArray(project.exxataActivities) 
        ? project.exxataActivities.filter(act => allActivities.includes(act))
        : [];
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atuação Exxata</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit && (
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {allActivities.map((opt) => {
                  const selected = selectedActivities.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        const prev = Array.isArray(project.exxataActivities) ? project.exxataActivities : [];
                        const next = prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt];
                        updateProjectBackend(project.id, { exxataActivities: next });
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
            )}
            {selectedActivities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedActivities.map((act) => (
                  <Badge key={act} variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    {act}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma atuação selecionada</p>
            )}
          </CardContent>
        </Card>
      );

    case 'progress':
      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Prazo</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.progress || 0)} 
                    onBlur={(e) => updateProjectBackend(project.id, { progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.progress || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-exxata-red transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.progress || 0)}%` }}
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
                onBlur={(e) => updateProjectBackend(project.id, { contractValue: e.target.value })} 
                placeholder="Ex.: 1500000.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {project.contractValue ? `R$ ${Number(project.contractValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Contrato assinado</p>
          </CardContent>
        </Card>
      );
      
    case 'measuredValue':
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Medido (R$)</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input 
                type="number"
                step="0.01"
                min="0"
                defaultValue={project.measuredValue || ''} 
                onBlur={(e) => updateProjectBackend(project.id, { measuredValue: e.target.value })} 
                placeholder="Ex.: 850000.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {project.measuredValue ? `R$ ${Number(project.measuredValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Valor medido do projeto</p>
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
                onBlur={(e) => updateProjectBackend(project.id, { hourlyRate: e.target.value })} 
                placeholder="Ex.: 150.00"
              />
            ) : (
              <div className="text-2xl font-bold">
                {project.hourlyRate ? `US$ ${Number(project.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
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
                onBlur={(e) => updateProjectBackend(project.id, { disputedAmount: e.target.value })} 
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
            <CardTitle className="text-sm font-medium">Progresso em Faturamento Real</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.billingProgress || 0)} 
                    onBlur={(e) => updateProjectBackend(project.id, { billingProgress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.billingProgress || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.billingProgress || 0)}%`, backgroundColor: '#4284D7' }}
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

    case 'physicalProgressReal':
      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Avanço Físico Real</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.physicalProgressReal || 0)} 
                    onBlur={(e) => updateProjectBackend(project.id, { physicalProgressReal: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.physicalProgressReal || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.physicalProgressReal || 0)}%`, backgroundColor: '#4284D7' }}
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

    case 'physicalProgressContract':
      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso de Avanço Físico Contratado</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.physicalProgressContract || 0)} 
                    onBlur={(e) => updateProjectBackend(project.id, { physicalProgressContract: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.physicalProgressContract || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.physicalProgressContract || 0)}%`, backgroundColor: '#D51D07' }}
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

    case 'billingProgressContract':
      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso em Faturamento Contratado</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              {canEdit && (
                <div className="flex items-center gap-3 mb-4">
                  <Input 
                    type="number" 
                    defaultValue={Number(project.billingProgressContract || 0)} 
                    onBlur={(e) => updateProjectBackend(project.id, { billingProgressContract: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} 
                    className="w-24" 
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-center">{Number(project.billingProgressContract || 0)}%</div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${Number(project.billingProgressContract || 0)}%`, backgroundColor: '#D51D07' }}
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
                onBlur={(e) => updateProjectBackend(project.id, { location: e.target.value })}
              />
            ) : (
              <div className="text-lg font-medium">{project.location || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'period':
      const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período de Vigência</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Início</label>
                  <Input type="date" defaultValue={project.startDate || ''} onBlur={(e) => updateProjectBackend(project.id, { startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Fim</label>
                  <Input type="date" defaultValue={project.endDate || ''} onBlur={(e) => updateProjectBackend(project.id, { endDate: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="text-sm font-medium">{formatDate(project.endDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'executionPeriod':
      const formatDateExec = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período de Execução</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Início</label>
                  <Input type="date" defaultValue={project.executionStartDate || ''} onBlur={(e) => updateProjectBackend(project.id, { executionStartDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Fim</label>
                  <Input type="date" defaultValue={project.executionEndDate || ''} onBlur={(e) => updateProjectBackend(project.id, { executionEndDate: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{formatDateExec(project.executionStartDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="text-sm font-medium">{formatDateExec(project.executionEndDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'contractSignatureDate':
      const formatDateContract = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data de Assinatura do Contrato</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input type="date" defaultValue={project.contractSignatureDate || ''} onBlur={(e) => updateProjectBackend(project.id, { contractSignatureDate: e.target.value })} />
            ) : (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                <p className="text-lg font-medium">{formatDateContract(project.contractSignatureDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'osSignatureDate':
      const formatDateOS = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data de Assinatura da OS</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input type="date" defaultValue={project.osSignatureDate || ''} onBlur={(e) => updateProjectBackend(project.id, { osSignatureDate: e.target.value })} />
            ) : (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                <p className="text-lg font-medium">{formatDateOS(project.osSignatureDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'reportCutoffDate':
      const formatDateReport = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data de Corte do Relatório</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {canEdit ? (
              <Input type="date" defaultValue={project.reportCutoffDate || ''} onBlur={(e) => updateProjectBackend(project.id, { reportCutoffDate: e.target.value })} />
            ) : (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                <p className="text-lg font-medium">{formatDateReport(project.reportCutoffDate)}</p>
              </div>
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
                onBlur={(e) => updateProjectBackend(project.id, { description: e.target.value })}
                className="w-full min-h-[100px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{project.description || '—'}</div>
            )}
          </CardContent>
        </Card>
      );

    case 'team': {
      const members = Array.isArray(teamMembers) && teamMembers.length > 0
        ? teamMembers
        : (Array.isArray(project.team) ? project.team : []);

      return (
        <Card className="h-full">
          <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe do Projeto</CardTitle>
            {headerActions}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const key = member.id || member.user_id || member.email || member.name;
                  const name = member.name || member.email || 'Usuário';
                  const roleLabel = member.role ? ` - ${member.role}` : '';
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className="bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {name}{roleLabel}
                    </Badge>
                  );
                })}
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
    }

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
                onBlur={(e) => updateProjectBackend(project.id, { contractSummary: e.target.value })}
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
