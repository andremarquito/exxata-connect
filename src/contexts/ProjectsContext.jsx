import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { conductService, activityService, fileService, indicatorService, panoramaService } from '@/services/supabaseService';

const STORAGE_KEY = 'exxata_projects';

export const ProjectsContext = createContext(null);

const seedProjects = [
  {
    id: 1,
    name: 'Otimização de Contratos - Projeto Ferroviário Carajás',
    client: 'Vale S.A.',
    status: 'Em Andamento',
    progress: 75,
    contractValue: 'R$ 15.000.000',
    location: 'Parauapebas, PA',
    phase: 'Contratual',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    description: 'Análise e otimização de contratos de construção e manutenção da malha ferroviária de Carajás, visando redução de pleitos e eficiência operacional.',
    createdBy: 1,
    team: [{ id: 1, name: 'Carlos Silva' }, { id: 2, name: 'Ana Oliveira' }],
    aiPredictiveText: 'Com base na experiência Exxata, o projeto tem 85% de probabilidade de ser concluído dentro do prazo, com redução de 40% no risco de pleitos contratuais em obras de infraestrutura.',
    conducts: [
      { id: 101, text: 'Revisar cláusula 5.2 do contrato para evitar ambiguidades', urgency: 'Imediato', priority: 'Alta' },
      { id: 102, text: 'Agendar reunião com o time jurídico para análise de riscos', urgency: 'Planejado', priority: 'Média' },
    ],
    panorama: {
      tecnica: { status: 'yellow', items: [ { id: 1001, text: 'Revisões sucessivas de projetos em frentes específicas.' } ] },
      fisica: { status: 'green', items: [] },
      economica: { status: 'red', items: [ { id: 1002, text: 'Impacto financeiro por revisões e ACT 2024/2026.' } ] },
    }
  },
  {
    id: 2,
    name: 'Gestão de Riscos - Empreendimento de Saneamento Básico',
    client: 'Concessionária Águas Limpas',
    status: 'Planejamento',
    progress: 30,
    contractValue: 'R$ 8.500.000',
    location: 'São José dos Campos, SP',
    phase: 'Pré-contratual',
    startDate: '2024-03-10',
    endDate: '2024-12-15',
    description: 'Gestão de riscos para empreendimento de saneamento básico.',
    createdBy: 1,
    team: [{ id: 3, name: 'Pedro Santos' }],
    aiPredictiveText: 'Análise preditiva inicial não informada.',
    conducts: [],
    panorama: {
      tecnica: { status: 'yellow', items: [] },
      fisica: { status: 'green', items: [] },
      economica: { status: 'yellow', items: [] },
    }
  },
  {
    id: 3,
    name: 'Revisão Contratual - Complexo Minerário Itabira',
    client: 'Vale S.A.',
    status: 'Concluído',
    progress: 100,
    contractValue: 'R$ 5.200.000',
    location: 'Itabira, MG',
    phase: 'Pós-contratual',
    startDate: '2023-01-15',
    endDate: '2023-12-10',
    description: 'Revisão contratual de complexos minerários.',
    createdBy: 1,
    team: [{ id: 2, name: 'Ana Oliveira' }],
    aiPredictiveText: 'Projeto concluído: consolidar lições aprendidas e recomendações.',
    conducts: [],
    panorama: {
      tecnica: { status: 'green', items: [] },
      fisica: { status: 'green', items: [] },
      economica: { status: 'green', items: [] },
    }
  },
  {
    id: 4,
    name: 'Due Diligence - Projeto Rodoviário BR-101',
    client: 'Construtora Rodovia Segura',
    status: 'Em Andamento',
    progress: 55,
    contractValue: 'R$ 12.000.000',
    location: 'Região Sul, BR',
    phase: 'Contratual',
    startDate: '2024-06-01',
    endDate: '2025-05-30',
    description: 'Due diligence contratual para projeto rodoviário.',
    createdBy: 1,
    team: [{ id: 4, name: 'Mariana Costa' }],
    aiPredictiveText: 'Projeto em andamento: manter monitoramento de riscos críticos.',
    conducts: [],
    panorama: {
      tecnica: { status: 'yellow', items: [] },
      fisica: { status: 'yellow', items: [] },
      economica: { status: 'yellow', items: [] },
    }
  }
];

