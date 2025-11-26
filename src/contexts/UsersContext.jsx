import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { loadTeam } from '@/services/profiles';

const STORAGE_KEY = 'exxata_users';

export const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar profiles do Supabase
  const loadProfilesFromSupabase = async () => {
    try {
      // console.log('🔄 Carregando profiles do Supabase...'); // Desabilitado para reduzir logs
      
      const profiles = await loadTeam(supabase);

      // console.log('🔍 Resposta do Supabase:', {
      //   count: profiles?.length,
      //   rawData: profiles
      // }); // Desabilitado para reduzir logs

      if (!profiles || profiles.length === 0) {
        // console.log('📝 Nenhum profile encontrado no Supabase'); // Desabilitado para reduzir logs
        return null;
      }

      // console.log('✅ Profiles encontrados no Supabase:', profiles.length); // Desabilitado para reduzir logs
      
      // Converter profiles do Supabase para formato local
      const mappedProfiles = profiles.map(profile => {
        const role = profile.role || profile.roleKey || 'collaborator';
        const roleLabel = profile.roleLabel || profile.role || 'Colaborador';
        const statusLabel = profile.statusLabel || profile.status || 'Ativo';
        const statusCode = profile.statusCode || (profile.status ? String(profile.status).toLowerCase() : null);

        return {
          id: profile.id,
          name: profile.name || profile.full_name || profile.email?.split('@')[0] || 'Usuário',
          email: profile.email,
          role,
          roleLabel,
          status: statusLabel,
          statusLabel,
          statusCode,
          empresa: profile.empresa,
          cargo: profile.cargo,
          phone: profile.phone,
          lastActive: profile.last_active || profile.updated_at || profile.created_at || new Date().toISOString(),
          supabaseProfile: true,
          invitedAt: profile.invited_at || profile.created_at,
          invitedBy: profile.invited_by || 'Sistema'
        };
      });
      
      // Profiles carregados com sucesso
      return mappedProfiles;
    } catch (error) {
      console.error('❌ Erro ao carregar profiles:', error);
      return null;
    }
  };

  // Inicializa usuários do localStorage e Supabase, garantindo que o usuário logado exista na base
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setIsLoading(true);
        
        // Carregar dados locais
        const raw = localStorage.getItem(STORAGE_KEY);
        let localUsers = [];
        if (raw) {
          try {
            localUsers = JSON.parse(raw);
          } catch {
            localUsers = [];
          }
        }

        // Verificar se usuário atual está nos dados locais
        if (user) {
          const exists = localUsers.some((u) => u.id === user.id);
          if (!exists) {
            localUsers = [
              ...localUsers,
              {
                id: user.id,
                name: user.name || 'Usuário',
                email: user.email || 'user@exxata.com',
                role: user.role || 'admin',
                status: 'Ativo',
                lastActive: new Date().toISOString(),
              },
            ];
          }
        }

        // Tentar carregar do Supabase
        const supabaseUsers = await loadProfilesFromSupabase();
        
        if (supabaseUsers && supabaseUsers.length > 0) {
          // Merge de usuários do Supabase e locais
          
          // Fazer merge dos usuários: Supabase tem prioridade
          const mergedUsers = [...supabaseUsers];
          
          // Adicionar usuários locais que não existem no Supabase
          localUsers.forEach(localUser => {
            const existsInSupabase = supabaseUsers.some(su => 
              su.email?.toLowerCase() === localUser.email?.toLowerCase() ||
              su.id === localUser.id
            );
            
            // Verificando existência do usuário
            
            if (!existsInSupabase) {
              mergedUsers.push({
                ...localUser,
                supabaseProfile: false // Flag para identificar origem local
              });
            }
          });

          // Merge realizado com sucesso
          
          setUsers(mergedUsers);
        } else {
          // Fallback para dados locais apenas
          console.log('📝 Usando apenas dados locais');
          setUsers(localUsers);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        // Em caso de erro, usar dados locais
        const raw = localStorage.getItem(STORAGE_KEY);
        let fallbackUsers = [];
        if (raw) {
          try {
            fallbackUsers = JSON.parse(raw);
          } catch {
            fallbackUsers = [];
          }
        }
        setUsers(fallbackUsers);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllUsers();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const addUser = ({ name, email, role = 'collaborator', status = 'Ativo' }) => {
    const id = Date.now();
    const newUser = { id, name, email, role, status, lastActive: new Date().toISOString() };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = async (id, patch) => {
    try {
      // Verificar se é um usuário do Supabase (não local)
      const userToUpdate = users.find(u => u.id === id);
      if (userToUpdate?.supabaseProfile) {
        console.log(`🔄 Atualizando usuário do Supabase: ${id}`, patch);

        // Chamar a Edge Function para atualizar no Supabase
        const { data, error } = await supabase.functions.invoke('update-user-profile', {
          body: {
            user_id: id,
            ...patch
          }
        });

        if (error) {
          console.error('❌ Erro ao atualizar usuário no Supabase:', error);
          throw new Error('Falha ao atualizar usuário no Supabase');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Erro desconhecido ao atualizar usuário');
        }

        console.log('✅ Usuário atualizado no Supabase com sucesso');
      }

      // Atualizar estado local (para todos os usuários, incluindo locais)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      console.log(`Attempting to delete user: ${id}`)

      // First, call Supabase Edge Function to delete from auth and profiles
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: id }
      })

      if (error) {
        console.error('Error calling delete-user function:', error)
        throw new Error('Falha ao excluir usuário do Supabase')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao excluir usuário')
      }

      console.log(`Successfully deleted user from Supabase: ${id}`)

      // Then remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== id));

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getUserById = (id) => users.find((u) => String(u.id) === String(id));
  const getUserByEmail = (email) => users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());

  const value = useMemo(
    () => ({ users, isLoading, addUser, updateUser, deleteUser, getUserById, getUserByEmail }),
    [users, isLoading]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers deve ser usado dentro de UsersProvider');
  return ctx;
};
