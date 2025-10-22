# Correção do Sistema de Redefinição de Senha

## Data: 22 de outubro de 2025

## Problema Identificado

O sistema de redefinição de senha via e-mail não estava funcionando corretamente. Apesar de exibir mensagem de sucesso, a senha não era alterada.

### Causas Raiz

1. **Configuração do Supabase**: `detectSessionInUrl` estava configurado como `false`, impedindo a detecção automática dos tokens de reset na URL
2. **Validação Inconsistente**: Diferentes requisitos de senha entre reset via e-mail (6 chars) e alteração no app (sem validação de complexidade)
3. **Verificação de Senha Problemática**: Settings.jsx usava `signInWithPassword` para verificar senha atual, criando nova sessão e potencialmente invalidando a atual

## Correções Implementadas

### 1. Configuração do Supabase (`src/lib/supabase.js`)

**Antes:**
```javascript
detectSessionInUrl: false
```

**Depois:**
```javascript
detectSessionInUrl: true // IMPORTANTE: Detectar tokens de reset/confirmação na URL
```

**Impacto:** Agora o Supabase detecta automaticamente os tokens `access_token` e `refresh_token` na URL quando o usuário clica no link do e-mail.

### 2. Helper de Validação de Senha (`src/lib/passwordValidation.js`)

Criado arquivo compartilhado com funções de validação:

- `validatePassword(password)`: Valida força da senha
- `getPasswordErrorMessage(errors)`: Formata mensagens de erro
- `PASSWORD_REQUIREMENTS`: Lista de requisitos para exibição
- `getPasswordStrength(password)`: Calcula força (0-4)
- `getPasswordStrengthLabel(strength)`: Retorna label e cor

**Requisitos Padronizados:**
- Mínimo 8 caracteres (antes era 6)
- Uma letra maiúscula
- Uma letra minúscula
- Um número

### 3. ResetPassword.jsx

**Mudanças:**
- ✅ Removido `useSearchParams` (não mais necessário)
- ✅ Removido `setSession` manual - agora é automático
- ✅ Importado helper de validação compartilhado
- ✅ Atualizado useEffect para apenas verificar sessão
- ✅ Validação padronizada com 8 caracteres mínimos

**Antes:**
```javascript
const [searchParams] = useSearchParams();

useEffect(() => {
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  
  if (accessToken && refreshToken) {
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }
}, [searchParams]);
```

**Depois:**
```javascript
useEffect(() => {
  // O Supabase agora detecta automaticamente os tokens na URL
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Sessão de reset detectada automaticamente');
    } else {
      console.warn('⚠️ Nenhuma sessão detectada - link pode estar expirado');
    }
  };
  
  checkSession();
}, []);
```

### 4. Settings.jsx

**Mudanças:**
- ✅ Importado helper de validação compartilhado
- ✅ Removido `signInWithPassword` problemático
- ✅ Implementado verificação via função RPC `verify_user_password`
- ✅ Validação padronizada com 8 caracteres mínimos
- ✅ Requisitos de senha exibidos dinamicamente

**Antes:**
```javascript
// Verificação problemática que criava nova sessão
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword
});

if (signInError) {
  throw new Error('Senha atual incorreta.');
}
```

**Depois:**
```javascript
// Verificação segura via RPC sem criar nova sessão
const { data: isPasswordValid, error: verifyError } = await supabase
  .rpc('verify_user_password', { password: currentPassword });

if (verifyError) {
  throw new Error('Erro ao verificar senha atual. Tente novamente.');
}

if (!isPasswordValid) {
  throw new Error('Senha atual incorreta.');
}
```

### 5. Função RPC no Supabase

Criada migração `add_verify_user_password_function` com função segura:

```sql
CREATE OR REPLACE FUNCTION verify_user_password(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = user_id
      AND encrypted_password = crypt(password, encrypted_password)
    )
  );
END;
$$;
```

**Benefícios:**
- Não cria nova sessão
- Executa com `SECURITY DEFINER` (acesso controlado)
- Apenas usuários autenticados podem chamar
- Verifica senha de forma segura usando `crypt`

## Fluxo Completo de Redefinição

### Via E-mail (Esqueci minha senha)

1. **ForgotPassword.jsx**: Usuário insere e-mail
2. **Supabase**: Envia e-mail com link contendo tokens
3. **E-mail**: Usuário clica no link → redireciona para `/reset-password?access_token=...&refresh_token=...`
4. **Supabase Client**: Detecta automaticamente tokens na URL (`detectSessionInUrl: true`)
5. **ResetPassword.jsx**: Carrega com sessão ativa, usuário define nova senha
6. **Supabase**: Atualiza senha via `updateUser({ password })`
7. **Sucesso**: Redireciona para login

### Dentro do App (Settings)

1. **Settings.jsx**: Usuário preenche senha atual, nova senha e confirmação
2. **Validação**: Verifica complexidade da senha (8 chars, maiúscula, minúscula, número)
3. **RPC**: Chama `verify_user_password` para validar senha atual
4. **Supabase**: Atualiza senha via `updateUser({ password })`
5. **Profiles**: Atualiza `password_changed_at` e `has_custom_password`
6. **Sucesso**: Exibe toast e limpa campos

## Arquivos Modificados

1. ✅ `src/lib/supabase.js` - Configuração `detectSessionInUrl`
2. ✅ `src/lib/passwordValidation.js` - **NOVO** Helper compartilhado
3. ✅ `src/pages/ResetPassword.jsx` - Remoção de lógica manual, uso do helper
4. ✅ `src/pages/Settings.jsx` - RPC para verificação, uso do helper
5. ✅ Migração Supabase - Função `verify_user_password`

## Testes Recomendados

### Reset via E-mail
- [ ] Solicitar reset de senha
- [ ] Verificar recebimento do e-mail
- [ ] Clicar no link do e-mail
- [ ] Verificar se página carrega com sessão ativa (console)
- [ ] Definir nova senha (testar validações)
- [ ] Confirmar redirecionamento para login
- [ ] Fazer login com nova senha

### Alteração no App
- [ ] Fazer login
- [ ] Ir para Settings → Segurança
- [ ] Tentar senha atual incorreta (deve falhar)
- [ ] Tentar senha fraca (deve falhar com mensagem específica)
- [ ] Alterar senha com sucesso
- [ ] Fazer logout e login com nova senha

## Notas Importantes

1. **Expiração do Link**: Links de reset expiram em 1 hora (padrão Supabase)
2. **Sessão Única**: Cada link de reset cria uma sessão temporária única
3. **Segurança**: Função RPC usa `SECURITY DEFINER` e valida usuário autenticado
4. **Consistência**: Mesmas regras de validação em todo o sistema
5. **Logs**: Console logs adicionados para facilitar debugging

## Compatibilidade

- ✅ Supabase Auth v2
- ✅ React 18+
- ✅ Vite
- ✅ PostgreSQL 17+

## Próximos Passos (Opcional)

1. Adicionar indicador visual de força da senha em tempo real
2. Implementar histórico de senhas (evitar reutilização)
3. Adicionar autenticação de dois fatores (2FA)
4. Implementar política de expiração de senha
