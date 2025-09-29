// =====================================================
// SERVIÇOS DO SUPABASE - EXXATA CONNECT
// Substitui o localStorage por banco de dados real
// =====================================================

import { supabase } from '@/lib/supabase';
import { loadTeam } from '@/services/profiles';
import { inviteUser as inviteUserWithAdminRole } from '@/services/invite';

// =====================================================
// 1. SERVIÇOS DE USUÁRIOS/PROFILES
// =====================================================

export const profileService = {
  // Obter perfil do usuário atual
  async getCurrentProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return null;
    }
  },

  // Listar todos os usuários (apenas admin/manager)
  async getAllProfiles() {
    try {
      const team = await loadTeam(supabase);
      return (team || []).map((member) => ({
        ...member,
        status:
          typeof member.statusLabel === 'string' && member.statusLabel.trim().length > 0
            ? member.statusLabel
            : member.status ?? 'Ativo',
      }));
    } catch (error) {
      console.error('Erro ao listar profiles:', error);
      return [];
    }
  },

  // Atualizar perfil
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  // Convidar usuário (criar convite)
  async inviteUser(email, role, invitedBy) {
    try {
      // Primeiro, registrar o usuário via Auth
      const normalizedEmail = String(email).trim();
      const fullName = normalizedEmail
        .split('@')[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const inviteResult = await inviteUserWithAdminRole(supabase, normalizedEmail, fullName || undefined);

      const invitedUser = inviteResult?.user ?? null;

      if (invitedUser) {
        try {
          await supabase
            .from('profiles')
            .update({
              role: role ?? null,
              invited_by: invitedBy ?? null,
              invited_at: new Date().toISOString(),
            })
            .eq('id', invitedUser.id);
        } catch (innerError) {
          console.warn('Não foi possível sincronizar dados adicionais do convite:', innerError);
        }
      }

      return { success: true, user: invitedUser };
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
      throw error;
    }
  },

  // Reset de senha
  async resetUserPassword(userId, resetBy) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          password_reset_at: new Date().toISOString(),
          password_reset_by: resetBy,
          status: 'Pendente',
          has_custom_password: false
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  }
};

// =====================================================
// 2. SERVIÇOS DE PROJETOS
// =====================================================

