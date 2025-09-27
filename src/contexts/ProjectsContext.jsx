import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
const loadProjectsFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_activities(*),
        project_files(*),
        project_indicators(*)
      `)
      .or(`created_by.eq.${userId},team.cs."[{\"id\":\"${userId}\"}]"`);

    if (error) {
      console.error('Erro ao carregar projetos do Supabase:', error);
      return null;
    }

    // Converter dados do Supabase para formato local
    return data.map(project => ({
      id: project.id,
      name: project.name,
      client: project.client,
      status: project.status,
      progress: project.progress,
      contractValue: project.contract_value,
      location: project.location,
      phase: project.phase,
      startDate: project.start_date,
      endDate: project.end_date,
      description: project.description,
      hourlyRate: project.hourly_rate,
      disputedAmount: project.disputed_amount,
      contractSummary: project.contract_summary,
      billingProgress: project.billing_progress,
      sector: project.sector,
      exxataActivities: project.exxata_activities || [],
      createdBy: project.created_by,
      team: project.team || [],
      aiPredictiveText: project.ai_predictive_text,
      conducts: project.conducts || [],
      panorama: project.panorama || {
        tecnica: { status: 'green', items: [] },
        fisica: { status: 'green', items: [] },
        economica: { status: 'green', items: [] },
      },
      overviewConfig: project.overview_config || { widgets: [], layouts: {} },
      activities: (project.project_activities || []).map(act => ({
        id: act.id,
        seq: act.seq,
        title: act.title,
        assignedTo: act.assigned_to,
        status: act.status,
        startDate: act.start_date,
        endDate: act.end_date,
        description: act.description,
        createdBy: act.created_by,
        createdAt: act.created_at,
      })),
      files: (project.project_files || []).map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        ext: file.ext,
        source: file.source,
        url: file.url,
        uploadedBy: file.uploaded_by,
        author: file.author,
        uploadedAt: file.uploaded_at,
      })),
      indicators: (project.project_indicators || []).map(ind => ({
        id: ind.id,
        title: ind.title,
        type: ind.type,
        labels: ind.labels || [],
        datasets: ind.datasets || [],
        notes: ind.notes,
        createdBy: ind.created_by,
        createdAt: ind.created_at,
      })),
    }));
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    return null;
  }
};

const saveProjectToSupabase = async (project) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        client: project.client,
        status: project.status,
        progress: project.progress,
        contract_value: project.contractValue,
        location: project.location,
        phase: project.phase,
        start_date: project.startDate,
        end_date: project.endDate,
        description: project.description,
        hourly_rate: project.hourlyRate,
        disputed_amount: project.disputedAmount,
        contract_summary: project.contractSummary,
        billing_progress: project.billingProgress,
        sector: project.sector,
        exxata_activities: project.exxataActivities,
        ai_predictive_text: project.aiPredictiveText,
        conducts: project.conducts,
        panorama: project.panorama,
        overview_config: project.overviewConfig,
        created_by: project.createdBy,
        team: project.team,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar projeto no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao salvar projeto:', error);
    return null;
  }
};

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Tentar carregar do Supabase primeiro
        const supabaseProjects = await loadProjectsFromSupabase(user.id);
        
        if (supabaseProjects && supabaseProjects.length > 0) {
          setProjects(supabaseProjects);
          console.log('Projetos carregados do Supabase:', supabaseProjects.length);
        } else {
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

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectById = (id) => projects.find(p => p.id === Number(id));

  // Activities helpers
  const addProjectActivity = (projectId, payload) => {
    let created = null;
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.activities) ? p.activities : [];
      const maxSeq = prevList.reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0);
      created = {
        id: Date.now() + Math.random(),
        seq: maxSeq + 1,
        title: payload.title,
        assignedTo: payload.assignedTo,
        status: payload.status || 'A Fazer',
        startDate: payload.startDate,
        endDate: payload.endDate,
        createdAt: new Date().toISOString(),
        createdBy: { id: user?.id ?? null, name: user?.name ?? 'Usuário', email: user?.email ?? '' },
        description: payload.description || '',
      };
      return { ...p, activities: [created, ...prevList] };
    }));
    return created;
  };

  const updateProjectActivity = (projectId, activityId, patch) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.activities) ? p.activities : [];
      return { ...p, activities: prevList.map(a => a.id === activityId ? { ...a, ...patch } : a) };
    }));
  };

  const deleteProjectActivity = (projectId, activityId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.activities) ? p.activities : [];
      return { ...p, activities: prevList.filter(a => a.id !== activityId) };
    }));
  };

  // Duplicate activity: clone with new id and next sequential 'seq', place after the original
  const duplicateProjectActivity = (projectId, activityId) => {
    let created = null;
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.activities) ? p.activities : [];
      const idx = prevList.findIndex(a => a.id === activityId);
      if (idx === -1) return p;
      const src = prevList[idx];
      const maxSeq = prevList.reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0);
      created = {
        ...src,
        id: Date.now() + Math.random(),
        seq: maxSeq + 1,
        title: src.title ? `${src.title} (cópia)` : 'Atividade (cópia)',
        createdAt: new Date().toISOString(),
        createdBy: { id: user?.id ?? null, name: user?.name ?? 'Usuário', email: user?.email ?? '' },
      };
      const next = [
        ...prevList.slice(0, idx + 1),
        created,
        ...prevList.slice(idx + 1),
      ];
      return { ...p, activities: next };
    }));
    return created;
  };

  // Indicators helpers
  const addProjectIndicator = (projectId, payload) => {
    const indicator = {
      id: Date.now() + Math.random(),
      title: payload.title || 'Indicador',
      type: payload.type || 'bar', // 'bar' | 'line' | 'pie'
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      datasets: Array.isArray(payload.datasets) ? payload.datasets : [], // [{ name, color, values: number[] }]
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
      createdBy: { id: user?.id ?? null, name: user?.name ?? 'Usuário', email: user?.email ?? '' },
    };
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.indicators) ? p.indicators : [];
      return { ...p, indicators: [indicator, ...prevList] };
    }));
    return indicator;
  };

  const updateProjectIndicator = (projectId, indicatorId, patch) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.indicators) ? p.indicators : [];
      return { ...p, indicators: prevList.map(i => i.id === indicatorId ? { ...i, ...patch } : i) };
    }));
  };

  const deleteProjectIndicator = (projectId, indicatorId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.indicators) ? p.indicators : [];
      return { ...p, indicators: prevList.filter(i => i.id !== indicatorId) };
    }));
  };

  // Duplicate indicator (clone as a new one, placed right after the original)
  const duplicateProjectIndicator = (projectId, indicatorId) => {
    let created = null;
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevList = Array.isArray(p.indicators) ? p.indicators : [];
      const idx = prevList.findIndex(i => i.id === indicatorId);
      if (idx === -1) return p;
      const src = prevList[idx];
      const copy = {
        ...src,
        id: Date.now() + Math.random(),
        title: src.title ? `${src.title} (cópia)` : 'Indicador (cópia)',
        createdAt: new Date().toISOString(),
        createdBy: { id: user?.id ?? null, name: user?.name ?? 'Usuário', email: user?.email ?? '' },
        labels: Array.isArray(src.labels) ? [...src.labels] : [],
        datasets: Array.isArray(src.datasets) ? src.datasets.map(ds => ({ ...ds, values: Array.isArray(ds.values) ? [...ds.values] : [] })) : [],
      };
      created = copy;
      const next = [
        ...prevList.slice(0, idx + 1),
        copy,
        ...prevList.slice(idx + 1),
      ];
      return { ...p, indicators: next };
    }));
    return created;
  };

  // Reorder indicators moving item from one index to another
  const reorderProjectIndicators = (projectId, fromIndex, toIndex) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const list = Array.isArray(p.indicators) ? [...p.indicators] : [];
      const len = list.length;
      if (len <= 1) return p;
      const f = Math.max(0, Math.min(len - 1, Number(fromIndex)));
      const t = Math.max(0, Math.min(len - 1, Number(toIndex)));
      if (Number.isNaN(f) || Number.isNaN(t) || f === t) return p;
      const [moved] = list.splice(f, 1);
      const insertIndex = f < t ? t - 1 : t;
      list.splice(insertIndex, 0, moved);
      return { ...p, indicators: list };
    }));
  };

  // Helper: convert File to Data URL for local persistence
  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Add a file to a project with metadata. Source: 'client' | 'exxata'
  const addProjectFile = async (projectId, file, source = 'exxata', author) => {
    const project = getProjectById(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    const dataUrl = await fileToDataUrl(file);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const uploadedAt = new Date().toISOString();
    const uploader = author || { id: user?.id ?? null, name: user?.name ?? 'Usuário', email: user?.email ?? '' };
    const fileEntry = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      ext,
      source,
      url: dataUrl,
      uploadedAt,
      uploadedBy: uploader,
      author: uploader,
    };
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevFiles = Array.isArray(p.files) ? p.files : [];
      return { ...p, files: [fileEntry, ...prevFiles] };
    }));
    return fileEntry;
  };

  const deleteProjectFile = (projectId, fileId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== Number(projectId)) return p;
      const prevFiles = Array.isArray(p.files) ? p.files : [];
      return { ...p, files: prevFiles.filter(f => f.id !== fileId) };
    }));
  };

  const getProjectFiles = (projectId) => {
    const p = getProjectById(projectId);
    return Array.isArray(p?.files) ? p.files : [];
  };

  const userCanSeeProject = (p) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (p.createdBy === user.id) return true;
    if (Array.isArray(p.team)) {
      return p.team.some(u => u.id === user.id);
    }
    return false;
  };

  const value = useMemo(() => ({
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    addProjectFile,
    deleteProjectFile,
    getProjectFiles,
    addProjectActivity,
    updateProjectActivity,
    deleteProjectActivity,
    duplicateProjectActivity,
    addProjectIndicator,
    updateProjectIndicator,
    deleteProjectIndicator,
    duplicateProjectIndicator,
    reorderProjectIndicators,
    getProjectById,
    userCanSeeProject,
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
