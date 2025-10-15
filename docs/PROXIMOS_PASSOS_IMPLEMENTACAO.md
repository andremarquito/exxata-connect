# 🚀 Próximos Passos - Implementação Lógica V0

## 📊 Status Atual

Análise completa da lógica do repositório V0 foi concluída. Os seguintes documentos foram criados:

1. **ANALISE_V0_LOGICA_IMPLEMENTACAO.md** - Análise detalhada das diferenças e recomendações
2. **supabase-migration-v0-logic.sql** - Script SQL completo de migração
3. Este documento - Guia de implementação passo a passo

---

## ⚠️ IMPORTANTE: Backup Obrigatório

**ANTES DE EXECUTAR QUALQUER SCRIPT:**

```bash
# 1. Fazer backup do banco de dados no Supabase Dashboard
# Settings > Database > Backups > Create Backup

# 2. Exportar dados importantes localmente
# SQL Editor > Execute:
```

```sql
-- Exportar projetos
COPY (SELECT * FROM projects) TO '/tmp/projects_backup.csv' CSV HEADER;

-- Exportar membros
COPY (SELECT * FROM project_members) TO '/tmp/members_backup.csv' CSV HEADER;

-- Exportar condutas
COPY (SELECT * FROM project_conducts) TO '/tmp/conducts_backup.csv' CSV HEADER;
```

---

## 📋 Checklist de Implementação

### Fase 1: Preparação (30 min)
- [ ] Ler completamente `ANALISE_V0_LOGICA_IMPLEMENTACAO.md`
- [ ] Fazer backup completo do banco de dados Supabase
- [ ] Criar branch Git para implementação: `git checkout -b feature/v0-logic-implementation`
- [ ] Testar conexão com Supabase localmente

### Fase 2: Migração do Banco de Dados (1-2 horas)
- [ ] Abrir Supabase Dashboard > SQL Editor
- [ ] Copiar conteúdo de `supabase-migration-v0-logic.sql`
- [ ] **Revisar script linha por linha antes de executar**
- [ ] Executar script em partes (não tudo de uma vez):
  - [ ] Parte 1: Adicionar campos JSONB
  - [ ] Parte 2: Migrar dados de condutas
  - [ ] Parte 3: Corrigir project_members (CUIDADO!)
  - [ ] Parte 4: Criar funções helper
  - [ ] Parte 5: Recriar políticas RLS
  - [ ] Parte 6: Adicionar índices
  - [ ] Parte 7: Criar trigger auto-membro
  - [ ] Parte 8: Verificações
- [ ] Testar queries básicas após cada parte
- [ ] Verificar se dados foram migrados corretamente

### Fase 3: Atualizar Serviços Backend (2-3 horas)

#### 3.1 Atualizar `src/services/supabaseService.js`

```javascript
// Localizar função createProject e substituir por:

async createProject(projectData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Criar projeto com novos campos
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        location: projectData.location,
        contract_value: projectData.contractValue,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        sector: projectData.sector,
        phase: projectData.phase || 'Planejamento',
        status: projectData.status || 'Planejamento',
        progress: 0,
        created_by: user.id,
        updated_by: user.id,
        // Novos campos JSONB
        conducts: projectData.conducts || [],
        panorama: projectData.panorama || {
          tecnica: { status: 'green', items: [] },
          fisica: { status: 'green', items: [] },
          economica: { status: 'green', items: [] }
        },
        exxata_activities: projectData.exxataActivities || [],
        overview_cards: projectData.overviewCards || [],
        ai_predictive_text: projectData.aiPredictiveText || ''
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // 2. Trigger já adiciona criador como membro automaticamente!
    // Não precisa fazer manualmente

    return project;
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
}
```

**Tarefas:**
- [ ] Atualizar função `createProject`
- [ ] Atualizar função `getProjectById` para carregar campos JSONB
- [ ] Atualizar função `updateProject` para aceitar novos campos
- [ ] Testar criação de projeto
- [ ] Verificar se criador é adicionado como membro automaticamente

