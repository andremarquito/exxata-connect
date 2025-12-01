# Implementação de Configuração de Abas com Visibilidade Específica para Clientes

## Visão Geral

Sistema completo que permite configurar a visibilidade das abas dos projetos com duas opções:
1. **Ocultar para todos os usuários**: A aba fica oculta para todos (Admin, Gerente, Colaborador e Cliente)
2. **Ocultar apenas para clientes**: A aba fica visível para Admin/Gerente/Colaborador mas oculta para Cliente

## Funcionalidades Implementadas

### 1. Migração Supabase

**Arquivo**: `supabase/migrations/add_tabs_config_client.sql`

- Campo `tabs_config_client` adicionado à tabela `projects`
- Tipo: JSONB
- Default: Todas as abas visíveis para clientes
- Estrutura idêntica ao `tabs_config` existente

### 2. Interface de Configuração

**Componente**: `src/components/projects/TabsConfigDialog.jsx`

#### Estrutura da Interface:

```
┌─────────────────────────────────────────────┐
│ Configurar Abas Visíveis                    │
├─────────────────────────────────────────────┤
│ [Aba]                                       │
│ ├─ Switch Principal (Ocultar para todos)   │
│ └─ Switch Secundário (Visível para cliente)│
│                                             │
│ [Aba]                                       │
│ ├─ Switch Principal                        │
│ └─ Switch Secundário                       │
└─────────────────────────────────────────────┘
```

#### Comportamento dos Switches:

1. **Switch Principal (Vermelho)**:
   - Controla visibilidade para TODOS os usuários
   - Quando desativado: aba oculta para todos
   - Quando desativado: automaticamente oculta para clientes também

2. **Switch Secundário (Verde)**:
   - Aparece apenas quando switch principal está ativo
   - Controla visibilidade APENAS para clientes
   - Permite ocultar aba especificamente para clientes

### 3. Lógica de Visibilidade

**Arquivo**: `src/pages/ProjectDetails.jsx`

#### Variáveis de Configuração:

```javascript
// Configuração geral (todos os usuários)
const [tabsConfig, setTabsConfig] = useState({...});

// Configuração específica para clientes
const [tabsConfigClient, setTabsConfigClient] = useState({...});

// Determina qual configuração usar baseado no role
const isClient = userRole === 'client' || userRole === 'cliente';
const effectiveTabsConfig = isClient ? tabsConfigClient : tabsConfig;
```

#### Fluxo de Decisão:

```
Usuário acessa projeto
    │
    ├─ É Cliente?
    │   ├─ SIM → Usa tabsConfigClient
    │   └─ NÃO → Usa tabsConfig
    │
    └─ Renderiza abas baseado na configuração efetiva
```

### 4. Persistência no Backend

**Arquivo**: `src/contexts/ProjectsContext.jsx`

#### Mapeamento de Campos:

```javascript
// Carregamento (Supabase → App)
tabsConfig: project.tabs_config || {...}
tabsConfigClient: project.tabs_config_client || {...}

// Salvamento (App → Supabase)
if (patch.tabsConfig !== undefined) {
  supabaseData.tabs_config = patch.tabsConfig;
}
if (patch.tabsConfigClient !== undefined) {
  supabaseData.tabs_config_client = patch.tabsConfigClient;
}
```

## Estrutura de Dados

### Formato JSON no Supabase:

```json
{
  "tabs_config": {
    "overview": true,
    "onboarding": true,
    "documents": true,
    "team": false,          // Oculto para TODOS
    "activities": true,
    "indicators": true,
    "panorama": true,
    "ai-insights": true
  },
  "tabs_config_client": {
    "overview": true,
    "onboarding": false,    // Oculto apenas para CLIENTES
    "documents": true,
    "team": false,          // Oculto para todos (sincronizado)
    "activities": false,    // Oculto apenas para CLIENTES
    "indicators": true,
    "panorama": false,      // Oculto apenas para CLIENTES
    "ai-insights": false    // Oculto apenas para CLIENTES
  }
}
```

## Casos de Uso

### Caso 1: Ocultar Onboarding apenas para Clientes

**Cenário**: Cliente não precisa ver documentação interna de onboarding

**Configuração**:
- Switch Principal (Onboarding): ✅ Ativo
- Switch Secundário (Visível para cliente): ❌ Inativo

**Resultado**:
- Admin/Gerente/Colaborador: ✅ Vê aba Onboarding
- Cliente: ❌ Não vê aba Onboarding

### Caso 2: Ocultar Equipe para Todos

**Cenário**: Projeto não usa gestão de equipe

**Configuração**:
- Switch Principal (Equipe): ❌ Inativo

