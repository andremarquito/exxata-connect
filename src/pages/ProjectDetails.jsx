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
  ChevronUp, ChevronDown, Check, Copy as CopyIcon, MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useState, useEffect } from 'react';
import OverviewGrid from '@/components/projects/OverviewGridSimple';
import IndicatorsTab from '@/components/projects/IndicatorsTab';

// Componente do Modal para Adicionar/Editar Indicador
const IndicatorModalForm = ({ project, indicator, onClose, onSave }) => {
  const [title, setTitle] = useState(indicator?.title || '');
  const [chartType, setChartType] = useState(indicator?.chart_type || 'bar');
  const [labels, setLabels] = useState(indicator?.labels?.join(', ') || '');
  const [datasets, setDatasets] = useState(indicator?.datasets || [{ name: '', values: '', color: '#8884d8' }]);

  const handleDatasetChange = (index, field, value) => {
    const newDatasets = [...datasets];
    newDatasets[index][field] = value;
    setDatasets(newDatasets);
  };

  const addDataset = () => {
    setDatasets([...datasets, { name: '', values: '', color: '#82ca9d' }]);
  };

  const removeDataset = (index) => {
    const newDatasets = datasets.filter((_, i) => i !== index);
    setDatasets(newDatasets);
  };

  const handleSave = async () => {
    const processedData = {
      title,
      chart_type: chartType,
      labels: labels.split(',').map(l => l.trim()),
      datasets: datasets.map(ds => ({
        ...ds,
        values: ds.values.split(',').map(v => parseFloat(v.trim()) || 0)
      })),
      options: {},
    };

    onSave(processedData);
  };

  return (
    <>
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
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rótulos (separados por vírgula)</label>
        <input value={labels} onChange={(e) => setLabels(e.target.value)} className="w-full p-2 border rounded" placeholder="Ex: Jan, Fev, Mar"/>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">Conjunto de Dados</h3>
        {datasets.map((ds, index) => (
          <div key={index} className="p-3 border rounded space-y-2 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={ds.name} onChange={(e) => handleDatasetChange(index, 'name', e.target.value)} placeholder="Nome da Série" className="p-2 border rounded" />
              <input value={ds.values} onChange={(e) => handleDatasetChange(index, 'values', e.target.value)} placeholder="Valores (ex: 10,20,30)" className="p-2 border rounded" />
              <input type="color" value={ds.color} onChange={(e) => handleDatasetChange(index, 'color', e.target.value)} className="p-1 h-10 w-full border rounded" />
            </div>
            {datasets.length > 1 && (
              <button onClick={() => removeDataset(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addDataset}>Adicionar Série</Button>
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
  const [activeTab, setActiveTab] = useState('overview');
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

  // Filtros do Gantt
  const [activityStatus, setActivityStatus] = useState('all');
  const [activityUser, setActivityUser] = useState('all');

  // Estados para ordenação e edição da tabela
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [dragOverConductId, setDragOverConductId] = useState(null);

  // Projeto vindo do contexto (persistido em localStorage)
  const { 
    getProjectById, 
    updateProject, 
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
  } = useProjects();
  const project = getProjectById(projectId);
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const isCollaborator = userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant';
  const canEdit = isAdmin || isManager || hasPermission('edit_projects');
  // Consultor/Admin podem editar textos da aba Inteligência Humana
  const canManageInsights = canEdit || ['consultant', 'consultor'].includes((user?.role || '').toLowerCase());

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

  const filteredActivities = activities.filter(a =>
    (activityStatus === 'all' || a.status === activityStatus) &&
    (activityUser === 'all' || a.assignedTo === activityUser)
  );

  const sortedActivities = sortActivities(filteredActivities, sortField, sortDirection);

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
  const parseDate = (d) => new Date(d);
  let defaultStart = new Date(project.startDate);
  if (isNaN(defaultStart)) defaultStart = new Date();
  let defaultEnd = new Date(project.endDate);
  if (isNaN(defaultEnd)) defaultEnd = addDays(defaultStart, 30);
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
  const canAddActivities = user && !(((user?.role || '').toLowerCase() === 'client') || ((user?.role || '').toLowerCase() === 'cliente'));

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
        urgency: 'Normal'
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

  // Arquivos: helpers e permissões
  const FILES_PAGE_SIZE = 10;
  const isClientUser = ((user?.role || '').toLowerCase() === 'client' || (user?.role || '').toLowerCase() === 'cliente');
  const canUploadTo = (source) => !isClientUser || source === 'client';
  const canDeleteFiles = isAdmin || isManager || hasPermission('delete_projects') || hasPermission('edit_projects');

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
      const url = await getFileUrl(file.storagePath);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name || file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
    });
  const handleRemoveMember = async (memberId, memberName) => {
    if (!canEdit) {
      alert('Você não tem permissão para remover membros do projeto.');
      return;
    }

    const confirmed = window.confirm(`Tem certeza que deseja remover "${memberName}" deste projeto?`);
    if (!confirmed) return;

    try {
      await removeProjectMember(project.id, memberId);
      
      // Atualizar estado local removendo o membro
      setLoadedProjectMembers(prev => prev.filter(m => String(m.user_id || m.id) !== String(memberId)));
      setProjectMembers(prev => prev.filter(m => String(m.user_id || m.id) !== String(memberId)));
      
      setMemberMenuOpen(null);
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

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
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
          
          {activeTab === 'team' && (
            <Button onClick={() => setShowAddMember(true)} size="sm" className="gap-1 bg-exxata-red hover:bg-red-700 text-white">
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          )}

          {activeTab === 'indicators' && (
            <Button onClick={() => { setEditingIndicator(null); setShowIndicatorModal(true); }} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Incluir gráfico
            </Button>
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <OverviewGrid 
            project={project} 
            user={user} 
            canEdit={canEdit} 
            updateProject={updateProject} 
          />
        </TabsContent>

        {/* INDICADORES */}
        <TabsContent value="indicators" className="space-y-4">
          {project?.project_indicators && project.project_indicators.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {project.project_indicators.map(indicator => (
                <Card key={indicator.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{indicator.title}</CardTitle>
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
                  </CardHeader>
                  <CardContent>
                    <IndicatorChart indicator={indicator} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum indicador cadastrado para este projeto.</p>
              <p className="text-sm mt-2">Clique em "Incluir gráfico" para adicionar o primeiro indicador.</p>
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
        <TabsContent value="documents">
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

        <TabsContent value="team">
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
 
        <TabsContent value="activities">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>Atividades</CardTitle>
                  <CardDescription>Gerencie as atividades, responsáveis, prazos e visualize o Gantt.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
                  {canAddActivities && (
                    <Button size="sm" className="gap-1" onClick={() => setShowAddActivity(v => !v)}>
                      <FilePlus2 className="h-4 w-4" />
                      Nova Atividade
                    </Button>
                  )}
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
        <TabsContent value="panorama">
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
                      <div className="flex items-center gap-2">
                        {['green','yellow','red'].map(color => (
                          <button
                            key={color}
                            title={color === 'green' ? 'Verde' : color === 'yellow' ? 'Amarelo' : 'Vermelho'}
                            className={`h-5 w-5 rounded-full border-2 ${statusDotClass(color)} ${section.status===color? 'ring-2 ring-offset-2 ring-slate-300': 'border-slate-300'} ${canManageInsights ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                            onClick={() => canManageInsights && updatePanoramaStatus(project.id, key, color)}
                            disabled={!canManageInsights}
                          />
                        ))}
                      </div>
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

        <TabsContent value="ai-insights">
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
                      defaultValue={project.aiPredictiveText || 'Com base na experiência Exxata, o projeto tem 85% de probabilidade de ser concluído dentro do prazo, com redução de 40% no risco de pleitos contratuais em obras de infraestrutura.'}
                      onBlur={(e) => updateProject(project.id, { aiPredictiveText: e.target.value })}
                      className="w-full min-h-[120px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a análise preditiva aqui"
                    />
                    <p className="text-xs text-slate-500">As alterações são salvas ao sair do campo.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{project.aiPredictiveText || 'Com base na experiência Exxata, o projeto tem 85% de probabilidade de ser concluído dentro do prazo, com redução de 40% no risco de pleitos contratuais em obras de infraestrutura.'}</p>
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
                {canManageInsights && (
                  <Button size="sm" onClick={addConduct}>Adicionar</Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-slate-600 grid grid-cols-12">
                    <div className="col-span-9">Conduta</div>
                    <div className="col-span-3">Urgência</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(!Array.isArray(project.conducts) || project.conducts.length === 0) ? (
                      <div className="px-3 py-4 text-sm text-slate-500">Nenhuma conduta cadastrada.</div>
                    ) : (
                      project.conducts.map((c) => (
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
                                <Select value={c.urgency || 'Normal'} onValueChange={(v) => updateConduct(c.id, { urgency: v })}>
                                  <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Urgência" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Baixa">Baixa</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Crítica">Crítica</SelectItem>
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
                              <span className="text-xs text-slate-600">{c.urgency || 'Normal'}</span>
                            )}
                          </div>
                        </div>
                      ))
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
