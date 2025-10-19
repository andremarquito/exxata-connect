# Correção: Exclusão de Colaboradores

## Problema
Ao tentar excluir colaboradores como usuário admin, ocorria erro 500:
```
POST https://lrnpdyqcxstghzrujywf.supabase.co/functions/v1/delete-user 500 (Internal Server Error)
Error: Falha ao excluir usuário do Supabase
```

## Causa Raiz
1. **Edge Function inexistente**: A função `delete-user` não existia no Supabase
2. **Política RLS inadequada**: A política de DELETE na tabela `profiles` verificava apenas emails específicos usando `auth.email()`, mas a Edge Function usa **service role** (que não tem email associado)
3. **Foreign keys não tratadas**: Várias tabelas tinham referências ao usuário com `NO ACTION`, impedindo a deleção

## Solução Implementada

### 1. Edge Function `delete-user` criada
**Arquivo**: `supabase/functions/delete-user/index.ts`

**Funcionalidades**:
- ✅ Autenticação e verificação de permissões (apenas admins)
- ✅ Validação de entrada (user_id obrigatório)
- ✅ Proteção contra auto-exclusão
- ✅ Limpeza de referências em cascata
- ✅ Deleção do profile e do usuário auth
- ✅ Tratamento de erros robusto

**Processo de deleção**:
1. Verifica se o usuário existe
2. Remove referências em outras tabelas (set NULL):
   - `projects.created_by` e `projects.updated_by`
   - `project_files.uploaded_by`
   - `project_indicators.created_by` e `project_indicators.updated_by`
   - `project_members.added_by`
   - `project_conducts.created_by`
   - `profiles.invited_by` e `profiles.password_reset_by`
3. Deleta o profile (cascateia para `project_members.user_id`)
4. Deleta o usuário do auth

### 2. Política RLS corrigida
**Migração**: `fix_profiles_delete_policy_for_service_role.sql`

**Antes**:
```sql
-- Apenas verificava emails específicos
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (auth.email() = ANY (ARRAY['admin@exxata.com', 'andre.marquito@exxata.com.br']));
```

**Depois**:
```sql
-- Permite service role + admins autenticados
CREATE POLICY "Allow delete for service role and admins"
ON profiles FOR DELETE
USING (
  -- Service role sempre pode deletar (auth.uid() será NULL)
  auth.uid() IS NULL
  OR
  -- Ou usuário autenticado é admin e não está deletando a si mesmo
  (
    auth.email() = ANY (ARRAY['admin@exxata.com', 'andre.marquito@exxata.com.br'])
    AND auth.uid() != id
  )
);
```

## Foreign Keys Identificadas

| Tabela | Coluna | Referencia | Delete Rule |
|--------|--------|------------|-------------|
| `project_members` | `user_id` | `profiles.id` | **CASCADE** ✅ |
| `projects` | `created_by` | `profiles.id` | NO ACTION (tratado na função) |
| `projects` | `updated_by` | `profiles.id` | NO ACTION (tratado na função) |
| `project_files` | `uploaded_by` | `profiles.id` | NO ACTION (tratado na função) |
| `project_indicators` | `created_by` | `profiles.id` | NO ACTION (tratado na função) |
| `project_indicators` | `updated_by` | `profiles.id` | NO ACTION (tratado na função) |
| `project_members` | `added_by` | `profiles.id` | NO ACTION (tratado na função) |
| `project_conducts` | `created_by` | `profiles.id` | NO ACTION (tratado na função) |
| `profiles` | `invited_by` | `profiles.id` | NO ACTION (tratado na função) |
| `profiles` | `password_reset_by` | `profiles.id` | NO ACTION (tratado na função) |

## Resultado
✅ Admins agora podem excluir colaboradores e clientes
✅ Dados relacionados são limpos adequadamente
✅ Proteção contra auto-exclusão
✅ Mensagens de erro claras
✅ Logs detalhados para debugging

## Teste
Para testar, como admin:
1. Acesse a aba "Equipe" de um projeto
2. Tente excluir um colaborador
3. Verifique que a exclusão funciona sem erros
4. Confirme que os dados relacionados foram limpos
