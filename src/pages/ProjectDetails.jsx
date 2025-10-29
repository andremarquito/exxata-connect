import { useParams, useNavigate } from 'react-router-dom';
import IndicatorChart from '@/components/projects/IndicatorChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, Calendar, DollarSign, FileText, MapPin, Users, 
  BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, Brain, 
  Download, Upload, Search, Zap, Target, Shield, ArrowLeft, Settings, UserPlus, FilePlus2,
  Image, File, Table, Trash2, PieChart, LineChart, Plus, Edit3, Palette, X, GripVertical, Copy, Camera,
  ChevronUp, ChevronDown, Check, Copy as CopyIcon, MoreVertical, FileDown, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useState, useEffect, useRef } from 'react';
import OverviewGrid from '@/components/projects/OverviewGridSimple';
import IndicatorsTab from '@/components/projects/IndicatorsTab';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Componente do Modal para Adicionar/Editar Indicador
const IndicatorModalForm = ({ project, indicator, onClose, onSave }) => {
  const formatDatasetsForForm = (list) => {
    if (!Array.isArray(list) || !list.length) {
      return [{ name: '', values: [], colors: [], color: '#8884d8' }];
    }
    return list.map(ds => ({
      ...ds,
      values: Array.isArray(ds.values) 
        ? ds.values.map(v => typeof v === 'string' ? v : String(v))
        : (typeof ds.values === 'number' 
          ? [String(ds.values)]
          : (ds.values || '').split(',').map(v => v.trim())),
      colors: Array.isArray(ds.colors) ? ds.colors : [],
    }));
  };

  const [title, setTitle] = useState(indicator?.title || '');
  const [chartType, setChartType] = useState(indicator?.chart_type || 'bar');
  const [labels, setLabels] = useState(indicator?.labels?.join(', ') || '');
  const [valueFormat, setValueFormat] = useState(indicator?.options?.valueFormat || 'number');
  const [observations, setObservations] = useState(indicator?.observations || '');
  const [datasets, setDatasets] = useState(() => formatDatasetsForForm(indicator?.datasets));
  const importInputRef = useRef(null);
  const [showDataLabels, setShowDataLabels] = useState(indicator?.options?.showDataLabels ?? true);

  useEffect(() => {
    setTitle(indicator?.title || '');
    setChartType(indicator?.chart_type || 'bar');
    setLabels(Array.isArray(indicator?.labels) ? indicator.labels.join(', ') : (indicator?.labels || ''));
    setValueFormat(indicator?.options?.valueFormat || 'number');
    setObservations(indicator?.observations || '');
    setShowDataLabels(indicator?.options?.showDataLabels ?? true);
    
    let formattedDatasets = formatDatasetsForForm(indicator?.datasets);
    
    // Para gráficos de pizza/rosca, garantir que temos valores e cores suficientes para cada rótulo
    if ((indicator?.chart_type === 'pie' || indicator?.chart_type === 'doughnut') && indicator?.labels) {
      const labelCount = indicator.labels.length;
      if (formattedDatasets[0]) {
        // Garantir que values e colors tenham o mesmo tamanho que labels
        const currentValues = formattedDatasets[0].values || [];
        const currentColors = formattedDatasets[0].colors || [];
        
        formattedDatasets[0].values = [...currentValues];
        formattedDatasets[0].colors = [...currentColors];
        
        // Preencher com valores padrão se necessário
        while (formattedDatasets[0].values.length < labelCount) {
          formattedDatasets[0].values.push(0);
        }
        while (formattedDatasets[0].colors.length < labelCount) {
          formattedDatasets[0].colors.push('#8884d8');
        }
      }
    }
    
    setDatasets(formattedDatasets);
  }, [indicator?.id]);

  // Atualizar datasets quando labels ou chartType mudam para gráficos de pizza/rosca
  useEffect(() => {
    if (chartType === 'pie' || chartType === 'doughnut') {
      const labelArray = labels.split(',').map(l => l.trim()).filter(Boolean);
      if (labelArray.length > 0) {
        setDatasets(prevDatasets => {
          const newDatasets = [...prevDatasets];
          if (!newDatasets[0]) {
            newDatasets[0] = { name: '', values: [], colors: [] };
          }
          
          // Garantir que values e colors tenham o mesmo tamanho que labels
          const currentValues = newDatasets[0].values || [];
          const currentColors = newDatasets[0].colors || [];
          
          newDatasets[0].values = [...currentValues];
          newDatasets[0].colors = [...currentColors];
          
          // Preencher com valores padrão se necessário
          while (newDatasets[0].values.length < labelArray.length) {
            newDatasets[0].values.push(0);
          }
          while (newDatasets[0].colors.length < labelArray.length) {
            newDatasets[0].colors.push('#8884d8');
          }
          
          // Remover valores extras se labels foram reduzidos
          if (newDatasets[0].values.length > labelArray.length) {
            newDatasets[0].values = newDatasets[0].values.slice(0, labelArray.length);
          }
          if (newDatasets[0].colors.length > labelArray.length) {
            newDatasets[0].colors = newDatasets[0].colors.slice(0, labelArray.length);
          }
          
          return newDatasets;
        });
      }
    }
  }, [labels, chartType]);

  const handleDatasetChange = (index, field, value) => {
    const newDatasets = [...datasets];
    newDatasets[index][field] = value;
    setDatasets(newDatasets);
  };

  const getValuesArray = (ds) => Array.isArray(ds.values)
    ? [...ds.values]
    : (typeof ds.values === 'string'
      ? ds.values.split(',').map(v => parseFloat(v.trim()) || 0)
      : []);

  const labelsArray = labels.split(',').map(l => l.trim()).filter(Boolean);

  const addLabelRow = () => {
    const nextLabel = `Rótulo ${labelsArray.length + 1}`;
    const newLabels = [...labelsArray, nextLabel];
    setLabels(newLabels.join(', '));
    setDatasets(prev => prev.map(ds => {
      const vals = getValuesArray(ds);
      return { ...ds, values: [...vals, 0] };
    }));
  };

  const removeLabelRow = (rowIdx) => {
    if (rowIdx < 0 || rowIdx >= labelsArray.length) return;
    const newLabels = labelsArray.filter((_, i) => i !== rowIdx);
    setLabels(newLabels.join(', '));
    setDatasets(prev => prev.map(ds => {
      const vals = getValuesArray(ds);
      const newVals = vals.filter((_, i) => i !== rowIdx);
      return { ...ds, values: newVals };
    }));
  };

  const updateLabelAtIndex = (rowIdx, value) => {
    const newLabels = [...labelsArray];
    newLabels[rowIdx] = value;
    setLabels(newLabels.join(', '));
  };

  const updateCellValue = (dsIdx, rowIdx, value) => {
    setDatasets(prev => {
      const copy = [...prev];
      const ds = { ...copy[dsIdx] };
      const vals = getValuesArray(ds);
      while (vals.length < Math.max(labelsArray.length, rowIdx + 1)) vals.push(0);
      vals[rowIdx] = parseFloat(value) || 0;
      ds.values = vals;
      copy[dsIdx] = ds;
      return copy;
    });
  };

  const buildFormData = () => ({
    title: title.trim(),
    chart_type: chartType,
    labels: labels.split(',').map(l => l.trim()).filter(Boolean),
    datasets: datasets.map(ds => ({
      ...ds,
      values: typeof ds.values === 'string' ? ds.values.split(',').map(v => parseFloat(v.trim()) || 0) : Array.isArray(ds.values) ? ds.values : []
    })),
    options: {
      ...indicator?.options,
      valueFormat,
      showDataLabels
    },
    observations: observations.trim(),
  });

  const addDataset = () => {
    setDatasets([...datasets, { name: '', values: '', color: '#82ca9d' }]);
  };

  const removeDataset = (index) => {
    const newDatasets = datasets.filter((_, i) => i !== index);
    setDatasets(newDatasets);
  };

  const triggerImport = () => {
    importInputRef.current?.click();
  };

  const handleExport = () => {
    try {
      const data = buildFormData();
      const exportRow = {
        'Título': data.title,
        'Tipo de Gráfico': data.chart_type,
        'Formato de Valor': data.options?.valueFormat === 'currency' ? 'Monetário BRL' : data.options?.valueFormat === 'currency-usd' ? 'Monetário USD' : data.options?.valueFormat === 'percentage' ? 'Percentual' : 'Numérico',
        'Rótulos': data.labels.join(', '),
        'Conjunto de Dados': data.datasets.map(ds => `${ds.name}: ${ds.values.join(', ')}`).join(' | '),
        'Cores': (data.chart_type === 'pie' || data.chart_type === 'doughnut')
          ? (data.datasets[0]?.colors?.join(', ') || '')
          : data.datasets.map(ds => ds.color).join(', '),
      };

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([exportRow]);
      ws['!cols'] = [
        { wch: 30 },
        { wch: 18 },
        { wch: 40 },
        { wch: 60 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Indicador');
      const fileName = `indicador_${data.title.replace(/[^a-zA-Z0-9]/g, '_') || 'sem_titulo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar indicador:', error);
      alert('Erro ao exportar este indicador.');
    }
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      if (!rows.length) {
        alert('Arquivo vazio ou inválido.');
        return;
      }

      const row = rows[0];
      const importedTitle = row['Título'] || row['title'] || '';
      const importedChart = row['Tipo de Gráfico'] || row['chart_type'] || chartType;
      const formatStr = (row['Formato de Valor'] || row['value_format'] || '').toLowerCase();
      const importedValueFormat = formatStr.includes('usd') || formatStr.includes('dólar') || formatStr.includes('dolar') ? 'currency-usd' : formatStr.includes('monetário') || formatStr.includes('monetario') || formatStr.includes('brl') ? 'currency' : formatStr.includes('percentual') ? 'percentage' : 'number';
      const importedLabels = row['Rótulos'] || row['labels'] || '';
      const importedDatasetStr = row['Conjunto de Dados'] || row['datasets'] || '';
      const importedColors = row['Cores'] || row['colors'] || '';

      if (!importedTitle) {
        alert('Título não encontrado no arquivo.');
        return;
      }

      const parsedLabels = importedLabels
        ? importedLabels.split(',').map(l => l.trim()).filter(Boolean)
        : [];

      const colorParts = importedColors ? importedColors.split(',').map(c => c.trim()) : [];
      let parsedDatasets = [];
      if (importedDatasetStr) {
        parsedDatasets = importedDatasetStr.split(' | ').map((part, index) => {
          const [name, valuesStr] = part.split(':');
          const valuesArray = valuesStr
            ? valuesStr.split(',').map(v => parseFloat(v.trim()) || 0)
            : [];
          
          if (importedChart === 'pie') {
            // Para pizza, as cores estão no array colorParts diretamente
            return {
              name: name?.trim() || `Série ${index + 1}`,
              values: valuesArray.join(', '),
              colors: colorParts.length > 0 ? colorParts : undefined,
            };
          } else {
            // Para outros gráficos, cores por dataset
            return {
              name: name?.trim() || `Série ${index + 1}`,
              values: valuesArray.join(', '),
              color: colorParts[index] || '#8884d8',
            };
          }
        });
      }

      setTitle(importedTitle);
      setChartType(importedChart);
      setValueFormat(importedValueFormat);
      setLabels(parsedLabels.join(', '));
      setDatasets(formatDatasetsForForm(parsedDatasets));
    } catch (error) {
      console.error('Erro ao importar indicador:', error);
      alert('Erro ao importar arquivo. Verifique se é um Excel válido.');
    } finally {
      event.target.value = null;
    }
  };

  const handleSave = async () => {
    const processedData = buildFormData();
    onSave(processedData);
  };

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <span className="text-sm text-muted-foreground">Edite manualmente ou importe/exporte via Excel.</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={triggerImport} className="gap-1">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Gráfico</label>
        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="w-full p-2 border rounded">
          <option value="bar">Barra</option>
          <option value="bar-horizontal">Barra Horizontal</option>
          <option value="line">Linha</option>
          <option value="pie">Pizza</option>
          <option value="doughnut">Rosca</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Formato de Valor</label>
        <select value={valueFormat} onChange={(e) => setValueFormat(e.target.value)} className="w-full p-2 border rounded">
          <option value="number">Numérico (1.234,56)</option>
          <option value="currency">Monetário BRL (R$ 1.234,56)</option>
          <option value="currency-usd">Monetário USD ($ 1,234.56)</option>
          <option value="percentage">Percentual (45,6%)</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="showDataLabels"
          type="checkbox"
          className="h-4 w-4"
          checked={showDataLabels}
          onChange={(e) => setShowDataLabels(e.target.checked)}
        />
        <label htmlFor="showDataLabels" className="text-sm font-medium">Exibir rótulos de dados</label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rótulos (separados por vírgula)</label>
        <input value={labels} onChange={(e) => setLabels(e.target.value)} className="w-full p-2 border rounded" placeholder="Ex: Jan, Fev, Mar"/>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Análise Exxata</label>
        <textarea 
          value={observations} 
          onChange={(e) => setObservations(e.target.value)} 
          className="w-full p-2 border rounded min-h-[80px] resize-y" 
          placeholder="Adicione observações sobre este indicador..."
        />
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">{(chartType === 'pie' || chartType === 'doughnut') ? 'Cores das Fatias' : 'Conjunto de Dados'}</h3>
        {(chartType === 'pie' || chartType === 'doughnut') ? (
          // Para gráficos de pizza, mostrar valores e cores por rótulo
          <div className="space-y-2">
            {labels.split(',').map((label, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded">
                <div className="md:col-span-2">
                  <span className="text-sm font-medium">{label.trim()}</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Valor"
                  value={datasets[0]?.values?.[index] || ''} 
                  onChange={(e) => {
                    const newValues = [...(datasets[0]?.values || [])];
                    newValues[index] = parseFloat(e.target.value) || 0;
                    handleDatasetChange(0, 'values', newValues);
                  }}
                  className="p-2 border rounded text-sm"
                />
                <input 
                  type="color" 
                  value={datasets[0]?.colors?.[index] || '#8884d8'} 
                  onChange={(e) => {
                    const newColors = [...(datasets[0]?.colors || [])];
                    newColors[index] = e.target.value;
                    handleDatasetChange(0, 'colors', newColors);
                  }}
                  className="p-1 h-10 w-full border rounded"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 border w-48 text-left">Rótulo</th>
                    {datasets.map((ds, index) => (
                      <th key={index} className="p-2 border text-left">
                        <div className="flex items-center gap-2">
                          <input
                            value={ds.name}
                            onChange={(e) => handleDatasetChange(index, 'name', e.target.value)}
                            placeholder={`Série ${index + 1}`}
                            className="p-1 border rounded w-full"
                          />
                          <input
                            type="color"
                            value={ds.color || '#8884d8'}
                            onChange={(e) => handleDatasetChange(index, 'color', e.target.value)}
                            className="h-8 w-10 border rounded"
                          />
                          {datasets.length > 1 && (
                            <button onClick={() => removeDataset(index)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labelsArray.length === 0 ? (
                    <tr>
                      <td className="p-3 border text-slate-500" colSpan={1 + datasets.length}>Nenhum rótulo. Adicione linhas abaixo.</td>
                    </tr>
                  ) : (
                    labelsArray.map((lbl, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="p-2 border">
                          <div className="flex items-center gap-2">
                            <input
                              value={lbl}
                              onChange={(e) => updateLabelAtIndex(rowIdx, e.target.value)}
                              className="w-full p-1 border rounded"
                            />
                            <button onClick={() => removeLabelRow(rowIdx)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
                          </div>
                        </td>
                        {datasets.map((ds, dsIdx) => {
                          const vals = getValuesArray(ds);
                          const val = typeof vals[rowIdx] === 'number' ? vals[rowIdx] : parseFloat(vals[rowIdx]) || 0;
                          return (
                            <td key={`${rowIdx}-${dsIdx}`} className="p-2 border">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-1 border rounded"
                                value={val}
                                onChange={(e) => updateCellValue(dsIdx, rowIdx, e.target.value)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={addLabelRow}>Adicionar Linha</Button>
              <Button variant="outline" size="sm" onClick={addDataset}>Adicionar Série</Button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </>
  );
};

export function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, hasPermission } = useAuth();
  const { users } = useUsers();
  const [activeTab, setActiveTab] = useState('preliminary');
  const [dragOverSource, setDragOverSource] = useState(null); // 'client' | 'exxata' | null
  const [searchClient, setSearchClient] = useState('');
  const [searchExxata, setSearchExxata] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [exxataPage, setExxataPage] = useState(1);
  const [conductsLoading, setConductsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [loadedProjectMembers, setLoadedProjectMembers] = useState([]);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const indicatorsContainerRef = useRef(null);
  const conductsImportInputRef = useRef(null);
  const panoramaImportInputRef = useRef(null);
  
  // Estado para modo "Visualizar como Cliente"
  const [viewAsClient, setViewAsClient] = useState(false);

  // Filtros do Gantt
  const [activityStatus, setActivityStatus] = useState('all');
  const [activityUser, setActivityUser] = useState('all');
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');

  // Estados para ordenação e edição da tabela
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [dragOverConductId, setDragOverConductId] = useState(null);
  const [conductSortOrder, setConductSortOrder] = useState('none'); // 'none', 'asc', 'desc'

  // Projeto vindo do contexto (persistido em localStorage)
  const { 
    getProjectById, 
    updateProject, 
    updateProjectBackend,
    deleteProject, 
    userCanSeeProject, 
    addProjectMember,
    removeProjectMember,
    getProjectMembers,
    loadProjectMembers, 
    getProjectFiles,
    getFileUrl,
    addProjectActivity, 
    updateProjectActivity, 
    deleteProjectActivity,
    getProjectActivities,
    addProjectIndicator,
    updateProjectIndicator,
    deleteProjectIndicator,
    getProjectIndicators,
    refreshProjects,
    addProjectConduct,
    updateProjectConduct,
    deleteProjectConduct,
    getProjectConducts,
    reorderProjectConducts,
    getProjectPanorama,
    updatePanoramaStatus,
    addPanoramaItem,
    updatePanoramaItem,
    deletePanoramaItem,
    addProjectFile,
    deleteProjectFile,
    duplicateProjectActivity,
  } = useProjects();
  const project = getProjectById(projectId);
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const isCollaborator = userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant';
  
  // Usuários que podem ativar o modo "Visualizar como Cliente"
  const canViewAsClient = isAdmin || isManager || isCollaborator;
  
  // Permissões de edição consideram o modo viewAsClient
  const canEdit = !viewAsClient && (isAdmin || isManager || isCollaborator || hasPermission('edit_projects'));
  // Consultor/Admin/Colaborador podem editar textos da aba Inteligência Humana
  const canManageInsights = !viewAsClient && canEdit;

  // Atividades do projeto (persistidas no contexto)
  const activities = Array.isArray(project?.activities) ? project.activities : [];
  const uniqueUsers = Array.from(new Set(activities.map(a => a.assignedTo).filter(Boolean)));
  
  // Função para ordenar atividades
  const sortActivities = (activities, field, direction) => {
    return [...activities].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // Tratamento especial para customId (ordenação inteligente)
      if (field === 'customId') {
        aValue = String(aValue || '');
        bValue = String(bValue || '');
      }
      // Tratamento especial para datas
      else if (field === 'startDate' || field === 'endDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      // Tratamento para strings
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Comparação final
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Usar localeCompare para strings (incluindo IDs) com ordenação natural
        comparison = aValue.localeCompare(bValue, undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
      } else if (aValue instanceof Date && bValue instanceof Date) {
        // Comparação de datas
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Comparação padrão
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const filteredActivities = activities.filter(a => {
    // Filtro de status
    if (activityStatus !== 'all' && a.status !== activityStatus) return false;
    
    // Filtro de usuário
    if (activityUser !== 'all' && a.assignedTo !== activityUser) return false;
    
    // Filtro de data de início
    if (activityStartDate) {
      const filterStartDate = new Date(activityStartDate);
      const activityStartDateValue = new Date(a.startDate);
      if (activityStartDateValue < filterStartDate) return false;
    }
    
    // Filtro de data de fim
    if (activityEndDate) {
      const filterEndDate = new Date(activityEndDate);
      const activityEndDateValue = new Date(a.endDate);
      if (activityEndDateValue > filterEndDate) return false;
    }
    
    return true;
  });

  const sortedActivities = sortActivities(filteredActivities, sortField, sortDirection);

  const handlePredictiveTextBlur = async (value) => {
    if (!project) return;
    updateProject(project.id, { aiPredictiveText: value });
    try {
      await updateProjectBackend(project.id, { aiPredictiveText: value });
    } catch (error) {
      console.error('Erro ao salvar análise preditiva:', error);
    }
  };

  // Função para obter ID único da atividade (independente da ordenação)
  const getActivityDisplayId = (activity) => {
    if (activity.customId) return activity.customId;
    
    // Encontrar a posição original da atividade no array não ordenado
    const originalIndex = activities.findIndex(a => a.id === activity.id);
    return String(originalIndex + 1).padStart(2, '0');
  };

  // Função para alterar ordenação
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para iniciar edição
  const startEditing = (activity, field) => {
    setEditingActivity(activity.id);
    setEditingField(field);
  };

  // Função para salvar edição
  const saveEdit = async (activityId, field, value) => {
    try {
      await updateProjectActivity(project.id, activityId, { [field]: value });
      setEditingActivity(null);
      setEditingField(null);
    } catch (error) {
      console.error('Erro ao salvar edição:', error);

      // Verificar se é erro de autenticação
      if (error.message?.includes('Auth operation timeout') || error.message?.includes('timeout')) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        // Aqui você poderia redirecionar para login ou tentar refresh da sessão
        return;
      }

      alert('Erro ao salvar. Tente novamente.');
    }
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingActivity(null);
    setEditingField(null);
  };

  // Função para duplicar atividade
  const duplicateActivity = async (activity) => {
    try {
      await duplicateProjectActivity(project.id, activity.id);
      alert(`Atividade "${activity.title}" duplicada com sucesso!`);
    } catch (error) {
      console.error('Erro ao duplicar atividade:', error);
      alert('Erro ao duplicar atividade. Tente novamente.');
    }
  };

  const dayMs = 86400000;
  const parseDate = (d) => {
    const parsed = d ? new Date(d) : new Date();
    return isNaN(parsed) ? new Date() : parsed;
  };

  let defaultStart = parseDate(project?.startDate);
  let defaultEnd = parseDate(project?.endDate);
  if (!project?.endDate || isNaN(defaultEnd)) {
    defaultEnd = addDays(defaultStart, 30);
  }
  const minStart = sortedActivities.length
    ? new Date(Math.min(...sortedActivities.map(a => parseDate(a.startDate))))
    : defaultStart;
  const maxEnd = sortedActivities.length
    ? new Date(Math.max(...sortedActivities.map(a => parseDate(a.endDate))))
    : defaultEnd;
  function startOfWeek(d) {
    const n = new Date(d);
    const day = n.getDay();
    const diff = (day + 6) % 7; // Monday as start
    n.setDate(n.getDate() - diff);
    n.setHours(0, 0, 0, 0);
    return n;
  }
  function addDays(d, days) {
    const n = new Date(d);
    n.setDate(n.getDate() + days);
    return n;
  }
  const rangeStart = startOfWeek(minStart);
  const rangeEnd = addDays(maxEnd, 1); // include last day
  const totalDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / dayMs));
  const weeks = [];
  for (let w = startOfWeek(rangeStart); w <= rangeEnd; w = addDays(w, 7)) {
    weeks.push(new Date(w));
  }
  const today = new Date();
  const showToday = today >= rangeStart && today <= rangeEnd;
  // Mapeamento de cores por status (tolerante a variações: "A fazer", "concluído/a", etc.)
  const statusColorClass = (status) => {
    const s = (status || '').toString().trim().toLowerCase();
    if (s.includes('progresso')) return 'bg-blue-600';
    if (s.includes('conclu')) return 'bg-green-600';
    if (s.includes('fazer')) return 'bg-slate-400';
    return 'bg-slate-400';
  };

  // Atividades: criar nova (apenas Exxata/admin)
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ customId: '', title: '', assignedTo: '', startDate: '', endDate: '', status: 'A Fazer' });
  const canAddActivities = !viewAsClient && user && !(((user?.role || '').toLowerCase() === 'client') || ((user?.role || '').toLowerCase() === 'cliente'));

  const handleCreateActivity = async () => {
    if (!canAddActivities) return;
    if (!newActivity.title || !newActivity.assignedTo || !newActivity.startDate || !newActivity.endDate) return;
    try {
      // Validação simples de datas
      const sd = new Date(newActivity.startDate);
      const ed = new Date(newActivity.endDate);
      if (isNaN(sd) || isNaN(ed) || ed < sd) {
        alert('Datas inválidas. Verifique se a data de fim é posterior à data de início.');
        return;
      }

      // Gerar customId se não fornecido
      let customId = newActivity.customId;
      if (!customId) {
        const existingIds = activities.map(a => a.customId).filter(Boolean);
        const numericIds = existingIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : activities.length + 1;
        customId = String(nextId).padStart(2, '0');
      }

      const activityWithId = { ...newActivity, customId };
      await addProjectActivity(project.id, activityWithId);
      setShowAddActivity(false);
      setNewActivity({ customId: '', title: '', assignedTo: '', startDate: '', endDate: '', status: 'A Fazer' });
    } catch (e) {
      console.error('Erro ao criar atividade:', e);
      alert('Erro ao criar atividade. Tente novamente.');
    }
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

  // Panorama Atual: helpers
  const getPanoramaSection = (key) => {
    const pano = project?.panorama || {};
    const section = pano[key] || {};
    return {
      status: section.status || 'green',
      items: Array.isArray(section.items) ? section.items : [],
    };
  };

  const statusDotClass = (status) => {
    switch (status) {
      case 'green': return 'bg-green-500 border-green-500';
      case 'yellow': return 'bg-yellow-500 border-yellow-500';
      case 'red': return 'bg-red-500 border-red-500';
      default: return 'bg-slate-400 border-slate-400';
    }
  };

  const statusBorderClass = (status) => {
    switch (status) {
      case 'green': return 'border-green-200';
      case 'yellow': return 'border-yellow-200';
      case 'red': return 'border-red-200';
      default: return 'border-slate-200';
    }
  };

  // Condutas: helpers e drag-and-drop
  const addConduct = async () => {
    if (!canManageInsights) return;
    try {
      await addProjectConduct(project.id, {
        text: '',
        urgency: 'Difícil'
      });
    } catch (error) {
      console.error('Erro ao adicionar conduta:', error);
      alert('Erro ao adicionar conduta. Tente novamente.');
    }
  };

  const updateConduct = async (id, patch) => {
    try {
      await updateProjectConduct(project.id, id, patch);
    } catch (error) {
      console.error('Erro ao atualizar conduta:', error);
      alert('Erro ao atualizar conduta. Tente novamente.');
    }
  };

  const deleteConduct = async (id) => {
    try {
      await deleteProjectConduct(project.id, id);
    } catch (error) {
      console.error('Erro ao deletar conduta:', error);
      alert('Erro ao deletar conduta. Tente novamente.');
    }
  };

  const duplicateConduct = async (id) => {
    if (!canManageInsights) return;
    try {
      const list = Array.isArray(project.conducts) ? project.conducts : [];
      const src = list.find((c) => c.id === id);
      if (!src) return;
      
      await addProjectConduct(project.id, {
        text: src.text,
        urgency: src.urgency
      });
    } catch (error) {
      console.error('Erro ao duplicar conduta:', error);
      alert('Erro ao duplicar conduta. Tente novamente.');
    }
  };

  const onDragStartConduct = (e, id) => {
    if (!canManageInsights) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
  };

  const onDragOverConduct = (e) => {
    if (!canManageInsights) return;
    e.preventDefault();
  };

  const onDropConduct = async (e, targetId) => {
    if (!canManageInsights) return;
    e.preventDefault();
    const srcIdStr = e.dataTransfer.getData('text/plain');
    if (!srcIdStr) return;
    
    try {
      const list = Array.isArray(project.conducts) ? project.conducts : [];
      const fromIdx = list.findIndex((c) => String(c.id) === String(srcIdStr));
      const toIdx = list.findIndex((c) => String(c.id) === String(targetId));
      
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      
      const next = [...list];
      const [moved] = next.splice(fromIdx, 1);
      const insertIdx = fromIdx < toIdx ? toIdx : toIdx;
      next.splice(insertIdx, 0, moved);
      
      // Atualizar ordem no Supabase
      const newOrder = next.map(c => c.id);
      await reorderProjectConducts(project.id, newOrder);
      
      setDragOverConductId(null);
    } catch (error) {
      console.error('Erro ao reordenar condutas:', error);
      setDragOverConductId(null);
    }
  };

  // Exportar condutas para Excel
  const handleExportConducts = () => {
    try {
      const conducts = Array.isArray(project.conducts) ? project.conducts : [];
      
      if (conducts.length === 0) {
        alert('Não há condutas para exportar.');
        return;
      }

      // Preparar dados para exportação
      const exportData = conducts.map((c, index) => ({
        'Ordem': index + 1,
        'Conduta': c.text || '',
        'Urgência': c.urgency || 'Difícil',
        'ID': c.id || ''
      }));

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 8 },  // Ordem
        { wch: 60 }, // Conduta
        { wch: 15 }, // Urgência
        { wch: 30 }  // ID
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Condutas');

      // Gerar nome do arquivo
      const projectName = project.name || 'Projeto';
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${projectName}_Condutas_${date}.xlsx`;

      // Download
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar condutas:', error);
      alert('Erro ao exportar condutas. Tente novamente.');
    }
  };

  // Importar condutas do Excel
  const handleImportConducts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        alert('O arquivo Excel está vazio.');
        return;
      }

      // Validar e processar dados
      const validConducts = [];
      for (const row of rows) {
        const text = row['Conduta'] || row['conduta'] || '';
        const urgency = row['Urgência'] || row['urgencia'] || row['Urgency'] || 'Difícil';
        
        if (text.trim()) {
          validConducts.push({
            text: text.trim(),
            urgency: urgency
          });
        }
      }

      if (validConducts.length === 0) {
        alert('Nenhuma conduta válida encontrada no arquivo.');
        return;
      }

      // Confirmar importação
      const confirmMsg = `Deseja importar ${validConducts.length} conduta(s)?\n\nIsso irá adicionar as condutas do arquivo às condutas existentes.`;
      if (!confirm(confirmMsg)) return;

      // Adicionar condutas
      for (const conduct of validConducts) {
        await addProjectConduct(project.id, conduct);
      }

      alert(`${validConducts.length} conduta(s) importada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar condutas:', error);
      alert('Erro ao importar condutas. Verifique o formato do arquivo.');
    } finally {
      // Limpar input
      e.target.value = '';
    }
  };

  // Exportar itens do Panorama Atual para Excel
  const handleExportPanorama = () => {
    try {
      const panorama = project?.panorama || {};
      
      // Preparar dados para exportação
      const exportData = [];
      
      const sections = [
        { key: 'tecnica', title: 'Aspectos de Ordem Técnica' },
        { key: 'fisica', title: 'Aspectos de Ordem Física' },
        { key: 'economica', title: 'Aspectos de Ordem Econômica' }
      ];

      sections.forEach(({ key, title }) => {
        const section = panorama[key] || {};
        const items = section.items || [];
        const status = section.status || 'green';
        
        items.forEach((item, index) => {
          exportData.push({
            'Seção': title,
            'Status': status === 'green' ? 'Verde' : status === 'yellow' ? 'Amarelo' : 'Vermelho',
            'Ordem': index + 1,
            'Item': item.text || '',
            'ID': item.id || ''
          });
        });
      });

      if (exportData.length === 0) {
        alert('Não há itens no Panorama Atual para exportar.');
        return;
      }

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Seção
        { wch: 12 }, // Status
        { wch: 8 },  // Ordem
        { wch: 60 }, // Item
        { wch: 30 }  // ID
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Panorama Atual');

      // Gerar nome do arquivo
      const projectName = project.name || 'Projeto';
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${projectName}_Panorama_Atual_${date}.xlsx`;

      // Download
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar Panorama Atual:', error);
      alert('Erro ao exportar Panorama Atual. Tente novamente.');
    }
  };

  // Importar itens do Panorama Atual do Excel
  const handleImportPanorama = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        alert('O arquivo Excel está vazio.');
        return;
      }

      // Mapear seções
      const sectionMap = {
        'Aspectos de Ordem Técnica': 'tecnica',
        'Aspectos de Ordem Física': 'fisica',
        'Aspectos de Ordem Econômica': 'economica'
      };

      const statusMap = {
        'Verde': 'green',
        'Amarelo': 'yellow',
        'Vermelho': 'red'
      };

      // Agrupar itens por seção
      const itemsBySection = {
        tecnica: [],
        fisica: [],
        economica: []
      };

      for (const row of rows) {
        const sectionTitle = row['Seção'] || row['Secao'] || '';
        const sectionKey = sectionMap[sectionTitle];
        const itemText = row['Item'] || row['item'] || '';
        
        if (sectionKey && itemText.trim()) {
          itemsBySection[sectionKey].push(itemText.trim());
        }
      }

      const totalItems = Object.values(itemsBySection).reduce((sum, items) => sum + items.length, 0);

      if (totalItems === 0) {
        alert('Nenhum item válido encontrado no arquivo.');
        return;
      }

      // Confirmar importação
      const confirmMsg = `Deseja importar ${totalItems} item(ns)?\n\n` +
        `Técnica: ${itemsBySection.tecnica.length}\n` +
        `Física: ${itemsBySection.fisica.length}\n` +
        `Econômica: ${itemsBySection.economica.length}\n\n` +
        `Isso irá adicionar os itens do arquivo aos itens existentes.`;
      
      if (!confirm(confirmMsg)) return;

      // Adicionar itens
      for (const [sectionKey, items] of Object.entries(itemsBySection)) {
        for (const itemText of items) {
          await addPanoramaItem(project.id, sectionKey, itemText);
        }
      }

      alert(`${totalItems} item(ns) importado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar Panorama Atual:', error);
      alert('Erro ao importar Panorama Atual. Verifique o formato do arquivo.');
    } finally {
      // Limpar input
      e.target.value = '';
    }
  };

  // Arquivos: helpers e permissões
  const FILES_PAGE_SIZE = 10;
  const isClientUser = ((user?.role || '').toLowerCase() === 'client' || (user?.role || '').toLowerCase() === 'cliente');
  const canManageIndicators = !viewAsClient && !isClientUser && canEdit;
  const canUploadTo = (source) => !viewAsClient && (!isClientUser || source === 'client');
  const canDeleteFiles = !viewAsClient && (isAdmin || isManager || hasPermission('delete_projects') || hasPermission('edit_projects'));

  const FileKindIcon = ({ ext }) => {
    const e = (ext || '').toLowerCase();
    const isImg = ['jpg','jpeg','png','gif','bmp','webp','svg','tiff','ico','heic','heif'].includes(e);
    if (isImg) return <Image className="h-4 w-4 text-amber-600" />;
    if (['xls','xlsx','csv'].includes(e)) return <Table className="h-4 w-4 text-green-600" />;
    if (e === 'pdf') return <FileText className="h-4 w-4 text-red-600" />;
    if (['doc','docx'].includes(e)) return <FileText className="h-4 w-4 text-blue-600" />;
    return <File className="h-4 w-4 text-slate-500" />;
  };

  // Helpers de arquivos
  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  const triggerDownload = async (file) => {
    try {
      // Validar se o arquivo tem storagePath válido
      if (!file?.storagePath || typeof file.storagePath !== 'string' || file.storagePath.trim() === '') {
        alert('Este arquivo não possui um caminho válido para download.');
        return;
      }

      const url = await getFileUrl(file.storagePath);
      if (url) {
        // Abrir o arquivo em uma nova aba
        window.open(url, '_blank');
      } else {
        alert('Erro ao obter URL do arquivo para download.');
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do arquivo.');
    }
  };
  const onDropFiles = async (e, source) => {
    e.preventDefault();
    setDragOverSource(null);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) {
      await Promise.all(files.map((f) => addProjectFile(project.id, f, source)));
    }
  };
  const onBrowseInputChange = async (e, source) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      await Promise.all(files.map((f) => addProjectFile(project.id, f, source)));
    }
    e.target.value = null;
  };

  const normalizeMember = (member) => {
    if (!member) return null;
    const profile = member.profiles || member.profile;
    const id = member.user_id || member.id || profile?.id;
    if (!id) return null;
    
    // Debug: verificar dados do membro
    console.log('🔍 Normalizando membro:', {
      member,
      profile,
      hasEmail: !!profile?.email,
      email: profile?.email
    });
    
    return {
      ...member,
      id,
      user_id: member.user_id || id,
      name: member.name || profile?.name || member.email || profile?.email || 'Usuário',
      email: member.email || profile?.email || '',
      role: member.role || profile?.role || 'member',
    };
  };

  const getInitialMembers = (proj) => {
    const base = Array.isArray(proj?.project_members) && proj.project_members.length > 0
      ? proj.project_members
      : Array.isArray(proj?.team)
        ? proj.team
        : [];
    return base.map(normalizeMember).filter(Boolean);
  };

  // Estado para controlar menu de opções dos membros
  const [memberMenuOpen, setMemberMenuOpen] = useState(null);

  // Team: add existing registered user to this project
  const [projectMembers, setProjectMembers] = useState(() => getInitialMembers(project));
  const projectMemberNames = projectMembers.map((member) => member.name).filter(Boolean);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  // Fechar menu de membros ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (memberMenuOpen && !event.target.closest('.member-menu')) {
        setMemberMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [memberMenuOpen]);
  const projectMemberIds = new Set(projectMembers.map((t) => String(t.user_id || t.id)));
  const availableUsers = (users || [])
    .filter(u => {
      const uid = String(u.id ?? u.user_id ?? '').trim();
      if (!uid) return false;
      return !projectMemberIds.has(uid);
    })
    .filter(u => {
      const q = searchMember.trim().toLowerCase();
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    })
    .filter(u => {
      const qCompany = searchCompany.trim().toLowerCase();
      if (!qCompany) return true;
      return (u.empresa || '').toLowerCase().includes(qCompany);
    });
  const handleConfirmAddMember = async () => {
    if (!selectedUserId) return;
    
    try {
      await addProjectMember(project.id, selectedUserId, 'member');
      
      // Recarregar membros imediatamente para atualizar a UI
      const membersResult = await loadProjectMembers(project.id);
      const normalizedMembers = (membersResult || []).map(member => normalizeMember(member));
      setLoadedProjectMembers(normalizedMembers);
      
      setShowAddMember(false);
      setSelectedUserId('');
      setSearchMember('');
      setSearchCompany('');
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro. Tente novamente.');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    // Verificar se o usuário tem permissão para remover membros
    if (!hasPermission('manage_team')) {
      alert('Você não tem permissão para remover membros. Função restrita ao administrador e gerente.');
      setMemberMenuOpen(null); // Fechar menu
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja remover ${memberName} do projeto?`)) {
      return;
    }
    
    try {
      setMemberMenuOpen(null); // Fechar menu
      await removeProjectMember(project.id, userId);
      
      // Recarregar membros imediatamente para atualizar a UI
      const membersResult = await loadProjectMembers(project.id);
      const normalizedMembers = (membersResult || []).map(member => normalizeMember(member));
      setLoadedProjectMembers(normalizedMembers);
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro. Tente novamente.');
    }
  };

  const handleUploadDocument = () => {
    // Abrir o seletor de arquivo para a seção Exxata
    const input = document.getElementById('file-input-exxata');
    if (input) input.click();
  };

  // Carregar condutas, atividades, arquivos e indicadores do Supabase quando o projeto for carregado
  useEffect(() => {
    const loadData = async () => {
      if (!project?.id || !user?.id) return;
      
      try {
        setConductsLoading(true);
        setActivitiesLoading(true);
        setMembersLoading(true);
        const [conductsResult, activitiesResult, filesResult, indicatorsResult, panoramaResult, membersResult] = await Promise.all([
          getProjectConducts(project.id),
          getProjectActivities(project.id),
          getProjectFiles(project.id),
          getProjectIndicators(project.id),
          getProjectPanorama(project.id),
          loadProjectMembers(project.id)
        ]);
        
        // Atualizar membros carregados
        const normalizedMembers = (membersResult || []).map(member => normalizeMember(member));
        setLoadedProjectMembers(normalizedMembers);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setConductsLoading(false);
        setActivitiesLoading(false);
        setMembersLoading(false);
      }
    };

    loadData();
  }, [project?.id, user?.id]);

  // Funções para export/import de indicadores - MODELO DE 3 ABAS
  const handleExportIndicators = () => {
    try {
      const indicators = project?.project_indicators || [];
      if (indicators.length === 0) {
        alert('Não há indicadores para exportar.');
        return;
      }

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // ===== ABA 1: CONFIGURAÇÕES =====
      const configData = indicators.map((indicator, index) => ({
        'ID': `G${index + 1}`,
        'Título': indicator.title,
        'Tipo': indicator.chart_type || 'bar',
        'Formato': indicator.options?.valueFormat || 'Numérico'
      }));

      const wsConfig = XLSX.utils.json_to_sheet(configData);
      wsConfig['!cols'] = [
        { wch: 8 },  // ID
        { wch: 40 }, // Título
        { wch: 15 }, // Tipo
        { wch: 15 }  // Formato
      ];
      XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações');

      // ===== ABA 2: DADOS =====
      const dataRows = [];
      indicators.forEach((indicator, index) => {
        const graphId = `G${index + 1}`;
        const labels = Array.isArray(indicator.labels) ? indicator.labels : [];
        const datasets = Array.isArray(indicator.datasets) ? indicator.datasets : [];

        datasets.forEach(dataset => {
          const row = {
            'ID_Gráfico': graphId,
            'Dataset': dataset.name || 'Série 1'
          };
          
          // Adicionar valores para cada rótulo
          labels.forEach((label, labelIndex) => {
            const value = dataset.values?.[labelIndex];
            row[label] = value !== undefined && value !== null ? value : '';
          });

          dataRows.push(row);
        });
      });

      const wsData = XLSX.utils.json_to_sheet(dataRows);
      // Largura dinâmica baseada no número de colunas
      const dataColWidths = [
        { wch: 12 }, // ID_Gráfico
        { wch: 20 }, // Dataset
        ...Array(Math.max(...indicators.map(i => (i.labels || []).length))).fill({ wch: 15 })
      ];
      wsData['!cols'] = dataColWidths;
      XLSX.utils.book_append_sheet(wb, wsData, 'Dados');

      // ===== ABA 3: CORES =====
      const colorRows = [];
      indicators.forEach((indicator, index) => {
        const graphId = `G${index + 1}`;
        const datasets = Array.isArray(indicator.datasets) ? indicator.datasets : [];

        datasets.forEach(dataset => {
          // Para pizza/rosca exportar cores por fatia (uma linha por rótulo)
          if ((indicator.chart_type === 'pie' || indicator.chart_type === 'doughnut') && Array.isArray(indicator.labels)) {
            const sliceColors = Array.isArray(dataset.colors) ? dataset.colors : [];
            indicator.labels.forEach((label, i) => {
              colorRows.push({
                'ID_Gráfico': graphId,
                'Dataset': dataset.name || 'Série 1',
                'Rótulo': label,
                'Cor': sliceColors[i] || '#8884d8'
              });
            });
          } else {
            // Demais tipos seguem com cor por dataset
            colorRows.push({
              'ID_Gráfico': graphId,
              'Dataset': dataset.name || 'Série 1',
              'Cor': dataset.color || '#8884d8'
            });
          }
        });
      });

      const wsColors = XLSX.utils.json_to_sheet(colorRows);
      wsColors['!cols'] = [
        { wch: 12 }, // ID_Gráfico
        { wch: 20 }, // Dataset
        { wch: 20 }, // Rótulo (opcional para pizza/rosca)
        { wch: 15 }  // Cor
      ];
      XLSX.utils.book_append_sheet(wb, wsColors, 'Cores');

      // Download do arquivo
      const fileName = `indicadores_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`${indicators.length} indicador(es) exportado(s) com sucesso em formato de 3 abas!`);
    } catch (error) {
      console.error('Erro ao exportar indicadores:', error);
      alert('Erro ao exportar indicadores. Tente novamente.');
    }
  };

  const handleExportPDF = async () => {
    const indicators = project?.project_indicators || [];
    const conducts = Array.isArray(project?.conducts) ? project.conducts : [];
    const predictiveText = project?.aiPredictiveText || '';

    if (indicators.length === 0 && conducts.length === 0 && !predictiveText) {
      alert('Não há conteúdo para exportar.');
      return;
    }

    setIsExportingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      
      // Cores da marca Exxata
      const exxataRed = [213, 29, 7]; // #d51d07
      const exxataNavy = [9, 24, 43]; // #09182b
      const lightGray = [248, 250, 252];
      const darkGray = [71, 85, 105];
      const textGray = [100, 116, 139];
      const subtleGray = [226, 232, 240];

      // Util: carregar imagem como DataURL (base64)
      const loadImageAsDataURL = async (src) => {
        try {
          const res = await fetch(src, { cache: 'no-store' });
          if (!res.ok) return null;
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (_) {
          return null;
        }
      };

      // Carregar logo oficial (localizado em public/)
      const logoUrl = '/Assinatura-de-Marca---Exxata_01.png';
      const logoDataUrl = await loadImageAsDataURL(logoUrl);

      // Função para adicionar cabeçalho em cada página
      const addHeader = (pageNum, totalPages, logo) => {
        // Faixa superior cinza claro para maior legibilidade
        pdf.setFillColor(...lightGray);
        pdf.rect(0, 0, pageWidth, 18, 'F');

        // Linha inferior sutil
        pdf.setDrawColor(...subtleGray);
        pdf.setLineWidth(0.6);
        pdf.line(0, 18, pageWidth, 18);

        // Logo (se disponível) ou fallback em texto
        if (logo) {
          try {
            const logoH = 10;
            const logoW = 26; // proporção aproximada
            pdf.addImage(logo, 'PNG', pageWidth - margin - logoW, 4, logoW, logoH);
          } catch (_) {
            // fallback silencioso
          }
        } else {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...exxataNavy);
          pdf.text('EXXATA', pageWidth - margin - 40, 11);
        }

        // Título da seção/cabeçalho
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...exxataNavy);
        pdf.text('Exxata Engenharia', margin, 9);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...darkGray);
        pdf.text('Atitude imediata. Resultados notáveis.', margin, 14);

        // Número da página
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textGray);
        pdf.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 20, 14);
      };

      // Função para adicionar rodapé elegante com logo e slogan
      const addFooter = (logo) => {
        // Área de endereços
        const footerY = pageHeight - 32;
        pdf.setDrawColor(...subtleGray);
        pdf.setLineWidth(0.6);
        pdf.line(margin, footerY, pageWidth - margin, footerY);

        pdf.setFontSize(7);
        pdf.setTextColor(...darkGray);
        pdf.setFont('helvetica', 'bold');

        // Belo Horizonte (badge cinza claro)
        pdf.setFillColor(...subtleGray);
        pdf.roundedRect(margin, footerY + 3, 37, 4.5, 1, 1, 'F');
        pdf.setTextColor(...exxataNavy);
        pdf.text('Belo Horizonte/MG', margin + 2, footerY + 6);

        pdf.setTextColor(...textGray);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const bhText = 'Av. Getúlio Vargas, n° 671, 10° Andar, Funcionários, Belo Horizonte/MG';
        pdf.text(bhText, margin, footerY + 11);

        // São Paulo (badge cinza claro)
        pdf.setFillColor(...subtleGray);
        pdf.roundedRect(margin, footerY + 14, 28, 4.5, 1, 1, 'F');
        pdf.setTextColor(...exxataNavy);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text('São Paulo/SP', margin + 2, footerY + 17);

        pdf.setTextColor(...textGray);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const spText = 'Avenida Engenheiro Luiz Carlos Berrini, n° 105. Ed. Thera Berrini Office, Brooklin, Sala 111, São Paulo/SP';
        pdf.text(spText, margin, footerY + 22);

        // Faixa inferior cinza claro com logo central
        const bandH = 12;
        pdf.setFillColor(...lightGray);
        pdf.rect(0, pageHeight - bandH, pageWidth, bandH, 'F');

        if (logo) {
          try {
            const logoH = 8;
            const logoW = 21;
            const logoX = (pageWidth - logoW) / 2;
            const logoY = pageHeight - bandH + 2;
            pdf.addImage(logo, 'PNG', logoX, logoY, logoW, logoH);
          } catch (_) { /* noop */ }
        } else {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(...exxataNavy);
          const t = 'EXXATA';
          const tw = pdf.getTextWidth(t);
          pdf.text(t, (pageWidth - tw) / 2, pageHeight - 4);
        }
      };

      let currentPage = 1;
      let yPosition = 30; // Começar após o cabeçalho com respiro maior

      // Título principal do documento
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...exxataNavy);
      pdf.text('Relatório do Projeto', margin, yPosition);
      yPosition += 12;

      // Nome do projeto com destaque
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(margin, yPosition - 5, contentWidth, 14, 2, 2, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...exxataNavy);
      pdf.text(project?.name || 'Sem nome', margin + 5, yPosition + 4);
      yPosition += 16;

      // Informações do projeto em cards
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...darkGray);
      
      const exportDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Card de informações
      const infoBoxY = yPosition;
      pdf.setDrawColor(...exxataRed);
      pdf.setLineWidth(0.5);
      pdf.line(margin, infoBoxY, margin + 3, infoBoxY);
      
      pdf.setTextColor(...textGray);
      pdf.text(`Data de Exportação: ${exportDate}`, margin + 5, infoBoxY + 1);
      pdf.text(`Total de Indicadores: ${indicators.length}`, margin + 5, infoBoxY + 6);
      
      if (project?.client) {
        pdf.text(`Cliente: ${project.client}`, margin + 5, infoBoxY + 11);
        yPosition += 18;
      } else {
        yPosition += 13;
      }

      yPosition += 5;

      // Sumário do relatório
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...textGray);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, yPosition, contentWidth, 24, 2, 2, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...exxataNavy);
      pdf.text('Conteúdo do Relatório:', margin + 5, yPosition + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...darkGray);
      
      let summaryY = yPosition + 12;
      if (indicators.length > 0) {
        pdf.setFillColor(...exxataRed);
        pdf.circle(margin + 7, summaryY - 1, 1, 'F');
        pdf.text(`Indicadores (${indicators.length})`, margin + 11, summaryY);
        summaryY += 4;
      }
      if (conducts.length > 0) {
        pdf.setFillColor(...exxataRed);
        pdf.circle(margin + 7, summaryY - 1, 1, 'F');
        pdf.text(`Condutas (${conducts.length})`, margin + 11, summaryY);
        summaryY += 4;
      }
      if (predictiveText) {
        pdf.setFillColor(...exxataRed);
        pdf.circle(margin + 7, summaryY - 1, 1, 'F');
        pdf.text('Inteligência Preditiva', margin + 11, summaryY);
      }

      yPosition += 34;

      // Linha divisória elegante
      pdf.setDrawColor(...subtleGray);
      pdf.setLineWidth(0.6);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Adicionar cabeçalho e rodapé na primeira página
      const totalPages = indicators.length + 1; // Estimativa
      addHeader(currentPage, totalPages, logoDataUrl);
      addFooter(logoDataUrl);

      // ========== SEÇÃO: INDICADORES ==========
      if (indicators.length > 0) {
        // Título da seção Indicadores (se houver outras seções)
        if (conducts.length > 0 || predictiveText) {
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...exxataNavy);
          pdf.text('Indicadores', margin, yPosition);
          yPosition += 8;

          // Linha divisória
          pdf.setDrawColor(...subtleGray);
          pdf.setLineWidth(0.6);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;
        }

        // Capturar cada gráfico
        const chartCards = indicatorsContainerRef.current?.querySelectorAll('.chart-card');
        
        if (!chartCards || chartCards.length === 0) {
          alert('Erro ao capturar os gráficos. Tente novamente.');
          setIsExportingPDF(false);
          return;
        }

        for (let i = 0; i < chartCards.length; i++) {
        const card = chartCards[i];
        const indicator = indicators[i];
        
        // Verificar se precisa de nova página antes do título
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          currentPage++;
          yPosition = 25;
          addHeader(currentPage, totalPages, logoDataUrl);
          addFooter(logoDataUrl);
        }

        // Título do indicador com número (badge minimalista)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...exxataNavy);

        const drawIndexBadge = (index, cx, cy) => {
          const r = 4;
          pdf.setLineWidth(0.8);
          pdf.setDrawColor(...exxataRed);
          pdf.setFillColor(255, 255, 255);
          pdf.circle(cx, cy, r, 'FD');
          const label = String(index);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(...exxataRed);
          const tw = pdf.getTextWidth(label);
          pdf.text(label, cx - tw / 2, cy + 1.5);
        };

        drawIndexBadge(i + 1, margin + 5, yPosition - 2);
        // Nome do indicador
        pdf.setTextColor(...exxataNavy);
        pdf.setFontSize(12);
        pdf.text(indicator.title, margin + 14, yPosition);
        yPosition += 8;

        // Capturar o card como imagem
        const canvas = await html2canvas(card, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Verificar se precisa de nova página para o gráfico
        if (yPosition + imgHeight > pageHeight - 25) {
          pdf.addPage();
          currentPage++;
          yPosition = 25;
          addHeader(currentPage, totalPages, logoDataUrl);
          addFooter(logoDataUrl);
        }

        // Box com sombra para o gráfico
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...subtleGray);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin - 2, yPosition - 2, contentWidth + 4, imgHeight + 4, 2, 2, 'FD');

        // Adicionar imagem ao PDF
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 8;

        // Adicionar observações se existirem
        if (indicator?.observations) {
          if (yPosition + 25 > pageHeight - 25) {
            pdf.addPage();
            currentPage++;
            yPosition = 25;
            addHeader(currentPage, totalPages, logoDataUrl);
            addFooter(logoDataUrl);
          }

          // Box de observações com estilo
          pdf.setFillColor(252, 252, 253);
          pdf.setDrawColor(...exxataRed);
          pdf.setLineWidth(0.5);
          
          const obsLines = pdf.splitTextToSize(indicator.observations, contentWidth - 12);
          const obsHeight = (obsLines.length * 4) + 8;
          
          pdf.roundedRect(margin, yPosition, contentWidth, obsHeight, 2, 2, 'FD');
          
          // Ícone de observação (simulado)
          pdf.setFillColor(...exxataRed);
          pdf.circle(margin + 4, yPosition + 4, 1.5, 'F');
          
          // Título "Observações"
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...exxataNavy);
          pdf.text('Análise Exxata:', margin + 8, yPosition + 5);
          
          // Texto das observações
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(...darkGray);
          pdf.text(obsLines, margin + 6, yPosition + 10);
          
          yPosition += obsHeight + 8;
        }

        // Espaçamento entre indicadores
        yPosition += 5;
        }
      }

      // ========== SEÇÃO: CONDUTAS ==========
      if (conducts.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          currentPage++;
          yPosition = 25;
          addHeader(currentPage, totalPages, logoDataUrl);
          addFooter(logoDataUrl);
        }

        // Título da seção Condutas
        yPosition += 10;
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...exxataNavy);
        pdf.text('Condutas', margin, yPosition);
        yPosition += 8;

        // Linha divisória
        pdf.setDrawColor(...exxataRed);
        pdf.setLineWidth(1);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Ordenar condutas por urgência
        const urgencyOrder = { 'Crise': 5, 'Complexo': 4, 'Complicado': 3, 'Difícil': 2, 'Fácil': 1 };
        const sortedConducts = [...conducts].sort((a, b) => 
          (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0)
        );

        // Cores por urgência
        const urgencyColors = {
          'Crise': [220, 38, 38],
          'Complexo': [234, 88, 12],
          'Complicado': [234, 179, 8],
          'Difícil': [59, 130, 246],
          'Fácil': [34, 197, 94],
          'Normal': [100, 116, 139]
        };

        for (let i = 0; i < sortedConducts.length; i++) {
          const conduct = sortedConducts[i];
          const urgencyColor = urgencyColors[conduct.urgency] || textGray;

          // Verificar espaço
          if (yPosition > pageHeight - 50) {
            pdf.addPage();
            currentPage++;
            yPosition = 25;
            addHeader(currentPage, totalPages, logoDataUrl);
            addFooter(logoDataUrl);
          }

          // Badge de urgência
          pdf.setFillColor(...urgencyColor);
          const badgeWidth = pdf.getTextWidth(conduct.urgency) + 6;
          pdf.roundedRect(margin, yPosition - 3, badgeWidth, 5, 1, 1, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.text(conduct.urgency, margin + 3, yPosition);

          // Número da conduta
          pdf.setTextColor(...darkGray);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`#${i + 1}`, margin + badgeWidth + 5, yPosition);
          yPosition += 6;

          // Texto da conduta
          const conductLines = pdf.splitTextToSize(conduct.text || 'Sem descrição', contentWidth - 6);
          const conductHeight = (conductLines.length * 4.5) + 8;

          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(...lightGray);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(margin, yPosition, contentWidth, conductHeight, 2, 2, 'FD');

          pdf.setFontSize(9);
          pdf.setTextColor(...darkGray);
          pdf.text(conductLines, margin + 3, yPosition + 5);

          yPosition += conductHeight + 6;
        }
      }

      // ========== SEÇÃO: INTELIGÊNCIA PREDITIVA ==========
      if (predictiveText) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          currentPage++;
          yPosition = 25;
          addHeader(currentPage, totalPages, logoDataUrl);
          addFooter(logoDataUrl);
        }

        // Título da seção
        yPosition += 10;
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...exxataNavy);
        pdf.text('Inteligência Preditiva', margin, yPosition);
        yPosition += 8;

        // Linha divisória
        pdf.setDrawColor(...exxataRed);
        pdf.setLineWidth(1);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Box de conteúdo
        const predictiveLines = pdf.splitTextToSize(predictiveText, contentWidth - 8);
        const predictiveHeight = (predictiveLines.length * 4.5) + 12;

        // Verificar se cabe na página
        if (yPosition + predictiveHeight > pageHeight - 30) {
          pdf.addPage();
          currentPage++;
          yPosition = 25;
          addHeader(currentPage, totalPages, logoDataUrl);
          addFooter(logoDataUrl);
        }

        // Box com gradiente simulado
        pdf.setFillColor(239, 246, 255); // Azul claro
        pdf.setDrawColor(59, 130, 246); // Azul
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPosition, contentWidth, predictiveHeight, 3, 3, 'FD');

        // Ícone decorativo
        pdf.setFillColor(59, 130, 246);
        pdf.circle(margin + 5, yPosition + 6, 2, 'F');

        // Texto
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...darkGray);
        pdf.text(predictiveLines, margin + 4, yPosition + 8);
      }

      // Salvar o PDF
      const fileName = `Exxata_Relatorio_${project?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'projeto'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Funções para export/import de atividades
  const handleExportActivities = () => {
    try {
      const activities = sortedActivities || [];
      if (activities.length === 0) {
        alert('Não há atividades para exportar.');
        return;
      }

      // Preparar dados para Excel
      const exportData = activities.map(activity => ({
        'ID': getActivityDisplayId(activity),
        'Atividade': activity.title,
        'Responsável': activity.assignedTo,
        'Data de Início': new Date(activity.startDate).toLocaleDateString('pt-BR'),
        'Data de Fim': new Date(activity.endDate).toLocaleDateString('pt-BR'),
        'Status': activity.status,
        'Criado em': new Date(activity.created_at).toLocaleString('pt-BR'),
        'Atualizado em': new Date(activity.updated_at).toLocaleString('pt-BR'),
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-ajustar largura das colunas
      const colWidths = [
        { wch: 10 }, // ID
        { wch: 40 }, // Atividade
        { wch: 20 }, // Responsável
        { wch: 15 }, // Data de Início
        { wch: 15 }, // Data de Fim
        { wch: 15 }, // Status
        { wch: 20 }, // Criado em
        { wch: 20 }, // Atualizado em
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Atividades');
      
      // Download do arquivo
      const fileName = `atividades_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar atividades:', error);
      alert('Erro ao exportar atividades. Tente novamente.');
    }
  };

  const handleImportIndicators = () => {
    if (!canManageIndicators) return;
    document.getElementById('indicator-import-input').click();
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Verificar se tem as 3 abas necessárias
      const hasConfigSheet = wb.SheetNames.includes('Configurações') || wb.SheetNames.includes('Configuracoes');
      const hasDataSheet = wb.SheetNames.includes('Dados');
      const hasColorSheet = wb.SheetNames.includes('Cores');

      // Se não tiver as 3 abas, tentar formato antigo (compatibilidade)
      if (!hasConfigSheet || !hasDataSheet) {
        return await handleImportLegacyFormat(wb, event);
      }

      // ===== PROCESSAR FORMATO DE 3 ABAS =====

      // Ler aba de Configurações
      const configSheetName = wb.SheetNames.find(name => name === 'Configurações' || name === 'Configuracoes');
      const configData = XLSX.utils.sheet_to_json(wb.Sheets[configSheetName]);

      if (configData.length === 0) {
        alert('A aba "Configurações" está vazia.');
        return;
      }

      // Ler aba de Dados
      const dataData = XLSX.utils.sheet_to_json(wb.Sheets['Dados']);

      if (dataData.length === 0) {
        alert('A aba "Dados" está vazia.');
        return;
      }

      // Ler aba de Cores (opcional)
      const colorData = hasColorSheet ? XLSX.utils.sheet_to_json(wb.Sheets['Cores']) : [];

      // Agrupar dados por ID_Gráfico
      const graphsMap = new Map();

      // Processar configurações
      configData.forEach(row => {
        const id = row['ID'] || row['id'];
        if (!id) return;

        graphsMap.set(id, {
          id,
          title: row['Título'] || row['Titulo'] || row['title'] || '',
          chart_type: row['Tipo'] || row['tipo'] || row['type'] || 'bar',
          valueFormat: row['Formato'] || row['formato'] || row['format'] || 'Numérico',
          labels: [],
          datasets: []
        });
      });

      // Processar dados
      dataData.forEach(row => {
        const graphId = row['ID_Gráfico'] || row['ID_Grafico'] || row['id'];
        const datasetName = row['Dataset'] || row['dataset'];
        
        if (!graphId || !datasetName) return;

        const graph = graphsMap.get(graphId);
        if (!graph) return;

        // Extrair rótulos (todas as colunas exceto ID_Gráfico e Dataset)
        const labels = Object.keys(row).filter(key => 
          key !== 'ID_Gráfico' && key !== 'ID_Grafico' && key !== 'id' && 
          key !== 'Dataset' && key !== 'dataset'
        );

        // Se ainda não temos labels, definir agora
        if (graph.labels.length === 0) {
          graph.labels = labels;
        }

        // Extrair valores
        const values = labels.map(label => {
          const val = row[label];
          return val !== undefined && val !== null && val !== '' ? parseFloat(val) : 0;
        });

        // Adicionar dataset
        graph.datasets.push({
          name: datasetName,
          values,
          color: '#8884d8' // Cor padrão, será substituída se houver na aba Cores
        });
      });

      // Processar cores
      colorData.forEach(row => {
        const graphId = row['ID_Gráfico'] || row['ID_Grafico'] || row['id'];
        const datasetName = row['Dataset'] || row['dataset'];
        const color = row['Cor'] || row['cor'] || row['color'];
        const labelName = row['Rótulo'] || row['Rotulo'] || row['rotulo'] || row['label'];

        if (!graphId || !datasetName || !color) return;

        const graph = graphsMap.get(graphId);
        if (!graph) return;

        // Encontrar dataset
        const dataset = graph.datasets.find(ds => ds.name === datasetName) || graph.datasets[0];
        if (!dataset) return;

        // Para pizza/rosca: permitir cores por fatia (array colors alinhado a labels)
        if (graph.chart_type === 'pie' || graph.chart_type === 'doughnut') {
          const labels = Array.isArray(graph.labels) ? graph.labels : [];
          const idx = labelName ? labels.findIndex(l => String(l).trim() === String(labelName).trim()) : -1;
          if (!Array.isArray(dataset.colors)) dataset.colors = Array(labels.length).fill('#8884d8');
          if (idx >= 0) {
            dataset.colors[idx] = color;
          } else if (labels.length > 0) {
            // Se não especificou rótulo, preencher sequencialmente a próxima posição vazia
            const next = dataset.colors.findIndex(c => !c || c === '#8884d8');
            const target = next >= 0 ? next : 0;
            dataset.colors[target] = color;
          }
        } else {
          // Demais tipos: cor por dataset
          dataset.color = color;
        }
      });

      // Normalizar datasets para pizza/rosca: usar apenas um dataset e garantir array de cores alinhado
      graphsMap.forEach((graph) => {
        if (graph.chart_type === 'pie' || graph.chart_type === 'doughnut') {
          if (!graph.datasets[0]) {
            graph.datasets = [{ name: 'Série 1', values: [], colors: [] }];
          } else {
            graph.datasets = [{
              name: graph.datasets[0].name || 'Série 1',
              values: Array.isArray(graph.datasets[0].values) ? graph.datasets[0].values : [],
              colors: Array.isArray(graph.datasets[0].colors) ? graph.datasets[0].colors : []
            }];
          }
          // Garantir que cores tenha mesmo tamanho de labels
          const labelCount = Array.isArray(graph.labels) ? graph.labels.length : 0;
          const ds0 = graph.datasets[0];
          if (!Array.isArray(ds0.colors)) ds0.colors = [];
          while (ds0.colors.length < labelCount) ds0.colors.push('#8884d8');
          // Garantir que values tenha mesmo tamanho de labels
          if (!Array.isArray(ds0.values)) ds0.values = [];
          while (ds0.values.length < labelCount) ds0.values.push(0);
        }
      });

      // Converter Map para array de indicadores
      const indicatorsToImport = Array.from(graphsMap.values())
        .filter(graph => graph.title && graph.datasets.length > 0)
        .map(graph => ({
          title: graph.title,
          chart_type: graph.chart_type,
          labels: graph.labels,
          datasets: graph.datasets,
          options: {
            valueFormat: graph.valueFormat
          }
        }));

      if (indicatorsToImport.length === 0) {
        alert('Nenhum indicador válido encontrado no arquivo.');
        return;
      }

      // Confirmar importação
      const confirmed = window.confirm(
        `Encontrados ${indicatorsToImport.length} indicador(es) para importar:\n\n` +
        indicatorsToImport.map(ind => `• ${ind.title} (${ind.chart_type})`).join('\n') +
        `\n\nDeseja prosseguir? Indicadores existentes com o mesmo título serão atualizados.`
      );
      
      if (!confirmed) return;

      // Importar indicadores
      let successCount = 0;
      let errorCount = 0;

      for (const indicatorData of indicatorsToImport) {
        try {
          // Verificar se já existe um indicador com o mesmo título
          const existing = project.project_indicators?.find(ind => ind.title === indicatorData.title);
          
          if (existing) {
            await updateProjectIndicator(project.id, existing.id, indicatorData);
          } else {
            await addProjectIndicator(project.id, indicatorData);
          }
          successCount++;
        } catch (error) {
          console.error('Erro ao importar indicador:', indicatorData.title, error);
          errorCount++;
        }
      }

      const message = errorCount > 0
        ? `${successCount} indicador(es) importado(s) com sucesso!\n${errorCount} erro(s) encontrado(s).`
        : `${successCount} indicador(es) importado(s) com sucesso!`;
      
      alert(message);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido com as abas: Configurações, Dados e Cores.');
    }

    // Limpar input
    event.target.value = null;
  };

  // Função auxiliar para importar formato antigo (compatibilidade)
  const handleImportLegacyFormat = async (wb, event) => {
    try {
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);

      if (jsonData.length === 0) {
        alert('O arquivo não contém dados válidos.');
        return;
      }

      // Processar dados importados (formato antigo)
      const indicatorsToImport = [];
      for (const row of jsonData) {
        try {
          const title = row['Título'] || row['titulo'] || row['title'];
          const chartType = row['Tipo de Gráfico'] || row['chart_type'] || 'bar';
          const labelsStr = row['Rótulos'] || row['labels'] || '';
          const datasetsStr = row['Conjunto de Dados'] || row['datasets'] || '';
          const colorsStr = row['Cores'] || row['colors'] || '';

          if (!title) continue;

          // Processar rótulos
          const labels = labelsStr ? labelsStr.split(',').map(l => l.trim()).filter(l => l) : [];

          // Processar conjuntos de dados
          let datasets = [];
          if (datasetsStr) {
            const datasetParts = datasetsStr.split(' | ');
            const colorParts = colorsStr ? colorsStr.split(',').map(c => c.trim()) : [];
            
            datasets = datasetParts.map((part, index) => {
              const [name, valuesStr] = part.split(': ');
              const values = valuesStr ? valuesStr.split(',').map(v => parseFloat(v.trim()) || 0) : [];
              return {
                name: name?.trim() || `Série ${index + 1}`,
                values,
                color: colorParts[index] || '#8884d8',
              };
            });
          }

          indicatorsToImport.push({
            title: title.trim(),
            chart_type: chartType,
            labels,
            datasets,
            options: {},
          });
        } catch (rowError) {
          console.warn('Erro ao processar linha:', row, rowError);
        }
      }

      if (indicatorsToImport.length === 0) {
        alert('Nenhum indicador válido encontrado no arquivo.');
        return;
      }

      // Confirmar importação
      const confirmed = window.confirm(`Encontrados ${indicatorsToImport.length} indicadores para importar (formato antigo). Deseja prosseguir?`);
      if (!confirmed) return;

      // Importar indicadores
      let successCount = 0;
      for (const indicatorData of indicatorsToImport) {
        try {
          const existing = project.project_indicators?.find(ind => ind.title === indicatorData.title);
          
          if (existing) {
            await updateProjectIndicator(project.id, existing.id, indicatorData);
          } else {
            await addProjectIndicator(project.id, indicatorData);
          }
          successCount++;
        } catch (error) {
          console.error('Erro ao importar indicador:', indicatorData.title, error);
        }
      }

      alert(`${successCount} indicadores importados com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar formato antigo:', error);
      alert('Erro ao processar o arquivo no formato antigo.');
    }
  };

  // Mostrar loading enquanto autenticação está sendo verificada
  if (authLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Verificando autenticação e carregando projeto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Projeto não encontrado</CardTitle>
            <CardDescription>Verifique se o link está correto ou selecione um projeto na lista.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/projects')}>Voltar para Projetos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userCanSeeProject(project)) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
            <CardDescription>Você não possui acesso a este projeto. Verifique com o administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/projects')}>Voltar para Projetos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-4rem)] overflow-y-auto pr-2">
      <datalist id="project-members-list">
        {projectMemberNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <style>{`
        /* Custom scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            size="icon" 
            className="h-8 w-8 text-exxata-red hover:bg-exxata-red/10 hover:text-exxata-red/90 focus-visible:ring-exxata-red/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {canEdit ? (
              <Input
                defaultValue={project.name}
                onBlur={(e) => updateProject(project.id, { name: e.target.value })}
                className="text-xl text-blue-exxata font-bold tracking-tight h-10"
              />
            ) : (
              <h2 className="text-2xl text-blue-700 font-bold tracking-tight">{project.name}</h2>
            )}
            {canEdit ? (
              <Input
                defaultValue={project.client}
                onBlur={(e) => updateProject(project.id, { client: e.target.value })}
                className="mt-2 text-blue-700 h-9"
              />
            ) : (
              <p className="text-muted-foreground">{project.client}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.sector && (
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
              {project.sector}
            </Badge>
          )}
          {Array.isArray(project.exxataActivities) && project.exxataActivities.length > 0 && (
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
              {project.exxataActivities[0]}
              {project.exxataActivities.length > 1 ? ` +${project.exxataActivities.length - 1}` : ''}
            </Badge>
          )}
          
          {/* Botão Toggle "Visualizar como Cliente" */}
          {canViewAsClient && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white">
              <Eye className={`h-4 w-4 ${viewAsClient ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-sm font-medium text-slate-700">Visualizar como Cliente</span>
              <button
                onClick={() => setViewAsClient(!viewAsClient)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  viewAsClient ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                title={viewAsClient ? 'Desativar modo visualização de cliente' : 'Ativar modo visualização de cliente'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    viewAsClient ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => {
              if (!isAdmin && !isManager) {
                alert('Você não tem permissão para excluir este projeto. Função restrita ao administrador e gerente.');
                return;
              }
              const confirmed = window.confirm('Tem certeza que deseja excluir este projeto? Esta ação é definitiva e não poderá ser desfeita.');
              if (!confirmed) return;
              
              // Segunda confirmação: digitar "exxata"
              const confirmText = window.prompt('Para confirmar a exclusão, digite "exxata" (sem aspas):');
              if (confirmText !== 'exxata') {
                alert('Texto de confirmação incorreto. Exclusão cancelada.');
                return;
              }
              
              // Excluir e voltar para a lista de projetos
              deleteProject(project.id);
              navigate('/projects');
            }}
            title="Excluir projeto (ação definitiva)"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Projeto
          </Button>
        </div>
      </div>

      {/* Banner de Feedback Visual quando modo "Visualizar como Cliente" está ativo */}
      {viewAsClient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Eye className="h-5 w-5" />
            <span className="font-medium">Modo Visualização de Cliente Ativo</span>
            <span className="text-sm text-blue-600">
              (Edições desabilitadas temporariamente)
            </span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="preliminary">Menu</TabsTrigger>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="panorama">Panorama Atual</TabsTrigger>
            <TabsTrigger value="ai-insights">Inteligência Humana</TabsTrigger>
          </TabsList>
          
          {activeTab === 'documents' && (
            <Button onClick={handleUploadDocument} size="sm" className="gap-1">
              <FilePlus2 className="h-4 w-4" />
              Novo Documento
            </Button>
          )}
          
          {activeTab === 'team' && canEdit && (
            <Button onClick={() => setShowAddMember(true)} size="sm" className="gap-1 bg-exxata-red hover:bg-red-700 text-white">
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          )}

          {activeTab === 'indicators' && null}
        </div>

        <TabsContent value="preliminary" className="pl-4 pb-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[ 
              { key: 'overview', title: 'Visão Geral', desc: 'Resumo do projeto com dados principais.', icon: <TrendingUp className="h-5 w-5 text-exxata-red" /> },
              { key: 'documents', title: 'Documentos', desc: 'Arquivos do cliente e da Exxata.', icon: <FileText className="h-5 w-5 text-exxata-red" /> },
              { key: 'team', title: 'Equipe', desc: 'Membros e permissões do projeto.', icon: <Users className="h-5 w-5 text-exxata-red" /> },
              { key: 'activities', title: 'Atividades', desc: 'Planejamento e andamento das atividades.', icon: <Clock className="h-5 w-5 text-exxata-red" /> },
              { key: 'indicators', title: 'Indicadores', desc: 'Gráficos e métricas do projeto.', icon: <BarChart3 className="h-5 w-5 text-exxata-red" /> },
              { key: 'panorama', title: 'Panorama Atual', desc: 'Situação técnica, física e econômica.', icon: <Shield className="h-5 w-5 text-exxata-red" /> },
              { key: 'ai-insights', title: 'Inteligência Humana', desc: 'Análises e percepções do time.', icon: <Brain className="h-5 w-5 text-exxata-red" /> },
            ].map(sec => (
              <Card key={sec.key} className="cursor-pointer hover:shadow-md transition" onClick={() => setActiveTab(sec.key)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {sec.icon}
                    {sec.title}
                  </CardTitle>
                  <CardDescription>{sec.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 pl-4 pb-8">
          <OverviewGrid 
            project={project} 
            user={user} 
            canEdit={canEdit}
            viewAsClient={viewAsClient}
            updateProject={updateProject}
            updateProjectBackend={updateProjectBackend}
            teamMembers={loadedProjectMembers.length > 0 ? loadedProjectMembers : projectMembers}
          />
        </TabsContent>

        {/* INDICADORES */}
        <TabsContent value="indicators" className="space-y-4 pl-4 pb-8">
          <div className="flex gap-2 mb-3">
            {canEdit && (
              <Button onClick={() => { setEditingIndicator(null); setShowIndicatorModal(true); }} size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Incluir gráfico
              </Button>
            )}
            {project?.project_indicators && project.project_indicators.length > 0 && (
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-1" disabled={isExportingPDF}>
                <FileDown className="h-4 w-4" />
                {isExportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            )}
            <Button onClick={handleExportIndicators} variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={handleImportIndicators} variant="outline" size="sm" className="gap-1">
              <Upload className="h-4 w-4" />
              Importar Excel
            </Button>
            <input
              id="indicator-import-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFileChange}
            />
          </div>
          {project?.project_indicators && project.project_indicators.length > 0 ? (
            <div ref={indicatorsContainerRef} className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {canEdit && (
                <Card className="border-dashed border-2 flex items-center justify-center min-h-[220px]">
                  <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
                    <span className="text-sm text-muted-foreground">Crie um novo indicador diretamente por aqui.</span>
                    <Button onClick={() => { setEditingIndicator(null); setShowIndicatorModal(true); }} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar indicador
                    </Button>
                  </CardContent>
                </Card>
              )}
              {project.project_indicators.map(indicator => (
                <Card key={indicator.id} className="chart-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{indicator.title}</CardTitle>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingIndicator(indicator); setShowIndicatorModal(true); }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (window.confirm('Tem certeza que deseja deletar este indicador?')) {
                            deleteProjectIndicator(project.id, indicator.id);
                          }
                        }} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <IndicatorChart indicator={indicator} />
                    {indicator.observations && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-700 mb-1">Análise Exxata</p>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{indicator.observations}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum indicador cadastrado para este projeto.</p>
              {canEdit && (
                <>
                  <p className="text-sm mt-2">Clique em "Incluir gráfico" para adicionar o primeiro indicador.</p>
                  <Button
                    className="mt-6 gap-2"
                    onClick={() => {
                      setEditingIndicator(null);
                      setShowIndicatorModal(true);
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Incluir gráfico
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Modal para adicionar/editar indicador */}
          {showIndicatorModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl bg-white">
                <CardHeader>
                  <CardTitle>{editingIndicator ? 'Editar Indicador' : 'Adicionar Indicador'}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4"
                    onClick={() => { setShowIndicatorModal(false); setEditingIndicator(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
                  <IndicatorModalForm 
                    project={project}
                    indicator={editingIndicator}
                    onSave={async (indicatorData) => {
                      try {
                        if (editingIndicator) {
                          await updateProjectIndicator(project.id, editingIndicator.id, indicatorData);
                        } else {
                          await addProjectIndicator(project.id, indicatorData);
                        }
                        setShowIndicatorModal(false);
                        setEditingIndicator(null);
                      } catch (error) {
                        console.error('Erro ao salvar indicador:', error);
                        alert('Erro ao salvar indicador. Tente novamente.');
                      }
                    }}
                    onClose={() => { setShowIndicatorModal(false); setEditingIndicator(null); }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ... */}
        <TabsContent value="documents" className="pl-4 pb-8">
          {(() => {
            const allFiles = Array.isArray(project.files) ? project.files : [];
            const qClient = searchClient.trim().toLowerCase();
            const clientFiles = allFiles
              .filter(f => f.source === 'client')
              .filter(f => {
                const name = (f.name || '').toLowerCase();
                const ext = (f.ext || '').toLowerCase();
                const uploader = (f.uploadedBy?.name || '').toLowerCase();
                return !qClient || name.includes(qClient) || ext.includes(qClient) || uploader.includes(qClient);
              });
            const qExxata = searchExxata.trim().toLowerCase();
            const exxataFiles = allFiles
              .filter(f => f.source === 'exxata')
              .filter(f => {
                const name = (f.name || '').toLowerCase();
                const ext = (f.ext || '').toLowerCase();
                const uploader = (f.uploadedBy?.name || '').toLowerCase();
                return !qExxata || name.includes(qExxata) || ext.includes(qExxata) || uploader.includes(qExxata);
              });
            return (
              <div className="grid gap-6 md:grid-cols-1">
                {/* Documentos enviados pela Exxata */}
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Enviados pela Exxata</CardTitle>
                    <CardDescription>Arquivos produzidos pela equipe Exxata.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Busca */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Buscar arquivo..."
                          className="w-full pl-8"
                          value={searchExxata}
                          onChange={(e) => { setSearchExxata(e.target.value); setExxataPage(1); }}
                        />
                      </div>

                      {/* Upload drag-and-drop + botão */}
                      <div
                        onDragOver={canUploadTo('exxata') ? (e) => { e.preventDefault(); setDragOverSource('exxata'); } : undefined}
                        onDragLeave={canUploadTo('exxata') ? () => setDragOverSource(null) : undefined}
                        onDrop={canUploadTo('exxata') ? (e) => onDropFiles(e, 'exxata') : undefined}
                        className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                          canUploadTo('exxata')
                            ? (dragOverSource === 'exxata' ? 'border-exxata-red bg-red-50/30' : 'border-slate-200 bg-slate-50')
                            : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <Upload className="h-5 w-5 mx-auto text-slate-500" />
                        <p className="mt-2 text-sm text-slate-600">{canUploadTo('exxata') ? 'Arraste e solte arquivos aqui' : 'Seu perfil não pode enviar arquivos nesta seção'}</p>
                        {canUploadTo('exxata') && (
                          <div className="mt-2">
                            <input
                              id="file-input-exxata"
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => onBrowseInputChange(e, 'exxata')}
                            />
                            <Button
                              type="button"
                              className="bg-exxata-red hover:bg-red-700 text-white"
                              onClick={() => document.getElementById('file-input-exxata')?.click()}
                            >
                              Adicionar arquivo
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Lista de arquivos */}
                      <div className="space-y-3">
                        {exxataFiles.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum arquivo enviado ainda.</p>
                        ) : (
                          (() => {
                            const exxataTotalPages = Math.max(1, Math.ceil(exxataFiles.length / FILES_PAGE_SIZE));
                            const exxataPageSafe = Math.min(exxataPage, exxataTotalPages);
                            const exxataStart = (exxataPageSafe - 1) * FILES_PAGE_SIZE;
                            const exxataVisible = exxataFiles.slice(exxataStart, exxataStart + FILES_PAGE_SIZE);
                            return (
                              <>
                                {exxataVisible.map((file) => (
                                  <div key={file.id} className="border rounded-lg p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileKindIcon ext={file.ext} />
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                      {(file.ext || 'FILE').toUpperCase()}
                                    </span>
                                    <div>
                                      <button className="font-medium text-blue-700 hover:underline" onClick={() => triggerDownload(file)}>
                                        {file.original_name || file.name}
                                      </button>
                                      <div className="text-xs text-slate-500">
                                        {formatBytes(file.size)} • Enviado por {file.uploadedBy?.name || 'Usuário'}{file.author && file.author.name && file.author.name !== file.uploadedBy?.name ? ` • Autor ${file.author.name}` : ''} • {new Date(file.uploadedAt).toLocaleString('pt-BR')}
                                      </div>
                                    </div>
                                  </div>
                              <div className="flex items-center">
                                <Button variant="outline" size="sm" onClick={() => triggerDownload(file)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </Button>
                                {canDeleteFiles && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-2 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => {
                                      if (window.confirm(`Excluir o arquivo "${file.name}"?`)) {
                                        deleteProjectFile(project.id, file.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                )}
                              </div>
                            </div>
                                ))}
                                <div className="flex items-center justify-between pt-2">
                                  <div className="text-xs text-slate-500">
                                    {exxataFiles.length > 0
                                      ? `Mostrando ${exxataStart + 1}-${Math.min(exxataFiles.length, exxataStart + FILES_PAGE_SIZE)} de ${exxataFiles.length}`
                                      : 'Mostrando 0 de 0'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={exxataPageSafe <= 1} onClick={() => setExxataPage(p => Math.max(1, p - 1))}>Anterior</Button>
                                    <span className="text-xs">{exxataPageSafe} / {exxataTotalPages}</span>
                                    <Button variant="outline" size="sm" disabled={exxataPageSafe >= exxataTotalPages} onClick={() => setExxataPage(p => Math.min(exxataTotalPages, p + 1))}>Próxima</Button>
                                  </div>
                                </div>
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="team" className="pl-4 pb-8">
          {showAddMember && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddMember(false)} />
              <Card className="relative z-50 w-full max-w-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-exxata-red" /> Adicionar membro ao projeto
                  </CardTitle>
                  <CardDescription>Selecione um usuário já cadastrado na plataforma para incluir neste projeto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar por nome ou e-mail"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar por empresa"
                      value={searchCompany}
                      onChange={(e) => setSearchCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder={availableUsers.length ? 'Selecione um usuário' : 'Nenhum usuário disponível'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => {
                          const uid = String(u.id ?? u.user_id ?? '');
                          return (
                            <SelectItem key={uid || u.email} value={uid}>
                              {u.name} <span className="text-slate-500">• {u.email}</span>
                              {u.empresa && <span className="text-slate-400"> • {u.empresa}</span>}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancelar</Button>
                    <Button disabled={!selectedUserId} className="bg-exxata-red hover:bg-red-700 text-white" onClick={handleConfirmAddMember}>Adicionar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Equipe do Projeto</CardTitle>
              <CardDescription>Gerencie os membros da equipe e suas permissões.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {membersLoading ? (
                  <div className="p-4 border rounded-lg text-sm text-slate-600 bg-slate-50">
                    Carregando membros...
                  </div>
                ) : loadedProjectMembers.length > 0 ? loadedProjectMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-medium text-muted-foreground">
                          {(member.name || member.email || '?').split(' ').map(n => n?.[0] || '').join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                      </div>
                    </div>
                      <div className="flex items-center space-x-2">
                        {member.role && <span className="text-sm text-muted-foreground">{member.role}</span>}
                        <div className="relative member-menu">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setMemberMenuOpen(memberMenuOpen === member.id ? null : member.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {memberMenuOpen === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50">
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => handleRemoveMember(member.user_id || member.id, member.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remover membro
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                  </div>
                )) : (
                  <div className="p-4 border rounded-lg text-sm text-slate-600 bg-slate-50">
                    Nenhum membro neste projeto ainda. Clique em "Adicionar Membro" para incluir alguém da plataforma.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="activities" className="pl-4 pb-8">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>Atividades</CardTitle>
                  <CardDescription>Gerencie as atividades, responsáveis, prazos e visualize o Gantt.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={activityUser} onValueChange={setActivityUser}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {uniqueUsers.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={activityStatus} onValueChange={setActivityStatus}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="A Fazer">A Fazer</SelectItem>
                      <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Data Início:</label>
                    <Input
                      type="date"
                      value={activityStartDate}
                      onChange={(e) => setActivityStartDate(e.target.value)}
                      className="w-[140px] h-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Data Fim:</label>
                    <Input
                      type="date"
                      value={activityEndDate}
                      onChange={(e) => setActivityEndDate(e.target.value)}
                      className="w-[140px] h-9"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button onClick={handleExportActivities} variant="outline" size="sm" className="gap-1">
                      <Download className="h-4 w-4" />
                      Exportar Excel
                    </Button>
                    {canAddActivities && (
                      <Button size="sm" className="gap-1" onClick={() => setShowAddActivity(v => !v)}>
                        <FilePlus2 className="h-4 w-4" />
                        Nova Atividade
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {canAddActivities && showAddActivity && (
                <div className="mb-4 p-4 border rounded-md bg-slate-50">
                  <div className="grid gap-3 md:grid-cols-6">
                    <Input
                      placeholder="ID (ex: 01)"
                      className="md:col-span-1"
                      value={newActivity.customId || ''}
                      onChange={(e) => setNewActivity(a => ({ ...a, customId: e.target.value }))}
                    />
                    <Input
                      placeholder="Título da atividade"
                      className="md:col-span-2"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity(a => ({ ...a, title: e.target.value }))}
                    />
                    <div className="md:col-span-1">
                      <Input
                        list="project-members-list"
                        placeholder="Responsável"
                        value={newActivity.assignedTo}
                        onChange={(e) => setNewActivity(a => ({ ...a, assignedTo: e.target.value }))}
                      />
                    </div>
                    <Input type="date" value={newActivity.startDate} onChange={(e) => setNewActivity(a => ({ ...a, startDate: e.target.value }))} />
                    <Input type="date" value={newActivity.endDate} onChange={(e) => setNewActivity(a => ({ ...a, endDate: e.target.value }))} />
                    <Select
                      value={newActivity.status}
                      onValueChange={(v) => setNewActivity(a => ({ ...a, status: v }))}
                    >
                      <SelectTrigger className="md:col-span-1"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A Fazer">A Fazer</SelectItem>
                        <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancelar</Button>
                    <Button className="bg-exxata-red hover:bg-red-700 text-white" onClick={handleCreateActivity}>Salvar</Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Tabela de atividades */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Cabeçalhos clicáveis para ordenação */}
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-slate-600 grid grid-cols-12 gap-2">
                    <div 
                      className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('customId')}
                    >
                      ID
                      {sortField === 'customId' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div 
                      className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('title')}
                    >
                      Atividade
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div 
                      className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('assignedTo')}
                    >
                      Responsável
                      {sortField === 'assignedTo' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div 
                      className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('startDate')}
                    >
                      Início
                      {sortField === 'startDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div 
                      className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('endDate')}
                    >
                      Fim
                      {sortField === 'endDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div 
                      className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    <div className="col-span-1 text-center text-slate-500">
                      Ações
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {sortedActivities.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-slate-500">Nenhuma atividade.</div>
                    ) : (
                      sortedActivities.map((a, i) => (
                        <div key={a.id} className="px-3 border-t grid grid-cols-12 items-center min-h-11 gap-2">
                          {/* ID da atividade - editável */}
                          <div className="col-span-1">
                            {editingActivity === a.id && editingField === 'customId' ? (
                              <Input
                                defaultValue={getActivityDisplayId(a)}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit(a.id, 'customId', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                onBlur={(e) => saveEdit(a.id, 'customId', e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="text-xs cursor-pointer hover:bg-slate-50 p-1 rounded font-mono"
                                title="Clique para editar ID"
                                onClick={() => canEdit && startEditing(a, 'customId')}
                              >
                                {getActivityDisplayId(a)}
                              </div>
                            )}
                          </div>

                          {/* Título da atividade - editável */}
                          <div className="col-span-3">
                            {editingActivity === a.id && editingField === 'title' ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  defaultValue={a.title}
                                  className="h-8 text-xs"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveEdit(a.id, 'title', e.target.value);
                                    } else if (e.key === 'Escape') {
                                      cancelEdit();
                                    }
                                  }}
                                  onBlur={(e) => saveEdit(a.id, 'title', e.target.value)}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div 
                                className="truncate cursor-pointer hover:bg-slate-50 p-1 rounded"
                                title={`${a.title} (clique para editar)`}
                                onClick={() => canEdit && startEditing(a, 'title')}
                              >
                                {a.title}
                              </div>
                            )}
                          </div>

                          {/* Responsável - editável */}
                          <div className="col-span-2">
                            {editingActivity === a.id && editingField === 'assignedTo' ? (
                              <Input
                                list="project-members-list"
                                defaultValue={a.assignedTo}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit(a.id, 'assignedTo', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                onBlur={(e) => saveEdit(a.id, 'assignedTo', e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="truncate cursor-pointer hover:bg-slate-50 p-1 rounded"
                                title={`${a.assignedTo} (clique para editar)`}
                                onClick={() => canEdit && startEditing(a, 'assignedTo')}
                              >
                                {a.assignedTo}
                              </div>
                            )}
                          </div>

                          {/* Data de início - editável */}
                          <div className="col-span-2">
                            {editingActivity === a.id && editingField === 'startDate' ? (
                              <Input
                                type="date"
                                defaultValue={a.startDate}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit(a.id, 'startDate', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                onBlur={(e) => saveEdit(a.id, 'startDate', e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="text-xs cursor-pointer hover:bg-slate-50 p-1 rounded"
                                title="Clique para editar"
                                onClick={() => canEdit && startEditing(a, 'startDate')}
                              >
                                {new Date(a.startDate).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {/* Data de fim - editável */}
                          <div className="col-span-2">
                            {editingActivity === a.id && editingField === 'endDate' ? (
                              <Input
                                type="date"
                                defaultValue={a.endDate}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit(a.id, 'endDate', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                onBlur={(e) => saveEdit(a.id, 'endDate', e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="text-xs cursor-pointer hover:bg-slate-50 p-1 rounded"
                                title="Clique para editar"
                                onClick={() => canEdit && startEditing(a, 'endDate')}
                              >
                                {new Date(a.endDate).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {/* Status - editável */}
                          <div className="col-span-1 flex items-center">
                            {editingActivity === a.id && editingField === 'status' ? (
                              <Select
                                defaultValue={a.status}
                                onValueChange={(value) => saveEdit(a.id, 'status', value)}
                              >
                                <SelectTrigger className="h-8 text-xs w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A Fazer">A Fazer</SelectItem>
                                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                                  <SelectItem value="Concluída">Concluída</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded"
                                title="Clique para editar"
                                onClick={() => canEdit && startEditing(a, 'status')}
                              >
                                <span className={`h-2 w-2 rounded-full ${statusColorClass(a.status)}`}></span>
                                <span className="truncate">{a.status}</span>
                              </span>
                            )}
                          </div>

                          {/* Coluna de ações */}
                          <div className="col-span-1 flex items-center justify-center gap-1">
                            {canAddActivities && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600 hover:bg-blue-50"
                                  title="Duplicar atividade"
                                  onClick={() => duplicateActivity(a)}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-600 hover:bg-red-50"
                                  title="Excluir atividade"
                                  onClick={() => {
                                    if (window.confirm(`Excluir a atividade "${a.title}"?`)) {
                                      deleteProjectActivity(project.id, a.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Gantt alinhado */}
                <div>
                  <div
                    className="relative border border-slate-200 rounded-lg p-4 overflow-hidden"
                    style={{ height: `${(sortedActivities.length || 1) * 44 + 56}px` }}
                  >
                    {/* Week grid */}
                    <div className="absolute left-0 right-0 top-6 bottom-4">
                      {weeks.map((w, idx) => {
                        const left = Math.max(0, Math.min(100, (((w - rangeStart) / dayMs) / totalDays) * 100));
                        return (
                          <div
                            key={`grid-${idx}`}
                            className="absolute top-0 bottom-0 border-l border-slate-200"
                            style={{ left: `${left}%` }}
                          />
                        );
                      })}
                      {showToday && (
                        <div
                          className="absolute top-0 bottom-0 border-l-2 border-exxata-red/70"
                          style={{ left: `${Math.max(0, Math.min(100, (((today - rangeStart) / dayMs) / totalDays) * 100))}%` }}
                        />
                      )}
                    </div>

                    {/* Week labels */}
                    <div className="absolute left-0 right-0 top-0 h-6 text-[11px] text-slate-500">
                      {weeks.map((w, idx) => {
                        const left = Math.max(0, Math.min(100, (((w - rangeStart) / dayMs) / totalDays) * 100));
                        return (
                          <div key={`label-${idx}`} className="absolute -translate-x-1/2" style={{ left: `${left}%` }}>
                            {w.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bars alinhadas à ordem da tabela */}
                    {sortedActivities.map((a, i) => {
                      const offDays = Math.max(0, Math.floor((parseDate(a.startDate) - rangeStart) / dayMs));
                      const durDays = Math.max(1, Math.floor((parseDate(a.endDate) - parseDate(a.startDate)) / dayMs) + 1);
                      const left = (offDays / totalDays) * 100;
                      const width = (durDays / totalDays) * 100;
                      return (
                        <div
                          key={a.id}
                          className="absolute left-0 right-0"
                          style={{ top: `${i * 44 + 40}px`, height: '36px' }}
                        >
                          <div
                            className={`absolute h-2 rounded ${statusColorClass(a.status)}`}
                            style={{ left: `${left}%`, width: `${width}%`, top: '8px' }}
                            title={`${a.title} • ${a.assignedTo}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><span className="h-2 w-4 rounded bg-slate-400 inline-block"/> A Fazer</div>
                    <div className="flex items-center gap-2"><span className="h-2 w-4 rounded bg-blue-600 inline-block"/> Em Progresso</div>
                    <div className="flex items-center gap-2"><span className="h-2 w-4 rounded bg-green-600 inline-block"/> Concluída</div>
                  </div>
                  <div className="text-slate-500">Linha vermelha: hoje</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PANORAMA ATUAL */}
        <TabsContent value="panorama" className="pl-4 pb-8">
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPanorama}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            {canManageInsights && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => panoramaImportInputRef.current?.click()}
                  className="gap-1"
                >
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </Button>
                <input
                  ref={panoramaImportInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportPanorama}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: 'tecnica', title: 'Aspectos de Ordem Técnica' },
              { key: 'fisica', title: 'Aspectos de Ordem Física' },
              { key: 'economica', title: 'Aspectos de Ordem Econômica' },
            ].map(({ key, title }) => {
              const section = getPanoramaSection(key);
              return (
                <Card key={key} className={`border ${statusBorderClass(section.status)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{title}</CardTitle>
                      {canManageInsights ? (
                        <div className="flex items-center gap-2">
                          {['green','yellow','red'].map(color => (
                            <button
                              key={color}
                              title={color === 'green' ? 'Verde' : color === 'yellow' ? 'Amarelo' : 'Vermelho'}
                              className={`h-5 w-5 rounded-full border-2 ${statusDotClass(color)} ${section.status===color? 'ring-2 ring-offset-2 ring-slate-300': 'border-slate-300'} cursor-pointer hover:scale-110 transition-transform`}
                              onClick={() => updatePanoramaStatus(project.id, key, color)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-6 w-6 rounded-full border-2 ${statusDotClass(section.status)}`}
                            title={section.status === 'green' ? 'Verde' : section.status === 'yellow' ? 'Amarelo' : 'Vermelho'}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {section.items.length === 0 && (
                        <div className="text-sm text-slate-500">Nenhum item.</div>
                      )}
                      {section.items.map((it) => (
                        <div key={it.id} className="flex items-start gap-2">
                          <span className="mt-2 h-[2px] w-4 bg-slate-400 inline-block" />
                          {canManageInsights ? (
                            <div className="flex-1 flex items-start gap-2">
                              <Input
                                defaultValue={it.text || ''}
                                onBlur={(e) => updatePanoramaItem(project.id, key, it.id, e.target.value)}
                                placeholder="Descreva o ponto"
                                className="text-sm"
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7 text-red-600 hover:bg-red-50" 
                                title="Excluir" 
                                onClick={() => deletePanoramaItem(project.id, key, it.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap flex-1">{it.text}</div>
                          )}
                        </div>
                      ))}
                      {canManageInsights && (
                        <Button onClick={() => addPanoramaItem(project.id, key, 'Novo item')} size="sm">Adicionar item</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="pl-4 pb-8">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Análise Preditiva */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-exxata-red" />
                  Análise Preditiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canManageInsights ? (
                  <div className="space-y-2">
                    <textarea
                      defaultValue={project.aiPredictiveText || ''}
                      onBlur={(e) => handlePredictiveTextBlur(e.target.value)}
                      className="w-full min-h-[120px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a análise preditiva aqui"
                    />
                    <p className="text-xs text-slate-500">As alterações são salvas ao sair do campo.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{project.aiPredictiveText || 'Nenhuma análise preditiva disponível.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Condutas */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-exxata-red" />
                  Condutas
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportConducts}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Exportar Excel
                  </Button>
                  {canManageInsights && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => conductsImportInputRef.current?.click()}
                        className="gap-1"
                      >
                        <Upload className="h-4 w-4" />
                        Importar Excel
                      </Button>
                      <input
                        ref={conductsImportInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportConducts}
                        style={{ display: 'none' }}
                      />
                      <Button size="sm" onClick={addConduct}>Adicionar</Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-slate-600 grid grid-cols-12">
                    <div className="col-span-9">Conduta</div>
                    <div 
                      className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-900"
                      onClick={() => {
                        setConductSortOrder(prev => 
                          prev === 'none' ? 'asc' : 
                          prev === 'asc' ? 'desc' : 
                          'none'
                        );
                      }}
                    >
                      Urgência
                      {conductSortOrder === 'asc' && <ChevronUp className="h-3 w-3" />}
                      {conductSortOrder === 'desc' && <ChevronDown className="h-3 w-3" />}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(!Array.isArray(project.conducts) || project.conducts.length === 0) ? (
                      <div className="px-3 py-4 text-sm text-slate-500">Nenhuma conduta cadastrada.</div>
                    ) : (
                      (() => {
                        const urgencyOrder = { 'Crise': 5, 'Complexo': 4, 'Complicado': 3, 'Difícil': 2, 'Fácil': 1 };
                        let sortedConducts = [...project.conducts];
                        
                        if (conductSortOrder === 'asc') {
                          sortedConducts.sort((a, b) => 
                            (urgencyOrder[a.urgency] || 0) - (urgencyOrder[b.urgency] || 0)
                          );
                        } else if (conductSortOrder === 'desc') {
                          sortedConducts.sort((a, b) => 
                            (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0)
                          );
                        }
                        
                        return sortedConducts.map((c) => (
                        <div
                          key={c.id}
                          className={`px-3 border-t grid grid-cols-12 items-center gap-2 py-2 ${dragOverConductId === c.id ? 'bg-slate-50' : ''}`}
                          draggable={canManageInsights}
                          onDragStart={(e) => onDragStartConduct(e, c.id)}
                          onDragOver={onDragOverConduct}
                          onDrop={(e) => onDropConduct(e, c.id)}
                          onDragEnter={() => setDragOverConductId(c.id)}
                          onDragLeave={() => setDragOverConductId(null)}
                        >
                          <div className="col-span-9 flex items-start gap-2 pr-4">
                            {canManageInsights && (
                              <GripVertical className="h-4 w-4 text-slate-400 cursor-move mt-2" title="Arrastar para reordenar" />
                            )}
                            <div className="flex-1 min-w-0">
                              {canManageInsights ? (
                                <textarea
                                  defaultValue={c.text || ''}
                                  onBlur={(e) => updateConduct(c.id, { text: e.target.value })}
                                  placeholder="Descreva a conduta"
                                  className="w-full min-h-[40px] max-h-[120px] resize-none border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={1}
                                  style={{ overflow: 'hidden' }}
                                  onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                  }}
                                />
                              ) : (
                                <div className="text-sm whitespace-pre-wrap break-words">{c.text || '—'}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-span-3 flex items-center justify-end gap-2">
                            {canManageInsights ? (
                              <>
                                <Select value={c.urgency || 'Difícil'} onValueChange={(v) => updateConduct(c.id, { urgency: v })}>
                                  <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Urgência" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Fácil">Fácil</SelectItem>
                                    <SelectItem value="Difícil">Difícil</SelectItem>
                                    <SelectItem value="Complicado">Complicado</SelectItem>
                                    <SelectItem value="Complexo">Complexo</SelectItem>
                                    <SelectItem value="Crise">Crise</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicar" onClick={() => duplicateConduct(c.id)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" title="Excluir" onClick={() => deleteConduct(c.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span 
                                className={`text-xs font-medium px-2 py-1 rounded ${
                                  c.urgency === 'Crise' ? 'bg-red-700 text-white' :
                                  c.urgency === 'Complexo' ? 'bg-red-500 text-white' :
                                  c.urgency === 'Complicado' ? 'bg-orange-500 text-white' :
                                  c.urgency === 'Difícil' ? 'bg-blue-400 text-white' :
                                  c.urgency === 'Fácil' ? 'bg-blue-600 text-white' :
                                  'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {c.urgency || 'Difícil'}
                              </span>
                            )}
                          </div>
                        </div>
                        ));
                      })()
                    )}
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
