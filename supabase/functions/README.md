# Edge Functions - CORS Configuration

Este diretório contém as funções Edge do Supabase com configuração adequada de CORS.

## Estrutura

```
supabase/
  functions/
    _shared/
      cors.ts          # Cabeçalhos CORS compartilhados
    invite-user/
      index.ts         # Função para convidar usuários
    send-invite-email/
      index.ts         # Função para enviar e-mails de convite
```

## Como Deployar

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link do projeto

```bash
supabase link --project-ref lrnpdyqcxstghzrujywf
```

### 4. Deploy das funções

```bash
# Deploy todas as funções
supabase functions deploy

# Ou deploy individualmente
supabase functions deploy invite-user
supabase functions deploy send-invite-email
```

## Configuração CORS

### Desenvolvimento
- `Access-Control-Allow-Origin: "*"` - Permite qualquer origem
- Ideal para desenvolvimento local

### Produção
Edite `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://exxata-connect.netlify.app", // Seu domínio
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
```

## Como Usar

### Invite User
```javascript
const response = await supabase.functions.invoke('invite-user', {
  body: {
    email: 'usuario@email.com',
    fullName: 'Nome Completo',
    role: 'cliente',
    sendEmail: true
  }
});
```

### Send Invite Email
```javascript
const response = await supabase.functions.invoke('send-invite-email', {
  body: {
    email: 'usuario@email.com',
    inviteLink: 'https://...',
    fullName: 'Nome Completo'
  }
});
```

## Troubleshooting

### Erro 500
- Verifique se as funções estão deployadas
- Confirme as variáveis de ambiente no Supabase

### Erro CORS
- Certifique-se de que `corsHeaders` estão sendo retornados
- Verifique se a origem está permitida

### Função não encontrada
- Execute `supabase functions deploy` novamente
- Verifique se o projeto está linkado corretamente
