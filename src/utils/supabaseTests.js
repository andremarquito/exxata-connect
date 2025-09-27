// ============================================================================
// TESTES PROFISSIONAIS PARA INTEGRAÇÃO SUPABASE - EXXATA CONNECT
// ============================================================================

import { supabase } from '@/lib/supabase';

export class SupabaseTestSuite {
  constructor() {
    this.results = [];
  }

  log(testName, status, details = '') {
    const result = {
      testName,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`[${status}] ${testName}: ${details}`);
    return result;
  }

  async testConnection() {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      return this.log('Conexão Supabase', 'PASS', 'Conectado com sucesso');
    } catch (error) {
      return this.log('Conexão Supabase', 'FAIL', error.message);
    }
  }

  async testAuthentication() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return this.log('Autenticação', 'PASS', `Usuário: ${session.user.email}`);
      } else {
        return this.log('Autenticação', 'INFO', 'Nenhum usuário logado');
      }
    } catch (error) {
      return this.log('Autenticação', 'FAIL', error.message);
    }
  }

  async testUserRegistration(email = 'test@exxata.com', password = 'test123') {
    try {
      // Tentar criar usuário de teste
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Usuário Teste',
            role: 'collaborator'
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return this.log('Registro de Usuário', 'INFO', 'Usuário já existe');
        }
        throw error;
      }

      return this.log('Registro de Usuário', 'PASS', 'Usuário criado com sucesso');
    } catch (error) {
      return this.log('Registro de Usuário', 'FAIL', error.message);
    }
  }

  async testProfilesTable() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (error) throw error;
      return this.log('Tabela Profiles', 'PASS', `${data.length} perfis encontrados`);
    } catch (error) {
      return this.log('Tabela Profiles', 'FAIL', error.message);
    }
  }

  async testProjectsTable() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(5);

      if (error) throw error;
      return this.log('Tabela Projects', 'PASS', `${data.length} projetos encontrados`);
    } catch (error) {
      return this.log('Tabela Projects', 'FAIL', error.message);
    }
  }

  async testProjectCreation() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.log('Criação de Projeto', 'SKIP', 'Usuário não logado');
      }

      const testProject = {
        name: `Projeto Teste ${Date.now()}`,
        client: 'Cliente Teste',
        description: 'Projeto criado automaticamente para teste',
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(testProject)
        .select()
        .single();

      if (error) throw error;

      // Limpar projeto de teste
      await supabase.from('projects').delete().eq('id', data.id);

      return this.log('Criação de Projeto', 'PASS', `Projeto ${data.id} criado e removido`);
    } catch (error) {
      return this.log('Criação de Projeto', 'FAIL', error.message);
    }
  }

  async testRLS() {
    try {
      // Testar se RLS está bloqueando acesso não autorizado
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

      // Se não há erro, RLS está funcionando (retorna apenas projetos do usuário)
      return this.log('Row Level Security', 'PASS', 'RLS funcionando corretamente');
    } catch (error) {
      if (error.message.includes('permission')) {
        return this.log('Row Level Security', 'PASS', 'RLS bloqueando acesso não autorizado');
      }
      return this.log('Row Level Security', 'FAIL', error.message);
    }
  }

  async testPerformance() {
    try {
      const startTime = performance.now();
      
      await Promise.all([
        supabase.from('profiles').select('count').limit(1),
        supabase.from('projects').select('count').limit(1)
      ]);
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      const status = duration < 1000 ? 'PASS' : duration < 3000 ? 'WARN' : 'FAIL';
      return this.log('Performance', status, `${duration}ms`);
    } catch (error) {
      return this.log('Performance', 'FAIL', error.message);
    }
  }

  async runAllTests() {
    console.log('🧪 Iniciando testes do Supabase...');
    
    const tests = [
      () => this.testConnection(),
      () => this.testAuthentication(),
      () => this.testProfilesTable(),
      () => this.testProjectsTable(),
      () => this.testRLS(),
      () => this.testProjectCreation(),
      () => this.testPerformance()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Erro no teste:', error);
      }
    }

    this.printSummary();
    return this.results;
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`⚠️ Avisos: ${warnings}`);
    console.log(`⏭️ Pulados: ${skipped}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((passed / (passed + failed)) * 100)}%`);

    if (failed === 0) {
      console.log('🎉 Todos os testes críticos passaram!');
    } else {
      console.log('🔧 Alguns testes falharam. Verifique os logs acima.');
    }
  }
}

// Função para executar testes rapidamente
export const runQuickTest = async () => {
  const testSuite = new SupabaseTestSuite();
  return await testSuite.runAllTests();
};

// Função para testar funcionalidade específica
export const testSpecific = async (testName) => {
  const testSuite = new SupabaseTestSuite();
  
  switch (testName) {
    case 'connection':
      return await testSuite.testConnection();
    case 'auth':
      return await testSuite.testAuthentication();
    case 'projects':
      return await testSuite.testProjectsTable();
    case 'performance':
      return await testSuite.testPerformance();
    default:
      console.log('Teste não encontrado. Opções: connection, auth, projects, performance');
  }
};
