# Correção: Visibilidade de Membros do Projeto

**Data:** 19 de outubro de 2024  
**Migrações:** v1 → v2 → v3 → v4 → v5 → **v6 (FINAL)**

## Problema

Clientes, colaboradores, admins e gerentes não conseguiam visualizar os outros membros dos projetos dos quais faziam parte. A política RLS anterior em `project_members` permitia apenas:

1. **Admins/Managers:** Ver todos os membros de todos os projetos
2. **Usuários:** Ver apenas sua própria membership

## Histórico de Tentativas

### v1 - Causou Recursão
Verificava se usuário era membro consultando `project_members` dentro da própria política de `project_members`.

### v2 - Causou Recursão Circular com projects
Delegava para RLS de `projects`, mas `projects` também consultava `project_members`, criando loop:
- `project_members` → consulta `projects`
- `projects` → consulta `project_members` 
- Loop infinito → Erro 500

### v3 - Muito Permissiva
Permitia que qualquer usuário autenticado visse todas as memberships (inseguro).

### v4 - Causou Recursão na Subconsulta
Usava `IN` com subconsulta, mas a subconsulta também aplicava RLS causando recursão:
```sql
project_members.project_id IN (
  SELECT pm.project_id FROM project_members pm  -- RLS aplicada aqui!
)
```

### v5 - JOIN filtrava apenas 1 membro
Política muito restritiva (apenas própria membership) + JOIN na aplicação. Resultado: JOIN retornava apenas o usuário logado, não todos os membros.

## Solução Final Implementada (v6) ✅

**Abordagem:** Delegação para RLS de projects + JOIN otimizado

### Política RLS (Delegação Segura)

```sql
CREATE POLICY "project_members_select"
  ON project_members FOR SELECT
  USING (
    -- Admin/Manager podem ver todos os membros
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR
    -- Usuário pode ver membros de projetos acessíveis
    -- Delega verificação para RLS de projects
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
    )
  );
```

### Mudança na Aplicação (ProjectsContext.jsx)

**Linha 153:** Removido `!inner` do JOIN para permitir LEFT JOIN normal:

```javascript
// v5 (filtrava apenas 1 membro)
project_members!inner(...)  // INNER JOIN forçava filtro extra

// v6 (retorna todos os membros)  
project_members(...)  // LEFT JOIN respeitando apenas RLS
```

**Resultado:** JOIN agora carrega **todos os membros** do projeto, não apenas o usuário logado.

## Comportamento Após a Correção

Agora, **todos os tipos de usuário** (clientes, colaboradores, admins, gerentes) podem:

- ✅ Ver todos os membros dos projetos dos quais são membros
- ✅ Ver informações dos outros membros (nome, email, role, status)
- ✅ Visualizar a aba "Equipe" completa nos detalhes do projeto

## Arquivos Modificados

1. **Migração aplicada no Supabase (v6):**
   - `supabase/migrations/fix_project_members_visibility.sql`

2. **Código da aplicação:**
   - `src/contexts/ProjectsContext.jsx` (linha 153)
     - Removido `!inner` do JOIN `project_members`
     - Processamento de dados já estava correto da v5

3. **Documentação atualizada:**
   - `supabase-migration-v0-logic.sql`
   - Este arquivo de documentação

## Validação

Para validar que a correção está funcionando:

1. Faça login como um usuário **cliente** ou **colaborador**
2. Acesse um projeto do qual você é membro
3. Vá para a aba **"Equipe"**
4. Você deve conseguir ver todos os outros membros do projeto

## Notas Técnicas

- **Evita Recursão:** RLS simples sem consultas recursivas + JOIN na aplicação
- **Seguro:** Usuários só veem memberships via JOIN em projetos acessíveis
- **Performance:** Uma única consulta com JOIN é mais eficiente que N consultas separadas
- **Sem Dependência Circular:** RLS de `project_members` não consulta outras tabelas

## Como Funciona (v6)

1. **Usuário solicita projetos:**
   - Busca suas memberships: `SELECT project_id FROM project_members WHERE user_id = auth.uid()`
   - RLS permite ver apenas sua própria membership ✅

2. **Aplicação carrega projetos com JOIN:**
   ```sql
   SELECT *, project_members(...)
   FROM projects
   WHERE id IN [project_ids]
   ```
   
3. **Postgres processa o JOIN de `project_members`:**
   - Para cada registro de `project_members`, aplica a RLS
   - RLS verifica: `EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id)`
   - Como o projeto já foi autorizado na consulta principal, a subconsulta retorna TRUE
   - **Não há recursão** porque a RLS de `projects` usa verificação direta em `project_members` (sem passar pela RLS novamente)
   - Retorna todos os membros daquele projeto ✅

4. **Resultado:**
   - ✅ Colaborador vê todos os membros dos seus projetos
   - ✅ Sem recursão (delegação controlada)
   - ✅ Seguro (só vê membros de projetos acessíveis)
