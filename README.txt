# Exxata Connect — README (MVP)

Este documento explica o funcionamento do sistema, a relação entre arquivos, o fluxo de execução e instruções de uso/desenvolvimento. Inclui um fluxograma de funcionamento ao final.


============================================================
1) Objetivo do Projeto
============================================================

Exxata Connect é um MVP de SaaS para gestão de projetos de consultoria, com foco em:
- Cadastro e gestão de projetos com visão geral personalizável por usuário/projeto
- Seção de Atividades com edição inline, filtros e Gantt visual
- Gestão de documentos com upload (drag-and-drop) e metadados
- Equipe do projeto e convites de usuários
- Indicadores (gráficos) com importação a partir de Excel/CSV
- Área “Inteligência Humana” para anotações e condutas (prioridades/urgências)

O MVP persiste dados localmente no navegador (localStorage) e simula autenticação. A arquitetura futura com backend e microsserviços está documentada em `arquitetura_tecnica.md`.


============================================================
2) Stack e Dependências
============================================================

Frontend: React 18 + Vite + React Router DOM 7 + Tailwind CSS
UI: Radix UI + componentes (botões, cards, inputs, select, etc.)
Gráficos: Recharts
Excel/CSV: SheetJS (xlsx)
Notificações: react-hot-toast

Arquivo: `package.json`
- "dev": Vite dev server
- "build": Vite build (saída em `dist/`)
- "preview": servidor de preview do Vite