// Funções para integração com Supabase
const loadProjectsFromSupabase = async (userId, userRole) => {
  try {
    // Carregando projetos do Supabase
    
    let data, error;
    const normalizedRole = (userRole || '').toLowerCase();
    const roleWithoutSpaces = normalizedRole.replace(/\s+/g, '');
    const isClient = roleWithoutSpaces === 'cliente' || roleWithoutSpaces === 'client';
    const isCollaborator = ['colaborador', 'collaborator', 'consultor', 'consultant'].includes(roleWithoutSpaces);
    
    // Verificando permissões do usuário
    
    // Estratégia unificada: sempre usar consultas diretas que funcionam com RLS
    // Usando consultas diretas com RLS
    
    let basicResult;
    
    if (isClient || isCollaborator) {
      // Para clientes e colaboradores: carregar projetos diretamente via RLS (sem pré-busca em project_members)
      // Usuário com acesso restrito

      basicResult = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            user_id,
            project_id,
            role,
            profiles!project_members_user_id_fkey (
              id,
              name,
              email,
              role,
              status
            )
          ),
          project_activities_old:project_activities_old(
            id,
            custom_id,
            name,
            responsible,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
          ),
          project_files(
            id,
            name,
            file_path,
            file_size,
            mime_type,
            created_at,
            uploaded_by,
            source,
            original_name,
            extension,
            storage_path,
            uploaded_at,
            metadata,
            category
          ),
          project_indicators(
            id,
            title,
            chart_type,
            datasets,
            labels,
            options,
            created_at,
            updated_at
          )
        `);

      // Projetos carregados via RLS
    } else {
      // Para admins/managers: buscar TODOS os projetos (RLS já controla acesso)
      // Carregar membros via JOIN diretamente
      // Usuário staff detectado
      basicResult = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            user_id,
            project_id,
            role,
            profiles!project_members_user_id_fkey (
              id,
              name,
              email,
              role,
              status
            )
          ),
          project_activities_old:project_activities_old(
            id,
            custom_id,
            name,
            responsible,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
          ),
          project_files(
            id,
            name,
            file_path,
            file_size,
            mime_type,
            created_at,
            uploaded_by,
            source,
            original_name,
            extension,
            storage_path,
            uploaded_at,
            metadata,
            category
          ),
          project_indicators(
            id,
            title,
            chart_type,
            datasets,
            labels,
            options,
            created_at,
            updated_at
          )
        `);
        // Removido .eq('created_by', userId) - RLS já controla o acesso
    }
      
    data = basicResult.data;
    error = basicResult.error;

    if (error) {
      console.error('Erro ao carregar projetos do Supabase:', error);
      // Se a tabela não existir, retornar null para usar fallback
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.log('📝 Tabela projects não existe no Supabase, usando dados locais');
        return null;
      }
      return null;
    }

    // Projetos carregados do Supabase

    // Se não há dados, usar fallback
    if (!data || data.length === 0) {
      console.log('📝 Nenhum projeto encontrado no Supabase, usando dados locais');
      return null;
    }

    // Converter dados do Supabase para formato local (baseado no schema real)
    const convertedProjects = data.map(project => ({
      id: project.id,
      name: project.name || 'Projeto sem nome',
      client: project.client || 'Cliente não informado',
      status: project.status || 'Planejamento',
      progress: project.progress || 0,
      contractValue: project.contract_value || 'R$ 0,00',
      measuredValue: project.measured_value || '',
      location: project.location || '',
      phase: project.phase || 'Contratual',
      startDate: project.start_date || '',
      endDate: project.end_date || '',
      executionStartDate: project.execution_start_date || '',
      executionEndDate: project.execution_end_date || '',
      contractSignatureDate: project.contract_signature_date || '',
      osSignatureDate: project.os_signature_date || '',
      reportCutoffDate: project.report_cutoff_date || '',
      description: project.description || '',
      hourlyRate: project.hourly_rate || '0',
      disputedAmount: project.disputed_amount || '0',
      contractSummary: project.contract_summary || '',
      billingProgress: project.billing_progress || 0,
      sector: project.sector || '',
      exxataActivities: Array.isArray(project.exxata_activities) ? project.exxata_activities : [],
      createdBy: project.created_by,
      team: [], // Team vem da tabela project_members, será carregado separadamente
      aiPredictiveText: project.ai_predictive_text || '',
      //  MEMBROS AGORA CARREGAM VIA JOIN em project_members
      members: project.project_members && Array.isArray(project.project_members) 
        ? project.project_members.map(member => ({
          // keep both id and user_id for compatibility with visibility checks
          id: member.user_id ?? member.id,
          user_id: member.user_id ?? member.id,
          name: member.profiles?.name || member.profiles?.email?.split('@')[0] || 'Usuário',
          email: member.profiles?.email || '',
          role: member.profiles?.role || member.role || 'member',
          status: member.profiles?.status || 'Ativo',
          addedAt: member.added_at,
          addedBy: member.added_by
        })) : [],

      //  CONDUTAS AGORA CARREGAM VIA VIEW (se disponível)
      conducts: project.conducts ?
        Array.isArray(project.conducts) ? project.conducts.map(conduct => ({
          id: conduct.id,
          content: conduct.content,
          urgency: conduct.urgency || 'Difícil',
          order: conduct.display_order || 0,
          createdAt: conduct.created_at,
          createdBy: conduct.created_by
        })) : [] : [],
      panorama: {
        tecnica: { status: 'green', items: [] },
        fisica: { status: 'green', items: [] },
        economica: { status: 'green', items: [] },
      },
      overviewConfig: project.overview_config || project.overview_cards || { widgets: [], layouts: {} },
      tabsConfig: project.tabs_config || {
        overview: true,
        onboarding: true,
        documents: true,
        team: true,
        activities: true,
        indicators: true,
        panorama: true,
        'ai-insights': true
      },
      physicalProgressReal: project.physical_progress_real || 0,
      physicalProgressContract: project.physical_progress_contract || 0,
      billingProgressContract: project.billing_progress_contract || 0,
      activities: (project.project_activities || []).map(act => ({
        id: act.id,
        seq: act.custom_id || act.id,
        title: act.name,
        assignedTo: act.responsible,
        status: act.status,
        startDate: act.start_date,
        endDate: act.end_date,
        description: '',
        createdBy: project.created_by,
        createdAt: act.created_at,
      })),
      files: (project.project_files || []).map(file => ({
        id: file.id,
        name: file.name,
        original_name: file.original_name || file.name,
        size: file.size_bytes || file.file_size,
        type: file.mime_type,
        ext: file.extension || (file.name ? file.name.split('.').pop() : ''),
        source: file.source || 'supabase',
        url: file.file_path,
        storagePath: file.storage_path,
        uploadedBy: file.uploaded_by,
        author: file.uploaded_by,
        uploadedAt: file.uploaded_at || file.created_at,
        category: file.category,
      })),
      indicators: (project.project_indicators || []).map(ind => ({
        id: ind.id,
        title: ind.title,
        type: ind.chart_type || 'bar',
        labels: ind.labels || [],
        datasets: ind.datasets || [],
        notes: '',
        createdBy: project.created_by,
        createdAt: ind.created_at,
      })),
      source: 'supabase',
    }));

    return convertedProjects;
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    return null;
  }
};

