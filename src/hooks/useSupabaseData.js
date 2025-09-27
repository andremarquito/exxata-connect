// =====================================================
// HOOK CUSTOMIZADO PARA DADOS DO SUPABASE
// Facilita o uso dos serviços em componentes React
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { 
  profileService, 
  projectService, 
  activityService, 
  fileService, 
  indicatorService, 
  conductService,
  utils
} from '@/services/supabaseService';

// =====================================================
// 1. HOOK PARA PROJETOS
// =====================================================

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar projetos
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getUserProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar projeto
  const createProject = useCallback(async (projectData) => {
    try {
      const newProject = await projectService.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Atualizar projeto
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const updatedProject = await projectService.updateProject(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Adicionar membro ao projeto
  const addProjectMember = useCallback(async (projectId, userId, role) => {
    try {
      const member = await projectService.addProjectMember(projectId, userId, role);
      // Atualizar o projeto na lista local
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            project_members: [...(p.project_members || []), member]
          };
        }
        return p;
      }));
      return member;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    addProjectMember
  };
};

// =====================================================
// 2. HOOK PARA PROJETO INDIVIDUAL
// =====================================================

export const useProject = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar projeto
  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectById(projectId);
      setProject(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar projeto:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Atualizar projeto
  const updateProject = useCallback(async (updates) => {
    try {
      const updatedProject = await projectService.updateProject(projectId, updates);
      setProject(prev => ({ ...prev, ...updatedProject }));
      return updatedProject;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    updateProject
  };
};

// =====================================================
// 3. HOOK PARA ATIVIDADES
// =====================================================

export const useActivities = (projectId) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar atividades
  const fetchActivities = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getProjectActivities(projectId);
      setActivities(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Criar atividade
  const createActivity = useCallback(async (activityData) => {
    try {
      const newActivity = await activityService.createActivity(projectId, activityData);
      setActivities(prev => [...prev, newActivity]);
      return newActivity;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  // Atualizar atividade
  const updateActivity = useCallback(async (activityId, updates) => {
    try {
      const updatedActivity = await activityService.updateActivity(activityId, updates);
      setActivities(prev => prev.map(a => a.id === activityId ? updatedActivity : a));
      return updatedActivity;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Deletar atividade
  const deleteActivity = useCallback(async (activityId) => {
    try {
      await activityService.deleteActivity(activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Duplicar atividade
  const duplicateActivity = useCallback(async (activityId) => {
    try {
      const duplicatedActivity = await activityService.duplicateActivity(activityId);
      setActivities(prev => [...prev, duplicatedActivity]);
      return duplicatedActivity;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    duplicateActivity
  };
};

// =====================================================
// 4. HOOK PARA ARQUIVOS
// =====================================================

export const useFiles = (projectId) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload de arquivo
  const uploadFile = useCallback(async (file, source = 'exxata') => {
    try {
      setUploading(true);
      setError(null);
      const newFile = await fileService.uploadFile(projectId, file, source);
      setFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  // Deletar arquivo
  const deleteFile = useCallback(async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Obter URL do arquivo
  const getFileUrl = useCallback(async (filePath) => {
    try {
      return await fileService.getFileUrl(filePath);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    files,
    loading,
    error,
    uploading,
    uploadFile,
    deleteFile,
    getFileUrl,
    setFiles // Para sincronizar com dados do projeto
  };
};

// =====================================================
// 5. HOOK PARA INDICADORES
// =====================================================

export const useIndicators = (projectId) => {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar indicadores
  const fetchIndicators = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await indicatorService.getProjectIndicators(projectId);
      setIndicators(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar indicadores:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Criar indicador
  const createIndicator = useCallback(async (indicatorData) => {
    try {
      const newIndicator = await indicatorService.createIndicator(projectId, indicatorData);
      setIndicators(prev => [...prev, newIndicator]);
      return newIndicator;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  // Atualizar indicador
  const updateIndicator = useCallback(async (indicatorId, updates) => {
    try {
      const updatedIndicator = await indicatorService.updateIndicator(indicatorId, updates);
      setIndicators(prev => prev.map(i => i.id === indicatorId ? updatedIndicator : i));
      return updatedIndicator;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Deletar indicador
  const deleteIndicator = useCallback(async (indicatorId) => {
    try {
      await indicatorService.deleteIndicator(indicatorId);
      setIndicators(prev => prev.filter(i => i.id !== indicatorId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Reordenar indicadores
  const reorderIndicators = useCallback(async (newOrder) => {
    try {
      await indicatorService.reorderIndicators(projectId, newOrder);
      // Reordenar localmente
      const reordered = newOrder.map(id => indicators.find(i => i.id === id)).filter(Boolean);
      setIndicators(reordered);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId, indicators]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  return {
    indicators,
    loading,
    error,
    refetch: fetchIndicators,
    createIndicator,
    updateIndicator,
    deleteIndicator,
    reorderIndicators
  };
};

// =====================================================
// 6. HOOK PARA CONDUTAS
// =====================================================

export const useConducts = (projectId) => {
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar condutas
  const fetchConducts = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await conductService.getProjectConducts(projectId);
      setConducts(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar condutas:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Criar conduta
  const createConduct = useCallback(async (conductData) => {
    try {
      const newConduct = await conductService.createConduct(projectId, conductData);
      setConducts(prev => [...prev, newConduct]);
      return newConduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  // Atualizar conduta
  const updateConduct = useCallback(async (conductId, updates) => {
    try {
      const updatedConduct = await conductService.updateConduct(conductId, updates);
      setConducts(prev => prev.map(c => c.id === conductId ? updatedConduct : c));
      return updatedConduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Deletar conduta
  const deleteConduct = useCallback(async (conductId) => {
    try {
      await conductService.deleteConduct(conductId);
      setConducts(prev => prev.filter(c => c.id !== conductId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Reordenar condutas
  const reorderConducts = useCallback(async (newOrder) => {
    try {
      await conductService.reorderConducts(projectId, newOrder);
      // Reordenar localmente
      const reordered = newOrder.map(id => conducts.find(c => c.id === id)).filter(Boolean);
      setConducts(reordered);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId, conducts]);

  useEffect(() => {
    fetchConducts();
  }, [fetchConducts]);

  return {
    conducts,
    loading,
    error,
    refetch: fetchConducts,
    createConduct,
    updateConduct,
    deleteConduct,
    reorderConducts
  };
};

// =====================================================
// 7. HOOK PARA PROFILES/USUÁRIOS
// =====================================================

export const useProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar profiles
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getAllProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar profile
  const updateProfile = useCallback(async (userId, updates) => {
    try {
      const updatedProfile = await profileService.updateProfile(userId, updates);
      setProfiles(prev => prev.map(p => p.id === userId ? updatedProfile : p));
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Convidar usuário
  const inviteUser = useCallback(async (email, role, invitedBy) => {
    try {
      const result = await profileService.inviteUser(email, role, invitedBy);
      // Recarregar profiles após convite
      await fetchProfiles();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchProfiles]);

  // Reset de senha
  const resetUserPassword = useCallback(async (userId, resetBy) => {
    try {
      const updatedProfile = await profileService.resetUserPassword(userId, resetBy);
      setProfiles(prev => prev.map(p => p.id === userId ? updatedProfile : p));
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    updateProfile,
    inviteUser,
    resetUserPassword
  };
};

// =====================================================
// 8. HOOK PARA ESTATÍSTICAS
// =====================================================

export const useProjectStats = (projectId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await utils.getProjectStats(projectId);
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
