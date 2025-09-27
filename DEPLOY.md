# 🚀 Guia de Deploy - Exxata Connect

## Pré-requisitos para Deploy no Netlify + Supabase

### 1. Configuração do Supabase

#### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login/cadastro
2. Clique em "New Project"
3. Escolha organização e configure:
   - **Name**: `exxata-connect` (ou nome desejado)
   - **Database Password**: Use uma senha forte
   - **Region**: `South America (São Paulo)` para melhor latência
4. Aguarde a criação do projeto (2-3 minutos)

#### 1.2 Configurar URLs Permitidas
No painel do Supabase:
1. Vá em **Settings** > **Configuration** > **URL Configuration**
2. Adicione nas **Site URL**:
   ```
   https://seu-site.netlify.app
   ```
3. Adicione nos **Redirect URLs**:
   ```
   https://seu-site.netlify.app/**
   http://localhost:3000/**
   ```

#### 1.3 Obter Credenciais
Em **Settings** > **API**:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbG...` (chave pública)
- **service_role key**: `eyJhbG...` (chave privada - opcional)

### 2. Configuração das Variáveis de Ambiente

#### 2.1 Criar arquivo `.env` local
```bash
# Configurações do Supabase
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Configurações da aplicação
VITE_APP_NAME=Exxata Connect
VITE_APP_VERSION=1.0.0
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` no Git!

#### 2.2 Configurar no Netlify
No painel do Netlify:
1. Vá em **Site settings** > **Environment variables**
2. Adicione as variáveis:
   - `VITE_SUPABASE_URL`: https://seu-projeto-id.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: sua-anon-key-aqui
   - `VITE_APP_NAME`: Exxata Connect
   - `VITE_APP_VERSION`: 1.0.0

### 3. Deploy no Netlify

#### 3.1 Opção 1: Deploy via Git (Recomendado)
1. Faça push do código para GitHub/GitLab
2. No Netlify, clique em **"New site from Git"**
3. Conecte seu repositório
4. Configure:
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Clique em **"Deploy site"**

#### 3.2 Opção 2: Deploy Manual
1. Execute localmente:
   ```bash
   npm install
   npm run build
   ```
2. Arraste a pasta `dist` para o Netlify
3. Configure as variáveis de ambiente após o deploy

### 4. Configurações Pós-Deploy

#### 4.1 Domínio Personalizado (Opcional)
1. No Netlify: **Site settings** > **Domain management**
2. Adicione seu domínio personalizado
3. Configure DNS do seu provedor

#### 4.2 HTTPS
- O Netlify fornece HTTPS automático
- Para domínios personalizados, o certificado é gerado automaticamente

#### 4.3 Configurar Autenticação
1. No Supabase, confirme que as URLs do site estão configuradas
2. Teste o login/logout na aplicação implantada
3. Verifique se o redirecionamento funciona corretamente

## ✅ Checklist de Deploy

### Antes do Deploy:
- [ ] Arquivo `.env` configurado localmente
- [ ] Projeto Supabase criado e configurado
- [ ] URLs permitidas configuradas no Supabase
- [ ] Código testado localmente
- [ ] Build local executado com sucesso (`npm run build`)

### Durante o Deploy:
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Build executado com sucesso
- [ ] Site acessível na URL fornecida
- [ ] Headers de segurança aplicados

### Após o Deploy:
- [ ] Login/logout funcionando
- [ ] Navegação SPA funcionando (sem 404)
- [ ] Performance satisfatória (PageSpeed Insights)
- [ ] Funcionalidades principais testadas
- [ ] SSL/HTTPS ativo

## 🛠️ Otimizações Implementadas

### Performance:
- ✅ **Bundle splitting**: Vendors, Supabase, UI separados
- ✅ **Compressão**: Gzip para JS/CSS
- ✅ **Cache**: Headers otimizados para assets
- ✅ **Minificação**: Console.logs removidos em produção
- ✅ **Tree shaking**: Código não utilizado removido

### Segurança:
- ✅ **Headers de segurança**: XSS, CSRF, Clickjacking
- ✅ **HTTPS**: Redirecionamento forçado
- ✅ **Arquivos sensíveis**: .env protegidos
- ✅ **Content Security**: Tipos MIME seguros

### SEO e Acessibilidade:
- ✅ **SPA Routing**: Fallback para index.html
- ✅ **Meta tags**: Configuradas no index.html
- ✅ **Favicon**: Incluído nos assets

## 🚨 Troubleshooting

### Erro de Build:
```bash
# Limpar cache e reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de Autenticação:
1. Verifique se as URLs estão corretas no Supabase
2. Confirme as variáveis de ambiente no Netlify
3. Teste com incógnito/private browsing

### 404 em Rotas:
- Confirme que o `netlify.toml` está configurado corretamente
- Verifique se o redirect para `index.html` está ativo

### Performance Lenta:
1. Execute audit no Chrome DevTools
2. Verifique Network tab para recursos demorados
3. Considere implementar lazy loading

## 📞 Suporte

Para problemas técnicos:
1. Verifique os logs de build no Netlify
2. Use o Chrome DevTools para debugging
3. Consulte a documentação do [Supabase](https://supabase.com/docs)
4. Consulte a documentação do [Netlify](https://docs.netlify.com)

---

**✨ Seu Exxata Connect está pronto para produção!**