const saveProjectToSupabase = async (project) => {
  try {
    console.log('💾 Tentando salvar projeto no Supabase:', project.name);
    
    // Usar o projectService que já tem a lógica completa e atualizada
    const { projectService } = await import('@/services/supabaseService');
    
    // Preparar dados do projeto no formato esperado pelo service
    const projectData = {
      name: project.name,
      client: project.client,
      description: project.description,
      location: project.location,
      contractValue: project.contractValue,
      startDate: project.startDate,
      endDate: project.endDate,
      sector: project.sector,
      phase: project.phase,
      status: project.status,
      hourlyRate: project.hourlyRate,
      disputedAmount: project.disputedAmount,
      contractSummary: project.contractSummary,
      billingProgress: project.billingProgress,
      exxataActivities: project.exxataActivities,
      conducts: project.conducts,
      panorama: project.panorama,
      overviewCards: project.overviewConfig,
      aiPredictiveText: project.aiPredictiveText
    };
    
    const data = await projectService.createProject(projectData);
    console.log('✅ Projeto salvo no Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('Erro ao salvar projeto no Supabase:', error);
    // Se a tabela não existir, retornar null para usar apenas localStorage
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('📝 Tabela projects não existe, salvando apenas localmente');
      return null;
    }
    return null;
  }
};

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar projetos
  const loadProjects = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar se o user.id é um UUID válido (Supabase) ou ID local
      // Usar uma verificação mais simples: se o ID parece ser UUID, tentar Supabase
      const isSupabaseUser = typeof user.id === 'string' && user.id.length > 10 && user.id.includes('-');
      // Verificando tipo de usuário

      if (isSupabaseUser) {
        // Carregando projetos do Supabase
        // Tentar carregar do Supabase primeiro
        const supabaseProjects = await loadProjectsFromSupabase(user.id, user.role);

        if (supabaseProjects && supabaseProjects.length > 0) {
          setProjects(supabaseProjects);
          // Projetos carregados com sucesso
          return;
        }
      } else {
        // Usuário local detectado
      }

      // Fallback para localStorage
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setProjects(data);
          console.log('Projetos carregados do localStorage:', data.length);
        } catch {
          setProjects(seedProjects);
          console.log('Usando projetos seed');
        }
      } else {
        setProjects(seedProjects);
        console.log('Usando projetos seed');
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      // Fallback para localStorage em caso de erro
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setProjects(data);
        } catch {
          setProjects(seedProjects);
        }
      } else {
        setProjects(seedProjects);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const createProject = async (payload) => {
    const newProject = {
      id: Date.now(), // Temporário, será substituído pelo ID do Supabase
      name: payload.name,
      client: payload.client,
      status: 'Planejamento',
      progress: 0,
      contractValue: payload.contractValue || 'R$ 0,00',
      location: payload.location || '',
      phase: 'Pré-contratual',
      startDate: payload.startDate || '',
      endDate: payload.endDate || '',
      description: payload.description || '',
      hourlyRate: payload.hourlyRate || '0',
      disputedAmount: payload.disputedAmount || '0',
      contractSummary: payload.contractSummary || '',
      billingProgress: Number(payload.billingProgress ?? 0) || 0,
      sector: payload.sector || '',
      exxataActivities: Array.isArray(payload.exxataActivities) ? payload.exxataActivities : [],
      createdBy: user?.id ?? null,
      team: payload.team || [],
      files: [],
      activities: [],
      indicators: [],
      aiPredictiveText: payload.aiPredictiveText || '',
      conducts: Array.isArray(payload.conducts) ? payload.conducts : [],
      panorama: payload.panorama || {
        tecnica: { status: 'green', items: [] },
        fisica: { status: 'green', items: [] },
        economica: { status: 'green', items: [] },
      },
      overviewConfig: { widgets: [], layouts: {} },
    };

    try {
      // Tentar salvar no Supabase primeiro
      const savedProject = await saveProjectToSupabase(newProject);
      
      if (savedProject) {
        // Usar ID do Supabase
        newProject.id = savedProject.id;
        console.log('Projeto salvo no Supabase:', savedProject.id);
      } else {
        console.log('Projeto salvo apenas localmente');
      }
    } catch (error) {
      console.error('Erro ao salvar projeto no Supabase:', error);
    }

    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id, patch) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  // Função para atualizar projeto no backend e estado local
  const updateProjectBackend = async (id, patch) => {
    try {
      console.log('💾 Salvando projeto no Supabase:', { id, patch });

      // Preparar dados para o Supabase
      const supabaseData = {};

      // Mapear campos do patch para os nomes corretos do Supabase
      if (patch.overviewConfig !== undefined) {
        supabaseData.overview_config = patch.overviewConfig;
      }

      if (patch.tabsConfig !== undefined) {
        supabaseData.tabs_config = patch.tabsConfig;
      }

      if (patch.contract_value !== undefined) {
        supabaseData.contract_value = patch.contract_value;
      }

      if (patch.location !== undefined) {
        supabaseData.location = patch.location;
      }

      if (patch.description !== undefined) {
        supabaseData.description = patch.description;
      }

      if (patch.startDate !== undefined) {
        supabaseData.start_date = patch.startDate;
      }

      if (patch.endDate !== undefined) {
        supabaseData.end_date = patch.endDate;
      }

      if (patch.contractSummary !== undefined) {
        supabaseData.contract_summary = patch.contractSummary;
      }

      if (patch.hourlyRate !== undefined) {
        supabaseData.hourly_rate = patch.hourlyRate;
      }

      if (patch.disputedAmount !== undefined) {
        supabaseData.disputed_amount = patch.disputedAmount;
      }

      if (patch.billing_progress !== undefined) {
        supabaseData.billing_progress = patch.billing_progress;
      }

      if (patch.billingProgress !== undefined) {
        supabaseData.billing_progress = patch.billingProgress;
      }

      if (patch.billingProgressContract !== undefined) {
        supabaseData.billing_progress_contract = patch.billingProgressContract;
      }

      if (patch.progress !== undefined) {
        supabaseData.progress = patch.progress;
      }

      if (patch.physicalProgressReal !== undefined) {
        supabaseData.physical_progress_real = patch.physicalProgressReal;
      }

      if (patch.physicalProgressContract !== undefined) {
        supabaseData.physical_progress_contract = patch.physicalProgressContract;
      }

      if (patch.sector !== undefined) {
        supabaseData.sector = patch.sector;
      }

      if (patch.status !== undefined) {
        supabaseData.status = patch.status;
      }

      if (patch.aiPredictiveText !== undefined) {
        supabaseData.ai_predictive_text = patch.aiPredictiveText;
      }

      if (patch.name !== undefined) {
        supabaseData.name = patch.name;
      }

      if (patch.client !== undefined) {
        supabaseData.client = patch.client;
      }

      if (patch.contractValue !== undefined) {
        supabaseData.contract_value = patch.contractValue;
      }

      if (patch.measuredValue !== undefined) {
        supabaseData.measured_value = patch.measuredValue;
      }

      if (patch.executionStartDate !== undefined) {
        supabaseData.execution_start_date = patch.executionStartDate;
      }

      if (patch.executionEndDate !== undefined) {
        supabaseData.execution_end_date = patch.executionEndDate;
      }

      if (patch.contractSignatureDate !== undefined) {
        supabaseData.contract_signature_date = patch.contractSignatureDate;
      }

      if (patch.osSignatureDate !== undefined) {
        supabaseData.os_signature_date = patch.osSignatureDate;
      }

      if (patch.reportCutoffDate !== undefined) {
        supabaseData.report_cutoff_date = patch.reportCutoffDate;
      }

      if (patch.exxataActivities !== undefined) {
        supabaseData.exxata_activities = patch.exxataActivities;
      }

      // Adicionar timestamp de atualização e usuário
      supabaseData.updated_at = new Date().toISOString();
      if (user?.id) {
        supabaseData.updated_by = user.id;
      }

      // Salvar no Supabase
      const { error } = await supabase
        .from('projects')
        .update(supabaseData)
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao salvar projeto no Supabase:', error);
        throw new Error(`Erro ao salvar projeto: ${error.message}`);
      }

      console.log('✅ Projeto salvo com sucesso no Supabase');

      // Atualizar estado local
      updateProject(id, patch);

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      const { projectService } = await import('@/services/supabaseService');

      console.log('🗑️ Removendo projeto do Supabase:', id);
      await projectService.deleteProject(id);

      // Atualiza store local para remoção imediata
      setProjects(prev => prev.filter(p => String(p.id) !== String(id)));

      // Recarrega lista para garantir consistência (membros, relacionamentos, etc.)
      await refreshProjects();
    } catch (error) {
      console.error('Erro ao remover projeto:', error);
      throw error;
    }
  };

  const getProjectById = (id) => projects.find(p => String(p.id) === String(id));

  // Função helper para retry em caso de timeout de autenticação
  const withAuthRetry = async (operation, maxRetries = 1) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`❌ Tentativa ${attempt + 1} falhou:`, error);

      // Verificar se é erro de autenticação que pode ser resolvido com retry
      if ((error.message?.includes('Auth operation timeout') ||
           error.message?.includes('timeout') ||
           error.code === 'PGRST301') && attempt < maxRetries) {

        console.log('🔄 Tentando refresh da sessão e retry...');

        try {
          // Tentar refresh da sessão
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('✅ Sessão válida encontrada, aguardando e tentando novamente...');
            // Aguardar um pouco antes do retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue; // Próxima tentativa
          } else {
            console.log('❌ Sessão expirada, não é possível fazer retry');
            throw error;
          }
        } catch (sessionError) {
          console.error('❌ Erro ao verificar sessão:', sessionError);
          throw error;
        }
      } else {
        // Não é um erro que pode ser resolvido com retry ou esgotou as tentativas
        throw error;
      }
    }
  }
};
  
  const addProjectActivity = async (projectId, payload) => {
    try {
      console.log('📅 Adicionando atividade ao projeto:', { projectId, payload });
      
      const newActivity = await activityService.createActivity(projectId, {
        customId: payload.customId,
        title: payload.title,
        assignedTo: payload.assignedTo,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: payload.status || 'A Fazer'
      });

      console.log('✅ Atividade criada:', newActivity);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const activities = Array.isArray(p.activities) ? p.activities : [];
        return {
          ...p,
          activities: [...activities, {
            id: newActivity.id,
            customId: newActivity.custom_id,
            title: newActivity.name,
            assignedTo: newActivity.responsible,
            startDate: newActivity.start_date,
            endDate: newActivity.end_date,
            status: newActivity.status,
            createdAt: newActivity.created_at
          }]
        };
      }));
      
      return newActivity;
    } catch (error) {
      console.error('❌ Erro ao adicionar atividade:', error);
      throw error;
    }
  };

  const deleteProjectActivity = async (projectId, activityId) => {
    try {
      console.log('📅 Deletando atividade:', { projectId, activityId });

      await activityService.deleteActivity(activityId);

      console.log('✅ Atividade deletada com sucesso');

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const activities = Array.isArray(p.activities) ? p.activities : [];
        return {
          ...p,
          activities: activities.filter(a => a.id !== activityId)
        };
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar atividade:', error);
      throw error;
    }
  };

  const updateProjectActivity = async (projectId, activityId, patch) => {
    return await withAuthRetry(async () => {
      console.log('📅 Atualizando atividade:', { projectId, activityId, patch });

      const updatedActivity = await activityService.updateActivity(activityId, patch);

      console.log('✅ Atividade atualizada:', updatedActivity);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const activities = Array.isArray(p.activities) ? p.activities : [];
        return {
          ...p,
          activities: activities.map(a =>
            a.id === activityId
              ? {
                  ...a,
                  customId: updatedActivity.custom_id,
                  title: updatedActivity.name,
                  assignedTo: updatedActivity.responsible,
                  startDate: updatedActivity.start_date,
                  endDate: updatedActivity.end_date,
                  status: updatedActivity.status
                }
              : a
          )
        };
      }));

      return updatedActivity;
    });
  };

  const duplicateProjectActivity = async (projectId, activityId) => {
    try {
      console.log('📅 Duplicando atividade:', { projectId, activityId });
      
      const duplicated = await activityService.duplicateActivity(activityId);

      console.log('✅ Atividade duplicada:', duplicated);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const activities = Array.isArray(p.activities) ? p.activities : [];
        return {
          ...p,
          activities: [...activities, {
            id: duplicated.id,
            customId: duplicated.custom_id,
            title: duplicated.name,
            assignedTo: duplicated.responsible,
            startDate: duplicated.start_date,
            endDate: duplicated.end_date,
            status: duplicated.status,
            createdAt: duplicated.created_at
          }]
        };
      }));
      
      return duplicated;
    } catch (error) {
      console.error('❌ Erro ao duplicar atividade:', error);
      throw error;
    }
  };

  const getProjectActivities = async (projectId) => {
    try {
      console.log('📅 Buscando atividades do projeto:', projectId);
      
      const activities = await activityService.getProjectActivities(projectId);

      console.log('✅ Atividades encontradas:', activities?.length || 0);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        return {
          ...p,
          activities: activities.map(a => ({
            id: a.id,
            customId: a.custom_id,
            title: a.name,
            assignedTo: a.responsible,
            startDate: a.start_date,
            endDate: a.end_date,
            status: a.status,
            createdAt: a.created_at
          }))
        };
      }));
      
      return activities;
    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      return [];
    }
  };

  // ========================================
  // 🔧 FUNÇÕES PARA ARQUIVOS DE PROJETO
  // ========================================

  const addProjectFile = async (projectId, file, source = 'exxata') => {
    try {
      console.log('📁 Fazendo upload de arquivo:', { projectId, fileName: file.name, source });

      const uploadedFile = await fileService.uploadFile(projectId, file, source);

      console.log('✅ Arquivo enviado com sucesso:', uploadedFile);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const files = Array.isArray(p.files) ? p.files : [];
        return {
          ...p,
          files: [uploadedFile, ...files]
        };
      }));

      return uploadedFile;
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo:', error);
      throw error;
    }
  };

  const deleteProjectFile = async (projectId, fileId) => {
    try {
      console.log('📁 Deletando arquivo:', { projectId, fileId });

      await fileService.deleteFile(fileId);

      console.log('✅ Arquivo deletado com sucesso');

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const files = Array.isArray(p.files) ? p.files : [];
        return {
          ...p,
          files: files.filter(f => f.id !== fileId)
        };
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      throw error;
    }
  };

  const getProjectFiles = async (projectId) => {
    try {
      console.log('📁 Buscando arquivos do projeto:', projectId);

      const files = await fileService.getProjectFiles(projectId);

      console.log('✅ Arquivos encontrados:', files?.length || 0);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        return {
          ...p,
          files: files.map(f => ({
            id: f.id,
            name: f.original_name || f.name,
            size: f.size_bytes,
            type: f.mime_type,
            ext: f.extension,
            source: f.source,
            url: f.storage_path, // Para compatibilidade com a UI existente
            uploadedAt: f.uploaded_at || f.created_at,
            uploadedBy: f.uploaded_by,
            author: f.uploaded_by,
            storagePath: f.storage_path, // Para obter URLs públicas
            metadata: f.metadata,
            category: f.category || null
          }))
        };
      }));

      return files;
    } catch (error) {
      console.error('❌ Erro ao buscar arquivos:', error);
      return [];
    }
  };

  const getFileUrl = async (storagePath) => {
    try {
      return await fileService.getFileUrl(storagePath);
    } catch (error) {
      console.error('❌ Erro ao obter URL do arquivo:', error);
      return null;
    }
  };

  // ========================================
  // 🔧 FUNÇÕES PARA INDICADORES DE PROJETO
  // ========================================

  const addProjectIndicator = async (projectId, indicatorData) => {
    try {
      console.log('📊 Criando indicador:', { projectId, indicatorData });

      const newIndicator = await indicatorService.createIndicator(projectId, indicatorData);

      console.log('✅ Indicador criado:', newIndicator);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const indicators = Array.isArray(p.project_indicators) ? p.project_indicators : [];
        return {
          ...p,
          project_indicators: [...indicators, newIndicator]
        };
      }));

      return newIndicator;
    } catch (error) {
      console.error('❌ Erro ao criar indicador:', error);
      throw error;
    }
  };

  const updateProjectIndicator = async (projectId, indicatorId, updates) => {
    try {
      console.log('📊 Atualizando indicador:', { projectId, indicatorId, updates });

      const updatedIndicator = await indicatorService.updateIndicator(indicatorId, updates);

      console.log('✅ Indicador atualizado:', updatedIndicator);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const indicators = Array.isArray(p.project_indicators) ? p.project_indicators : [];
        return {
          ...p,
          project_indicators: indicators.map(i => 
            i.id === indicatorId ? updatedIndicator : i
          )
        };
      }));

      return updatedIndicator;
    } catch (error) {
      console.error('❌ Erro ao atualizar indicador:', error);
      throw error;
    }
  };

  const deleteProjectIndicator = async (projectId, indicatorId) => {
    try {
      console.log('📊 Deletando indicador:', { projectId, indicatorId });

      await indicatorService.deleteIndicator(indicatorId);

      console.log('✅ Indicador deletado com sucesso');

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const indicators = Array.isArray(p.project_indicators) ? p.project_indicators : [];
        return {
          ...p,
          project_indicators: indicators.filter(i => i.id !== indicatorId)
        };
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar indicador:', error);
      throw error;
    }
  };

  const getProjectIndicators = async (projectId) => {
    try {
      console.log('📊 Buscando indicadores do projeto:', projectId);

      const indicators = await indicatorService.getProjectIndicators(projectId);

      console.log('✅ Indicadores encontrados:', indicators?.length || 0);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        return {
          ...p,
          project_indicators: indicators
        };
      }));

      return indicators;
    } catch (error) {
      console.error('❌ Erro ao buscar indicadores:', error);
      return [];
    }
  };

  const reorderProjectIndicators = async (projectId, newOrder) => {
    try {
      console.log('📊 Reordenando indicadores:', { projectId, newOrder });

      await indicatorService.reorderIndicators(projectId, newOrder);

      console.log('✅ Indicadores reordenados com sucesso');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar indicadores:', error);
      throw error;
    }
  };

  // Função para recarregar projetos (usada pelos componentes)
  const refreshProjects = async () => {
    console.log('🔄 Recarregando projetos...');
    await loadProjects();
  };

  // ========================================
  // 🔧 FUNÇÕES PARA PANORAMA ATUAL
  // ========================================

  const getProjectPanorama = async (projectId) => {
    try {
      console.log('📊 Buscando panorama do projeto:', projectId);

      const panorama = await panoramaService.getProjectPanorama(projectId);

      console.log('✅ Panorama encontrado:', panorama);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        return {
          ...p,
          panorama: panorama
        };
      }));

      return panorama;
    } catch (error) {
      console.error('❌ Erro ao buscar panorama:', error);
      return {
        tecnica: { status: 'green', items: [] },
        fisica: { status: 'green', items: [] },
        economica: { status: 'green', items: [] }
      };
    }
  };

  const updatePanoramaStatus = async (projectId, sectionKey, status) => {
    try {
      console.log('📊 Atualizando status do panorama:', { projectId, sectionKey, status });

      const result = await panoramaService.updatePanoramaStatus(projectId, sectionKey, status);

      console.log('✅ Status do panorama atualizado:', result);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const currentPanorama = p.panorama || {};
        return {
          ...p,
          panorama: {
            ...currentPanorama,
            [sectionKey]: {
              ...currentPanorama[sectionKey],
              status: status
            }
          }
        };
      }));

      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do panorama:', error);
      throw error;
    }
  };

  const addPanoramaItem = async (projectId, sectionKey, text) => {
    try {
      console.log('📊 Adicionando item ao panorama:', { projectId, sectionKey, text });

      const newItem = await panoramaService.addPanoramaItem(projectId, sectionKey, text);

      console.log('✅ Item adicionado ao panorama:', newItem);

      // Atualizar estado local
      setProjects(prev => {
        const updatedProjects = [...prev];
        const projectIndex = updatedProjects.findIndex(p => String(p.id) === String(projectId));
        if (projectIndex !== -1) {
          const project = updatedProjects[projectIndex];
          const currentPanorama = project.panorama || {};
          const currentSection = currentPanorama[sectionKey] || { status: 'green', items: [] };
          const newPanorama = {
            ...currentPanorama,
            [sectionKey]: {
              ...currentSection,
              items: [...currentSection.items, newItem]
            }
          };
          updatedProjects[projectIndex] = {
            ...project,
            panorama: newPanorama
          };
        }
        return updatedProjects;
      });

      return newItem;
    } catch (error) {
      console.error('❌ Erro ao adicionar item ao panorama:', error);
      throw error;
    }
  };

  const updatePanoramaItem = async (projectId, sectionKey, itemId, text) => {
    try {
      console.log('📊 Atualizando item do panorama:', { projectId, sectionKey, itemId, text });

      const result = await panoramaService.updatePanoramaItem(projectId, sectionKey, itemId, text);

      console.log('✅ Item do panorama atualizado:', result);

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const currentPanorama = p.panorama || {};
        const currentSection = currentPanorama[sectionKey] || { status: 'green', items: [] };
        return {
          ...p,
          panorama: {
            ...currentPanorama,
            [sectionKey]: {
              ...currentSection,
              items: currentSection.items.map(item =>
                item.id === itemId ? { ...item, text } : item
              )
            }
          }
        };
      }));

      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar item do panorama:', error);
      throw error;
    }
  };

  const deletePanoramaItem = async (projectId, sectionKey, itemId) => {
    try {
      console.log('📊 Deletando item do panorama:', { projectId, sectionKey, itemId });

      const result = await panoramaService.deletePanoramaItem(projectId, sectionKey, itemId);

      console.log('✅ Item do panorama deletado');

      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const currentPanorama = p.panorama || {};
        const currentSection = currentPanorama[sectionKey] || { status: 'green', items: [] };
        return {
          ...p,
          panorama: {
            ...currentPanorama,
            [sectionKey]: {
              ...currentSection,
              items: currentSection.items.filter(item => item.id !== itemId)
            }
          }
        };
      }));

      return result;
    } catch (error) {
      console.error('❌ Erro ao deletar item do panorama:', error);
      throw error;
    }
  };

  const userCanSeeProject = (p) => {
    try {
      if (!user) return false;
      const role = (user.role || '').toLowerCase();
      const userId = String(user.id);
      const createdBy = p?.createdBy != null ? String(p.createdBy) : '';

      // Log removido para evitar poluição do console

      if (role === 'admin' || role === 'administrador' || role === 'manager' || role === 'gerente') return true;
      if (createdBy && createdBy === userId) return true;

      // Verificar membros do projeto (tanto id quanto user_id) como string
      const members = Array.isArray(p?.members) ? p.members : [];
      // Verificando membros do projeto
      
      if (members.length > 0) {
        const isMember = members.some(m => {
          const mid = m?.user_id != null ? String(m.user_id) : (m?.id != null ? String(m.id) : null);
          // Comparando IDs
          return mid === userId;
        });
        if (isMember) {
          return true;
        }
      }

      // Verificar time legado
      const team = Array.isArray(p?.team) ? p.team : [];
      if (team.length > 0) {
        const inTeam = team.some(u => u && String(u.id) === userId);
        if (inTeam) return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar permissões do projeto:', error);
      return false; // Fallback para não mostrar o projeto
    }
  };
  // 🔧 FUNÇÕES PARA MEMBROS DE PROJETO
  // ========================================

  const addProjectMember = async (projectId, userId, role = 'member') => {
    try {
      console.log('👥 Adicionando membro ao projeto:', { projectId, userId, role });
      
      // Usar insert direto na tabela project_members
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId, // Usar project_id ao invés de project
          user_id: userId,
          role: role,
          added_by: user?.id,
          added_at: new Date().toISOString()
        })
        .select('*');

      if (error) {
        console.error('❌ Erro ao adicionar membro:', error);
        throw new Error(`Erro ao adicionar membro: ${error.message}`);
      }

      console.log('✅ Membro adicionado com sucesso:', data);
      
      // Recarregar projetos para atualizar a UI
      loadProjects();
      
      return { success: true, member: data[0] };
    } catch (error) {
      console.error('❌ Erro ao adicionar membro:', error);
      throw error;
    }
  };

  const removeProjectMember = async (projectId, userId) => {
    try {
      console.log('👥 Removendo membro do projeto:', { projectId, userId });
      
      // Usar delete direto na tabela project_members
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId) // Usar project_id ao invés de project
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao remover membro:', error);
        throw new Error(`Erro ao remover membro: ${error.message}`);
      }

      console.log('✅ Membro removido com sucesso');
      
      // Recarregar projetos para atualizar a UI
      loadProjects();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      throw error;
    }
  };

  const getProjectMembers = async (projectId) => {
    try {
      console.log('🔍 INICIANDO getProjectMembers para projeto:', projectId);
      
      // Buscar membros diretamente da tabela com JOIN para profiles
      // Especificar explicitamente qual relação usar para evitar ambiguidade
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles:profiles!project_members_user_id_fkey (
            id,
            name,
            email,
            role,
            status
          ),
          added_by_profile:profiles!project_members_added_by_fkey (
            id,
            name,
            email
          )
        `)
        .eq('project_id', projectId); // Usar project_id ao invés de project

      if (error) {
        console.error('❌ ERRO AO BUSCAR MEMBROS:', error);
        console.error('❌ DETALHES DO ERRO:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('✅ MEMBROS ENCONTRADOS:', data?.length || 0);
      console.log('📋 DADOS DOS MEMBROS:', data?.map(m => ({
        user_id: m.user_id,
        role: m.role,
        profile_name: m.profiles?.name,
        profile_email: m.profiles?.email,
        has_profiles: !!m.profiles
      })));
      console.log('📦 DADOS COMPLETOS:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar membros:', error);
      return [];
    }
  };

  const loadProjectMembers = async (projectId) => {
    try {
      console.log('🚀 INICIANDO loadProjectMembers para projeto:', projectId);
      
      const members = await getProjectMembers(projectId);
      
      console.log('✅ MEMBROS CARREGADOS:', members?.length || 0);
      console.log('📦 MEMBROS COMPLETOS:', members);
      return members;
    } catch (error) {
      console.error('❌ ERRO ao carregar membros:', error);
      return [];
    }
  };

  // ========================================
  // 🔧 FUNÇÕES PARA CONDUTAS DE PROJETO
  // ========================================
  
  const addProjectConduct = async (projectId, conductData) => {
    try {
      console.log('📋 Adicionando conduta ao projeto:', { projectId, conductData });
      
      // Obter a ordem máxima atual
      const project = getProjectById(projectId);
      const currentConducts = Array.isArray(project?.conducts) ? project.conducts : [];
      const maxOrder = currentConducts.reduce((max, c) => Math.max(max, c.order || 0), -1);
      
      const newConduct = await conductService.createConduct(projectId, {
        content: conductData.text || conductData.content || '',
        urgency: conductData.urgency || 'Difícil',
        display_order: maxOrder + 1
      });

      console.log('✅ Conduta adicionada com sucesso:', newConduct);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const conducts = Array.isArray(p.conducts) ? p.conducts : [];
        return {
          ...p,
          conducts: [...conducts, {
            id: newConduct.id,
            text: newConduct.content,
            urgency: newConduct.urgency,
            order: newConduct.display_order,
            createdAt: newConduct.created_at,
            createdBy: newConduct.created_by
          }]
        };
      }));
      
      return newConduct;
    } catch (error) {
      console.error('❌ Erro ao adicionar conduta:', error);
      throw error;
    }
  };

  const updateProjectConduct = async (projectId, conductId, updates) => {
    try {
      console.log('📋 Atualizando conduta:', { projectId, conductId, updates });
      
      // Mapear campos do formato local para Supabase
      const supabaseUpdates = {};
      if (updates.text !== undefined) supabaseUpdates.content = updates.text;
      if (updates.urgency !== undefined) supabaseUpdates.urgency = updates.urgency;
      if (updates.order !== undefined) supabaseUpdates.display_order = updates.order;
      
      const updatedConduct = await conductService.updateConduct(conductId, supabaseUpdates);

      console.log('✅ Conduta atualizada com sucesso:', updatedConduct);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const conducts = Array.isArray(p.conducts) ? p.conducts : [];
        return {
          ...p,
          conducts: conducts.map(c => 
            c.id === conductId 
              ? {
                  ...c,
                  text: updatedConduct.content,
                  urgency: updatedConduct.urgency,
                  order: updatedConduct.display_order
                }
              : c
          )
        };
      }));
      
      return updatedConduct;
    } catch (error) {
      console.error('❌ Erro ao atualizar conduta:', error);
      throw error;
    }
  };

  const deleteProjectConduct = async (projectId, conductId) => {
    try {
      console.log('📋 Deletando conduta:', { projectId, conductId });
      
      await conductService.deleteConduct(conductId);

      console.log('✅ Conduta deletada com sucesso');
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const conducts = Array.isArray(p.conducts) ? p.conducts : [];
        return {
          ...p,
          conducts: conducts.filter(c => c.id !== conductId)
        };
      }));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar conduta:', error);
      throw error;
    }
  };

  const reorderProjectConducts = async (projectId, newOrder) => {
    try {
      console.log('📋 Reordenando condutas:', { projectId, newOrder });
      
      await conductService.reorderConducts(projectId, newOrder);

      console.log('✅ Condutas reordenadas com sucesso');
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        const conducts = Array.isArray(p.conducts) ? p.conducts : [];
        const reordered = newOrder.map((id, index) => {
          const conduct = conducts.find(c => c.id === id);
          return conduct ? { ...conduct, order: index } : null;
        }).filter(Boolean);
        return { ...p, conducts: reordered };
      }));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar condutas:', error);
      throw error;
    }
  };

  const getProjectConducts = async (projectId) => {
    try {
      console.log('📋 Buscando condutas do projeto:', projectId);
      
      const conducts = await conductService.getProjectConducts(projectId);

      console.log('✅ Condutas encontradas:', conducts?.length || 0);
      
      // Atualizar estado local
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(projectId)) return p;
        return {
          ...p,
          conducts: conducts.map(c => ({
            id: c.id,
            text: c.content,
            urgency: c.urgency,
            order: c.display_order,
            createdAt: c.created_at,
            createdBy: c.created_by
          }))
        };
      }));
      
      return conducts;
    } catch (error) {
      console.error('❌ Erro ao buscar condutas:', error);
      return [];
    }
  };

  const value = useMemo(() => ({
    projects,
    isLoading,
    createProject,
    updateProject,
    updateProjectBackend,
    deleteProject,
    addProjectFile,
    deleteProjectFile,
    getProjectFiles,
    getFileUrl,
    addProjectActivity,
    updateProjectActivity,
    deleteProjectActivity,
    duplicateProjectActivity,
    getProjectActivities,
    addProjectIndicator,
    updateProjectIndicator,
    deleteProjectIndicator,
    getProjectIndicators,
    reorderProjectIndicators,
    refreshProjects,
    getProjectById,
    userCanSeeProject,
    // 🆕 Funções para membros de projeto
    addProjectMember,
    removeProjectMember,
    getProjectMembers,
    loadProjectMembers,
    // 🆕 Funções para condutas de projeto
    addProjectConduct,
    updateProjectConduct,
    deleteProjectConduct,
    reorderProjectConducts,
    getProjectConducts,
    // 🆕 Funções para panorama atual
    getProjectPanorama,
    updatePanoramaStatus,
    addPanoramaItem,
    updatePanoramaItem,
    deletePanoramaItem,
  }), [projects, isLoading, user]);

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects deve ser usado dentro de ProjectsProvider');
  return ctx;
};
