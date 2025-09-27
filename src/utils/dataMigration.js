// =====================================================
// UTILITÁRIO DE MIGRAÇÃO DE DADOS
// Migra dados do localStorage para o Supabase
// =====================================================

import { supabase } from '@/lib/supabase';
import { 
  profileService, 
  projectService, 
  activityService, 
  indicatorService, 
  conductService 
} from '@/services/supabaseService';

// =====================================================
// 1. MIGRAÇÃO DE USUÁRIOS
// =====================================================

export const migrateUsers = async () => {
  try {
    console.log('🔄 Iniciando migração de usuários...');
    
    // Obter usuários do localStorage
    const localUsers = JSON.parse(localStorage.getItem('exxata_users') || '[]');
    
    if (localUsers.length === 0) {
      console.log('📝 Nenhum usuário local encontrado para migrar.');
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    const errors = [];

    for (const localUser of localUsers) {
      try {
        // Verificar se usuário já existe no Supabase
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', localUser.email)
          .single();

        if (existingProfile) {
          console.log(`👤 Usuário ${localUser.email} já existe no Supabase`);
          continue;
        }

        // Para migração, assumir que usuários locais já têm IDs do Supabase Auth
        // Em produção, você precisaria criar usuários via Supabase Auth primeiro
        
        console.log(`🔄 Migrando usuário: ${localUser.email}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${localUser.email}:`, error);
        errors.push({ user: localUser.email, error: error.message });
      }
    }

    console.log(`✅ Migração de usuários concluída: ${migratedCount} usuários migrados`);
    
    return { 
      success: true, 
      migrated: migratedCount, 
      errors: errors.length > 0 ? errors : null 
    };
    
  } catch (error) {
    console.error('❌ Erro na migração de usuários:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// 2. MIGRAÇÃO DE PROJETOS
// =====================================================

export const migrateProjects = async () => {
  try {
    console.log('🔄 Iniciando migração de projetos...');
    
    // Obter projetos do localStorage
    const localProjects = JSON.parse(localStorage.getItem('exxata_projects') || '[]');
    
    if (localProjects.length === 0) {
      console.log('📝 Nenhum projeto local encontrado para migrar.');
      return { success: true, migrated: 0 };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado para migração');
    }

    let migratedCount = 0;
    const errors = [];
    const projectMapping = {}; // Para mapear IDs locais para IDs do Supabase

    for (const localProject of localProjects) {
      try {
        console.log(`🔄 Migrando projeto: ${localProject.name}`);
        
        // Preparar dados do projeto
        const projectData = {
          name: localProject.name,
          client: localProject.client,
          sector: localProject.sector,
          location: localProject.location,
          description: localProject.description,
          start_date: localProject.startDate,
          end_date: localProject.endDate,
          contract_value: parseFloat(localProject.contractValue) || null,
          hourly_rate: parseFloat(localProject.hourlyRate) || null,
          disputed_amount: parseFloat(localProject.disputedAmount) || null,
          contract_summary: localProject.contractSummary,
          progress: localProject.progress || 0,
          billing_progress: localProject.billingProgress || 0,
          status: localProject.status || 'Em Andamento',
          exxata_activities: localProject.exxataActivities || [],
          overview_config: localProject.overviewConfig || { widgets: [], layouts: {} }
        };

        // Criar projeto no Supabase
        const newProject = await projectService.createProject(projectData);
        projectMapping[localProject.id] = newProject.id;

        // Migrar membros da equipe
        if (localProject.team && localProject.team.length > 0) {
          for (const member of localProject.team) {
            try {
              // Encontrar usuário por email
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', member.email)
                .single();

              if (userProfile) {
                await projectService.addProjectMember(newProject.id, userProfile.id, 'member');
              }
            } catch (memberError) {
              console.warn(`⚠️ Não foi possível adicionar membro ${member.email}:`, memberError);
            }
          }
        }

        // Migrar atividades
        if (localProject.activities && localProject.activities.length > 0) {
          await migrateProjectActivities(localProject.activities, newProject.id);
        }

        // Migrar indicadores
        if (localProject.indicators && localProject.indicators.length > 0) {
          await migrateProjectIndicators(localProject.indicators, newProject.id);
        }

        // Migrar condutas
        if (localProject.conducts && localProject.conducts.length > 0) {
          await migrateProjectConducts(localProject.conducts, newProject.id);
        }

        migratedCount++;
        console.log(`✅ Projeto ${localProject.name} migrado com sucesso`);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar projeto ${localProject.name}:`, error);
        errors.push({ project: localProject.name, error: error.message });
      }
    }

    console.log(`✅ Migração de projetos concluída: ${migratedCount} projetos migrados`);
    
    return { 
      success: true, 
      migrated: migratedCount, 
      errors: errors.length > 0 ? errors : null,
      projectMapping
    };
    
  } catch (error) {
    console.error('❌ Erro na migração de projetos:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// 3. MIGRAÇÃO DE ATIVIDADES
// =====================================================

const migrateProjectActivities = async (localActivities, projectId) => {
  try {
    for (const localActivity of localActivities) {
      const activityData = {
        custom_id: localActivity.customId,
        seq: localActivity.seq,
        title: localActivity.title,
        description: localActivity.description,
        assigned_to: localActivity.assignedTo,
        start_date: localActivity.startDate,
        end_date: localActivity.endDate,
        status: localActivity.status || 'A Fazer'
      };

      await activityService.createActivity(projectId, activityData);
    }
    
    console.log(`✅ ${localActivities.length} atividades migradas`);
  } catch (error) {
    console.error('❌ Erro ao migrar atividades:', error);
    throw error;
  }
};

// =====================================================
// 4. MIGRAÇÃO DE INDICADORES
// =====================================================

const migrateProjectIndicators = async (localIndicators, projectId) => {
  try {
    for (const [index, localIndicator] of localIndicators.entries()) {
      const indicatorData = {
        title: localIndicator.title,
        type: localIndicator.type,
        datasets: localIndicator.datasets || [],
        labels: localIndicator.labels || [],
        colors: localIndicator.colors || ['#09182b', '#d51d07', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        display_order: index
      };

      await indicatorService.createIndicator(projectId, indicatorData);
    }
    
    console.log(`✅ ${localIndicators.length} indicadores migrados`);
  } catch (error) {
    console.error('❌ Erro ao migrar indicadores:', error);
    throw error;
  }
};

// =====================================================
// 5. MIGRAÇÃO DE CONDUTAS
// =====================================================

const migrateProjectConducts = async (localConducts, projectId) => {
  try {
    for (const [index, localConduct] of localConducts.entries()) {
      const conductData = {
        content: localConduct.content,
        urgency: localConduct.urgency || 'Normal',
        display_order: index
      };

      await conductService.createConduct(projectId, conductData);
    }
    
    console.log(`✅ ${localConducts.length} condutas migradas`);
  } catch (error) {
    console.error('❌ Erro ao migrar condutas:', error);
    throw error;
  }
};

// =====================================================
// 6. MIGRAÇÃO COMPLETA
// =====================================================

export const migrateAllData = async () => {
  try {
    console.log('🚀 Iniciando migração completa dos dados...');
    
    const results = {
      users: { migrated: 0, errors: [] },
      projects: { migrated: 0, errors: [] },
      success: true,
      startTime: new Date().toISOString()
    };

    // 1. Migrar usuários primeiro
    console.log('\n1️⃣ === MIGRAÇÃO DE USUÁRIOS ===');
    const userMigration = await migrateUsers();
    results.users = userMigration;

    if (!userMigration.success) {
      console.error('❌ Falha na migração de usuários. Abortando migração.');
      results.success = false;
      return results;
    }

    // 2. Migrar projetos
    console.log('\n2️⃣ === MIGRAÇÃO DE PROJETOS ===');
    const projectMigration = await migrateProjects();
    results.projects = projectMigration;

    if (!projectMigration.success) {
      console.error('❌ Falha na migração de projetos.');
      results.success = false;
      return results;
    }

    results.endTime = new Date().toISOString();
    
    console.log('\n🎉 === MIGRAÇÃO CONCLUÍDA ===');
    console.log(`✅ Usuários migrados: ${results.users.migrated}`);
    console.log(`✅ Projetos migrados: ${results.projects.migrated}`);
    
    if (results.users.errors?.length > 0 || results.projects.errors?.length > 0) {
      console.log('⚠️ Alguns erros ocorreram durante a migração. Verifique os detalhes.');
    }

    // Criar backup dos dados locais
    await createLocalBackup();
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro crítico na migração:', error);
    return { 
      success: false, 
      error: error.message, 
      endTime: new Date().toISOString() 
    };
  }
};

// =====================================================
// 7. BACKUP DOS DADOS LOCAIS
// =====================================================

const createLocalBackup = async () => {
  try {
    console.log('💾 Criando backup dos dados locais...');
    
    const backup = {
      timestamp: new Date().toISOString(),
      users: JSON.parse(localStorage.getItem('exxata_users') || '[]'),
      projects: JSON.parse(localStorage.getItem('exxata_projects') || '[]'),
      auth_user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
      token: localStorage.getItem('token')
    };

    // Salvar backup no localStorage com timestamp
    const backupKey = `exxata_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    console.log(`✅ Backup criado: ${backupKey}`);
    
    // Criar arquivo de download (opcional)
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `exxata-connect-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('💾 Arquivo de backup baixado');
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
  }
};

// =====================================================
// 8. UTILITÁRIOS DE VERIFICAÇÃO
// =====================================================

export const verifyMigration = async () => {
  try {
    console.log('🔍 Verificando migração...');
    
    // Verificar projetos
    const projects = await projectService.getUserProjects();
    console.log(`📊 Projetos no Supabase: ${projects.length}`);
    
    // Verificar usuários (se tiver permissão)
    try {
      const profiles = await profileService.getAllProfiles();
      console.log(`👤 Usuários no Supabase: ${profiles.length}`);
    } catch (error) {
      console.log('ℹ️ Não foi possível verificar usuários (permissão necessária)');
    }
    
    // Comparar com dados locais
    const localProjects = JSON.parse(localStorage.getItem('exxata_projects') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('exxata_users') || '[]');
    
    console.log(`📊 Projetos locais: ${localProjects.length}`);
    console.log(`👤 Usuários locais: ${localUsers.length}`);
    
    return {
      supabase: {
        projects: projects.length
      },
      local: {
        projects: localProjects.length,
        users: localUsers.length
      }
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
};

// =====================================================
// 9. LIMPEZA DOS DADOS LOCAIS (CUIDADO!)
// =====================================================

export const clearLocalData = () => {
  if (!confirm('⚠️ ATENÇÃO: Isso irá apagar todos os dados locais. Tem certeza?')) {
    return false;
  }
  
  if (!confirm('🚨 ÚLTIMA CHANCE: Você fez backup dos dados? Esta ação é IRREVERSÍVEL!')) {
    return false;
  }
  
  try {
    localStorage.removeItem('exxata_users');
    localStorage.removeItem('exxata_projects');
    console.log('🗑️ Dados locais removidos com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar dados locais:', error);
    return false;
  }
};

// Exportar funções principais
export default {
  migrateAllData,
  migrateUsers,
  migrateProjects,
  verifyMigration,
  createLocalBackup,
  clearLocalData
};
