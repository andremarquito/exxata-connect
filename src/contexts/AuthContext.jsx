import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const AuthContext = createContext(null);

// Função helper para timeout em promises
const withTimeout = (promise, ms = 12000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth operation timeout')), ms)
    )
  ]);
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
    // Buscar dados adicionais do usuário na tabela profiles (se existir) com timeout
    const { data: profile, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single(),
      5000 // 5 segundos de timeout
    );

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não encontrada
      console.error('Erro ao buscar perfil:', error);
    }

    // Determinar role baseado no email ou perfil
    let role = 'cliente'; // padrão
    let name = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário';

    if (profile) {
      role = profile.role || role;
      name = profile.name || name;
    } else {
      // Fallback baseado no email para usuários existentes
      if (supabaseUser.email === 'admin@exxata.com') {
        role = 'admin';
        name = 'Admin';
      } else if (supabaseUser.email === 'consultor@exxata.com') {
        role = 'consultor';
        name = 'Consultor';
      }
    }

    return {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email,
      role,
      permissions: getPermissionsByRole(role),
      supabaseUser // Manter referência ao usuário do Supabase
    };
  } catch (error) {
    console.error('Erro ao processar perfil do usuário:', error);
    // Retornar dados básicos em caso de erro
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário',
      email: supabaseUser.email,
      role: 'cliente',
      permissions: getPermissionsByRole('cliente'),
      supabaseUser
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação...');
        
        // Verificar sessão do Supabase primeiro com timeout
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000 // 5 segundos de timeout
        );
        
        if (error) {
          console.error('Erro ao verificar sessão Supabase:', error);
          throw error; // Forçar fallback
        }

        if (session?.user) {
          console.log('✅ Sessão Supabase encontrada:', session.user.email);
          // Usuário autenticado no Supabase
          const supabaseUser = session.user;
          
          // Buscar dados adicionais do usuário (role, etc.)
          const userData = await getUserProfile(supabaseUser);
          setUser(userData);
          console.log('✅ Profile carregado:', userData.name);
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
        console.error('Erro ao verificar autenticação:', error);
        
        // Fallback para sistema local em caso de timeout
        console.log('🔄 Fallback para sistema local devido a erro');
        const token = localStorage.getItem('token');
        if (token) {
          const rawUser = localStorage.getItem('auth_user');
          if (rawUser) {
            try { 
              const localUser = JSON.parse(rawUser);
              setUser(localUser);
              console.log('✅ Fallback: usuário local carregado');
            } catch { 
              localStorage.removeItem('auth_user');
              localStorage.removeItem('token');
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const userData = await getUserProfile(session.user);
          setUser(userData);
        } else {
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
      // Tentar login com Supabase primeiro
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.log('Login Supabase falhou, tentando sistema local:', authError.message);
        
        // Fallback para sistema local
        return await loginLocal(email, password);
      }

      if (authData.user) {
        // Login Supabase bem-sucedido
        const userData = await getUserProfile(authData.user);
        setUser(userData);
        
        // Manter compatibilidade com sistema local
        localStorage.setItem('token', 'supabase-session');
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        return { success: true };
      }

      throw new Error('Erro inesperado no login');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  // Função de login local (fallback)
  const loginLocal = async (email, password) => {
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
      if (!invitedUser) {
        throw new Error('E-mail não cadastrado na plataforma. Entre em contato com o administrador para receber um convite.');
      } else {
        throw new Error('Senha incorreta.');
      }
    }

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

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission
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
