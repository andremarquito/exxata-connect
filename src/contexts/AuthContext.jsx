import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const AuthContext = createContext(null);

// Função helper para timeout em promises
const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth operation timeout')), ms)
    )
  ]).catch(error => {
    // Garantir que sempre temos uma mensagem de erro
    throw new Error(error?.message || error?.toString() || 'Timeout na operação de autenticação');
  });
};

// Cache de perfis para evitar consultas repetidas
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getCachedProfile = (userId) => {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Usando perfil em cache para:', userId);
    return cached.profile;
  }
  return null;
};

const setCachedProfile = (userId, profile) => {
  profileCache.set(userId, {
    profile,
    timestamp: Date.now()
  });
};

// Função para definir permissões baseadas no role
const getPermissionsByRole = (role) => {
  const normalizedRole = (role || '').toLowerCase();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrador':
      return [
        'view_projects',
        'edit_projects',
        'delete_projects',
        'manage_team',
        'create_project'
      ];
    case 'manager':
    case 'gerente':
      return [
        'view_projects',
        'edit_projects',
        'delete_projects',
        'manage_team',
        'create_project'
      ];
    case 'collaborator':
    case 'colaborador':
    case 'consultor':
    case 'consultant':
      return [
        'view_projects',
        'edit_projects'
      ];
    case 'client':
    case 'cliente':
      return [
        'view_projects'
      ];
    default:
      return ['view_projects'];
  }
};

