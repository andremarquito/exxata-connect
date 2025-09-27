// =====================================================
// SCRIPT DE CORREÇÃO RÁPIDA DO SUPABASE
// Execute no console do navegador após o diagnóstico
// =====================================================

async function fixSupabaseIssues() {
  console.log('🔧 INICIANDO CORREÇÕES DO SUPABASE');
  console.log('==================================');

  try {
    const { supabase } = await import('./src/lib/supabase.js');

    // ============================================
    // 1. VERIFICAR E CRIAR PROFILE MISSING
    // ============================================
    console.log('\n1️⃣ VERIFICANDO PROFILE DO USUÁRIO:');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Usuário autenticado:', user.email);
      
      // Verificar se profile existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        console.log('❌ Profile não encontrado, criando...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email.split('@')[0],
            email: user.email,
            role: 'admin', // ou role desejado
            status: 'Ativo'
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Erro ao criar profile:', createError.message);
        } else {
          console.log('✅ Profile criado:', newProfile);
        }
      } else if (profileError) {
        console.log('❌ Erro ao buscar profile:', profileError.message);
      } else {
        console.log('✅ Profile existe:', profile);
      }
    } else {
      console.log('ℹ️ Nenhum usuário autenticado');
    }

    // ============================================
    // 2. TESTAR CRIAÇÃO DE DADOS BÁSICOS
    // ============================================
    console.log('\n2️⃣ TESTANDO CRIAÇÃO DE DADOS:');
    
    if (user) {
      // Tentar criar projeto de teste
      try {
        const { data: testProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: 'Projeto Teste - ' + Date.now(),
            client: 'Cliente Teste',
            description: 'Projeto criado para testar conectividade',
            created_by: user.id
          })
          .select()
          .single();
        
        if (projectError) {
          console.log('❌ Erro ao criar projeto teste:', projectError.message);
        } else {
          console.log('✅ Projeto teste criado:', testProject.name);
          
          // Remover projeto teste
          await supabase.from('projects').delete().eq('id', testProject.id);
          console.log('🗑️ Projeto teste removido');
        }
      } catch (err) {
        console.log('❌ Erro no teste de criação:', err.message);
      }
    }

    // ============================================
    // 3. VERIFICAR STORAGE BUCKET
    // ============================================
    console.log('\n3️⃣ VERIFICANDO STORAGE BUCKET:');
    
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasProjectFiles = buckets.some(b => b.id === 'project-files');
      
      if (!hasProjectFiles) {
        console.log('❌ Bucket project-files não encontrado');
        console.log('💡 Execute este SQL no Supabase:');
        console.log(`INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);`);
      } else {
        console.log('✅ Bucket project-files existe');
      }
    } catch (err) {
      console.log('❌ Erro ao verificar storage:', err.message);
    }

    // ============================================
    // 4. LIMPAR DADOS CONFLITANTES
    // ============================================
    console.log('\n4️⃣ LIMPANDO DADOS CONFLITANTES:');
    
    // Verificar localStorage conflitante
    const authUser = localStorage.getItem('auth_user');
    const token = localStorage.getItem('token');
    
    if (authUser && user) {
      try {
        const localUser = JSON.parse(authUser);
        if (localUser.email !== user.email) {
          console.log('⚠️ Dados locais conflitantes detectados');
          console.log('🧹 Limpando localStorage...');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('token');
          console.log('✅ LocalStorage limpo');
        }
      } catch (err) {
        console.log('🧹 Removendo dados locais corrompidos...');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('token');
      }
    }

    // ============================================
    // 5. FORÇAR REAUTENTICAÇÃO
    // ============================================
    console.log('\n5️⃣ STATUS FINAL:');
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Sessão válida:', !!session);
    console.log('Usuário:', session?.user?.email || 'Nenhum');
    
    if (session) {
      console.log('✅ Supabase configurado e funcionando');
      console.log('💡 Recarregue a página para aplicar mudanças');
    } else {
      console.log('⚠️ Faça login novamente no Supabase');
    }

  } catch (error) {
    console.error('❌ ERRO NA CORREÇÃO:', error);
  }
}

// ============================================
// FUNÇÃO DE LOGIN RÁPIDO
// ============================================
async function quickLogin(email, password) {
  try {
    console.log('🔐 Fazendo login no Supabase...');
    
    const { supabase } = await import('./src/lib/supabase.js');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
    } else {
      console.log('✅ Login realizado:', data.user.email);
      console.log('🔄 Execute o diagnóstico novamente');
    }
  } catch (err) {
    console.log('❌ Erro crítico no login:', err.message);
  }
}

// ============================================
// FUNÇÃO DE RESET COMPLETO
// ============================================
async function resetSupabaseConnection() {
  console.log('🔄 RESETANDO CONEXÃO SUPABASE');
  
  // Limpar todo localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  try {
    const { supabase } = await import('./src/lib/supabase.js');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
  } catch (err) {
    console.log('⚠️ Erro no logout:', err.message);
  }
  
  console.log('✅ Reset concluído - recarregue a página');
}

// ============================================
// EXECUTAR CORREÇÕES
// ============================================
console.log('🔧 Executando correções...');
fixSupabaseIssues();

// ============================================
// FUNÇÕES DISPONÍVEIS
// ============================================
console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('- quickLogin("email", "senha") - Login rápido');
console.log('- resetSupabaseConnection() - Reset completo');
console.log('- window.location.reload() - Recarregar página');
