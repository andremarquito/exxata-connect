# Troubleshooting - Problema de Login

## Sistema de Autenticação

A plataforma Exxata Connect utiliza **exclusivamente autenticação via Supabase**. Não há mais sistema local de fallback.

## Problema Identificado

Usuários podem apresentar erro 400 "Invalid login credentials" ao tentar fazer login.

## Causa Raiz

O erro ocorre quando:

1. O usuário **não existe no Supabase** (não foi cadastrado)
2. A **senha está incorreta**
3. O **email não foi confirmado** após o cadastro

## Possíveis Causas Adicionais

1. **Cache do navegador**: Dados em cache podem estar causando comportamento inconsistente
2. **Problemas de rede**: Timeouts intermitentes na comunicação com o Supabase
3. **Sessão expirada**: A sessão do Supabase pode ter expirado

## Melhorias Implementadas

### 1. Logging Detalhado (AuthContext.jsx)

Adicionado logging completo para diagnosticar o problema:

```javascript
console.log('📊 Detalhes da tentativa:', {
  emailLength: email.length,
  passwordLength: password.length,
  emailTrimmed: email.trim(),
  timestamp: new Date().toISOString()
});

console.log('❌ Login Supabase falhou:', {
  message: authError.message,
  status: authError.status,
  code: authError.code,
  name: authError.name
});
```

### 2. Normalização de Email

O email agora é sempre normalizado antes de enviar para o Supabase:

```javascript
email: email.trim().toLowerCase()
```

### 3. Mensagem de Erro Clara

Mensagens de erro específicas para cada situação:

```javascript
// Credenciais inválidas
throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');

// Email não confirmado
throw new Error('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.');
```

### 4. Remoção do Sistema Local

O sistema local de fallback foi completamente removido. A plataforma agora funciona **exclusivamente com autenticação Supabase**.

## Como Verificar o Status do Usuário no Supabase

### Opção 1: Via Dashboard do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Busque por `andremarquito@gmail.com`
5. Verifique:
   - ✅ Se o usuário existe
   - ✅ Se o email foi confirmado (campo `email_confirmed_at`)
   - ✅ Status da conta (ativo/bloqueado)

### Opção 2: Via SQL Editor

Execute no SQL Editor do Supabase:

```sql
-- Verificar se o usuário existe na tabela auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'andremarquito@gmail.com';

-- Verificar se existe perfil na tabela profiles
SELECT 
  id,
  email,
  name,
  role,
  empresa,
  status
FROM profiles
WHERE email = 'andremarquito@gmail.com';
```

### Opção 3: Via Console do Navegador

Com as melhorias implementadas, agora você verá logs detalhados no console:

```
🔐 LoginForm: Iniciando login para: andremarquito@gmail.com
🔐 Tentando login para: andremarquito@gmail.com
📊 Detalhes da tentativa: {emailLength: 23, passwordLength: 8, ...}
❌ Login Supabase falhou: {message: "Invalid login credentials", status: 400, ...}
❌ LoginForm: Erro no login: E-mail ou senha incorretos
```

## Soluções

### Se o usuário NÃO existe no Supabase:

**Opção A: Criar o usuário via Dashboard**
1. Vá em **Authentication** > **Users** > **Add user**
2. Preencha email e senha
3. Marque "Auto Confirm User" se não quiser enviar email de confirmação

**Opção B: Criar o usuário via código (página de Signup)**
1. Acesse a página de cadastro da aplicação
2. Preencha os dados e crie a conta
3. Confirme o email se necessário

**Opção C: Criar via SQL**
```sql
-- ATENÇÃO: Use a função do Supabase para criar usuários com senha hash
-- Não é recomendado criar usuários diretamente via SQL
```

### Se o usuário existe mas o email NÃO está confirmado:

**Opção A: Confirmar manualmente via Dashboard**
1. Vá em **Authentication** > **Users**
2. Clique no usuário
3. Clique em "Confirm email"

**Opção B: Reenviar email de confirmação**
```javascript
// Via código
await supabase.auth.resend({
  type: 'signup',
  email: 'andremarquito@gmail.com'
});
```

### Se o usuário existe e está confirmado mas a senha está incorreta:

**Opção A: Resetar senha via aplicação**
1. Clique em "Esqueceu a senha?" na tela de login
2. Digite o email
3. Siga as instruções do email recebido

**Opção B: Resetar senha via Dashboard**
1. Vá em **Authentication** > **Users**
2. Clique no usuário
3. Clique em "Reset password"
4. Envie o email de reset

### Se o problema persistir (cache/rede):

1. **Limpar cache do navegador**:
   - Ctrl+Shift+Delete
   - Limpar cookies e dados de sites
   - Recarregar a página (Ctrl+F5)

2. **Testar em modo anônimo**:
   - Abrir janela anônima/privada
   - Tentar fazer login novamente

3. **Verificar conexão com Supabase**:
   ```javascript
   // No console do navegador
   const { data, error } = await supabase.auth.getSession();
   console.log('Sessão atual:', data, error);
   ```

## Próximos Passos

1. ✅ Implementado logging detalhado
2. ✅ Normalização de email
3. ✅ Mensagens de erro melhoradas
4. ✅ **CONCLUÍDO**: Sistema local removido - plataforma 100% Supabase
5. ⏳ **AÇÃO NECESSÁRIA**: Verificar se o usuário existe no Supabase
6. ⏳ **AÇÃO NECESSÁRIA**: Verificar se o email está confirmado
7. ⏳ **AÇÃO NECESSÁRIA**: Testar login novamente e verificar logs no console

## Logs Esperados Após as Melhorias

### Login bem-sucedido:
```
🔐 LoginForm: Iniciando login para: andremarquito@gmail.com
🔐 Tentando login para: andremarquito@gmail.com
📊 Detalhes da tentativa: {emailLength: 23, passwordLength: 8, ...}
✅ Autenticação Supabase bem-sucedida: {email: "andremarquito@gmail.com", emailConfirmed: true, ...}
✅ Login Supabase bem-sucedido, role: cliente
```

### Login falhou (usuário não existe ou senha incorreta):
```
🔐 LoginForm: Iniciando login para: andremarquito@gmail.com
🔐 Tentando login para: andremarquito@gmail.com
📊 Detalhes da tentativa: {emailLength: 23, passwordLength: 8, ...}
❌ Login Supabase falhou: {message: "Invalid login credentials", status: 400, ...}
❌ LoginForm: Erro no login: E-mail ou senha incorretos
```

### Login falhou (email não confirmado):
```
🔐 LoginForm: Iniciando login para: andremarquito@gmail.com
🔐 Tentando login para: andremarquito@gmail.com
📊 Detalhes da tentativa: {emailLength: 23, passwordLength: 8, ...}
❌ Login Supabase falhou: {message: "Email not confirmed", ...}
❌ LoginForm: Erro no login: Por favor, confirme seu e-mail antes de fazer login
```
