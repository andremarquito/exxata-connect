// =====================================================
// DIAGNÓSTICO COMPLETO DO SUPABASE
// Execute no console do navegador (F12)
// =====================================================

async function diagnosticSupabase() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO SUPABASE');
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
    // 1. VERIFICAR VARIÁVEIS DE AMBIENTE
    // ============================================
    console.log('\n1️⃣ VERIFICANDO VARIÁVEIS DE AMBIENTE:');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('URL:', supabaseUrl || '❌ AUSENTE');
    console.log('KEY:', supabaseKey ? '✅ PRESENTE' : '❌ AUSENTE');
    
    if (!supabaseUrl || !supabaseKey) {
      results.env.status = 'error';
      results.env.details = {
        url: !!supabaseUrl,
        key: !!supabaseKey,
        error: 'Variáveis de ambiente não configuradas'
      };
      console.log('❌ Configure o arquivo .env com as credenciais do Supabase');
      return results;
    } else {
      results.env.status = 'success';
      results.env.details = { url: supabaseUrl, hasKey: true };
    }

    // ============================================
    // 2. TESTAR CONEXÃO BÁSICA
    // ============================================
    console.log('\n2️⃣ TESTANDO CONEXÃO BÁSICA:');
    
    try {
      const { supabase } = await import('./src/lib/supabase.js');
      console.log('✅ Cliente Supabase carregado');
      
      // Teste simples de conectividade
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.log('⚠️ Erro na conexão:', error.message);
        console.log('Código:', error.code);
        results.connection.status = 'error';
        results.connection.details = { error: error.message, code: error.code };
      } else {
        console.log('✅ Conexão estabelecida com sucesso');
        results.connection.status = 'success';
        results.connection.details = { data };
      }
    } catch (err) {
      console.log('❌ Erro ao carregar cliente Supabase:', err.message);
      results.connection.status = 'error';
      results.connection.details = { error: err.message };
      return results;
    }

    // ============================================
    // 3. VERIFICAR AUTENTICAÇÃO
    // ============================================
    console.log('\n3️⃣ VERIFICANDO AUTENTICAÇÃO:');
    
    const { supabase } = await import('./src/lib/supabase.js');
    
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Sessão ativa:', !!session);
    console.log('Usuário logado:', !!user);
    
    if (user) {
      console.log('Email do usuário:', user.email);
      console.log('ID do usuário:', user.id);
      results.auth.status = 'success';
      results.auth.details = { 
        hasSession: !!session, 
        hasUser: !!user, 
        email: user.email 
      };
    } else {
      console.log('ℹ️ Nenhum usuário autenticado');
      results.auth.status = 'info';
      results.auth.details = { hasSession: !!session, hasUser: false };
    }

    // ============================================
    // 4. VERIFICAR TABELAS
    // ============================================
    console.log('\n4️⃣ VERIFICANDO TABELAS:');
    
    const tables = ['profiles', 'projects', 'project_members', 'activities', 'project_files', 'project_indicators', 'project_conducts'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ ${table}:`, error.message);
          tableResults[table] = { status: 'error', error: error.message };
        } else {
          console.log(`✅ ${table}: OK`);
          tableResults[table] = { status: 'success' };
        }
      } catch (err) {
        console.log(`❌ ${table}:`, err.message);
        tableResults[table] = { status: 'error', error: err.message };
      }
    }
    
    const successfulTables = Object.keys(tableResults).filter(t => tableResults[t].status === 'success');
    results.tables.status = successfulTables.length === tables.length ? 'success' : 'partial';
    results.tables.details = tableResults;

    // ============================================
    // 5. VERIFICAR RLS (Row Level Security)
    // ============================================
    console.log('\n5️⃣ VERIFICANDO RLS:');
    
    try {
      // Tentar acessar dados sem autenticação
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error && error.message.includes('RLS')) {
        console.log('✅ RLS ativo (dados protegidos)');
        results.rls.status = 'success';
        results.rls.details = { active: true, protected: true };
      } else if (error) {
        console.log('⚠️ Erro RLS:', error.message);
        results.rls.status = 'error';
        results.rls.details = { error: error.message };
      } else {
        console.log('⚠️ RLS pode não estar configurado corretamente');
        results.rls.status = 'warning';
        results.rls.details = { active: false, dataVisible: !!data };
      }
    } catch (err) {
      console.log('❌ Erro ao verificar RLS:', err.message);
      results.rls.status = 'error';
      results.rls.details = { error: err.message };
    }

    // ============================================
    // 6. VERIFICAR STORAGE
    // ============================================
    console.log('\n6️⃣ VERIFICANDO STORAGE:');
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.log('❌ Erro ao listar buckets:', error.message);
        results.storage.status = 'error';
        results.storage.details = { error: error.message };
      } else {
        const projectFilesBucket = buckets.find(b => b.id === 'project-files');
        console.log('Buckets disponíveis:', buckets.map(b => b.id));
        console.log('Bucket project-files:', projectFilesBucket ? '✅ Existe' : '❌ Não encontrado');
        
        results.storage.status = projectFilesBucket ? 'success' : 'warning';
        results.storage.details = { 
          buckets: buckets.map(b => b.id), 
          hasProjectFiles: !!projectFilesBucket 
        };
      }
    } catch (err) {
      console.log('❌ Erro ao verificar storage:', err.message);
      results.storage.status = 'error';
      results.storage.details = { error: err.message };
    }

    // ============================================
    // 7. RESUMO FINAL
    // ============================================
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('========================');
    
    Object.keys(results).forEach(key => {
      const result = results[key];
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : 
                   result.status === 'partial' ? '🔶' :
                   result.status === 'info' ? 'ℹ️' : '❌';
      console.log(`${icon} ${key.toUpperCase()}: ${result.status}`);
    });

    // ============================================
    // 8. RECOMENDAÇÕES
    // ============================================
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('=================');
    
    if (results.env.status === 'error') {
      console.log('1. Configure o arquivo .env com URL e ANON_KEY do Supabase');
    }
    
    if (results.connection.status === 'error') {
      console.log('2. Verifique se o projeto Supabase está ativo');
      console.log('3. Confirme se a URL está correta');
    }
    
    if (results.tables.status !== 'success') {
      console.log('4. Execute o script supabase-setup.sql no SQL Editor');
    }
    
    if (results.auth.status === 'info') {
      console.log('5. Faça login para testar funcionalidades autenticadas');
    }
    
    if (results.storage.status !== 'success') {
      console.log('6. Verifique se o bucket project-files foi criado');
    }

    return results;

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NO DIAGNÓSTICO:', error);
    return { error: error.message };
  }
}

// ============================================
// EXECUTAR DIAGNÓSTICO
// ============================================
console.log('🚀 Executando diagnóstico do Supabase...');
diagnosticSupabase().then(results => {
  console.log('\n🔍 DIAGNÓSTICO CONCLUÍDO');
  console.log('========================');
  console.log('Resultados completos:', results);
}).catch(error => {
  console.error('❌ FALHA NO DIAGNÓSTICO:', error);
});
