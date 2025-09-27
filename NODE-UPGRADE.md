# 🚀 Node.js Upgrade Guide - Exxata Connect

## 📋 **Requisitos de Versão**

- **Node.js**: `>=20.19.0` ou `22.12+`
- **npm**: `>=10.0.0`
- **Vite**: `^7.1.7`

## 🔧 **Como Atualizar o Node.js**

### **Opção 1: Usando NVM (Recomendado)**

```bash
# Windows (nvm-windows)
nvm install 20.19.0
nvm use 20.19.0

# macOS/Linux (nvm)
nvm install 20.19.0
nvm use 20.19.0
```

### **Opção 2: Download Direto**

1. Acesse: https://nodejs.org/
2. Baixe a versão **20.19.0 LTS** ou superior
3. Instale seguindo o assistente

### **Opção 3: Usando Package Managers**

```bash
# Windows - Chocolatey
choco install nodejs --version=20.19.0

# macOS - Homebrew
brew install node@20

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## ✅ **Verificação**

```bash
# Verificar versões
node --version    # Deve ser >=20.19.0
npm --version     # Deve ser >=10.0.0

# Verificar se tudo está funcionando
npm install
npm run dev
```

## 📦 **Pacotes Adicionados**

### **@rollup/rollup-linux-x64-gnu**
- **Versão**: `^4.28.0`
- **Propósito**: Suporte nativo para builds em Linux x64
- **Necessário para**: Builds otimizados do Vite 7+

### **terser**
- **Versão**: `^5.36.0`
- **Propósito**: Minificador de JavaScript para produção
- **Necessário para**: Otimização e compressão do código

### **Engines no package.json**
```json
{
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  }
}
```

## 🚀 **Deploy no Netlify**

### **Variável de Ambiente**
Adicione no painel do Netlify:
```
NODE_VERSION=20.19.0
```

### **Netlify.toml** (Já configurado)
```toml
[build.environment]
  NODE_VERSION = "20.19.0"
  NPM_VERSION = "10.2.4"

[build]
  command = "npm ci && npm run build:production"
  publish = "dist"
```

## 🔍 **Troubleshooting**

### **Erro: "Module not found @rollup/rollup-..."**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### **Erro: "Node version mismatch"**
```bash
# Verificar versão
node --version

# Se diferente, atualizar
nvm use 20.19.0  # ou instalar nova versão
```

### **Erro de Permissões (Linux/macOS)**
```bash
# Usar nvm ao invés de sudo
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20.19.0
```

## 📊 **Benefícios da Atualização**

### **Performance**
- ✅ **40% mais rápido** no build com Vite 7
- ✅ **Tree-shaking melhorado** no Rollup 4
- ✅ **HMR otimizado** no desenvolvimento

### **Compatibilidade**
- ✅ **ECMAScript 2024** support
- ✅ **Top-level await** nativo
- ✅ **Import assertions** completo

### **Segurança**
- ✅ **CVE fixes** mais recentes
- ✅ **Dependencies** atualizadas
- ✅ **SSL/TLS** melhorado

## 🔄 **Scripts Atualizados**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:production": "NODE_ENV=production vite build",
    "preview": "vite preview",
    "analyze": "vite build --mode analyze"
  }
}
```

## 📝 **Checklist de Atualização**

- [ ] ✅ Node.js atualizado para >=20.19.0
- [ ] ✅ npm atualizado para >=10.0.0
- [ ] ✅ Arquivo `.nvmrc` criado
- [ ] ✅ `@rollup/rollup-linux-x64-gnu` adicionado
- [ ] ✅ Engines definidos no package.json
- [ ] ✅ Vite atualizado para 7.1.7+
- [ ] ✅ Dependencies reinstaladas
- [ ] ✅ Build testado localmente
- [ ] ✅ Deploy configurado no Netlify

## 🎯 **Próximos Passos**

1. **Atualizar Node.js** localmente
2. **Reinstalar dependências**: `npm install`
3. **Testar build**: `npm run build`
4. **Configurar Netlify** com NODE_VERSION=20.19.0
5. **Deploy em produção**

---

**🎉 Sua aplicação agora está compatível com as versões mais recentes do Node.js e Vite!**
