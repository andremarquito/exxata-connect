/**
 * Script de Diagnóstico de Login - Exxata Connect
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Cole este script completo
 * 3. Execute: await diagnosticLogin('andremarquito@gmail.com')
 * 4. Analise os resultados
 */

async function diagnosticLogin(email) {
  console.log('🔍 ========================================');
  console.log('🔍 DIAGNÓSTICO DE LOGIN - EXXATA CONNECT');
  console.log('🔍 ========================================\n');
  
  const results = {
    email: email,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. Verificar se o Supabase está configurado
  console.log('1️⃣ Verificando configuração do Supabase...');
  try {
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase não está definido');
      results.checks.supabaseConfigured = false;
      
      // Tentar importar do módulo
      try {
        const { supabase: sb } = await import('./src/lib/supabase.js');
        window.supabase = sb;
        console.log('✅ Supabase importado com sucesso');
        results.checks.supabaseConfigured = true;
      } catch (importError) {
        console.error('❌ Erro ao importar Supabase:', importError.message);
        return results;
      }
    } else {
      console.log('✅ Supabase está configurado');
      results.checks.supabaseConfigured = true;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar Supabase:', error.message);
    results.checks.supabaseConfigured = false;
    return results;
  }

  // 2. Verificar sessão atual
  console.log('\n2️⃣ Verificando sessão atual...');
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
      results.checks.currentSession = { error: sessionError.message };
    } else if (sessionData?.session) {
      console.log('✅ Sessão ativa encontrada:', {
        email: sessionData.session.user.email,
        userId: sessionData.session.user.id,
        emailConfirmed: !!sessionData.session.user.email_confirmed_at
      });
      results.checks.currentSession = {
        active: true,
        email: sessionData.session.user.email,
        userId: sessionData.session.user.id,
        emailConfirmed: !!sessionData.session.user.email_confirmed_at
      };
    } else {
      console.log('ℹ️ Nenhuma sessão ativa');
      results.checks.currentSession = { active: false };
    }
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error.message);
    results.checks.currentSession = { error: error.message };
  }

  // 3. Verificar se o usuário existe no Supabase (via tentativa de recuperação de senha)
  console.log('\n3️⃣ Verificando se o usuário existe no Supabase...');
  console.log('ℹ️ Nota: Vamos tentar buscar o perfil do usuário');
  
  try {
    // Tentar buscar na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.warn('⚠️ Erro ao buscar perfil:', profileError.message);
      results.checks.profileExists = { error: profileError.message };
    } else if (profileData) {
      console.log('✅ Perfil encontrado na tabela profiles:', {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role,
        status: profileData.status,
        empresa: profileData.empresa
      });
      results.checks.profileExists = {
        found: true,
        profile: {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role,
          status: profileData.status,
          empresa: profileData.empresa
        }
      };
    } else {
      console.log('❌ Perfil NÃO encontrado na tabela profiles');
      results.checks.profileExists = { found: false };
    }
  } catch (error) {
    console.error('❌ Erro ao verificar perfil:', error.message);
    results.checks.profileExists = { error: error.message };
  }

  // 4. Verificar localStorage
  console.log('\n4️⃣ Verificando dados no localStorage...');
  try {
    const token = localStorage.getItem('token');
    const authUser = localStorage.getItem('auth_user');
    
    if (token) {
      console.log('✅ Token encontrado:', token);
      results.checks.localStorage = { token: token };
    } else {
      console.log('ℹ️ Nenhum token no localStorage');
      results.checks.localStorage = { token: null };
    }
    
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        console.log('✅ Dados do usuário no localStorage:', {
          email: user.email,
          name: user.name,
          role: user.role
        });
        results.checks.localStorage.user = {
          email: user.email,
          name: user.name,
          role: user.role
        };
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse dos dados do usuário:', parseError.message);
        results.checks.localStorage.user = { error: 'Parse error' };
      }
    } else {
      console.log('ℹ️ Nenhum dado de usuário no localStorage');
      results.checks.localStorage.user = null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar localStorage:', error.message);
    results.checks.localStorage = { error: error.message };
  }

  // 5. Verificar sistema local de usuários convidados
  console.log('\n5️⃣ Verificando sistema local de usuários convidados...');
  try {
    const usersData = localStorage.getItem('exxata_users');
    
    if (usersData) {
      const users = JSON.parse(usersData);
      const invitedUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (invitedUser) {
        console.log('✅ Usuário encontrado no sistema local:', {
          id: invitedUser.id,
          email: invitedUser.email,
          name: invitedUser.name,
          role: invitedUser.role,
          status: invitedUser.status
        });
        results.checks.localSystem = {
          found: true,
          user: {
            id: invitedUser.id,
            email: invitedUser.email,
            name: invitedUser.name,
            role: invitedUser.role,
            status: invitedUser.status
          }
        };
      } else {
        console.log('❌ Usuário NÃO encontrado no sistema local');
        console.log(`ℹ️ Total de usuários convidados: ${users.length}`);
        results.checks.localSystem = { 
          found: false,
          totalUsers: users.length
        };
      }
    } else {
      console.log('ℹ️ Nenhum usuário convidado no sistema local');
      results.checks.localSystem = { found: false, totalUsers: 0 };
    }
  } catch (error) {
    console.error('❌ Erro ao verificar sistema local:', error.message);
    results.checks.localSystem = { error: error.message };
  }

  // 6. Resumo e Recomendações
  console.log('\n📊 ========================================');
  console.log('📊 RESUMO DO DIAGNÓSTICO');
  console.log('📊 ========================================\n');

  const recommendations = [];

  // Analisar resultados
  if (!results.checks.supabaseConfigured) {
    recommendations.push('❌ CRÍTICO: Supabase não está configurado corretamente');
  }

  if (results.checks.profileExists?.found) {
    console.log('✅ Usuário existe no Supabase (tabela profiles)');
    
    // Verificar se há sessão ativa
    if (!results.checks.currentSession?.active) {
      recommendations.push('⚠️ Usuário existe mas não há sessão ativa. Tente fazer login novamente.');
    }
  } else {
    console.log('❌ Usuário NÃO existe no Supabase (tabela profiles)');
    recommendations.push('❌ AÇÃO NECESSÁRIA: Criar usuário no Supabase via Dashboard ou página de Signup');
  }

  if (results.checks.localSystem?.found) {
    console.log('✅ Usuário existe no sistema local');
  } else {
    console.log('❌ Usuário NÃO existe no sistema local');
  }

  // Exibir recomendações
  if (recommendations.length > 0) {
    console.log('\n🔧 RECOMENDAÇÕES:');
    recommendations.forEach(rec => console.log(rec));
  } else {
    console.log('\n✅ Tudo parece estar configurado corretamente!');
    console.log('ℹ️ Se ainda houver problemas de login, verifique:');
    console.log('   1. Se a senha está correta');
    console.log('   2. Se o email foi confirmado no Supabase');
    console.log('   3. Limpe o cache do navegador e tente novamente');
  }

  console.log('\n📋 Resultados completos:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Exportar para uso global
window.diagnosticLogin = diagnosticLogin;

console.log('✅ Script de diagnóstico carregado!');
console.log('📝 Para usar, execute: await diagnosticLogin("seu@email.com")');
console.log('📝 Exemplo: await diagnosticLogin("andremarquito@gmail.com")');