**Resultado**:
- Admin/Gerente/Colaborador: ❌ Não vê aba Equipe
- Cliente: ❌ Não vê aba Equipe

### Caso 3: Ocultar Panorama e Inteligência Humana apenas para Clientes

**Cenário**: Análises internas não devem ser compartilhadas com cliente

**Configuração**:
- Panorama Atual:
  - Switch Principal: ✅ Ativo
  - Switch Secundário: ❌ Inativo
- Inteligência Humana:
  - Switch Principal: ✅ Ativo
  - Switch Secundário: ❌ Inativo

**Resultado**:
- Admin/Gerente/Colaborador: ✅ Vê ambas as abas
- Cliente: ❌ Não vê nenhuma das duas abas

## Permissões

### Quem pode configurar abas:
- ✅ Admin
- ✅ Gerente
- ❌ Colaborador (não tem acesso ao botão "Configurar Abas")
- ❌ Cliente (não tem acesso ao botão "Configurar Abas")

### Botão "Configurar Abas":
- Localização: Header das abas do projeto
- Visível apenas para: Admin e Gerente
- Ícone: ⚙️ Settings

## Arquivos Modificados

### 1. Migração Supabase
- `supabase/migrations/add_tabs_config_client.sql`

### 2. Componentes
- `src/components/projects/TabsConfigDialog.jsx`
  - Adicionado estado `configClient`
  - Adicionada função `handleToggleClient`
  - Atualizada interface com switch secundário
  - Atualizada função `handleSave` para salvar ambas configurações

### 3. Contexto
- `src/contexts/ProjectsContext.jsx`
  - Adicionado mapeamento `tabsConfigClient` no carregamento
  - Adicionado mapeamento `tabs_config_client` no salvamento

### 4. Página Principal
- `src/pages/ProjectDetails.jsx`
  - Adicionado estado `tabsConfigClient`
  - Adicionada variável `isClient`
  - Adicionada variável `effectiveTabsConfig`
  - Atualizada função `handleSaveTabsConfig`
  - Substituídas todas referências de `tabsConfig` por `effectiveTabsConfig` na renderização

## Compatibilidade

### Projetos Existentes:
✅ Totalmente compatível
- Projetos sem `tabs_config_client` usam default (todas visíveis)
- Não quebra configurações existentes de `tabs_config`

### Migração Automática:
✅ Não requer ação manual
- Campo criado com default seguro
- Valores null tratados como "todas visíveis"

## Testes Recomendados

### 1. Teste com Admin:
- [ ] Acessar projeto
- [ ] Abrir "Configurar Abas"
- [ ] Desativar switch principal de uma aba
- [ ] Verificar que aba desaparece
- [ ] Verificar que switch secundário também desaparece

### 2. Teste com Cliente:
- [ ] Acessar projeto (como Admin)
- [ ] Configurar aba visível para todos, mas oculta para cliente
- [ ] Fazer logout
- [ ] Login como Cliente
- [ ] Verificar que aba está oculta
- [ ] Verificar que outras abas estão visíveis

### 3. Teste de Persistência:
- [ ] Configurar abas
- [ ] Salvar
- [ ] Recarregar página
- [ ] Verificar que configuração persiste
- [ ] Verificar em outro navegador/dispositivo

### 4. Teste de Menu Preliminar:
- [ ] Configurar algumas abas ocultas
- [ ] Acessar aba "Menu"
- [ ] Verificar que apenas abas visíveis aparecem nos cards

## Benefícios

### Para Administradores:
✅ Controle granular de visibilidade
✅ Interface intuitiva com feedback visual
✅ Configuração rápida e fácil

### Para Clientes:
✅ Interface limpa, sem abas desnecessárias
✅ Foco apenas no conteúdo relevante
✅ Experiência personalizada por projeto

### Para o Sistema:
✅ Flexibilidade por projeto
✅ Não afeta outros projetos
✅ Configuração persistente no banco
✅ Compatível com versões anteriores

## Próximos Passos Sugeridos

1. **Aplicar Migração no Supabase**:
   ```bash
   # Via Supabase Dashboard ou CLI
   supabase migration up
   ```

2. **Testar em Desenvolvimento**:
   - Criar projeto de teste
   - Configurar abas com diferentes combinações
   - Testar com diferentes perfis de usuário

3. **Deploy em Produção**:
   - Aplicar migração
   - Deploy do código atualizado
   - Monitorar logs para erros

4. **Documentar para Usuários**:
   - Criar guia de uso para administradores
   - Adicionar tooltips explicativos na interface
   - Criar vídeo tutorial (opcional)

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do navegador (Console)
2. Verificar logs do Supabase
3. Verificar se migração foi aplicada corretamente
4. Verificar permissões do usuário
