// =====================================================
// DIAGNÓSTICO SUPABASE - VERSÃO CONSOLE
// Copie e cole ESTE código no console do navegador (F12)
// =====================================================

(async function diagnosticSupabaseConsole() {
  console.log('🔍 INICIANDO DIAGNÓSTICO SUPABASE - VERSÃO CONSOLE');
  console.log('================================================');
  
  const results = {
    env: { status: 'unknown', details: {} },
    connection: { status: 'unknown', details: {} },
    auth: { status: 'unknown', details: {} },
    tables: { status: 'unknown', details: {} },
    rls: { status: 'unknown', details: {} },
    storage: { status: 'unknown', details: {} }
  };

  try {
    // ============================================
    // 1. TENTAR CARREGAR SUPABASE CLIENT
    // ============================================
    console.log('\n1️⃣ CARREGANDO CLIENTE SUPABASE:');
    
    let supabase;
    try {
      // Tentar importar o cliente
      const module = await import('./src/lib/supabase.js');
      supabase = module.supabase;
      console.log('✅ Cliente Supabase carregado com sucesso');
      results.env.status = 'success';
    } catch (err) {
      console.log('❌ Erro ao carregar Supabase:', err.message);
      results.env.status = 'error';
      results.env.details = { error: err.message };
      
      // Se não conseguir carregar, provavelmente é problema de .env
      console.log('💡 Possíveis causas:');
      console.log('   - Arquivo .env não existe');
      console.log('   - Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas');
      console.log('   - Servidor de desenvolvimento não rodando');
      return results;
    }

    // ============================================
    // 2. TESTAR CONEXÃO BÁSICA
    // ============================================
    console.log('\n2️⃣ TESTANDO CONEXÃO BÁSICA:');
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.log('⚠️ Erro na consulta:', error.message);
        console.log('Código do erro:', error.code);
        
        if (error.code === 'PGRST301') {
          console.log('💡 Possível causa: Tabela profiles não existe');
          results.connection.status = 'warning';
        } else {
          results.connection.status = 'error';
        }
        results.connection.details = { error: error.message, code: error.code };
      } else {
        console.log('✅ Conexão com banco estabelecida');
        results.connection.status = 'success';
        results.connection.details = { connected: true };
      }
    } catch (err) {
      console.log('❌ Erro crítico de conexão:', err.message);
      results.connection.status = 'error';
      results.connection.details = { error: err.message };
    }

    // ============================================
    // 3. VERIFICAR AUTENTICAÇÃO
    // ============================================
    console.log('\n3️⃣ VERIFICANDO AUTENTICAÇÃO:');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Sessão ativa:', !!session);
      console.log('Usuário logado:', !!user);
      
      if (user) {
        console.log('📧 Email:', user.email);
        console.log('🆔 ID:', user.id);
        console.log('📅 Criado em:', new Date(user.created_at).toLocaleString('pt-BR'));
        results.auth.status = 'success';
        results.auth.details = { 
          hasSession: !!session, 
          hasUser: !!user, 
          email: user.email,
          userId: user.id
        };
      } else {
        console.log('ℹ️ Nenhum usuário autenticado');
        results.auth.status = 'info';
        results.auth.details = { hasSession: !!session, hasUser: false };
      }
    } catch (err) {
      console.log('❌ Erro ao verificar autenticação:', err.message);
      results.auth.status = 'error';
      results.auth.details = { error: err.message };
    }

    // ============================================
    // 4. VERIFICAR TABELAS
    // ============================================
    console.log('\n4️⃣ VERIFICANDO TABELAS:');
    
    const tables = ['profiles', 'projects', 'project_members', 'activities', 'project_files', 'project_indicators', 'project_conducts'];
    const tableResults = {};
    let successCount = 0;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ ${table}:`, error.message);
          tableResults[table] = { status: 'error', error: error.message };
        } else {
          console.log(`✅ ${table}: OK`);
          tableResults[table] = { status: 'success' };
          successCount++;
        }
      } catch (err) {
        console.log(`❌ ${table}:`, err.message);
        tableResults[table] = { status: 'error', error: err.message };
      }
      
      // Delay pequeno para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    results.tables.status = successCount === tables.length ? 'success' : 
                          successCount > 0 ? 'partial' : 'error';
    results.tables.details = { ...tableResults, successCount, totalCount: tables.length };

    // ============================================
    // 5. VERIFICAR PROFILE DO USUÁRIO ATUAL
    // ============================================
    console.log('\n5️⃣ VERIFICANDO PROFILE:');
    
    if (results.auth.details.hasUser) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', results.auth.details.userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log('❌ Profile não encontrado para o usuário atual');
            console.log('💡 O usuário precisa de um registro na tabela profiles');
            results.rls.status = 'warning';
            results.rls.details = { hasProfile: false, needsProfile: true };
          } else {
            console.log('❌ Erro ao buscar profile:', error.message);
            results.rls.status = 'error';
            results.rls.details = { error: error.message };
          }
        } else {
          console.log('✅ Profile encontrado:');
          console.log('   Nome:', profile.name);
          console.log('   Email:', profile.email);
          console.log('   Role:', profile.role);
          console.log('   Status:', profile.status);
          results.rls.status = 'success';
          results.rls.details = { hasProfile: true, profile: profile };
        }
      } catch (err) {
        console.log('❌ Erro ao verificar profile:', err.message);
        results.rls.status = 'error';
        results.rls.details = { error: err.message };
      }
    } else {
      console.log('ℹ️ Usuário não autenticado - não é possível verificar profile');
      results.rls.status = 'info';
      results.rls.details = { needsAuth: true };
    }

    // ============================================
    // 6. VERIFICAR STORAGE
    // ============================================
    console.log('\n6️⃣ VERIFICANDO STORAGE:');
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.log('❌ Erro ao acessar storage:', error.message);
        results.storage.status = 'error';
        results.storage.details = { error: error.message };
      } else {
        const bucketNames = buckets.map(b => b.id);
        const hasProjectFiles = buckets.find(b => b.id === 'project-files');
        
        console.log('📦 Buckets encontrados:', bucketNames);
        console.log('📁 project-files:', hasProjectFiles ? '✅ Existe' : '❌ Não encontrado');
        
        results.storage.status = hasProjectFiles ? 'success' : 'warning';
        results.storage.details = { 
          buckets: bucketNames, 
          hasProjectFiles: !!hasProjectFiles,
          totalBuckets: buckets.length
        };
      }
    } catch (err) {
      console.log('❌ Erro ao verificar storage:', err.message);
      results.storage.status = 'error';
      results.storage.details = { error: err.message };
    }

    // ============================================
    // 7. VERIFICAR DADOS LOCAIS
    // ============================================
    console.log('\n7️⃣ VERIFICANDO DADOS LOCAIS:');
    
    const localData = {
      authUser: localStorage.getItem('auth_user'),
      token: localStorage.getItem('token'),
      projects: localStorage.getItem('exxata_projects'),
      users: localStorage.getItem('exxata_users')
    };
    
    console.log('LocalStorage:');
    console.log('   auth_user:', localData.authUser ? '✅ Presente' : '❌ Ausente');
    console.log('   token:', localData.token ? '✅ Presente' : '❌ Ausente');
    console.log('   exxata_projects:', localData.projects ? `✅ Presente (${JSON.parse(localData.projects || '[]').length} projetos)` : '❌ Ausente');
    console.log('   exxata_users:', localData.users ? `✅ Presente (${JSON.parse(localData.users || '[]').length} usuários)` : '❌ Ausente');

    // ============================================
    // 8. RESUMO FINAL
    // ============================================
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('========================');
    
    Object.keys(results).forEach(key => {
      const result = results[key];
      const status = result.status;
      const icon = status === 'success' ? '✅' : 
                   status === 'warning' ? '⚠️' : 
                   status === 'partial' ? '🔶' :
                   status === 'info' ? 'ℹ️' : '❌';
      
      console.log(`${icon} ${key.toUpperCase()}: ${status.toUpperCase()}`);
    });

    // ============================================
    // 9. RECOMENDAÇÕES ESPECÍFICAS
    // ============================================
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('=================');
    
    if (results.env.status === 'error') {
      console.log('🔧 1. Configure o arquivo .env com as credenciais do Supabase');
    }
    
    if (results.connection.status === 'error') {
      console.log('🔧 2. Verifique se o projeto Supabase está ativo e acessível');
    }
    
    if (results.tables.status !== 'success') {
      console.log('🔧 3. Execute o script supabase-setup.sql no SQL Editor do Supabase');
    }
    
    if (results.auth.status === 'info') {
      console.log('🔧 4. Faça login: await supabase.auth.signInWithPassword({email: "seu@email.com", password: "senha"})');
    }
    
    if (results.rls.status === 'warning' && results.rls.details.needsProfile) {
      console.log('🔧 5. Crie profile para o usuário atual (execute o script fix-supabase.js)');
    }
    
    if (results.storage.status !== 'success') {
      console.log('🔧 6. Crie o bucket project-files no Supabase Storage');
    }

    // ============================================
    // 10. COMANDOS ÚTEIS
    // ============================================
    console.log('\n🛠️ COMANDOS ÚTEIS PARA O CONSOLE:');
    console.log('=================================');
    console.log('// Login rápido:');
    console.log('const { supabase } = await import("./src/lib/supabase.js");');
    console.log('await supabase.auth.signInWithPassword({email: "admin@exxata.com", password: "admin123"});');
    console.log('');
    console.log('// Criar profile:');
    console.log('const { data: user } = await supabase.auth.getUser();');
    console.log('await supabase.from("profiles").insert({id: user.data.id, name: "Admin", email: user.data.email, role: "admin"});');
    console.log('');
    console.log('// Verificar tabelas:');
    console.log('await supabase.from("profiles").select("count");');

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!');
    console.log('=========================');
    
    return results;

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NO DIAGNÓSTICO:', error);
    return { error: error.message, stack: error.stack };
  }
})();
