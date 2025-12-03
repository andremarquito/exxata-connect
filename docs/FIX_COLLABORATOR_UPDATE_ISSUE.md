# Correção: Colaboradores não conseguem editar projetos

## 🔴 Problema Identificado

Colaboradores conseguem **visualizar** projetos dos quais são membros, mas **não conseguem salvar alterações** na aba "Visão Geral" e outras abas.

### Sintomas:
- Console mostra: ✅ "Projeto salvo com sucesso no Supabase"
- Ao atualizar a página (F5), as alterações **não persistem**
- Problema afeta apenas perfil "Colaborador"
- Admin e Gerente funcionam normalmente

## 🔍 Causa Raiz

Existem **duas políticas RLS conflitantes** para UPDATE na tabela `projects`:

### Política Permissiva (supabase-setup.sql):
```sql
CREATE POLICY "Authorized users can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador')
    )
  );
```
✅ Permite colaboradores editarem

### Política Restritiva (supabase-migration-v0-logic.sql):
```sql
CREATE POLICY "Project creators can update projects"
  ON projects FOR UPDATE
  USING (
    projects.created_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );
```
❌ **Bloqueia** colaboradores (apenas criador, admin e manager)

### Por que o console mostra sucesso?

O frontend (JavaScript) não tem como saber que o RLS bloqueou a operação. O Supabase retorna sucesso (200), mas **silenciosamente ignora** o UPDATE devido à política RLS.

## ✅ Solução

Aplicar a migração que corrige a política de UPDATE:

### Passo 1: Aplicar migração no Supabase

1. Acesse o **Dashboard do Supabase**
2. Vá em **SQL Editor**
3. Abra o arquivo: `supabase/migrations/fix_projects_update_policy_for_collaborators.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Verificar se foi aplicada

Execute no SQL Editor:

```sql
-- Verificar políticas da tabela projects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'projects'
ORDER BY cmd, policyname;
```

Você deve ver:
- ✅ `Users can update projects they have access to` (FOR UPDATE)
- ✅ `Users can create projects` (FOR INSERT)
- ✅ `Users can delete projects they created` (FOR DELETE)
- ✅ `Users can view projects they are members of` (FOR SELECT)

### Passo 3: Testar

1. Faça login como **Colaborador**
2. Acesse um projeto do qual você é membro
3. Edite um card na aba "Visão Geral"
4. Salve
5. Atualize a página (F5)
6. ✅ Alteração deve persistir

## 📋 O que a migração faz

### Remove políticas conflitantes:
- ❌ `Project creators can update projects`
- ❌ `Authorized users can manage projects`

### Cria política correta de UPDATE:
Permite UPDATE se:
1. **Criador do projeto** (`created_by = auth.uid()`)
2. **Admin/Manager** (todos os projetos)
3. **Colaborador E membro do projeto** (via `project_members`)

### Mantém políticas de INSERT e DELETE:
- INSERT: Apenas admin/manager
- DELETE: Apenas criador ou admin

## 🔐 Permissões Finais

| Perfil | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| **Admin** | Todos | ✅ | Todos | Todos |
| **Manager** | Todos | ✅ | Todos | ❌ |
| **Colaborador** | Membros | ❌ | Membros* | ❌ |
| **Cliente** | Membros | ❌ | ❌ | ❌ |

*Colaborador pode editar apenas projetos dos quais é membro

## 🧪 Testes Recomendados

### Teste 1: Colaborador edita projeto do qual é membro
1. Login como colaborador
2. Editar card na aba "Visão Geral"
3. ✅ Deve salvar e persistir

### Teste 2: Colaborador tenta editar projeto do qual NÃO é membro
1. Login como colaborador
2. Tentar acessar projeto de outro colaborador
3. ❌ Não deve aparecer na lista

### Teste 3: Admin/Manager editam qualquer projeto
1. Login como admin ou manager
2. Editar qualquer projeto
3. ✅ Deve salvar e persistir

### Teste 4: Cliente não consegue editar
1. Login como cliente
2. Visualizar projeto
3. ❌ Botões de edição devem estar ocultos

## 📝 Arquivos Relacionados

- **Migração**: `supabase/migrations/fix_projects_update_policy_for_collaborators.sql`
- **Documentação**: `docs/FIX_COLLABORATOR_UPDATE_ISSUE.md`
- **Contexto**: `src/contexts/ProjectsContext.jsx` (função `updateProjectBackend`)
- **Permissões Frontend**: `src/contexts/AuthContext.jsx` (rolePermissions)

## 🔄 Rollback (se necessário)

Se precisar reverter:

```sql
-- Remover política nova
DROP POLICY IF EXISTS "Users can update projects they have access to" ON projects;

-- Restaurar política antiga (restritiva)
CREATE POLICY "Project creators can update projects"
  ON projects FOR UPDATE
  USING (
    projects.created_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );
```

⚠️ **Atenção**: Isso voltará a bloquear colaboradores de editar projetos.

## ✅ Checklist de Aplicação

- [ ] Migração aplicada no Supabase
- [ ] Políticas verificadas via `pg_policies`
- [ ] Teste com colaborador realizado
- [ ] Teste com admin/manager realizado
- [ ] Teste com cliente realizado
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

**Data da correção**: 02/12/2024  
**Versão**: 1.0  
**Autor**: Sistema de IA - Cascade
