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
  async inviteUser(email, role, invitedBy, empresa) {
    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const fullName = normalizedEmail
        .split('@')[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const inviteResult = await inviteUserWithAdminRole(supabase, normalizedEmail, {
        fullName: fullName || undefined,
        password: 'exxata123',
        role: role ?? 'collaborator',
        empresa: empresa,
        invitedBy: invitedBy || null,
        metadata: {
          role: role ?? 'collaborator'
        },
        sendEmail: true
      });

      if (!inviteResult?.success) {
        throw new Error('Falha ao criar convite no Supabase');
      }

      const profileRecord = inviteResult.profile ?? {
        id: inviteResult.userId,
        email: inviteResult.email,
        name: fullName || normalizedEmail,
        role: role ?? 'collaborator',
        empresa: empresa,
        status: 'Pendente',
        invited_by: invitedBy?.id ?? invitedBy ?? null,
        invited_by_role: invitedBy?.role ?? null,
        invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        success: true,
        userId: inviteResult.userId,
        email: inviteResult.email,
        password: inviteResult.password,
        profile: profileRecord,
        inviteLink: inviteResult.inviteLink ?? null
      };
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
            profiles:profiles!project_members_user_id_fkey(name, email, role)
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
            profiles:profiles!project_members_user_id_fkey(id, name, email, role)
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
            file_size,
            mime_type,
            extension,
            source,
            file_path,
            storage_path,
            uploaded_at,
            uploaded_by,
            metadata,
            category,
            created_at
          ),
          project_indicators(
            id,
            title,
            chart_type,
            labels,
            datasets,
            options,
            display_order,
            created_at,
            updated_at,
            created_by
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

      // Função auxiliar para limpar e converter valores monetários
      const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        // Remove 'R$', espaços, e usa '.' como separador de milhar, depois remove, e troca ',' por '.'
        const cleanedValue = value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
        const number = parseFloat(cleanedValue);
        return isNaN(number) ? 0 : number;
      };

      // 1. Preparar o objeto de inserção com dados limpos e convertidos
      const projectToInsert = {
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        location: projectData.location,
        sector: projectData.sector,
        contract_summary: projectData.contractSummary,
        phase: projectData.phase || 'Planejamento',
        status: projectData.status || 'Planejamento',
        progress: 0,
        start_date: projectData.startDate || null,
        end_date: projectData.endDate || null,
        created_by: user.id,
        updated_by: user.id,

        // Campos convertidos para NUMERIC
        contract_value: parseCurrency(projectData.contractValue),
        hourly_rate: parseCurrency(projectData.hourlyRate),
        disputed_amount: parseCurrency(projectData.disputedAmount),
        billing_progress: parseInt(projectData.billingProgress, 10) || 0,

        // Campos JSONB da lógica V0
        exxata_activities: projectData.exxataActivities || [],
        conducts: projectData.conducts || [],
        panorama: projectData.panorama || {
          tecnica: { status: 'green', items: [] },
          fisica: { status: 'green', items: [] },
          economica: { status: 'green', items: [] }
        },
        overview_cards: projectData.overviewCards || [],
        ai_predictive_text: projectData.aiPredictiveText || null
      };

      // 2. Inserir no Supabase
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectToInsert)
        .select()
        .single();

      if (projectError) throw projectError;

      // 3. O trigger 'add_creator_as_member_trigger' cuida da adição do membro.

      return project;
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
          profiles:profiles!project_members_user_id_fkey(id, name, email, role)
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
  },

  // Deletar projeto completamente
  async deleteProject(projectId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🗑️ Deletando projeto no Supabase:', projectId);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
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
        .from('project_activities_old')
        .select('*')
        .eq('project_id', projectId)
        .order('custom_id', { ascending: true });

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
      const { data, error } = await supabase
        .from('project_activities_old')
        .insert({
          project_id: projectId,
          custom_id: activityData.customId || activityData.custom_id,
          name: activityData.title || activityData.name,
          responsible: activityData.assignedTo || activityData.responsible,
          start_date: activityData.startDate || activityData.start_date,
          end_date: activityData.endDate || activityData.end_date,
          status: activityData.status || 'A Fazer',
          is_milestone: activityData.isMilestone || false
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
      // Mapear campos da UI para o schema do banco
      const dbUpdates = {};
      if (updates.customId !== undefined) dbUpdates.custom_id = updates.customId;
      if (updates.title !== undefined) dbUpdates.name = updates.title;
      if (updates.assignedTo !== undefined) dbUpdates.responsible = updates.assignedTo;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.isMilestone !== undefined) dbUpdates.is_milestone = updates.isMilestone;

      const { data, error } = await supabase
        .from('project_activities_old')
        .update(dbUpdates)
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
        .from('project_activities_old')
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
        .from('project_activities_old')
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

      // Gerar próximo custom_id
      const { data: allActivities } = await supabase
        .from('project_activities_old')
        .select('custom_id')
        .eq('project_id', original.project_id);
      
      const existingIds = (allActivities || []).map(a => a.custom_id).filter(Boolean);
      const numericIds = existingIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

      // Criar cópia
      const { data, error } = await supabase
        .from('project_activities_old')
        .insert({
          project_id: original.project_id,
          custom_id: String(nextId).padStart(2, '0'),
          name: `${original.name} (Cópia)`,
          responsible: original.responsible,
          start_date: newStart.toISOString().split('T')[0],
          end_date: newEnd.toISOString().split('T')[0],
          status: 'A Fazer'
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
  // Listar arquivos do projeto
  async getProjectFiles(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  },

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
          name: file.name, // Display name
          original_name: file.name, // Original filename
          size_bytes: file.size,
          mime_type: file.type,
          extension: fileExt,
          storage_path: uploadData.path,
          source: source,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          metadata: {
            uploaded_at: new Date().toISOString(),
            browser_info: navigator.userAgent
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

  // Obter URL do arquivo (usando URL pública já que o bucket é público)
  async getFileUrl(storagePath) {
    try {
      // Validar se storagePath é uma string válida
      if (!storagePath || typeof storagePath !== 'string' || storagePath.trim() === '') {
        throw new Error('Caminho do arquivo inválido ou não fornecido');
      }

      // Como o bucket está público, usar URL pública diretamente
      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(storagePath);

      if (data?.publicUrl) {
        return data.publicUrl;
      }

      throw new Error('Não foi possível gerar URL para o arquivo');
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
  },

  // Atualizar metadados do arquivo
  async updateFile(fileId, updates) {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar arquivo:', error);
      throw error;
    }
  },

  // Atualizar categoria do arquivo
  async updateFileCategory(fileId, category) {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .update({ category })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar categoria do arquivo:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_indicators')
        .update({ ...updates, updated_by: user.id })
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
        .eq('project', projectId)
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
          project: projectId,
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
      // Atualizar display_order de cada conduta individualmente
      for (let i = 0; i < newOrder.length; i++) {
        const { error } = await supabase
          .from('project_conducts')
          .update({ display_order: i })
          .eq('id', newOrder[i]);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao reordenar condutas:', error);
      throw error;
    }
  }
};

// =====================================================
// 8. SERVIÇOS DE PANORAMA ATUAL
// =====================================================

export const panoramaService = {
  // Obter panorama completo do projeto
  async getProjectPanorama(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_panorama')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Converter para formato esperado pela UI
      const panorama = {};
      (data || []).forEach(item => {
        panorama[item.section_key] = {
          status: item.status,
          items: Array.isArray(item.items) ? item.items : []
        };
      });

      // Garantir que todas as seções existam
      const sections = ['tecnica', 'fisica', 'economica'];
      sections.forEach(section => {
        if (!panorama[section]) {
          panorama[section] = { status: 'green', items: [] };
        }
      });

      return panorama;
    } catch (error) {
      console.error('Erro ao obter panorama:', error);
      return {
        tecnica: { status: 'green', items: [] },
        fisica: { status: 'green', items: [] },
        economica: { status: 'green', items: [] }
      };
    }
  },

  // Atualizar status de uma seção
  async updatePanoramaStatus(projectId, sectionKey, status) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro verificar se já existe
      const { data: existing } = await supabase
        .from('project_panorama')
        .select('id, items')
        .eq('project_id', projectId)
        .eq('section_key', sectionKey)
        .single();

      if (existing) {
        // Atualizar
        const { data, error } = await supabase
          .from('project_panorama')
          .update({
            status,
            updated_by: user.id
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('project_panorama')
          .insert({
            project_id: projectId,
            section_key: sectionKey,
            status,
            items: [],
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do panorama:', error);
      throw error;
    }
  },

  // Adicionar item a uma seção
  async addPanoramaItem(projectId, sectionKey, text) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro obter ou criar a seção
      let sectionData;
      const newItem = { id: Date.now() + Math.random(), text };
      const { data: existing } = await supabase
        .from('project_panorama')
        .select('id, items')
        .eq('project_id', projectId)
        .eq('section_key', sectionKey)
        .single();

      if (existing) {
        // Adicionar item à lista existente
        const currentItems = Array.isArray(existing.items) ? existing.items : [];
        const updatedItems = [...currentItems, newItem];

        const { data, error } = await supabase
          .from('project_panorama')
          .update({
            items: updatedItems,
            updated_by: user.id
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        sectionData = data;
      } else {
        // Criar nova seção com o item
        const { data, error } = await supabase
          .from('project_panorama')
          .insert({
            project_id: projectId,
            section_key: sectionKey,
            status: 'green',
            items: [newItem],
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        sectionData = data;
      }

      return newItem;
    } catch (error) {
      console.error('Erro ao adicionar item ao panorama:', error);
      throw error;
    }
  },

  // Atualizar item de uma seção
  async updatePanoramaItem(projectId, sectionKey, itemId, text) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter a seção atual
      const { data: existing } = await supabase
        .from('project_panorama')
        .select('id, items')
        .eq('project_id', projectId)
        .eq('section_key', sectionKey)
        .single();

      if (!existing) throw new Error('Seção não encontrada');

      // Atualizar o item na lista
      const currentItems = Array.isArray(existing.items) ? existing.items : [];
      const updatedItems = currentItems.map(item =>
        item.id === itemId ? { ...item, text } : item
      );

      const { data, error } = await supabase
        .from('project_panorama')
        .update({
          items: updatedItems,
          updated_by: user.id
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar item do panorama:', error);
      throw error;
    }
  },

  // Remover item de uma seção
  async deletePanoramaItem(projectId, sectionKey, itemId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter a seção atual
      const { data: existing } = await supabase
        .from('project_panorama')
        .select('id, items')
        .eq('project_id', projectId)
        .eq('section_key', sectionKey)
        .single();

      if (!existing) throw new Error('Seção não encontrada');

      // Remover o item da lista
      const currentItems = Array.isArray(existing.items) ? existing.items : [];
      const updatedItems = currentItems.filter(item => item.id !== itemId);

      const { data, error } = await supabase
        .from('project_panorama')
        .update({
          items: updatedItems,
          updated_by: user.id
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao deletar item do panorama:', error);
      throw error;
    }
  }
};

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
  panoramaService,
  utils
};
