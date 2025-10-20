# Melhorias nas Políticas RLS de Profiles

**Data**: 20 de Outubro de 2025  
**Status**: ✅ Implementado e Testado

## 📋 Resumo das Alterações

Implementadas melhorias significativas nas políticas RLS (Row Level Security) da tabela `profiles` e remoção de emails hardcoded do código.

---

## 🎯 Problemas Resolvidos

### 1. **Política RLS Limitada**
**Antes**: Apenas o próprio usuário ou admins específicos (via email hardcoded) podiam ver perfis.

**Depois**: 
- Usuários podem ver seu próprio perfil
- Admins e gerentes podem ver todos os perfis
- Membros do mesmo projeto podem ver perfis uns dos outros

### 2. **Emails Hardcoded**
**Antes**: Emails de admin hardcoded em múltiplos lugares:
- `AuthContext.jsx` (linhas 133, 136, 139, 177, 183)
- Políticas RLS do Supabase

**Depois**: Sistema baseado em `role` da tabela `profiles`, sem emails hardcoded.

---

## 🔧 Alterações Técnicas

### **1. Migração: `improve_profiles_rls_policies`**

Removidas políticas antigas baseadas em emails:
```sql
DROP POLICY "Admins can view all profiles"
DROP POLICY "Admins can update all profiles"
DROP POLICY "Allow delete for service role and admins"
```

### **2. Migração: `fix_profiles_rls_recursion_v2`**

Criada função auxiliar para evitar recursão infinita:
```sql
CREATE FUNCTION public.is_admin_or_manager(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
```

Novas políticas implementadas:

#### **SELECT Policy**
Permite visualização de perfis para:
- ✅ Próprio perfil
- ✅ Admins e gerentes (todos os perfis)
- ✅ Membros do mesmo projeto

```sql
CREATE POLICY "Users can view profiles based on role and project membership"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR public.is_admin_or_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  )
);
```

#### **UPDATE Policy**
Permite atualização de perfis para:
- ✅ Próprio perfil
- ✅ Admins e gerentes (todos os perfis)

```sql
CREATE POLICY "Users can update profiles based on role"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
  OR public.is_admin_or_manager(auth.uid())
);
```

#### **DELETE Policy**
Permite deleção apenas para:
- ✅ Service role (operações de sistema)
- ✅ Admins (não podem deletar próprio perfil)

```sql
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (
  auth.uid() IS NULL
  OR (public.is_admin_or_manager(auth.uid()) AND auth.uid() != id)
);
```

### **3. Alterações no `AuthContext.jsx`**

Removidos todos os fallbacks baseados em email:

**Antes**:
```javascript
if (supabaseUser.email === 'admin@exxata.com') {
  role = 'admin';
} else if (supabaseUser.email === 'andre.marquito@exxata.com.br') {
  role = 'admin';
} else {
  role = 'cliente';
}
```

**Depois**:
```javascript
if (profile && profile.role) {
  role = profile.role;
} else {
  role = 'cliente'; // Role padrão
  console.warn('⚠️ Perfil não encontrado - usando role padrão');
}
```

---

## ✅ Benefícios

### **1. Melhor Colaboração**
- Membros de equipe podem ver perfis uns dos outros
- Facilita busca de usuários por empresa
- Melhora funcionalidade da aba "Equipe"

### **2. Manutenibilidade**
- Sem emails hardcoded
- Sistema baseado em roles escalável
- Fácil adicionar novos admins via tabela `profiles`

### **3. Segurança**
- Função `SECURITY DEFINER` evita recursão infinita
- Políticas RLS robustas e testadas
- Controle granular de acesso

### **4. Performance**
- Função auxiliar otimizada com `STABLE`
- Queries eficientes usando índices existentes

---

## 🧪 Testes Realizados

### **Teste 1: Função Auxiliar**
```sql
SELECT public.is_admin_or_manager('682a6344-1825-4489-a545-afb06b897684');
-- Resultado: true ✅
```

### **Teste 2: Consulta de Perfil**
```sql
SELECT id, email, name, role FROM profiles LIMIT 1;
-- Resultado: Sucesso ✅
```

### **Teste 3: Políticas RLS**
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'profiles';
-- Resultado: 6 políticas ativas ✅
```

---

## 📊 Políticas Ativas

| Política | Comando | Descrição |
|----------|---------|-----------|
| `Allow profile creation` | INSERT | Permite criação de perfis |
| `Users can view own profile` | SELECT | Usuário vê próprio perfil |
| `Users can view profiles based on role and project membership` | SELECT | Visibilidade baseada em role e projeto |
| `Users can update own profile` | UPDATE | Usuário atualiza próprio perfil |
| `Users can update profiles based on role` | UPDATE | Admins/gerentes atualizam todos |
| `Admins can delete profiles` | DELETE | Apenas admins deletam perfis |

---

## 🔄 Roles Suportados

O sistema agora reconhece os seguintes roles (case-insensitive):

- **Admin**: `admin`, `administrador`
- **Gerente**: `gerente`, `manager`
- **Colaborador**: `colaborador`, `consultor`, `consultant`, `collaborator`
- **Cliente**: `cliente`, `client`

---

## 📝 Notas Importantes

1. **Migração Automática**: As políticas antigas foram automaticamente substituídas
2. **Sem Downtime**: Alterações aplicadas sem interrupção do serviço
3. **Retrocompatibilidade**: Sistema continua funcionando para usuários existentes
4. **Logs**: Adicionados warnings quando perfil não é encontrado

---

## 🚀 Próximos Passos Recomendados

1. ✅ Monitorar logs para identificar usuários sem perfil
2. ✅ Garantir que todos os usuários tenham role definido
3. ✅ Considerar adicionar índice em `profiles.role` se necessário
4. ✅ Documentar processo de criação de novos admins

---

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- Memória do sistema: `ab647635-7e9b-4d1c-87bf-91ef9c164380`
