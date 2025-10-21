# Correção: Logout Automático ao Dar F5 (Auth Timeout)

## Problema Identificado

Ao dar F5 (refresh) na plataforma logada, o usuário era automaticamente deslogado com os seguintes erros no console:

```
⏰ Timeout ao verificar sessão Supabase: Auth operation timeout
⚠️ Erro ao verificar sessão Supabase: Auth operation timeout
Erro ao verificar autenticação: Auth operation timeout
⚠️ Erro na consulta de perfil: Auth operation timeout
```

### Causa Raiz

1. **Timeout muito curto (8 segundos)**: A função `withTimeout` estava configurada com apenas 8 segundos para verificar a sessão do Supabase
2. **Tratamento de erro inadequado**: Quando ocorria timeout, o código tratava isso como erro fatal e forçava logout imediato
3. **Sem fallback**: Não havia mecanismo de fallback para usar dados em cache quando o Supabase demorava para responder
4. **Conexões lentas**: Em conexões mais lentas ou com latência, 8 segundos não era suficiente para o Supabase responder

## Soluções Implementadas

### 1. Aumento dos Timeouts

**Arquivo**: `src/contexts/AuthContext.jsx`

- **Verificação de sessão**: Aumentado de 8s para **15 segundos** (linha 202)
- **Busca de perfil**: Aumentado de 10s para **15 segundos** (linha 102)

```javascript
// Antes
withTimeout(supabase.auth.getSession(), 8000)

// Depois
withTimeout(supabase.auth.getSession(), 15000)
```

### 2. Sistema de Fallback com LocalStorage

**Arquivo**: `src/contexts/AuthContext.jsx` (linhas 206-226)

Implementado sistema de fallback que:
- Tenta usar dados do `localStorage` quando há timeout
- Mantém usuário logado mesmo com problemas de rede temporários
- Evita logout automático desnecessário

```javascript
catch (timeoutError) {
  console.warn('⏰ Timeout ao verificar sessão Supabase:', timeoutError.message);
  
  // Tentar usar dados do localStorage como fallback
  try {
    const cachedAuthUser = localStorage.getItem('auth_user');
    const cachedToken = localStorage.getItem('token');
    
    if (cachedAuthUser && cachedToken) {
      console.log('📦 Usando dados em cache do localStorage após timeout');
      const userData = JSON.parse(cachedAuthUser);
      setUser(userData);
      setIsLoading(false);
      return; // Mantém usuário logado
    }
  } catch (cacheError) {
    console.warn('⚠️ Erro ao ler cache do localStorage:', cacheError.message);
  }
}
```

### 3. Tratamento de Erro Não-Fatal

**Arquivo**: `src/contexts/AuthContext.jsx` (linhas 229-233)

- Removido `throw sessionError` que forçava logout
- Erros de timeout agora são apenas logados como warnings
- Usuário só é deslogado se não houver cache válido

```javascript
if (sessionError) {
  console.warn('⚠️ Erro ao verificar sessão Supabase:', sessionError.message || sessionError);
  // Não forçar logout imediatamente, apenas logar o erro
  // O usuário será deslogado apenas se não houver cache válido
}
```

### 4. Fallback Adicional no Catch Global

**Arquivo**: `src/contexts/AuthContext.jsx` (linhas 261-276)

Adicionado fallback adicional no bloco catch principal:

```javascript
catch (error) {
  console.error('Erro ao verificar autenticação:', error?.message || error || 'Erro desconhecido');
  
  // Tentar usar cache como último recurso
  try {
    const cachedAuthUser = localStorage.getItem('auth_user');
    const cachedToken = localStorage.getItem('token');
    
    if (cachedAuthUser && cachedToken) {
      console.log('📦 Usando dados em cache do localStorage após erro');
      const userData = JSON.parse(cachedAuthUser);
      setUser(userData);
    }
  } catch (cacheError) {
    console.warn('⚠️ Erro ao ler cache do localStorage:', cacheError.message);
  }
}
```

### 5. Otimização do Cliente Supabase

**Arquivo**: `src/lib/supabase.js`

Adicionadas configurações otimizadas ao cliente Supabase:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'x-client-info': 'exxata-connect'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

## Benefícios das Correções

1. ✅ **Usuário permanece logado ao dar F5** mesmo com conexão lenta
2. ✅ **Melhor experiência do usuário** sem logouts inesperados
3. ✅ **Resiliência a problemas de rede** temporários
4. ✅ **Sistema de cache robusto** usando localStorage
5. ✅ **Timeouts mais realistas** para conexões variadas
6. ✅ **Logs informativos** para debugging

## Comportamento Esperado Agora

### Cenário 1: Conexão Normal
- Supabase responde dentro de 15s
- Sessão é verificada normalmente
- Perfil é carregado do banco
- Usuário permanece logado

### Cenário 2: Timeout do Supabase
- Supabase demora mais de 15s
- Sistema usa dados do localStorage
- Usuário permanece logado com dados em cache
- Próxima tentativa de conexão acontece em background

### Cenário 3: Sem Cache e Sem Conexão
- Não há dados no localStorage
- Supabase não responde
- Apenas neste caso o usuário é deslogado
- Comportamento esperado para sessão realmente expirada

## Testes Recomendados

1. **Teste de F5 Normal**: Dar F5 várias vezes com conexão normal
2. **Teste de Conexão Lenta**: Simular conexão lenta (DevTools > Network > Slow 3G) e dar F5
3. **Teste de Timeout**: Desabilitar rede temporariamente e dar F5
4. **Teste de Cache**: Verificar que dados do localStorage são usados corretamente

## Arquivos Modificados

- ✅ `src/contexts/AuthContext.jsx` - Lógica de autenticação com fallbacks
- ✅ `src/lib/supabase.js` - Configurações otimizadas do cliente

## Data da Correção

21 de outubro de 2025