// Função para buscar perfil do usuário
const getUserProfile = async (supabaseUser) => {
  try {
    console.log('🔍 Buscando perfil para usuário:', supabaseUser.email);
    
    // Verificar cache primeiro
    const cachedProfile = getCachedProfile(supabaseUser.id);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    let profile = null;
    
    // Tentar buscar dados adicionais do usuário na tabela profiles (se existir)
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single(),
        10000 // 10 segundos de timeout para busca de perfil (aumentado)
      );

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 Tabela profiles não existe, usando fallback');
        } else if (error.code === 'PGRST118') {
          console.log('📝 Perfil não encontrado na tabela profiles, usando fallback');
        } else {
          console.warn('⚠️ Erro ao buscar perfil:', error.message);
        }
      } else {
        profile = data;
        console.log('✅ Perfil encontrado no Supabase:', profile.role);
      }
    } catch (profileError) {
      console.warn('⚠️ Erro na consulta de perfil:', profileError.message);
    }

    // Determinar role - PRIORIDADE: 1) Perfil Supabase, 2) Fallback de email, 3) Padrão
    let role = null;
    let name = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário';

    // PRIORIDADE 1: Se houver perfil no Supabase, usar ele
    if (profile && profile.role) {
      role = profile.role;
      name = profile.name || name;
      console.log('📋 Role definido pelo perfil Supabase:', role);
    }
    // PRIORIDADE 2: Fallback baseado no email (apenas se não houver perfil)
    else {
      if (supabaseUser.email === 'admin@exxata.com') {
        role = 'admin';
        name = 'Admin';
      } else if (supabaseUser.email === 'consultor@exxata.com') {
        role = 'consultor';
        name = 'Consultor';
      } else if (supabaseUser.email === 'andre.marquito@exxata.com.br') {
        role = 'admin';
        name = 'André Marquito';
      } else {
        // PRIORIDADE 3: Padrão como último recurso
        role = 'cliente';
      }
      console.log('📋 Role definido por fallback de email:', role);
    }

    const userData = {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email,
      role,
      empresa: profile?.empresa,
      permissions: getPermissionsByRole(role),
      supabaseUser // Manter referência ao usuário do Supabase
    };
    
    // Armazenar no cache
    setCachedProfile(supabaseUser.id, userData);
    
    return userData;
  } catch (error) {
    console.error('❌ Erro crítico ao processar perfil do usuário:', error.message || error);
    
    // Tentar usar cache mesmo em caso de erro
    const cachedProfile = getCachedProfile(supabaseUser.id);
    if (cachedProfile) {
      console.log('📦 Usando perfil em cache após erro');
      return cachedProfile;
    }
    
    // Fallback seguro baseado no email mesmo em caso de erro
    let fallbackRole = 'cliente';
    let fallbackName = 'Usuário';
    
    if (supabaseUser.email === 'admin@exxata.com') {
      fallbackRole = 'admin';
      fallbackName = 'Admin';
    } else if (supabaseUser.email === 'consultor@exxata.com') {
      fallbackRole = 'consultor';
      fallbackName = 'Consultor';
    } else if (supabaseUser.email === 'andre.marquito@exxata.com.br') {
      fallbackRole = 'admin';
      fallbackName = 'André Marquito';
    }
    
    console.warn('⚠️ Usando fallback de emergência - role:', fallbackRole);
    
    // Retornar dados básicos em caso de erro
    const fallbackData = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || fallbackName,
      email: supabaseUser.email,
      role: fallbackRole,
      permissions: getPermissionsByRole(fallbackRole),
      supabaseUser
    };
    
    // Armazenar fallback no cache para evitar consultas repetidas
    setCachedProfile(supabaseUser.id, fallbackData);
    
    return fallbackData;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionProtected, setSessionProtected] = useState(false);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação...');
        
        // Verificar sessão do Supabase primeiro com timeout
        let session = null;
        let sessionError = null;
        
        try {
          const result = await withTimeout(
            supabase.auth.getSession(),
            8000 // 8 segundos de timeout para verificação de sessão
          );
          session = result.data?.session;
          sessionError = result.error;
        } catch (timeoutError) {
          console.warn('⏰ Timeout ao verificar sessão Supabase:', timeoutError.message);
          sessionError = timeoutError;
        }
        
        if (sessionError) {
          console.warn('⚠️ Erro ao verificar sessão Supabase:', sessionError.message || sessionError);
          throw sessionError; // Forçar fallback
        }

        if (session?.user) {
          console.log('✅ Sessão Supabase encontrada:', session.user.email);
          // Usuário autenticado no Supabase
          const supabaseUser = session.user;
          
          // Buscar dados adicionais do usuário (role, etc.)
          try {
            const userData = await getUserProfile(supabaseUser);
            setUser(userData);
            console.log('✅ Profile carregado:', userData.name, 'Role:', userData.role);
          } catch (profileError) {
            console.error('❌ Erro ao carregar perfil, usando dados básicos:', profileError.message);
            // Fallback com dados básicos do Supabase
            setUser({
              id: supabaseUser.id,
              name: supabaseUser.email?.split('@')[0] || 'Usuário',
              email: supabaseUser.email,
              role: supabaseUser.email === 'andre.marquito@exxata.com.br' ? 'admin' : 'cliente',
              permissions: getPermissionsByRole(supabaseUser.email === 'andre.marquito@exxata.com.br' ? 'admin' : 'cliente'),
              supabaseUser
            });
          }
        } else {
          console.log('❌ Nenhuma sessão Supabase, usando sistema local');
          // Fallback para sistema local (compatibilidade)
          const token = localStorage.getItem('token');
          if (token) {
            const rawUser = localStorage.getItem('auth_user');
            if (rawUser) {
              try { 
                const localUser = JSON.parse(rawUser);
                setUser(localUser);
                console.log('✅ Usuário local carregado:', localUser.email);
              } catch { 
                localStorage.removeItem('auth_user');
                localStorage.removeItem('token');
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error?.message || error || 'Erro desconhecido');
        
        // Fallback para sistema local em caso de timeout
        console.log('🔄 Fallback para sistema local devido a erro');
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const rawUser = localStorage.getItem('auth_user');
            if (rawUser) {
              try { 
                const localUser = JSON.parse(rawUser);
                setUser(localUser);
                console.log('✅ Fallback: usuário local carregado');
              } catch (parseError) { 
                console.warn('⚠️ Erro ao fazer parse do usuário local:', parseError.message);
                localStorage.removeItem('auth_user');
                localStorage.removeItem('token');
              }
            }
          }
        } catch (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Evitar sobrescrever dados se o usuário já está logado com o mesmo email
          if (user && user.email === session.user.email) {
            console.log('👤 Usuário já logado, mantendo dados atuais');
            return;
          }
          
          const userData = await getUserProfile(session.user);
          console.log('👤 Definindo usuário via auth state change:', userData.role);
          setUser(userData);
          
          // Atualizar localStorage para manter consistência
          localStorage.setItem('token', 'supabase-session');
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } else {
          console.log('👤 Logout detectado, limpando dados');
          setUser(null);
          // Limpar dados locais quando logout do Supabase
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login para:', email);
      
      // Tentar login com Supabase primeiro
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.log('❌ Login Supabase falhou:', authError.message);
        
        // Verificar se é erro de email não confirmado
        if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.');
        }
        
        // Verificar se é erro de credenciais inválidas
        if (authError.message?.includes('Invalid login credentials') || 
            authError.message?.includes('Invalid email or password')) {
          console.log('🔄 Tentando sistema local como fallback');
          
          // Tentar fallback para sistema local
          try {
            return await loginLocal(email, password);
          } catch (localError) {
            // Se o sistema local também falhar, usar a mensagem mais específica
            console.log('❌ Sistema local também falhou:', localError.message);
            throw localError; // Propagar o erro específico do sistema local
          }
        }
        
        // Para outros erros do Supabase, lançar erro específico
        throw new Error('Erro de conexão com o servidor. Tente novamente.');
      }

      if (authData.user) {
        // Verificar se o email foi confirmado
        if (!authData.user.email_confirmed_at) {
          console.log('❌ Email não confirmado');
          // Fazer logout imediatamente
          await supabase.auth.signOut();
          throw new Error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.');
        }

        // Login Supabase bem-sucedido
        const userData = await getUserProfile(authData.user);
        console.log('✅ Login Supabase bem-sucedido, role:', userData.role);
        setUser(userData);
        
        // Manter compatibilidade com sistema local
        localStorage.setItem('token', 'supabase-session');
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        return { success: true };
      }

      throw new Error('Erro inesperado no login. Tente novamente.');
    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      throw error;
    }
  };

  // Função de login local (fallback)
  const loginLocal = async (email, password) => {
    console.log('🔐 Tentando login local para:', email);
    
    // Verificar se o usuário existe na base de usuários convidados
    const usersData = localStorage.getItem('exxata_users');
    let invitedUsers = [];
    
    if (usersData) {
      try {
        invitedUsers = JSON.parse(usersData);
      } catch {
        invitedUsers = [];
      }
    }

    // Buscar usuário convidado
    const invitedUser = invitedUsers.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    let userData = null;

    // Usuários padrão do sistema (sempre permitidos)
    if (email === 'admin@exxata.com' && password === 'admin123') {
      userData = {
        id: 1,
        name: 'Admin',
        email: 'admin@exxata.com',
        role: 'admin',
        permissions: getPermissionsByRole('admin')
      };
    } else if ((email === 'consultor@exxata.com' || email === 'consultant@exxata.com') && password === 'consultor123') {
      userData = {
        id: 2,
        name: 'Consultor',
        email,
        role: 'consultor',
        permissions: getPermissionsByRole('consultor')
      };
    } else if ((email === 'cliente@exxata.com' || email === 'client@exxata.com') && password === 'cliente123') {
      userData = {
        id: 3,
        name: 'Cliente',
        email,
        role: 'cliente',
        permissions: getPermissionsByRole('cliente')
      };
    } 
    // Verificar usuários convidados
    else if (invitedUser) {
      // Verificar senha padrão ou senha personalizada
      if (password === 'exxata123' || (invitedUser.password && password === invitedUser.password)) {
        userData = {
          id: invitedUser.id,
          name: invitedUser.name,
          email: invitedUser.email,
          role: invitedUser.role,
          permissions: getPermissionsByRole(invitedUser.role)
        };

        // Atualizar status para Ativo no primeiro login
        if (invitedUser.status === 'Pendente') {
          const updatedUsers = invitedUsers.map(u => 
            u.id === invitedUser.id 
              ? { ...u, status: 'Ativo', lastActive: new Date().toISOString() }
              : u
          );
          localStorage.setItem('exxata_users', JSON.stringify(updatedUsers));
        }
      }
    }

    if (!userData) {
      console.log('❌ Login local falhou para:', email);
      
      if (!invitedUser) {
        // Verificar se é um dos emails padrão com senha errada
        if (email === 'admin@exxata.com' || 
            email === 'consultor@exxata.com' || 
            email === 'consultant@exxata.com' ||
            email === 'cliente@exxata.com' || 
            email === 'client@exxata.com') {
          console.log('❌ Email padrão encontrado, mas senha incorreta');
          throw new Error('Senha incorreta. Verifique suas credenciais e tente novamente.');
        }
        console.log('❌ Email não encontrado no sistema');
        throw new Error('E-mail não cadastrado na plataforma. Entre em contato com o administrador para receber um convite.');
      } else {
        console.log('❌ Usuário convidado encontrado, mas senha incorreta');
        throw new Error('Senha incorreta. Verifique suas credenciais e tente novamente.');
      }
    }

    console.log('✅ Login local bem-sucedido para:', email);

    localStorage.setItem('token', 'local-token');
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const logout = async () => {
    try {
      // Logout do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout do Supabase:', error);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados locais sempre
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      setUser(null);
      // O redirecionamento será tratado pelo App.jsx
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const resetPassword = async (email) => {
    try {
      console.log('🔄 Enviando email de reset para:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Erro ao enviar email de reset:', error.message);
        throw error;
      }

      console.log('✅ Email de reset enviado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no reset de senha:', error.message);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      console.log('🔄 Atualizando senha...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error.message);
        throw error;
      }

      console.log('✅ Senha atualizada com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error.message);
      throw error;
    }
  };

  const signup = async (email, password, metadata = {}) => {
    try {
      console.log('🔄 Criando conta para:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // user_metadata (ex.: full_name, empresa)
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ Erro no cadastro:', error.message);
        throw error;
      }

      // Se o cadastro foi bem-sucedido e temos um usuário criado, criar perfil na tabela profiles
      if (data.user && data.user.id) {
        try {
          // Preparar dados do perfil, garantindo que campos vazios sejam null
          const profileData = {
            id: data.user.id,
            email: email.trim().toLowerCase(),
            name: metadata.full_name || email.split('@')[0],
            empresa: metadata.empresa?.trim() || null,
            phone: metadata.phone?.trim() || null,
            role: 'cliente', // padrão para novos cadastros
            status: data.user.email_confirmed_at ? 'Ativo' : 'Pendente',
            invited_at: new Date().toISOString(),
          };

          console.log('📝 Criando perfil com dados:', {
            email: profileData.email,
            name: profileData.name,
            empresa: profileData.empresa,
            phone: profileData.phone,
            role: profileData.role
          });

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData);

          if (profileError) {
            console.warn('⚠️ Perfil criado, mas erro ao salvar dados adicionais:', profileError.message);
          } else {
            console.log('✅ Perfil criado com sucesso na tabela profiles');
          }
        } catch (profileError) {
          console.warn('⚠️ Erro ao criar perfil adicional:', profileError.message);
        }
      }

      console.log('✅ Conta criada com sucesso, aguardando confirmação de e-mail');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro no cadastro:', error.message);
      throw error;
    }
  };

  const protectSession = async () => {
    try {
      setSessionProtected(true);
      const { data: currentSession } = await supabase.auth.getSession();
      return currentSession?.session;
    } catch (error) {
      console.error('Erro ao proteger sessão:', error);
      return null;
    }
  };

  const restoreSession = async (originalSession) => {
    try {
      if (originalSession && !sessionProtected) {
        await supabase.auth.setSession({
          access_token: originalSession.access_token,
          refresh_token: originalSession.refresh_token
        });
      }
      setSessionProtected(false);
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    resetPassword,
    updatePassword,
    signup,
    protectSession,
    restoreSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
