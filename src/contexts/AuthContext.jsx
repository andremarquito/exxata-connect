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
    // console.log('🔍 Buscando perfil para usuário:', supabaseUser.email); // Desabilitado para reduzir logs
    
    // Verificar cache primeiro
    const cachedProfile = getCachedProfile(supabaseUser.id);
    if (cachedProfile) {
      // console.log('📦 Usando perfil em cache'); // Desabilitado para reduzir logs
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
        15000 // 15 segundos de timeout para busca de perfil (aumentado)
      );

      if (error) {
        if (error.code === 'PGRST116') {
          // console.log('📝 Tabela profiles não existe, usando fallback'); // Desabilitado para reduzir logs
        } else if (error.code === 'PGRST118') {
          // console.log('📝 Perfil não encontrado na tabela profiles, usando fallback'); // Desabilitado para reduzir logs
        } else {
          console.warn('⚠️ Erro ao buscar perfil:', error.message);
        }
      } else {
        profile = data;
        // console.log('✅ Perfil encontrado no Supabase:', profile.role); // Desabilitado para reduzir logs
      }
    } catch (profileError) {
      console.warn('⚠️ Erro na consulta de perfil:', profileError.message);
    }

    // Determinar role - PRIORIDADE: 1) Perfil Supabase, 2) Padrão
    let role = null;
    let name = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário';

    // PRIORIDADE 1: Se houver perfil no Supabase, usar ele
    if (profile && profile.role) {
      role = profile.role;
      name = profile.name || name;
      // console.log('📋 Role definido pelo perfil Supabase:', role); // Desabilitado para reduzir logs
    }
    // PRIORIDADE 2: Padrão como último recurso (se não houver perfil)
    else {
      role = supabaseUser.user_metadata?.role || 'cliente';
      console.warn('⚠️ Perfil não encontrado para usuário:', supabaseUser.email, '- usando role de JWT ou padrão:', role);
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
    
    // Armazenar no cache somente se perfil foi carregado do banco
    if (profile) {
      setCachedProfile(supabaseUser.id, userData);
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Erro crítico ao processar perfil do usuário:', error.message || error);
    
    // Tentar usar cache mesmo em caso de erro
    const cachedProfile = getCachedProfile(supabaseUser.id);
    if (cachedProfile) {
      console.log('📦 Usando perfil em cache após erro');
      return cachedProfile;
    }
    
    // Fallback seguro - tentar usar role do JWT; senão padrão
    const fallbackRole = supabaseUser.user_metadata?.role || 'cliente';
    const fallbackName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário';
    
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
    
    // Não armazenar fallback no cache; tentar buscar perfil novamente em futuras tentativas
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
        // console.log('🔍 Verificando autenticação...'); // Desabilitado para reduzir logs
        
        // Verificar sessão do Supabase primeiro com timeout aumentado
        let session = null;
        let sessionError = null;
        
        try {
          const result = await withTimeout(
            supabase.auth.getSession(),
            15000 // 15 segundos de timeout para verificação de sessão (aumentado)
          );
          session = result.data?.session;
          sessionError = result.error;
        } catch (timeoutError) {
          console.warn('⏰ Timeout ao verificar sessão Supabase:', timeoutError.message);
          
          // IMPORTANTE: Em caso de timeout, tentar usar dados do localStorage como fallback
          // Isso evita logout automático em caso de problemas de rede temporários
          try {
            const cachedAuthUser = localStorage.getItem('auth_user');
            const cachedToken = localStorage.getItem('token');
            
            if (cachedAuthUser && cachedToken) {
              console.log('📦 Usando dados em cache do localStorage após timeout');
              const userData = JSON.parse(cachedAuthUser);
              setUser(userData);
              setIsLoading(false);
              return; // Sair da função, mantendo usuário logado
            }
          } catch (cacheError) {
            console.warn('⚠️ Erro ao ler cache do localStorage:', cacheError.message);
          }
          
          sessionError = timeoutError;
        }
        
        if (sessionError) {
          console.warn('⚠️ Erro ao verificar sessão Supabase:', sessionError.message || sessionError);
          // Não forçar logout imediatamente, apenas logar o erro
          // O usuário será deslogado apenas se não houver cache válido
        }

        if (session?.user) {
          // console.log('✅ Sessão Supabase encontrada:', session.user.email); // Desabilitado para reduzir logs
          // Usuário autenticado no Supabase
          const supabaseUser = session.user;
          
          // Buscar dados adicionais do usuário (role, etc.)
          try {
            const userData = await getUserProfile(supabaseUser);
            setUser(userData);
            // console.log('✅ Profile carregado:', userData.name, 'Role:', userData.role); // Desabilitado para reduzir logs
          } catch (profileError) {
            console.error('❌ Erro ao carregar perfil, usando dados básicos:', profileError.message);
            // Fallback com dados básicos do Supabase
            const fallbackRole = supabaseUser.user_metadata?.role;
            setUser({
              id: supabaseUser.id,
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário',
              email: supabaseUser.email,
              role: fallbackRole,
              permissions: getPermissionsByRole(fallbackRole),
              supabaseUser
            });
          }
        } else {
          // console.log('ℹ️ Nenhuma sessão Supabase ativa'); // Desabilitado para reduzir logs
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error?.message || error || 'Erro desconhecido');
        
        // Tentar usar cache como último recurso
        try {
          const cachedAuthUser = localStorage.getItem('auth_user');
          const cachedToken = localStorage.getItem('token');
          
          if (cachedAuthUser && cachedToken) {
            console.log('📦 Usando dados em cache do localStorage após erro');
            const userData = JSON.parse(cachedAuthUser);
            setUser(userData);
          }
        } catch (cacheError) {
          console.warn('⚠️ Erro ao ler cache do localStorage:', cacheError.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 Auth state changed:', event, session?.user?.email); // Desabilitado para reduzir logs
        
        if (session?.user) {
          // Evitar sobrescrever dados se o usuário já está logado com o mesmo email
          if (user && user.email === session.user.email) {
            // console.log('👤 Usuário já logado, mantendo dados atuais'); // Desabilitado para reduzir logs
            return;
          }
          
          const userData = await getUserProfile(session.user);
          // console.log('👤 Definindo usuário via auth state change:', userData.role); // Desabilitado para reduzir logs
          setUser(userData);
          
          // Atualizar localStorage para manter consistência
          localStorage.setItem('token', 'supabase-session');
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } else {
          // console.log('👤 Logout detectado, limpando dados'); // Desabilitado para reduzir logs
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
      console.log('📊 Detalhes da tentativa:', {
        emailLength: email.length,
        passwordLength: password.length,
        emailTrimmed: email.trim(),
        timestamp: new Date().toISOString()
      });
      
      // Login com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        console.log('❌ Login Supabase falhou:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
          name: authError.name
        });
        
        // Verificar se é erro de email não confirmado
        if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.');
        }
        
        // Verificar se é erro de credenciais inválidas
        if (authError.message?.includes('Invalid login credentials') || 
            authError.message?.includes('Invalid email or password')) {
          throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
        }
        
        // Para outros erros do Supabase, lançar erro específico
        throw new Error('Erro de conexão com o servidor. Tente novamente.');
      }

      if (authData.user) {
        console.log('✅ Autenticação Supabase bem-sucedida:', {
          email: authData.user.email,
          emailConfirmed: !!authData.user.email_confirmed_at,
          userId: authData.user.id
        });
        
        // Verificar se o email foi confirmado
        if (!authData.user.email_confirmed_at) {
          console.log('❌ Email não confirmado');
          // Fazer logout imediatamente
          await supabase.auth.signOut();
          throw new Error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.');
        }

        // Login Supabase bem-sucedido
        const userData = await getUserProfile(authData.user);
        console.log('✅ Login bem-sucedido, role:', userData.role);
        setUser(userData);
        
        // Salvar dados no localStorage para persistência
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

          // Somente tentar escrever em profiles se houver sessão (usuário autenticado)
          if (data.session) {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert(profileData);

            if (profileError) {
              console.warn('⚠️ Perfil criado, mas erro ao salvar dados adicionais:', profileError.message);
            } else {
              console.log('✅ Perfil criado com sucesso na tabela profiles');
            }
          } else {
            // Sem sessão após signup: o perfil será criado automaticamente pelo trigger no banco
            console.log('ℹ️ Sem sessão após signup, perfil será criado via trigger no banco.');
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