Principais libs (versões no `package.json`):
- react, react-dom
- react-router-dom
- @radix-ui/*
- tailwindcss, tailwind-merge, tailwindcss-animate
- recharts
- xlsx
- lucide-react


============================================================
3) Como Rodar Localmente
============================================================

Pré-requisitos:
- Node.js 18 (configurado em `netlify.toml` e compatível com Vite)

Passos:
- npm install
- npm run dev
- A aplicação abre em http://localhost:3000 (porta 3000 definida em `vite.config.js`)

Build/Preview:
- npm run build
- npm run preview


============================================================
4) Deploy (Netlify)
============================================================

Arquivo: `netlify.toml`
- build: `npm run build`
- publish: `dist`
- SPA fallback para `index.html` (client-side routing)
- NODE_VERSION=18


============================================================
5) Estrutura de Diretórios (principal)
============================================================

Raiz do projeto:
- `index.html`: shell do app SPA
- `vite.config.js`: alias `@` -> `src/`, server em 3000, cache fora do Dropbox
- `tailwind.config.js`: tema, cores da marca Exxata ("blue-exxata" #09182b, "exxata-red" #d51d07)
- `netlify.toml`: configuração de deploy/redirect SPA
- `arquitetura_tecnica.md`: visão futura (microsserviços, IA, cloud, bancos)
- `src/`: código-fonte da aplicação em produção
- `pages/`: versões antigas de páginas (não utilizadas no fluxo atual)
- `routes/`: esboço alternativo de roteamento (não utilizado no fluxo atual)

Em `src/`:
- `main.jsx`: Bootstrap React + render do `<App />`
- `App.jsx`: Providers globais, Router, layout (Header/Sidebar) e rotas protegidas
- `index.css` e `styles/`: estilos Tailwind
- `components/`: UI e componentes de layout/projetos
- `contexts/`: Contextos globais (Auth, Users, Projects)
- `pages/`: Páginas reais usadas no app (DashboardNew, Projects, ProjectDetails, Team, Settings)
- `utils/`: utilitários (ex.: importador de Excel)
- `lib/`: utilitários menores (ex.: `utils.js` com `cn`)


============================================================
6) Fluxo de Execução (alto nível)
============================================================

1. `src/main.jsx` renderiza `<App />` no elemento `#root`.
2. `src/App.jsx` envolve a aplicação com `AuthProvider`, `UsersProvider`, `ProjectsProvider`, configura Router e Rotas Protegidas.
3. Usuário não autenticado é redirecionado para `/login`. Ao logar, o layout principal é carregado: `Sidebar` + `Header` + `<Routes/>`.
4. Rotas principais:
   - `/` -> `DashboardNew`
   - `/projects` -> `Projects` (lista com filtros e ordenação)
   - `/projects/:projectId` -> `ProjectDetails` (abas: Visão Geral, Documentos, Equipe, Atividades, Indicadores, Panorama Atual, Inteligência Humana)
   - `/team`, `/settings`
5. Todo o estado de projetos/usuários é persistido em `localStorage` (MVP sem backend).


============================================================
7) Fluxograma de Funcionamento (Mermaid)
============================================================

```mermaid
flowchart LR
  A[Usuário] --> B[Browser SPA]
  B --> C[src/main.jsx]
  C --> D[src/App.jsx]
  D --> E[AuthProvider / UsersProvider / ProjectsProvider]
  D --> F[React Router]
  F --> |/login| G[LoginForm]
  G --> |login ok| H[Salva token+user no localStorage]
  H --> I[ProtectedRoute]
  I --> |user ok| J[Layout: Sidebar + Header]
  J --> K[/ Routes /]
  K --> |/| L[DashboardNew]
  K --> |/projects| M[Projects]
  M --> |seleciona projeto| N[ProjectDetails]
  N --> O{Abas}
  O --> P[Visão Geral]
  P --> |OverviewGridSimple| P1[updateProject -> overviewConfig]
  O --> Q[Documentos]
  Q --> Q1[Drag&Drop -> addProjectFile -> localStorage]
  O --> R[Equipe]
  R --> R1[Adicionar membro]
  O --> S[Atividades]
  S --> S1[Editar status inline -> updateProjectActivity]
  S --> S2[Filtro por data/usuário/status]
  S --> S3[Ordenação por ID/createdAt]
  S --> S4[Gantt alin. à tabela]
  O --> T[Indicadores]
  T --> T1[Excel/CSV -> utils/excelImporter]
  T1 --> T2[transformSheetToIndicator -> add/update]
  O --> U[Inteligência Humana]
  U --> U1[Anotações + Condutas (reordenar, duplicar, excluir)]
```


============================================================
8) Autenticação e Permissões
============================================================

Arquivo: `src/contexts/AuthContext.jsx`
- Autenticação simulada via `localStorage` (`token` e `auth_user`).
- Perfis de demonstração:
  - admin@exxata.com / admin123  -> role: admin (todas permissões)
  - consultor@exxata.com ou consultant@exxata.com / consultor123 -> role: consultor (ver/editar projetos)
  - cliente@exxata.com ou client@exxata.com / cliente123 -> role: cliente (visualização restrita)
- `hasPermission(permission)`: verifica permissões incluídas no usuário corrente.
- `ProtectedRoute` (definida dentro de `App.jsx`): bloqueia rotas quando `!user`.

Relacionamento:
- `Sidebar.jsx` usa `hasPermission` para exibir itens condicionais (ex.: Equipe)
- `Header.jsx` usa `useAuth()` para exibição do usuário e logout


============================================================
9) Contextos de Estado e Persistência (localStorage)
============================================================

Arquivo: `src/contexts/UsersContext.jsx`
- Seed inicial inclui o usuário logado se não existir.
- `addUser`, `updateUser`, `deleteUser`, `getUserById`, `getUserByEmail`
- Persistência em `localStorage` (chave `exxata_users`)

Arquivo: `src/contexts/ProjectsContext.jsx`
- `seedProjects`: 4 projetos de exemplo
- `projects` persistidos em `localStorage` (chave `exxata_projects`)
- Helpers principais:
  - Projetos: `createProject`, `updateProject`, `deleteProject`, `getProjectById`, `userCanSeeProject`
  - Arquivos: `addProjectFile` (converte `File` -> DataURL, guarda metadados), `deleteProjectFile`, `getProjectFiles`
  - Atividades: `addProjectActivity` (gera `seq` incremental e `createdAt`), `updateProjectActivity`, `deleteProjectActivity`, `duplicateProjectActivity`
  - Indicadores: `addProjectIndicator`, `updateProjectIndicator`, `deleteProjectIndicator`, `duplicateProjectIndicator`, `reorderProjectIndicators`
- Campos relevantes do projeto para Visão Geral: `overviewConfig: { widgets: [], layouts: {} }`


============================================================
10) Páginas e Relação com Componentes
============================================================

Arquivo: `src/App.jsx`
- Layout principal com `Sidebar` (navegação) e `Header` (ações), além dos modais globais
- Rotas (quando logado): `/`, `/projects`, `/projects/:projectId`, `/team`, `/settings`
- Abre modais de Novo Projeto e Convite (componentes em `src/components/projects/`)

Arquivo: `src/pages/Projects.jsx`
- Lista os projetos: busca, filtro por status, ordenação (nome/progresso)
- Clique no card -> navega para `ProjectDetails`

Arquivo: `src/pages/ProjectDetails.jsx`
- Abas principais:
  - Visão Geral: usa `components/projects/OverviewGridSimple.jsx` (cartões customizáveis)
  - Documentos: upload por drag&drop, metadados e permissões de upload/exclusão
  - Equipe: adiciona membros a partir de `UsersContext`
  - Atividades: tabela + filtros + ordenação + edição inline de status + Gantt
  - Indicadores: CRUD com `IndicatorChart` e importação de planilhas
  - Panorama Atual: três colunas (técnica, física, econômica) com status e itens
  - Inteligência Humana: textarea e “Condutas” (com reordenação/duplicação)

Componentes utilizados em `ProjectDetails`:
- `OverviewGridSimple.jsx`: cards configuráveis e reordenáveis via DnD (modo edição)
- `IndicatorChart.jsx`: render de gráficos (bar, bar-horizontal, line, pie)
- `utils/excelImporter.js`: leitura (xlsx/csv) e transformação de planilha em `indicator.datasets`

Observação: Existe um `OverviewGrid.jsx` (grid avançado com `react-grid-layout`), mas o fluxo atual utiliza o `OverviewGridSimple.jsx`.


============================================================
11) Visão Geral do Projeto (cards customizáveis)
============================================================

Arquivo: `src/components/projects/OverviewGridSimple.jsx`
- Catálogo de cards (`CARD_CATALOG`): name, client, sector, exxataActivities, location, period, description, team, contractValue, hourlyRate, disputedAmount, contractSummary, progress, billingProgress
- Ações (se Admin): adicionar/remover cards e reordenar por drag-and-drop
- Persistência: alterações fazem `updateProject(project.id, { overviewConfig: {...} })`
- Edição inline quando `canEdit` (ex.: inputs para nome/cliente/descritivo, selects para setor/atividades, etc.)


============================================================
12) Atividades (tabela, filtros, ordenação e Gantt)
============================================================

Arquivo: `src/pages/ProjectDetails.jsx` (aba "Atividades")
- Filtros:
  - Por usuário (assignedTo)
  - Por status
  - Por intervalo de datas: `activityDateFrom` / `activityDateTo` (interseção com período da atividade)
- Ordenação:
  - Por `createdAt` ou `id` (seq), e também pelos cabeçalhos: título, responsável, início, fim, status
  - Alternância asc/desc ao clicar no cabeçalho ou usar o seletor
- Coluna de ID:
  - Exibe `seq` com `formatSeq()` (sequencial 01, 02, ...)
- Edição inline de status (Select por linha)
- Ações por linha: duplicar e excluir
- Gantt:
  - Barras alinhadas às linhas da tabela
  - Grade semanal e linha “Hoje”

APIs do contexto usadas:
- `addProjectActivity(projectId, payload)` – cria com `seq` incremental e `createdAt`
- `updateProjectActivity(projectId, activityId, patch)` – edição inline de status
- `deleteProjectActivity(...)`, `duplicateProjectActivity(...)`


============================================================
13) Documentos (upload, metadados, permissões)
============================================================

Arquivo: `src/pages/ProjectDetails.jsx` (aba "Documentos")
- Upload por drag-and-drop para origem `client` ou `exxata`
- Persistência via `addProjectFile(project.id, file, source)` que converte para DataURL e salva metadados (id, nome, tamanho, tipo, ext, origem, autor, data)
- Regras simples de permissão:
  - Usuários "cliente" só podem enviar para a origem `client`
  - Exclusão de arquivos restrita (admin ou permissão editar/deletar)


============================================================
14) Equipe do Projeto
============================================================

- Adiciona membros já cadastrados em `UsersContext`
- Busca por nome/email e inclusão com dados básicos (id, name, email, role)
- Persistência via `updateProject(project.id, { team: [...] })`


============================================================
15) Indicadores (gráficos + importação Excel/CSV)
============================================================

Arquivos:
- `src/components/projects/IndicatorChart.jsx` – renderiza `bar`, `bar-horizontal`, `line`, `pie`
- `src/utils/excelImporter.js` – leitura (`readSpreadsheet`) e transformação (`transformSheetToIndicator`) da planilha para `{ labels, datasets }`

Funcionalidades:
- CRUD de indicadores (adicionar, editar, excluir, duplicar, reordenar)
- Importação: seleciona planilha/aba, define se tem cabeçalho e (para pizza) coluna de valores
- Paleta de cores default alinhada às cores da marca (ver `DEFAULT_COLORS`)


============================================================
16) Layout e UI
============================================================

Arquivos:
- `src/components/layout/Header.jsx` – logo, ações: convidar usuário, novo projeto, menu usuário
- `src/components/layout/Sidebar.jsx` – navegação principal, recolhível, itens condicionais por permissão
- `src/components/ui/*` – componentes visuais (button, card, input, select, table, tabs, etc.)
- `src/lib/utils.js` – util `cn` (clsx + tailwind-merge)

Estilo e tema:
- `tailwind.config.js` define cores da marca: `blue-exxata` (#09182b) e `exxata-red` (#d51d07)


============================================================
17) Modais Globais e Ações
============================================================

Arquivos:
- `src/components/projects/NewProjectModal.jsx`
  - Campos completos do projeto e de cards customizáveis da Visão Geral
  - Ao salvar, dispara `createProject(payload)` (via `App.jsx`)
- `src/components/projects/InviteUserModal.jsx`
  - Registra convite e adiciona usuário na base local via `UsersContext`


============================================================
18) Roteamento
============================================================

- Em uso: Roteamento configurado diretamente em `src/App.jsx` com `<BrowserRouter>` e `<Routes>`
- Não utilizado: `routes/index.jsx` (um esboço prévio de rotas) e `pages/` (raiz) com versões antigas


============================================================
19) Convenções, Limitações e Próximos Passos
============================================================

- Persistência local (MVP): dados são salvos no `localStorage`. Não há backend nem autenticação real.
- IDs e datas: gerados no cliente (ex.: `Date.now()` e `new Date().toISOString()`).
- A arquitetura evolutiva planejada é descrita em `arquitetura_tecnica.md`:
  - Microsserviços: Autenticação/Usuários, Projetos, Documentos, Atividades/Gantt, Notificações, IA
  - Bancos: PostgreSQL (relacional) e MongoDB (documentos)
  - Infra: Docker/Kubernetes e cloud (AWS/GCP)
  - IA: sumarização de documentos, análise de sentimento, otimização de cronogramas, chatbot

Sugestões de evolução imediata:
- Persistência real (API REST/GraphQL) e autenticação JWT
- RBAC completo no backend
- Upload para storage externo (S3/GCS) com presigned URLs
- Logs/auditoria de atividades
- Testes unitários e E2E


============================================================
20) Credenciais de Teste (Resumo)
============================================================

- Admin:    email `admin@exxata.com`     senha `admin123`
- Consultor: email `consultor@exxata.com` (ou `consultant@exxata.com`) senha `consultor123`
- Cliente:  email `cliente@exxata.com`   (ou `client@exxata.com`)    senha `cliente123`


============================================================
21) Notas Finais
============================================================

- Alias `@` aponta para `src/` (ver `vite.config.js`).
- SPA com fallback em produção no Netlify.
- As páginas em `src/pages/` são as efetivamente usadas no app. A pasta `pages/` do raiz contém versões antigas.
- Para personalizar os cards da Visão Geral, use a aba “Visão Geral” dentro de cada projeto e ative “Editar Cards”.

============================================================
22) Capturas de Tela
============================================================

Para visualizar uma galeria de capturas, consulte o arquivo `README.md` na raiz do projeto. As imagens devem ser salvas na pasta `docs/screenshots/` com os nomes sugeridos abaixo.

- Pasta de imagens: `docs/screenshots/`
- Formato recomendado: PNG
- Resolução sugerida: 1440×900 ou superior
- Abra a galeria em: `README.md`

Sugestão de nomes de arquivos:
- `login.png`
- `dashboard.png`
- `layout-sidebar-header.png`
- `projects.png`
- `new-project-modal.png`
- `project-details-overview.png`
- `project-details-documents.png`
- `project-details-team.png`
- `project-details-activities-table.png`
- `project-details-activities-gantt.png`
- `project-details-indicators.png`
- `project-details-panorama.png`
- `project-details-ai-insights.png`
- `invite-user-modal.png`

Como gerar as capturas (passo a passo):
- `npm install`
- `npm run dev`
- Acesse http://localhost:3000
- Faça login com as credenciais de teste (seção 20 deste README)
- Capture a tela (Windows: Win+Shift+S)
- Salve cada imagem com o nome correspondente em `docs/screenshots/`

Observação: O `README.md` referencia as imagens por caminho relativo (`./docs/screenshots/...`). Ao substituir os placeholders por imagens reais, a galeria ficará visível no GitHub/IDE.
