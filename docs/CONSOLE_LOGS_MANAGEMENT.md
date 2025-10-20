# Gerenciamento de Logs do Console

## Comportamento Atual

A plataforma Exxata Connect utiliza **sessões persistentes do Supabase**. Isso significa que:

1. ✅ Quando você faz login, o Supabase salva a sessão no `localStorage` do navegador
2. ✅ Quando você fecha e reabre o navegador, a sessão continua ativa
3. ✅ Você **não precisa fazer login novamente** - isso é intencional e esperado
4. ✅ A sessão expira automaticamente após um período (configurável no Supabase)

## Logs Reduzidos (Implementado)

Os logs de rotina foram comentados para reduzir a poluição do console. Agora você verá apenas:

### Logs Mantidos (Importantes)
- ⚠️ **Avisos**: Erros ao buscar perfil, timeouts, etc.
- ❌ **Erros**: Falhas críticas de autenticação
- 🔐 **Login**: Tentativas de login (apenas quando o usuário faz login manualmente)

### Logs Desabilitados (Rotina)
- 🔍 Verificando autenticação...
- ✅ Sessão Supabase encontrada
- ✅ Profile carregado
- 🔄 Auth state changed
- 🔄 Carregando profiles do Supabase...
- ℹ️ Nenhuma sessão Supabase ativa

## Como Reativar Logs para Debug

Se você precisar debugar problemas de autenticação, basta descomentar os logs:

### AuthContext.jsx

```javascript
// Linha 215 - Verificação inicial
console.log('🔍 Verificando autenticação...');

// Linha 239 - Sessão encontrada
console.log('✅ Sessão Supabase encontrada:', session.user.email);

// Linha 247 - Profile carregado
console.log('✅ Profile carregado:', userData.name, 'Role:', userData.role);

// Linha 275 - Mudanças de estado
console.log('🔄 Auth state changed:', event, session?.user?.email);

// Linha 83 - Busca de perfil
console.log('🔍 Buscando perfil para usuário:', supabaseUser.email);

// Linha 115 - Perfil encontrado
console.log('✅ Perfil encontrado no Supabase:', profile.role);

// Linha 129 - Role definido
console.log('📋 Role definido pelo perfil Supabase:', role);
```

### UsersContext.jsx

```javascript
// Linha 18 - Carregamento de profiles
console.log('🔄 Carregando profiles do Supabase...');

// Linha 22-25 - Resposta do Supabase
console.log('🔍 Resposta do Supabase:', {
  count: profiles?.length,
  rawData: profiles
});

// Linha 32 - Profiles encontrados
console.log('✅ Profiles encontrados no Supabase:', profiles.length);
```

## Como Desabilitar Sessão Persistente (Não Recomendado)

Se você quiser que o usuário precise fazer login toda vez que abrir o navegador:

### Opção 1: Configurar no Supabase Dashboard

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** > **Settings**
3. Ajuste o **Session Duration** para um valor menor (ex: 1 hora)

### Opção 2: Fazer Logout ao Fechar o Navegador

Adicione no `AuthContext.jsx`:

```javascript
useEffect(() => {
  // Fazer logout quando a janela for fechada
  const handleBeforeUnload = async () => {
    await supabase.auth.signOut();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);
```

**⚠️ Aviso**: Isso pode prejudicar a experiência do usuário, pois ele precisará fazer login toda vez.

### Opção 3: Usar Sessão em Memória (Não Persistente)

No arquivo `src/lib/supabase.js`, altere a configuração:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      // Usar sessionStorage ao invés de localStorage
      // A sessão será perdida ao fechar a aba
      getItem: (key) => sessionStorage.getItem(key),
      setItem: (key, value) => sessionStorage.setItem(key, value),
      removeItem: (key) => sessionStorage.removeItem(key),
    },
  },
});
```

## Logs de Login (Mantidos)

Os logs de tentativa de login foram **mantidos ativos** porque são importantes para diagnóstico:

```javascript
// LoginForm.jsx - Linha 50
console.log('🔐 LoginForm: Iniciando login para:', email);

// AuthContext.jsx - Linha 307-313
console.log('🔐 Tentando login para:', email);
console.log('📊 Detalhes da tentativa:', {
  emailLength: email.length,
  passwordLength: password.length,
  emailTrimmed: email.trim(),
  timestamp: new Date().toISOString()
});

// AuthContext.jsx - Linha 322-326
console.log('❌ Login Supabase falhou:', {
  message: authError.message,
  status: authError.status,
  code: authError.code,
  name: authError.name
});

// AuthContext.jsx - Linha 345-348
console.log('✅ Autenticação Supabase bem-sucedida:', {
  email: authData.user.email,
  emailConfirmed: !!authData.user.email_confirmed_at,
  userId: authData.user.id
});
```

## Modo Debug vs Produção

### Desenvolvimento (Logs Ativos)
Para desenvolvimento, você pode criar uma variável de ambiente:

```javascript
// .env.local
VITE_DEBUG_AUTH=true
```

E usar condicionalmente nos logs:

```javascript
if (import.meta.env.VITE_DEBUG_AUTH === 'true') {
  console.log('🔍 Verificando autenticação...');
}
```

### Produção (Logs Mínimos)
Em produção, mantenha apenas logs de erro:

```javascript
// .env.production
VITE_DEBUG_AUTH=false
```

## Resumo

✅ **Implementado**: Logs de rotina desabilitados para reduzir poluição do console
✅ **Mantido**: Logs de erro e avisos importantes
✅ **Mantido**: Logs de tentativas de login para diagnóstico
✅ **Comportamento**: Sessão persistente é intencional e esperado
✅ **Documentado**: Como reativar logs para debug quando necessário

Se você não quer ver **nenhum log** no console, você pode usar a opção do navegador para filtrar logs por tipo ou desabilitar completamente o console.
