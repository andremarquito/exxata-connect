# Templates de E-mail - Exxata Connect

Este diretório contém os templates de e-mail personalizados para o Supabase, em português brasileiro, seguindo o estilo visual da plataforma Exxata Connect.

## 📧 Templates Disponíveis

### 1. **confirm-signup.html** - Confirmação de Cadastro
Enviado quando um novo usuário se cadastra na plataforma.
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 24 horas
- **Uso:** Ativar nova conta

### 2. **invite-user.html** - Convite de Usuário
Enviado quando um usuário é convidado para a plataforma.
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 7 dias
- **Uso:** Aceitar convite e criar conta

### 3. **magic-link.html** - Link Mágico
Enviado para login sem senha (magic link).
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 1 hora
- **Uso:** Acesso rápido à plataforma

### 4. **change-email.html** - Alteração de E-mail
Enviado quando o usuário solicita alteração de e-mail.
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 24 horas
- **Uso:** Confirmar novo endereço de e-mail

### 5. **reset-password.html** - Redefinição de Senha
Enviado quando o usuário esquece a senha.
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 1 hora
- **Uso:** Criar nova senha

### 6. **reauthentication.html** - Reautenticação
Enviado quando é necessária reautenticação por segurança.
- **Variável Supabase:** `{{ .ConfirmationURL }}`
- **Validade:** 1 hora
- **Uso:** Confirmar identidade

## 🎨 Estilo Visual

Os templates seguem a identidade visual da Exxata:

- **Cor Principal:** `#09182b` (Azul Exxata)
- **Cor de Destaque:** `#d51d07` (Vermelho Exxata)
- **Cor de Link:** `#1616d6` (Azul Corporativo)
- **Fonte:** Manrope
- **Layout:** Responsivo e compatível com todos os clientes de e-mail

## 📝 Como Configurar no Supabase

### Opção 1: Via Dashboard do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **Email Templates**
4. Selecione o template que deseja personalizar
5. Cole o conteúdo HTML correspondente
6. Clique em **Save**

### Opção 2: Via Supabase CLI

```bash
# Navegue até o diretório do projeto
cd supabase

# Para cada template, execute:
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### Opção 3: Configuração Manual

Para cada tipo de e-mail no Supabase Dashboard:

#### Confirm Signup
```
Authentication → Email Templates → Confirm signup
```
Cole o conteúdo de `confirm-signup.html`

#### Invite User
```
Authentication → Email Templates → Invite user
```
Cole o conteúdo de `invite-user.html`

#### Magic Link
```
Authentication → Email Templates → Magic Link
```
Cole o conteúdo de `magic-link.html`

#### Change Email Address
```
Authentication → Email Templates → Change Email Address
```
Cole o conteúdo de `change-email.html`

#### Reset Password
```
Authentication → Email Templates → Reset Password
```
Cole o conteúdo de `reset-password.html`

#### Reauthentication
```
Authentication → Email Templates → Reauthentication
```
Cole o conteúdo de `reauthentication.html`

## 🔧 Variáveis Disponíveis

O Supabase fornece as seguintes variáveis que podem ser usadas nos templates:

- `{{ .ConfirmationURL }}` - URL de confirmação/ação
- `{{ .Token }}` - Token de confirmação
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do site configurado
- `{{ .Email }}` - E-mail do destinatário

## ✅ Checklist de Configuração

- [ ] Copiar todos os arquivos HTML para o Supabase
- [ ] Configurar URL de redirecionamento no Supabase (Site URL)
- [ ] Testar cada tipo de e-mail
- [ ] Verificar renderização em diferentes clientes de e-mail
- [ ] Confirmar que os links estão funcionando corretamente

## 🧪 Testando os Templates

Para testar os templates:

1. **Confirm Signup:** Crie uma nova conta
2. **Invite User:** Convide um usuário pela plataforma
3. **Magic Link:** Use a opção "Login sem senha"
4. **Change Email:** Altere seu e-mail nas configurações
5. **Reset Password:** Use "Esqueci minha senha"
6. **Reauthentication:** Execute ação que requer reautenticação

## 📱 Compatibilidade

Os templates foram testados e são compatíveis com:

- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop, Mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

## 🔒 Segurança

- Todos os links expiram após o período especificado
- Tokens são de uso único
- Alertas de segurança incluídos nos templates
- Recomendações de boas práticas de senha

## 📞 Suporte

Para dúvidas ou problemas com os templates, entre em contato com a equipe de desenvolvimento.

---

**Exxata Engenharia** © 2024
