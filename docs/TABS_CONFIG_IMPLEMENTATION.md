# Configuração de Visibilidade de Abas por Projeto

## 📋 Visão Geral

Sistema que permite Admin e Gerente personalizar quais abas são exibidas em cada projeto, oferecendo flexibilidade para adaptar a interface às necessidades específicas de cada projeto.

## 🎯 Funcionalidades

### **1. Configuração por Projeto**
- Cada projeto possui sua própria configuração de abas visíveis
- Configuração salva no campo `tabs_config` (JSONB) no Supabase
- Sincronização automática entre todos os usuários do projeto

### **2. Controle de Acesso**
- **Configurar abas:** Apenas Admin e Gerente
- **Visualizar abas:** Todos os usuários respeitam a configuração

### **3. Abas Disponíveis**
1. **Visão Geral** (overview) - ⚠️ Obrigatória
2. **Onboarding** (onboarding)
3. **Documentos** (documents)
4. **Equipe** (team)
5. **Atividades** (activities)
6. **Indicadores** (indicators)
7. **Panorama Atual** (panorama)
8. **Inteligência Humana** (ai-insights)

**Nota:** A aba "Menu" (preliminary) sempre fica visível e não é configurável.

## 🔧 Implementação Técnica

### **Estrutura de Dados**

```json
{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}
```

### **Migração Supabase**

```sql
-- Arquivo: supabase/migrations/add_tabs_config_to_projects.sql

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tabs_config JSONB DEFAULT '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_projects_tabs_config 
ON projects USING GIN (tabs_config);
```

### **Arquivos Modificados**

#### **1. src/contexts/ProjectsContext.jsx**
- **Linha 321-330:** Mapeamento `tabs_config` do Supabase para camelCase
- **Linha 572-574:** Mapeamento `tabsConfig` para `tabs_config` no update

#### **2. src/components/projects/TabsConfigDialog.jsx** (NOVO)
- Componente Dialog para configuração de abas
- Interface visual com switches por aba
- Contador de abas visíveis
- Validação de aba obrigatória (Visão Geral)

#### **3. src/pages/ProjectDetails.jsx**
- **Linha 25:** Import do componente TabsConfigDialog
- **Linha 15:** Import do ícone SettingsIcon
- **Linha 980-991:** Estados para controle de configuração
- **Linha 1898-1903:** useEffect para carregar configuração
- **Linha 1905-1921:** Função handleSaveTabsConfig
- **Linha 4016-4026:** Renderização condicional das abas
- **Linha 4029-4040:** Botão "Configurar Abas"
- **Linha 4071:** Filtro no menu preliminar
- **Linha 5336-5341:** Componente TabsConfigDialog

## 🎨 Interface do Usuário

### **Botão de Configuração**
- **Localização:** Ao lado das abas, no header do projeto
- **Ícone:** Engrenagem (Settings)
- **Texto:** "Configurar Abas"
- **Visibilidade:** Apenas Admin e Gerente

### **Modal de Configuração**
- **Título:** "Configurar Abas Visíveis"
- **Descrição:** Aviso de que afeta todos os usuários
- **Contador:** Mostra quantas abas estão visíveis
- **Lista:** Cards com ícone, título, descrição e switch
- **Indicador:** Badge "Obrigatória" na aba Visão Geral
- **Botões:** Cancelar e Salvar Configuração

### **Feedback Visual**
- Abas ocultas não aparecem na barra de abas
- Cards ocultos não aparecem no menu preliminar
- Contador atualiza em tempo real
- Alerta de sucesso ao salvar

## 📊 Casos de Uso

### **Projeto Simples**
```json
{
  "overview": true,
  "onboarding": false,
  "documents": true,
  "team": true,
  "activities": false,
  "indicators": false,
  "panorama": false,
  "ai-insights": false
}
```
**Resultado:** Apenas Visão Geral, Documentos e Equipe visíveis

### **Projeto para Cliente**
```json
{
  "overview": true,
  "onboarding": false,
  "documents": true,
  "team": false,
  "activities": false,
  "indicators": true,
  "panorama": false,
  "ai-insights": false
}
```
**Resultado:** Cliente vê apenas Visão Geral, Documentos e Indicadores

### **Projeto Completo**
```json
{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}
```
**Resultado:** Todas as abas visíveis (padrão)

## 🔒 Segurança e Validações

### **Permissões**
- ✅ Botão de configuração visível apenas para Admin/Gerente
- ✅ Função `handleSaveTabsConfig` verifica permissões no backend
- ✅ RLS do Supabase controla acesso ao campo `tabs_config`

### **Validações**
- ✅ Aba "Visão Geral" sempre obrigatória (não pode ser desabilitada)
- ✅ Se aba ativa for ocultada, usuário volta para o Menu
- ✅ Configuração padrão aplicada em projetos novos
- ✅ Projetos existentes mantêm todas as abas visíveis

### **Tratamento de Erros**
- ✅ Try/catch na função de salvamento
- ✅ Rollback em caso de erro
- ✅ Mensagens de erro claras para o usuário
- ✅ Logs detalhados no console

## 🚀 Como Usar

### **Para Admin/Gerente:**

1. **Acessar Configuração:**
   - Abrir um projeto
   - Clicar no botão "Configurar Abas" ao lado das abas

2. **Configurar Abas:**
   - Usar os switches para mostrar/ocultar cada aba
   - Observar o contador de abas visíveis
   - Aba "Visão Geral" não pode ser desabilitada

3. **Salvar:**
   - Clicar em "Salvar Configuração"
   - Aguardar mensagem de sucesso
   - Abas atualizam automaticamente

### **Para Outros Usuários:**
- Visualizam apenas as abas configuradas pelo Admin/Gerente
- Não têm acesso ao botão de configuração
- Configuração sincroniza automaticamente

## 📈 Benefícios

1. **Flexibilidade:** Cada projeto pode ter abas diferentes
2. **Simplicidade:** Reduz poluição visual em projetos simples
3. **Controle:** Admin/Gerente decide o que é visível
4. **Organização:** Clientes veem apenas o relevante
5. **Compatibilidade:** Projetos existentes mantêm todas as abas

## 🔄 Compatibilidade

- ✅ **Projetos Existentes:** Todas as abas visíveis por padrão
- ✅ **Projetos Novos:** Todas as abas visíveis por padrão
- ✅ **Migração:** Não quebra funcionalidades existentes
- ✅ **Rollback:** Pode reverter configuração a qualquer momento

## 🐛 Troubleshooting

### **Abas não aparecem após configuração:**
- Verificar se a configuração foi salva no Supabase
- Verificar console do navegador para erros
- Recarregar a página (F5)

### **Botão de configuração não aparece:**
- Verificar se usuário é Admin ou Gerente
- Verificar permissões no AuthContext

### **Erro ao salvar configuração:**
- Verificar conexão com Supabase
- Verificar RLS policies na tabela projects
- Verificar logs do console

## 📝 Notas Técnicas

- **Performance:** Índice GIN otimiza queries em JSONB
- **Sincronização:** Configuração carregada via useEffect
- **Estado Local:** Mantido em sync com Supabase
- **Persistência:** Salvamento automático no backend

## 🎯 Próximas Melhorias (Futuro)

- [ ] Reordenar abas via drag & drop
- [ ] Renomear abas personalizadamente
- [ ] Ícones personalizados por aba
- [ ] Templates de configuração (Simples, Completo, Cliente)
- [ ] Histórico de mudanças de configuração
- [ ] Permissões granulares por aba e por usuário
