# Fix: Timeout na Autenticação e Fallback Incorreto de Role

## Problema Identificado

Usuários colaboradores estavam sendo incorretamente classificados como "cliente" devido a:

1. **Timeout na consulta de perfil** - A busca na tabela `profiles` estava excedendo o timeout de 5 segundos
2. **Dependência circular nas políticas RLS** - A política "Admins can manage all profiles" consultava a própria tabela `profiles` para verificar o role do usuário, criando um loop infinito
3. **Fallback incorreto** - Quando ocorria timeout, o sistema usava 'cliente' como role padrão para todos os usuários não listados explicitamente

### Erro Observado

```
Erro na consulta de perfil: Auth operation timeout
Role definido por fallback de email: cliente
Definindo usuário via auth state change: cliente
```

## Causa Raiz

### 1. Dependência Circular no RLS

A política problemática em `supabase-setup.sql`:

```sql
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
  );
```

**Problema**: Para verificar se um usuário pode acessar um perfil, a política consulta a tabela `profiles` para verificar o role. Mas essa consulta também precisa passar pelas políticas RLS, criando um loop infinito.

### 2. Lógica de Fallback Inadequada

No `AuthContext.jsx`, a lógica original:

```javascript
// Determinar role baseado no email ou perfil
let role = 'cliente'; // padrão ❌ PROBLEMA: Define 'cliente' primeiro

// Verificar fallback baseado no email
if (supabaseUser.email === 'admin@exxata.com') {
  role = 'admin';
} // ... outros emails específicos

// Se houver perfil no Supabase, pode sobrescrever
if (profile && profile.role) {
  role = profile.role;
}
```

**Problema**: Quando há timeout, `profile` é null, então o role permanece como 'cliente' para usuários não listados explicitamente.

## Soluções Implementadas

### 1. Correção das Políticas RLS (`fix_profiles_rls_circular_dependency.sql`)

**Antes** (com dependência circular):
```sql
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (...))
  );
```

**Depois** (sem dependência circular):
```sql
-- Política separada para SELECT
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (
    auth.uid() = id  -- Próprio perfil
    OR
    auth.email() IN ('admin@exxata.com', 'andre.marquito@exxata.com.br')
  );

-- Política separada para UPDATE
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    auth.uid() = id
    OR
    auth.email() IN ('admin@exxata.com', 'andre.marquito@exxata.com.br')
  );
```

**Benefícios**:
- ✅ Sem auto-referência à tabela `profiles`
- ✅ Verificação direta via `auth.email()`
- ✅ Políticas separadas por operação (SELECT, UPDATE, DELETE)
- ✅ Performance melhorada

### 2. Melhorias no AuthContext.jsx

#### a) Sistema de Cache de Perfis

```javascript
// Cache de perfis para evitar consultas repetidas
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getCachedProfile = (userId) => {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.profile;
  }
  return null;
};
```

**Benefícios**:
- ✅ Reduz consultas ao banco
- ✅ Melhora performance
- ✅ Evita timeouts repetidos

#### b) Aumento do Timeout

```javascript
// Antes: 5000ms (5 segundos)
// Depois: 10000ms (10 segundos)
const { data, error } = await withTimeout(
  supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
  10000
);
```

#### c) Lógica de Prioridade Corrigida

```javascript
// PRIORIDADE 1: Se houver perfil no Supabase, usar ele
if (profile && profile.role) {
  role = profile.role;
  console.log('📋 Role definido pelo perfil Supabase:', role);
}
// PRIORIDADE 2: Fallback baseado no email (apenas se não houver perfil)
else {
  if (supabaseUser.email === 'admin@exxata.com') {
    role = 'admin';
  } else if (supabaseUser.email === 'consultor@exxata.com') {
    role = 'consultor';
  } else {
    // PRIORIDADE 3: Padrão como último recurso
    role = 'cliente';
  }
}
```

**Benefícios**:
- ✅ Perfil do Supabase tem prioridade máxima
- ✅ Fallback de email só é usado se não houver perfil
- ✅ Lógica clara e documentada

#### d) Fallback com Cache em Caso de Erro

```javascript
catch (error) {
  // Tentar usar cache mesmo em caso de erro
  const cachedProfile = getCachedProfile(supabaseUser.id);
  if (cachedProfile) {
    console.log('📦 Usando perfil em cache após erro');
    return cachedProfile;
  }
  
  // Fallback de emergência...
}
```

**Benefícios**:
- ✅ Usa dados em cache se disponíveis
- ✅ Evita degradação de experiência
- ✅ Mantém role correto mesmo com problemas de rede

## Como Aplicar a Correção

### 1. Aplicar a Migração SQL

Execute a migração no Supabase:

```bash
# Via Supabase CLI
supabase db push

# Ou via Dashboard do Supabase
# SQL Editor > Copiar conteúdo de fix_profiles_rls_circular_dependency.sql > Run
```

### 2. Verificar Políticas RLS

No Supabase Dashboard:
1. Vá para **Database** > **Tables** > **profiles**
2. Clique na aba **Policies**
3. Verifique se as novas políticas estão ativas:
   - ✅ Users can view own profile
   - ✅ Users can update own profile
   - ✅ Allow profile creation
   - ✅ Admins can view all profiles
   - ✅ Admins can update all profiles
   - ✅ Admins can delete profiles

### 3. Testar a Autenticação

1. Faça logout da aplicação
2. Faça login com um usuário colaborador
3. Verifique no console do navegador:
   - ✅ Não deve haver mensagens de timeout
   - ✅ Role deve ser carregado corretamente do Supabase
   - ✅ Mensagem: "✅ Perfil encontrado no Supabase: colaborador"

## Verificação de Sucesso

### Logs Esperados (Sucesso)

```
🔍 Buscando perfil para usuário: colaborador@exemplo.com
✅ Perfil encontrado no Supabase: colaborador
📋 Role definido pelo perfil Supabase: colaborador
👤 Definindo usuário via auth state change: colaborador
```

### Logs Anteriores (Problema)

```
🔍 Buscando perfil para usuário: colaborador@exemplo.com
⚠️ Erro na consulta de perfil: Auth operation timeout
📋 Role definido por fallback de email: cliente  ❌
👤 Definindo usuário via auth state change: cliente  ❌
```

## Melhorias Futuras Recomendadas

### 1. Custom Claims no JWT

Para uma solução mais escalável, considere adicionar o role como custom claim no JWT:

```sql
-- Função para adicionar role ao JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;
  
  -- Adicionar ao JWT
  event := jsonb_set(event, '{claims,user_role}', to_jsonb(user_role));
  
  RETURN event;
END;
$$;
```

### 2. Índices para Performance

```sql
-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

### 3. Monitoramento de Performance

Adicionar logging de performance no AuthContext:

```javascript
const startTime = performance.now();
const profile = await supabase.from('profiles')...;
const endTime = performance.now();
console.log(`⏱️ Consulta de perfil levou ${endTime - startTime}ms`);
```

## Arquivos Modificados

1. ✅ `src/contexts/AuthContext.jsx` - Lógica de autenticação melhorada
2. ✅ `supabase/migrations/fix_profiles_rls_circular_dependency.sql` - Correção de políticas RLS
3. ✅ `docs/FIX_AUTH_TIMEOUT_FALLBACK.md` - Esta documentação

## Referências

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Memória do sistema: `SYSTEM-RETRIEVED-MEMORY[dfa942d6-2496-410e-9509-e691b11385b3]` - Erro similar em project_members