#### 3.2 Adicionar Funções de Gerenciamento de Membros

```javascript
// Adicionar ao projectService:

async addProjectMember(projectId, userId, role = 'member') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se usuário existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    // Adicionar membro
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role,
        added_by: user.id
      })
      .select(`
        *,
        profiles:profiles!project_members_user_id_fkey(id, name, email, role)
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Este usuário já é membro do projeto');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    throw error;
  }
},

async removeProjectMember(projectId, userId) {
  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    throw error;
  }
},

async getProjectMembers(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        profiles:profiles!project_members_user_id_fkey(id, name, email, role, status)
      `)
      .eq('project_id', projectId)
      .order('added_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return [];
  }
}
```

**Tarefas:**
- [ ] Adicionar funções de gerenciamento de membros
- [ ] Testar adição de membro
- [ ] Testar remoção de membro
- [ ] Testar listagem de membros

### Fase 4: Criar Componentes UI (3-4 horas)

#### 4.1 Criar Modal de Adicionar Membro

**Arquivo:** `src/components/projects/AddMemberModal.jsx`

```bash
# Criar arquivo
touch src/components/projects/AddMemberModal.jsx
```

**Tarefas:**
- [ ] Criar componente `AddMemberModal`
- [ ] Implementar busca de usuário por email
- [ ] Implementar seleção de role
- [ ] Adicionar validação de formulário
- [ ] Adicionar feedback visual (toast/alert)
- [ ] Testar adição de membro via UI

#### 4.2 Criar Modal de Adicionar Atividade

**Arquivo:** `src/components/projects/AddActivityModal.jsx`

**Tarefas:**
- [ ] Criar componente `AddActivityModal`
- [ ] Implementar formulário completo
- [ ] Adicionar seleção de responsável (membros do projeto)
- [ ] Adicionar validação de datas
- [ ] Testar criação de atividade via UI

#### 4.3 Criar Modal de Upload de Documento

**Arquivo:** `src/components/projects/UploadDocumentModal.jsx`

**Tarefas:**
- [ ] Criar componente `UploadDocumentModal`
- [ ] Implementar upload para Supabase Storage
- [ ] Adicionar preview de arquivo
- [ ] Adicionar validação de tipo/tamanho
- [ ] Testar upload via UI

#### 4.4 Criar Tab de Equipe

**Arquivo:** `src/components/projects/TeamTab.jsx`

**Tarefas:**
- [ ] Criar componente `TeamTab`
- [ ] Listar membros do projeto
- [ ] Adicionar botão "Adicionar Membro"
- [ ] Adicionar botão de remover membro
- [ ] Exibir role de cada membro
- [ ] Testar visualização e gerenciamento

### Fase 5: Atualizar Context (1 hora)

#### 5.1 Atualizar `src/contexts/ProjectsContext.jsx`

**Tarefas:**
- [ ] Remover lógica de conversão TEXT para UUID
- [ ] Atualizar `loadProjectsFromSupabase` para carregar campos JSONB
- [ ] Atualizar `createProject` para usar novos campos
- [ ] Adicionar funções de gerenciamento de membros no context
- [ ] Testar carregamento de projetos

### Fase 6: Testes Completos (2-3 horas)

#### 6.1 Testes de Criação
- [ ] Criar novo projeto
- [ ] Verificar se criador é adicionado como membro automaticamente
- [ ] Verificar se campos JSONB são salvos corretamente
- [ ] Verificar se projeto aparece na lista

#### 6.2 Testes de Membros
- [ ] Adicionar membro ao projeto
- [ ] Verificar se membro aparece na lista
- [ ] Tentar adicionar mesmo membro novamente (deve falhar)
- [ ] Remover membro do projeto
- [ ] Verificar se membro foi removido

#### 6.3 Testes de Atividades
- [ ] Criar atividade no projeto
- [ ] Atribuir atividade a membro
- [ ] Atualizar status da atividade
- [ ] Deletar atividade

#### 6.4 Testes de Documentos
- [ ] Upload de documento
- [ ] Download de documento
- [ ] Deletar documento

#### 6.5 Testes de Permissões RLS
- [ ] Criar usuário de teste
- [ ] Tentar acessar projeto sem ser membro (deve falhar)
- [ ] Adicionar usuário como membro
- [ ] Verificar se agora consegue acessar
- [ ] Remover usuário e verificar se perde acesso

### Fase 7: Documentação e Deploy (1 hora)

**Tarefas:**
- [ ] Atualizar README.md com novas funcionalidades
- [ ] Documentar estrutura de dados JSONB
- [ ] Criar guia de uso para membros de projeto
- [ ] Fazer commit das mudanças
- [ ] Criar Pull Request
- [ ] Fazer merge para main
- [ ] Deploy para produção

---

## 🎯 Principais Mudanças Implementadas

### 1. Schema do Banco de Dados
✅ Campos JSONB adicionados: `conducts`, `panorama`, `overview_cards`, `exxata_activities`
✅ Coluna `project_members.project` convertida de TEXT para UUID
✅ Constraint UNIQUE adicionada em `project_members`
✅ Funções helper RLS criadas para evitar recursão
✅ Trigger para auto-adicionar criador como membro

### 2. Lógica de Negócio
✅ Criador é adicionado automaticamente como membro (role: owner)
✅ Validação de membro duplicado
✅ Permissões RLS otimizadas
✅ Queries mais eficientes com índices

### 3. Interface do Usuário
✅ Modal de adicionar membro
✅ Modal de adicionar atividade
✅ Modal de upload de documento
✅ Tab de equipe para gerenciar membros

---

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: Erro ao converter project_members.project
**Sintoma:** Erro "invalid input syntax for type uuid"
**Solução:** Verificar se todos os valores na coluna são UUIDs válidos antes de converter

```sql
-- Verificar valores inválidos
SELECT * FROM project_members WHERE project !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Corrigir ou deletar registros inválidos antes de converter
```

### Problema 2: Recursão circular em RLS
**Sintoma:** Timeout ou erro de recursão infinita
**Solução:** Usar funções SECURITY DEFINER (já implementado no script)

### Problema 3: Membro duplicado
**Sintoma:** Erro ao adicionar membro que já existe
**Solução:** Constraint UNIQUE já previne isso + validação no frontend

---

## 📞 Suporte

Se encontrar problemas durante a implementação:

1. Verificar logs do Supabase Dashboard
2. Consultar documentação: `ANALISE_V0_LOGICA_IMPLEMENTACAO.md`
3. Revisar script SQL: `supabase-migration-v0-logic.sql`
4. Fazer rollback se necessário (usar backup)

---

## ✅ Critérios de Sucesso

A implementação está completa quando:

- [ ] Todos os testes da Fase 6 passam
- [ ] Criador é adicionado automaticamente como membro
- [ ] Membros podem ser adicionados/removidos via UI
- [ ] Atividades podem ser criadas e atribuídas a membros
- [ ] Documentos podem ser enviados e baixados
- [ ] Permissões RLS funcionam corretamente
- [ ] Não há erros no console
- [ ] Performance está adequada

---

## 🎓 Lições Aprendidas

1. **Sempre fazer backup antes de migrar**
2. **Testar scripts SQL em partes, não tudo de uma vez**
3. **Usar SECURITY DEFINER para evitar recursão RLS**
4. **Validar dados no frontend E no backend**
5. **Documentar mudanças importantes**

---

## 📚 Referências

- Análise Completa: `docs/ANALISE_V0_LOGICA_IMPLEMENTACAO.md`
- Script SQL: `supabase-migration-v0-logic.sql`
- Repositório V0: https://github.com/andremarquito/v0-exxata-connect-clone.git
- Documentação Supabase: https://supabase.com/docs

---

**Boa sorte com a implementação! 🚀**
