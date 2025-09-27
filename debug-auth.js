// UTILITÁRIO DE DEBUG - Execute no console do navegador
// Copie e cole este código no console (F12)

async function debugAuth() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO');
  
  try {
    // Importar supabase
    const { supabase } = await import('./src/lib/supabase.js');
    
    // 1. Verificar sessão Supabase
    console.log('\n1️⃣ SESSÃO SUPABASE:');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session Error:', sessionError);
    
    // 2. Verificar usuário atual
    console.log('\n2️⃣ USUÁRIO ATUAL:');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('User Error:', userError);
    
    // 3. Verificar profile na tabela
    if (user) {
      console.log('\n3️⃣ PROFILE NA TABELA:');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('Profile:', profile);
      console.log('Profile Error:', profileError);
      
      // 4. Criar profile se não existe
      if (profileError && profileError.code === 'PGRST116') {
        console.log('\n4️⃣ CRIANDO PROFILE:');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email.split('@')[0],
            email: user.email,
            role: 'admin',
            status: 'Ativo'
          })
          .select()
          .single();
        console.log('Novo Profile:', newProfile);
        console.log('Create Error:', createError);
      }
    }
    
    // 5. Verificar localStorage
    console.log('\n5️⃣ LOCALSTORAGE:');
    console.log('token:', localStorage.getItem('token'));
    console.log('auth_user:', localStorage.getItem('auth_user'));
    console.log('exxata_users:', localStorage.getItem('exxata_users'));
    
    // 6. Testar conexão com tabelas
    console.log('\n6️⃣ TESTE DE CONEXÃO:');
    const { data: projectsTest, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    console.log('Projects table:', projectsTest ? 'OK' : 'ERRO', projectsError);
    
    const { data: profilesTest, error: profilesTestError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    console.log('Profiles table:', profilesTest ? 'OK' : 'ERRO', profilesTestError);
    
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Se não há sessão: fazer login novamente');
    console.log('2. Se não há profile: foi criado automaticamente');
    console.log('3. Recarregar a página: window.location.reload()');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Executar diagnóstico
debugAuth();