export const projectService = {
  // Listar projetos acessíveis ao usuário
  async getUserProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(name, email),
          project_members(
            user_id,
            role,
            profiles(name, email, role)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      return [];
    }
  },

  // Obter projeto por ID
  async getProjectById(projectId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(name, email),
          project_members(
            id,
            user_id,
            role,
            added_at,
            profiles(id, name, email, role)
          ),
          activities(
            id,
            custom_id,
            seq,
            title,
            description,
            assigned_to,
            assigned_user_id,
            start_date,
            end_date,
            status,
            created_at,
            updated_at
          ),
          project_files(
            id,
            name,
            original_name,
            size_bytes,
            mime_type,
            extension,
            source,
            storage_path,
            uploaded_at,
            uploaded_by,
            metadata
          ),
          project_indicators(
            id,
            title,
            type,
            datasets,
            labels,
            colors,
            display_order,
            created_at
          ),
          project_conducts(
            id,
            content,
            urgency,
            display_order,
            created_at
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter projeto:', error);
      return null;
    }
  },

  // Criar projeto
  async createProject(projectData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar criador como membro do projeto
      await this.addProjectMember(data.id, user.id, 'owner');

      return data;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  },

  // Atualizar projeto
  async updateProject(projectId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  },

  // Adicionar membro ao projeto
  async addProjectMember(projectId, userId, role = 'member') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role,
          added_by: user.id
        })
        .select(`
          *,
          profiles(id, name, email, role)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  },

  // Remover membro do projeto
  async removeProjectMember(projectId, userId) {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }
};

// =====================================================
// 3. SERVIÇOS DE ATIVIDADES
// =====================================================

export const activityService = {
  // Listar atividades do projeto
  async getProjectActivities(projectId) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId)
        .order('seq', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar atividades:', error);
      return [];
    }
  },

  // Criar atividade
  async createActivity(projectId, activityData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activityData,
          project_id: projectId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }
  },

  // Atualizar atividade
  async updateActivity(activityId, updates) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      throw error;
    }
  },

  // Deletar atividade
  async deleteActivity(activityId) {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      throw error;
    }
  },

  // Duplicar atividade
  async duplicateActivity(activityId) {
    try {
      // Primeiro, obter a atividade original
      const { data: original, error: getError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (getError) throw getError;

      // Calcular novas datas
      const originalStart = new Date(original.start_date);
      const originalEnd = new Date(original.end_date);
      const duration = originalEnd.getTime() - originalStart.getTime();
      
      const newStart = new Date(originalEnd);
      newStart.setDate(newStart.getDate() + 1);
      const newEnd = new Date(newStart.getTime() + duration);

      // Criar cópia
      const { data, error } = await supabase
        .from('activities')
        .insert({
          project_id: original.project_id,
          title: `${original.title} (Cópia)`,
          description: original.description,
          assigned_to: original.assigned_to,
          assigned_user_id: original.assigned_user_id,
          start_date: newStart.toISOString().split('T')[0],
          end_date: newEnd.toISOString().split('T')[0],
          status: 'A Fazer',
          created_by: original.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao duplicar atividade:', error);
      throw error;
    }
  }
};

// =====================================================
// 4. SERVIÇOS DE ARQUIVOS
// =====================================================

export const fileService = {
  // Upload de arquivo
  async uploadFile(projectId, file, source = 'exxata') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      // Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Registrar no banco de dados
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: fileName,
          original_name: file.name,
          size_bytes: file.size,
          mime_type: file.type,
          extension: fileExt,
          storage_path: uploadData.path,
          source: source,
          uploaded_by: user.id,
          metadata: {
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  },

  // Obter URL pública do arquivo
  async getFileUrl(filePath) {
    try {
      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao obter URL do arquivo:', error);
      return null;
    }
  },

  // Deletar arquivo
  async deleteFile(fileId) {
    try {
      // Primeiro obter dados do arquivo
      const { data: fileData, error: getError } = await supabase
        .from('project_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (getError) throw getError;

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([fileData.storage_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }
};

// =====================================================
// 5. SERVIÇOS DE INDICADORES
// =====================================================

export const indicatorService = {
  // Listar indicadores do projeto
  async getProjectIndicators(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_indicators')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar indicadores:', error);
      return [];
    }
  },

  // Criar indicador
  async createIndicator(projectId, indicatorData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_indicators')
        .insert({
          ...indicatorData,
          project_id: projectId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar indicador:', error);
      throw error;
    }
  },

  // Atualizar indicador
  async updateIndicator(indicatorId, updates) {
    try {
      const { data, error } = await supabase
        .from('project_indicators')
        .update(updates)
        .eq('id', indicatorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error);
      throw error;
    }
  },

  // Deletar indicador
  async deleteIndicator(indicatorId) {
    try {
      const { error } = await supabase
        .from('project_indicators')
        .delete()
        .eq('id', indicatorId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar indicador:', error);
      throw error;
    }
  },

  // Reordenar indicadores
  async reorderIndicators(projectId, newOrder) {
    try {
      const updates = newOrder.map((indicatorId, index) => ({
        id: indicatorId,
        display_order: index
      }));

      const { error } = await supabase
        .from('project_indicators')
        .upsert(updates);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao reordenar indicadores:', error);
      throw error;
    }
  }
};

// =====================================================
// 6. SERVIÇOS DE CONDUTAS
// =====================================================

export const conductService = {
  // Listar condutas do projeto
  async getProjectConducts(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_conducts')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar condutas:', error);
      return [];
    }
  },

  // Criar conduta
  async createConduct(projectId, conductData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_conducts')
        .insert({
          ...conductData,
          project_id: projectId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar conduta:', error);
      throw error;
    }
  },

  // Atualizar conduta
  async updateConduct(conductId, updates) {
    try {
      const { data, error } = await supabase
        .from('project_conducts')
        .update(updates)
        .eq('id', conductId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar conduta:', error);
      throw error;
    }
  },

  // Deletar conduta
  async deleteConduct(conductId) {
    try {
      const { error } = await supabase
        .from('project_conducts')
        .delete()
        .eq('id', conductId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar conduta:', error);
      throw error;
    }
  },

  // Reordenar condutas
  async reorderConducts(projectId, newOrder) {
    try {
      const updates = newOrder.map((conductId, index) => ({
        id: conductId,
        display_order: index
      }));

      const { error } = await supabase
        .from('project_conducts')
        .upsert(updates);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao reordenar condutas:', error);
      throw error;
    }
  }
};

// =====================================================
// 7. UTILITÁRIOS
// =====================================================

export const utils = {
  // Verificar se usuário tem acesso ao projeto
  async userHasProjectAccess(projectId, userId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const checkUserId = userId || user?.id;

      if (!checkUserId) return false;

      const { data, error } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', checkUserId)
        .single();

      return !error && data;
    } catch (error) {
      return false;
    }
  },

  // Obter estatísticas do projeto
  async getProjectStats(projectId) {
    try {
      const [activities, files, indicators, conducts] = await Promise.all([
        activityService.getProjectActivities(projectId),
        supabase.from('project_files').select('id').eq('project_id', projectId),
        indicatorService.getProjectIndicators(projectId),
        conductService.getProjectConducts(projectId)
      ]);

      const stats = {
        totalActivities: activities.length,
        completedActivities: activities.filter(a => a.status === 'Concluída').length,
        totalFiles: files.data?.length || 0,
        totalIndicators: indicators.length,
        totalConducts: conducts.length,
        progressPercentage: activities.length > 0 
          ? Math.round((activities.filter(a => a.status === 'Concluída').length / activities.length) * 100)
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
};

// Exportar todos os serviços
export default {
  profileService,
  projectService,
  activityService,
  fileService,
  indicatorService,
  conductService,
  utils
};
