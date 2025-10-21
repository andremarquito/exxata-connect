# Fix: E-mails não aparecem na aba Equipe (RLS bloqueando)

## 🐛 Problema Identificado

Usuário logado como **'cliente'** via os membros da equipe, mas **sem e-mails**:
- ✅ 1º membro: Vitor de Melo Oliveira - `vitor@exxata.com.br` (aparecia)
- ❌ 2º, 3º e 4º membros: "Usuário" (sem email)

## 🔍 Causa Raiz (Confirmada via Logs)

```javascript
// Logs do console:
🔍 Normalizando membro: {member: {...}, profile: {...}, hasEmail: true, email: 'vitor@exxata.com.br'}
🔍 Normalizando membro: {member: {...}, profile: undefined, hasEmail: false, email: undefined}
🔍 Normalizando membro: {member: {...}, profile: undefined, hasEmail: false, email: undefined}
🔍 Normalizando membro: {member: {...}, profile: undefined, hasEmail: false, email: undefined}
```

**Problema:** O **RLS da tabela `profiles`** estava bloqueando o acesso aos dados dos outros membros!

### Por que isso acontecia?

A query faz um JOIN:
```sql
SELECT * FROM project_members
JOIN profiles ON profiles.id = project_members.user_id
```

Mas a política RLS de `profiles` só permitia:
- ✅ Ver seu próprio perfil (`id = auth.uid()`)
- ✅ Admins verem todos

**Resultado:** O JOIN retornava `profiles = null` para membros que o usuário não tinha permissão de ver.

## ✅ Solução Implementada

Criada nova política RLS em `profiles` que permite **membros do mesmo projeto** verem perfis uns dos outros:

```sql
CREATE POLICY "project_members_can_see_each_other"
  ON profiles FOR SELECT
  USING (
    -- Usuário pode ver seu próprio perfil
    id = auth.uid()
    OR
    -- Admin/Manager podem ver todos os perfis
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR
    -- Membros do mesmo projeto podem ver uns aos outros
    EXISTS (
      SELECT 1 FROM project_members pm1
      WHERE pm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM project_members pm2
        WHERE pm2.user_id = profiles.id
        AND pm2.project_id = pm1.project_id
      )
    )
  );
```

## 🎯 Como Funciona Agora

### Cenário: Cliente vê membros do projeto

1. **Cliente** faz parte do projeto X
2. **Outros 3 usuários** também fazem parte do projeto X
3. **Query busca membros:**
   ```sql
   SELECT * FROM project_members
   JOIN profiles ON profiles.id = project_members.user_id
   WHERE project_id = 'X'
   ```
4. **RLS de profiles verifica:**
   - Para cada profile, verifica se o usuário logado está no mesmo projeto
   - ✅ Se SIM → Retorna dados do profile (nome, email, etc.)
   - ❌ Se NÃO → Bloqueia (retorna null)

5. **Resultado:** Cliente vê **nome e email** de todos os membros do projeto!

## 📊 Políticas RLS de `profiles` (Após Correção)

1. **"Users can view own profile"** - Ver próprio perfil
2. **"Users can view profiles (self or admin via JWT)"** - Admins veem todos
3. **"project_members_can_see_each_other"** ✨ **NOVA** - Membros do mesmo projeto se veem

## 🔐 Segurança Mantida

- ✅ Usuários **não** veem perfis de pessoas fora de seus projetos
- ✅ Apenas membros do **mesmo projeto** se veem
- ✅ Admins continuam vendo todos
- ✅ Cada usuário vê seu próprio perfil

## 🧪 Como Testar

1. **Limpe o cache do navegador** (Ctrl+Shift+R)
2. **Faça login como 'cliente'**
3. **Entre em um projeto**
4. **Vá para aba "Equipe"**
5. ✅ **Verificar:** Todos os membros devem aparecer com **nome E email**

### Console Esperado
```
🔍 INICIANDO getProjectMembers para projeto: ...
✅ MEMBROS ENCONTRADOS: 4
📋 DADOS DOS MEMBROS: [
  {user_id: '...', profile_name: 'Vitor...', profile_email: 'vitor@...', has_profiles: true},
  {user_id: '...', profile_name: 'João...', profile_email: 'joao@...', has_profiles: true},
  {user_id: '...', profile_name: 'Maria...', profile_email: 'maria@...', has_profiles: true},
  {user_id: '...', profile_name: 'Pedro...', profile_email: 'pedro@...', has_profiles: true}
]
🔍 Normalizando membro: {profile: {...}, hasEmail: true, email: 'vitor@...'}
🔍 Normalizando membro: {profile: {...}, hasEmail: true, email: 'joao@...'}
🔍 Normalizando membro: {profile: {...}, hasEmail: true, email: 'maria@...'}
🔍 Normalizando membro: {profile: {...}, hasEmail: true, email: 'pedro@...'}
```

**Todos devem ter:** `has_profiles: true` e `hasEmail: true`

## 📁 Arquivos Modificados

- ✅ **Migração:** `allow_project_members_see_profiles.sql` - Nova política RLS
- ✅ **Logs de debug:** `ProjectsContext.jsx` e `ProjectDetails.jsx` (podem ser removidos depois)

## 💡 Lição Aprendida

**Sempre considerar RLS ao fazer JOINs:**
- JOIN pode retornar `null` se RLS bloquear
- Testar com diferentes roles (admin, cliente, colaborador)
- Logs de debug são essenciais para identificar problemas de RLS

---

**Data:** 2024-10-21  
**Status:** ✅ Corrigido  
**Impacto:** Membros do mesmo projeto agora veem emails uns dos outros
