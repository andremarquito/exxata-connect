# Documentação Técnica: Processo de Criação de Usuários e Projetos
## Exxata Connect - Integração com Supabase

---

## 📋 Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Criação de Usuários](#criação-de-usuários)
3. [Criação de Projetos](#criação-de-projetos)
4. [Gestão de Membros do Projeto](#gestão-de-membros-do-projeto)
5. [Gestão de Atividades](#gestão-de-atividades)
6. [Gestão de Documentos](#gestão-de-documentos)
7. [Gestão de Indicadores](#gestão-de-indicadores)
8. [Gestão de Condutas](#gestão-de-condutas)
9. [Schema do Supabase](#schema-do-supabase)
10. [Fluxos de Dados](#fluxos-de-dados)

---

## 🏗️ Arquitetura Geral

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    EXXATA CONNECT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │ AuthContext  │◄────►│   Supabase   │                   │
│  │              │      │     Auth     │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      │                           │
│         ▼                      ▼                           │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Projects   │◄────►│   Supabase   │                   │
│  │   Context    │      │   Database   │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      │                           │
│         ▼                      ▼                           │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │ localStorage │      │  PostgreSQL  │                   │
│  │  (fallback)  │      │   (tabelas)  │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sistema Híbrido

O Exxata Connect utiliza um **sistema híbrido** de autenticação e persistência:

1. **Primário**: Supabase (PostgreSQL + Auth)
2. **Fallback**: localStorage (sistema local)

---

## 👤 Criação de Usuários

### 1.1 Fluxo de Registro no Supabase

#### Arquivo: `src/contexts/AuthContext.jsx`

```javascript
// Não há função de registro exposta no AuthContext atual
// O registro é feito diretamente via Supabase Auth
```

#### Processo de Registro:

**Etapa 1: Registro via Supabase Auth**

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@exemplo.com',
  password: 'senha_segura',
  options: {
    data: {
      full_name: 'Nome do Usuário'
    }
  }
});
```

**Dados Enviados ao Supabase:**
- **email** (string, obrigatório): Email do usuário
- **password** (string, obrigatório): Senha (mínimo 6 caracteres)
- **options.data.full_name** (string, opcional): Nome completo do usuário

**Resposta do Supabase:**
```typescript
{
  user: {
    id: string,              // UUID gerado pelo Supabase
    email: string,
    user_metadata: {
      full_name: string
    },
    created_at: string,      // ISO 8601 timestamp
    confirmed_at: string | null
  },
  session: {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    token_type: 'bearer'
  }
}
```

**Etapa 2: Criação Automática do Perfil**

Quando um usuário é registrado no Supabase Auth, um trigger no banco de dados cria automaticamente um registro na tabela `profiles`:

```sql
-- Trigger executado automaticamente
INSERT INTO profiles (id, email, name, role, status, created_at)
VALUES (
  NEW.id,                    -- UUID do auth.users
  NEW.email,                 -- string
  NEW.raw_user_meta_data->>'full_name',  -- string
  'cliente',                 -- string (role padrão)
  'Ativo',                   -- string
  NOW()                      -- timestamp
);
```

**Campos da Tabela `profiles`:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Referência ao `auth.users.id` |
| `email` | TEXT | Sim | Email do usuário |
| `name` | TEXT | Não | Nome completo |
| `role` | TEXT | Sim | Papel: 'admin', 'gerente', 'consultor', 'colaborador', 'cliente' |
| `status` | TEXT | Sim | Status: 'Ativo', 'Inativo', 'Pendente' |
| `avatar_url` | TEXT | Não | URL do avatar |
| `phone` | TEXT | Não | Telefone |
| `created_at` | TIMESTAMP | Sim | Data de criação |
| `updated_at` | TIMESTAMP | Sim | Data de atualização |

### 1.2 Fluxo de Login

#### Arquivo: `src/contexts/AuthContext.jsx` (linhas 293-344)

**Etapa 1: Tentativa de Login no Supabase**

```javascript
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'usuario@exemplo.com',
  password: 'senha'
});
```

**Dados Enviados:**
- **email** (string): Email do usuário
- **password** (string): Senha

**Resposta de Sucesso:**
```typescript
{
  user: {
    id: string,              // UUID
    email: string,
    user_metadata: object,
    created_at: string
  },
  session: {
    access_token: string,    // JWT token
    refresh_token: string,
    expires_in: number,      // segundos
    expires_at: number       // timestamp
  }
}
```

**Etapa 2: Busca do Perfil do Usuário**

Após login bem-sucedido, o sistema busca dados adicionais na tabela `profiles`:

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', supabaseUser.id)
  .single();
```

**Query SQL Executada:**
```sql
SELECT * FROM profiles WHERE id = 'uuid-do-usuario' LIMIT 1;
```

**Dados Retornados:**
```typescript
{
  id: string,              // UUID
  email: string,
  name: string,
  role: string,            // 'admin' | 'gerente' | 'consultor' | 'colaborador' | 'cliente'
  status: string,          // 'Ativo' | 'Inativo' | 'Pendente'
  avatar_url: string | null,
  phone: string | null,
  created_at: string,      // ISO 8601
  updated_at: string       // ISO 8601
}
```

**Etapa 3: Construção do Objeto de Usuário**

O sistema combina dados do Supabase Auth e da tabela `profiles`:

```javascript
const userData = {
  id: supabaseUser.id,                    // UUID (string)
  name: profile?.name || 'Usuário',       // string
  email: supabaseUser.email,              // string
  role: profile?.role || 'cliente',       // string
  permissions: getPermissionsByRole(role), // array de strings
  supabaseUser: supabaseUser              // objeto completo
};
```

**Etapa 4: Persistência Local (Fallback)**

```javascript
localStorage.setItem('token', 'supabase-session');
localStorage.setItem('auth_user', JSON.stringify(userData));
```

### 1.3 Sistema de Permissões

#### Arquivo: `src/contexts/AuthContext.jsx` (linhas 19-58)

**Mapeamento de Roles para Permissões:**

```javascript
const getPermissionsByRole = (role) => {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'administrador':
      return [
        'view_projects',
        'edit_projects',
        'delete_projects',
        'manage_team',
        'create_project'
      ];
    
    case 'manager':
    case 'gerente':
      return [
        'view_projects',
        'edit_projects',
        'delete_projects',
        'manage_team',
        'create_project'
      ];
    
    case 'collaborator':
    case 'colaborador':
    case 'consultor':
    case 'consultant':
      return [
        'view_projects',
        'edit_projects'
      ];
    
    case 'client':
    case 'cliente':
      return [
        'view_projects'
      ];
    
    default:
      return ['view_projects'];
  }
};
```

### 1.4 Recuperação de Senha

#### Arquivo: `src/contexts/AuthContext.jsx` (linhas 471-490)

**Etapa 1: Solicitação de Reset**

```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Dados Enviados:**
- **email** (string): Email do usuário
- **redirectTo** (string): URL de redirecionamento após reset

**Processo no Supabase:**
1. Verifica se o email existe
2. Gera token de recuperação (válido por 1 hora)
3. Envia email com link de reset

**Etapa 2: Atualização de Senha**

```javascript
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

**Dados Enviados:**
- **password** (string): Nova senha

---

## 📁 Criação de Projetos

### 2.1 Fluxo de Criação de Projeto

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 411-462)

**Etapa 1: Coleta de Dados no Frontend**

Componente: `src/components/projects/NewProjectModal.jsx`

**Formulário de Criação (linhas 69-90):**

```javascript
const payload = {
  name: string,                    // Nome do projeto (obrigatório)
  contractValue: string,           // Valor formatado: "R$ 15.000.000"
  client: string,                  // Nome do cliente
  startDate: string,               // Formato: "YYYY-MM-DD"
  endDate: string,                 // Formato: "YYYY-MM-DD"
  description: string,             // Descrição textual
  location: string,                // Localização: "Cidade, UF"
  sector: string,                  // Setor de atuação
  exxataActivities: string[],      // Array de atividades Exxata
  team: Array<{                    // Membros da equipe
    id: number | string,
    name: string,
    email: string
  }>,
  hourlyRate: string,              // Valor do homem-hora
  disputedAmount: string,          // Valor em discussão
  contractSummary: string,         // Título do contrato
  billingProgress: number          // Progresso em faturamento (0-100)
};
```

**Campos do Formulário:**

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `name` | string | Sim | Nome do projeto | "Otimização Contratual - Linha Férrea" |
| `contractValue` | string | Não | Valor do contrato | "R$ 15.000.000,00" |
| `client` | string | Não | Cliente final | "VALE S.A." |
| `startDate` | string | Não | Data de início | "2024-01-15" |
| `endDate` | string | Não | Data de término | "2025-01-15" |
| `description` | string | Não | Descrição do projeto | "Análise e otimização..." |
| `location` | string | Não | Localização | "Parauapebas, PA" |
| `sector` | string | Não | Setor de atuação | "Ferrovias" |
| `exxataActivities` | array | Não | Atividades Exxata | ["Administração Contratual"] |
| `team` | array | Não | Equipe inicial | [{ id: 1, name: "João" }] |
| `hourlyRate` | string | Não | Valor homem-hora | "150.00" |
| `disputedAmount` | string | Não | Valor em discussão | "50000.00" |
| `contractSummary` | string | Não | Título do contrato | "CT - 684N" |
| `billingProgress` | number | Não | Progresso faturamento | 45 |

**Etapa 2: Processamento no Context**

```javascript
const createProject = async (payload) => {
  // Criar objeto de projeto local
  const newProject = {
    id: Date.now(),                          // Temporário
    name: payload.name,                      // string
    client: payload.client,                  // string
    status: 'Planejamento',                  // string (padrão)
    progress: 0,                             // number (padrão)
    contractValue: payload.contractValue || 'R$ 0,00',  // string
    location: payload.location || '',        // string
    phase: 'Pré-contratual',                // string (padrão)
    startDate: payload.startDate || '',      // string
    endDate: payload.endDate || '',          // string
    description: payload.description || '',  // string
    hourlyRate: payload.hourlyRate || '0',   // string
    disputedAmount: payload.disputedAmount || '0',  // string
    contractSummary: payload.contractSummary || '',  // string
    billingProgress: Number(payload.billingProgress ?? 0) || 0,  // number
    sector: payload.sector || '',            // string
    exxataActivities: Array.isArray(payload.exxataActivities) 
      ? payload.exxataActivities : [],       // array
    createdBy: user?.id ?? null,             // UUID ou number
    team: payload.team || [],                // array
    files: [],                               // array (vazio)
    activities: [],                          // array (vazio)
    indicators: [],                          // array (vazio)
    aiPredictiveText: payload.aiPredictiveText || '',  // string
    conducts: Array.isArray(payload.conducts) 
      ? payload.conducts : [],               // array
    panorama: payload.panorama || {          // object
      tecnica: { status: 'green', items: [] },
      fisica: { status: 'green', items: [] },
      economica: { status: 'green', items: [] },
    },
    overviewConfig: { widgets: [], layouts: {} },  // object
  };
  
  // Tentar salvar no Supabase
  const savedProject = await saveProjectToSupabase(newProject);
  
  if (savedProject) {
    newProject.id = savedProject.id;  // Usar ID do Supabase
  }
  
  // Adicionar ao estado local
  setProjects(prev => [newProject, ...prev]);
  
  return newProject;
};
```

**Etapa 3: Salvamento no Supabase**

Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 302-338)

```javascript
const saveProjectToSupabase = async (project) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: project.name,              // TEXT (obrigatório)
      client: project.client,          // TEXT
      description: project.description, // TEXT
      location: project.location,      // TEXT
      contract_value: project.contractValue,  // TEXT
      status: project.status,          // TEXT
      created_by: project.createdBy,   // UUID (FK para profiles)
      team: project.team || [],        // JSONB (array)
    })
    .select()
    .single();
  
  return data;
};
```

**Query SQL Executada:**

```sql
INSERT INTO projects (
  name,
  client,
  description,
  location,
  contract_value,
  status,
  created_by,
  team,
  created_at,
  updated_at
)
VALUES (
  'Nome do Projeto',           -- TEXT
  'Cliente Final',             -- TEXT
  'Descrição do projeto',      -- TEXT
  'Cidade, UF',                -- TEXT
  'R$ 15.000.000,00',          -- TEXT
  'Planejamento',              -- TEXT
  'uuid-do-usuario',           -- UUID
  '[]'::jsonb,                 -- JSONB
  NOW(),                       -- TIMESTAMP
  NOW()                        -- TIMESTAMP
)
RETURNING *;
```

**Dados Retornados pelo Supabase:**

```typescript
{
  id: number,                  // Serial (auto-incremento)
  name: string,
  client: string,
  description: string,
  location: string,
  contract_value: string,
  status: string,
  created_by: string,          // UUID
  team: any[],                 // JSONB array
  created_at: string,          // ISO 8601
  updated_at: string           // ISO 8601
}
```

**Etapa 4: Persistência Local (Fallback)**

```javascript
// Salvar em localStorage para fallback
localStorage.setItem('exxata_projects', JSON.stringify(projects));
```

### 2.2 Carregamento de Projetos

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 104-300)

**Etapa 1: Verificação do Tipo de Usuário**

```javascript
const isSupabaseUser = user.supabaseUser && 
                       typeof user.id === 'string' && 
                       user.id.length > 10;
```

**Etapa 2: Carregamento via View Completa (Preferencial)**

```javascript
const { data, error } = await supabase
  .from('v_projects_complete')
  .select('*')
  .eq('created_by', userId);
```

**Query SQL Executada:**
```sql
SELECT * FROM v_projects_complete WHERE created_by = 'uuid-do-usuario';
```

**Estrutura da View `v_projects_complete`:**
- Combina dados de `projects`, `project_members`, `project_activities`, `project_files`, `project_indicators`
- Retorna dados normalizados e prontos para uso

**Etapa 3: Fallback para Carregamento Básico**

Se a view não existir:

```javascript
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    project_activities_old:project_activities_old(
      id,
      custom_id,
      name,
      responsible,
      start_date,
      end_date,
      status,
      created_at,
      updated_at
    ),
    project_files(
      id,
      name,
      file_path,
      file_size,
      mime_type,
      uploaded_by,
      created_at
    ),
    project_indicators(
      id,
      name,
      value,
      type,
      created_at,
      updated_at
    )
  `)
  .eq('created_by', userId);
```

**Etapa 4: Carregamento de Membros Separadamente**

```javascript
for (const project of data) {
  const { data: members } = await supabase
    .from('project_members')
    .select(`
      *,
      profiles (
        id,
        name,
        email,
        role,
        status
      )
    `)
    .eq('project', project.id.toString());
  
  project.members = members || [];
}
```

**Etapa 5: Transformação de Dados**

```javascript
const transformedProjects = data.map(project => ({
  id: project.id,                              // number
  name: project.name || 'Projeto sem nome',    // string
  client: project.client || 'Cliente não informado',  // string
  status: project.status || 'Planejamento',    // string
  progress: 0,                                 // number (não existe no schema)
  contractValue: project.contract_value || 'R$ 0,00',  // string
  location: project.location || '',            // string
  phase: 'Contratual',                         // string (padrão)
  startDate: '',                               // string (não existe no schema)
  endDate: '',                                 // string (não existe no schema)
  description: project.description || '',      // string
  createdBy: project.created_by,               // UUID
  team: Array.isArray(project.team) ? project.team : [],  // array
  
  // Membros transformados
  members: Array.isArray(project.members) 
    ? project.members.map(member => ({
        id: member.user_id,                    // UUID
        name: member.name || member.email?.split('@')[0] || 'Usuário',  // string
        email: member.email,                   // string
        role: member.profile_role || member.role || 'member',  // string
        status: member.status || 'Ativo',      // string
        addedAt: member.added_at,              // timestamp
        addedBy: member.added_by               // UUID
      })) 
    : [],
  
  // Condutas transformadas
  conducts: Array.isArray(project.conducts) 
    ? project.conducts.map(conduct => ({
        id: conduct.id,                        // number
        content: conduct.content,              // string
        urgency: conduct.urgency || 'Normal',  // string
        order: conduct.display_order || 0,     // number
        createdAt: conduct.created_at,         // timestamp
        createdBy: conduct.created_by          // UUID
      })) 
    : [],
  
  // Atividades transformadas
  activities: (project.project_activities || []).map(act => ({
    id: act.id,                                // number
    seq: act.custom_id || act.id,              // string ou number
    title: act.name,                           // string
    assignedTo: act.responsible,               // string
    status: act.status,                        // string
    startDate: act.start_date,                 // string (YYYY-MM-DD)
    endDate: act.end_date,                     // string (YYYY-MM-DD)
    description: '',                           // string (não existe)
    createdBy: project.created_by,             // UUID
    createdAt: act.created_at,                 // timestamp
  })),
  
  // Arquivos transformados
  files: (project.project_files || []).map(file => ({
    id: file.id,                               // number
    name: file.name,                           // string
    size: file.file_size,                      // number (bytes)
    type: file.mime_type,                      // string
    ext: file.name ? file.name.split('.').pop() : '',  // string
    source: 'supabase',                        // string
    url: file.file_path,                       // string (URL ou path)
    uploadedBy: file.uploaded_by,              // UUID
    author: file.uploaded_by,                  // UUID
    uploadedAt: file.created_at,               // timestamp
  })),
  
  // Indicadores transformados
  indicators: (project.project_indicators || []).map(ind => ({
    id: ind.id,                                // number
    title: ind.name,                           // string
    type: ind.type || 'bar',                   // string
    labels: [],                                // array (não armazenado)
    datasets: [],                              // array (não armazenado)
    notes: ind.value || '',                    // string
    createdBy: project.created_by,             // UUID
    createdAt: ind.created_at,                 // timestamp
  })),
  
  // Panorama (não armazenado no Supabase)
  panorama: {
    tecnica: { status: 'green', items: [] },
    fisica: { status: 'green', items: [] },
    economica: { status: 'green', items: [] },
  },
  
  // Configuração de overview (não armazenado no Supabase)
  overviewConfig: { widgets: [], layouts: {} },
}));
```

---

## 👥 Gestão de Membros do Projeto

### 3.1 Adicionar Membro ao Projeto

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 687-718)

**Etapa 1: Validação e Preparação**

```javascript
const addProjectMember = async (projectId, userId, role = 'member') => {
  // projectId: number (ID do projeto)
  // userId: string (UUID do usuário)
  // role: string ('admin' | 'manager' | 'member')
  
  console.log('👥 Adicionando membro ao projeto:', { projectId, userId, role });
```

**Etapa 2: Inserção no Supabase**

```javascript
const { data, error } = await supabase
  .from('project_members')
  .insert({
    project: projectId.toString(),     // TEXT (convertido para string)
    user_id: userId,                   // UUID
    role: role,                        // TEXT
    added_by: user?.id,                // UUID (quem adicionou)
    added_at: new Date().toISOString() // TIMESTAMP
  })
  .select('*');
```

**Query SQL Executada:**

```sql
INSERT INTO project_members (
  project,
  user_id,
  role,
  added_by,
  added_at
)
VALUES (
  '123',                    -- TEXT (ID do projeto como string)
  'uuid-do-usuario',        -- UUID
  'member',                 -- TEXT
  'uuid-do-admin',          -- UUID
  '2024-01-15T10:30:00Z'    -- TIMESTAMP
)
RETURNING *;
```

**Dados Retornados:**

```typescript
{
  id: number,              // Serial (auto-incremento)
  project: string,         // TEXT (ID do projeto)
  user_id: string,         // UUID
  role: string,            // TEXT
  added_by: string,        // UUID
  added_at: string         // ISO 8601 timestamp
}
```

**Etapa 3: Atualização da UI**

```javascript
// Recarregar projetos para atualizar a UI
loadProjects();

return { success: true, member: data[0] };
```

### 3.2 Remover Membro do Projeto

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 720-746)

```javascript
const removeProjectMember = async (projectId, userId) => {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project', projectId.toString())  // TEXT
    .eq('user_id', userId);               // UUID
  
  // Recarregar projetos
  loadProjects();
  
  return { success: true };
};
```

**Query SQL Executada:**

```sql
DELETE FROM project_members 
WHERE project = '123' 
  AND user_id = 'uuid-do-usuario';
```

### 3.3 Listar Membros do Projeto

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 748-778)

```javascript
const getProjectMembers = async (projectId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      profiles (
        id,
        name,
        email,
        role,
        status
      )
    `)
    .eq('project', projectId.toString());
  
  return data || [];
};
```

**Query SQL Executada:**

```sql
SELECT 
  pm.*,
  p.id,
  p.name,
  p.email,
  p.role,
  p.status
FROM project_members pm
LEFT JOIN profiles p ON pm.user_id = p.id
WHERE pm.project = '123';
```

**Dados Retornados:**

```typescript
Array<{
  id: number,
  project: string,
  user_id: string,
  role: string,
  added_by: string,
  added_at: string,
  profiles: {
    id: string,
    name: string,
    email: string,
    role: string,
    status: string
  }
}>
```

---

## 📋 Gestão de Atividades

### 4.1 Adicionar Atividade ao Projeto

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 475-496)

**Etapa 1: Preparação dos Dados**

```javascript
const addProjectActivity = (projectId, payload) => {
  // projectId: number
  // payload: {
  //   customId?: string,
  //   title: string,
  //   assignedTo: string,
  //   status: string,
  //   startDate: string,
  //   endDate: string,
  //   description?: string
  // }
  
  const prevList = Array.isArray(project.activities) ? project.activities : [];
  const maxSeq = prevList.reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0);
  
  const created = {
    id: Date.now() + Math.random(),          // number (único)
    seq: maxSeq + 1,                         // number (sequencial)
    title: payload.title,                    // string
    assignedTo: payload.assignedTo,          // string
    status: payload.status || 'A Fazer',     // string
    startDate: payload.startDate,            // string (YYYY-MM-DD)
    endDate: payload.endDate,                // string (YYYY-MM-DD)
    createdAt: new Date().toISOString(),     // string (ISO 8601)
    createdBy: {                             // object
      id: user?.id ?? null,                  // UUID ou number
      name: user?.name ?? 'Usuário',         // string
      email: user?.email ?? ''               // string
    },
    description: payload.description || '',  // string
  };
  
  return created;
};
```

**Etapa 2: Salvamento no Supabase**

**NOTA:** Atualmente, as atividades são salvas apenas no localStorage. Para salvar no Supabase, seria necessário:

```javascript
// Exemplo de salvamento no Supabase (não implementado atualmente)
const { data, error } = await supabase
  .from('project_activities')
  .insert({
    project_id: projectId,               // INTEGER (FK)
    custom_id: created.seq.toString(),   // TEXT
    name: created.title,                 // TEXT
    responsible: created.assignedTo,     // TEXT
    start_date: created.startDate,       // DATE
    end_date: created.endDate,           // DATE
    status: created.status,              // TEXT
    description: created.description,    // TEXT
    created_by: user.id,                 // UUID
    created_at: created.createdAt        // TIMESTAMP
  })
  .select()
  .single();
```

**Query SQL que seria executada:**

```sql
INSERT INTO project_activities (
  project_id,
  custom_id,
  name,
  responsible,
  start_date,
  end_date,
  status,
  description,
  created_by,
  created_at,
  updated_at
)
VALUES (
  123,                      -- INTEGER
  '01',                     -- TEXT
  'Análise Contratual',     -- TEXT
  'João Silva',             -- TEXT
  '2024-01-15',             -- DATE
  '2024-02-15',             -- DATE
  'A Fazer',                -- TEXT
  'Descrição da atividade', -- TEXT
  'uuid-do-usuario',        -- UUID
  NOW(),                    -- TIMESTAMP
  NOW()                     -- TIMESTAMP
)
RETURNING *;
```

### 4.2 Atualizar Atividade

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 498-504)

```javascript
const updateProjectActivity = (projectId, activityId, patch) => {
  // projectId: number
  // activityId: number
  // patch: Partial<Activity>
  
  setProjects(prev => prev.map(p => {
    if (p.id !== Number(projectId)) return p;
    const prevList = Array.isArray(p.activities) ? p.activities : [];
    return { 
      ...p, 
      activities: prevList.map(a => 
        a.id === activityId ? { ...a, ...patch } : a
      ) 
    };
  }));
};
```

**Campos Atualizáveis:**
- `title` (string): Título da atividade
- `assignedTo` (string): Responsável
- `status` (string): Status ('A Fazer', 'Em Progresso', 'Concluído')
- `startDate` (string): Data de início
- `endDate` (string): Data de término
- `description` (string): Descrição

### 4.3 Deletar Atividade

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 506-512)

```javascript
const deleteProjectActivity = (projectId, activityId) => {
  setProjects(prev => prev.map(p => {
    if (p.id !== Number(projectId)) return p;
    const prevList = Array.isArray(p.activities) ? p.activities : [];
    return { ...p, activities: prevList.filter(a => a.id !== activityId) };
  }));
};
```

### 4.4 Duplicar Atividade

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 515-540)

```javascript
const duplicateProjectActivity = (projectId, activityId) => {
  const list = Array.isArray(project.activities) ? project.activities : [];
  const idx = list.findIndex(a => a.id === activityId);
  if (idx === -1) return;
  
  const src = list[idx];
  const maxSeq = list.reduce((m, x) => Math.max(m, Number(x.seq) || 0), 0);
  
  const created = {
    ...src,                                  // Copiar todos os campos
    id: Date.now() + Math.random(),          // Novo ID único
    seq: maxSeq + 1,                         // Próximo número sequencial
    title: src.title ? `${src.title} (cópia)` : 'Atividade (cópia)',
    createdAt: new Date().toISOString(),
    createdBy: { 
      id: user?.id ?? null, 
      name: user?.name ?? 'Usuário', 
      email: user?.email ?? '' 
    },
  };
  
  // Inserir após a atividade original
  const next = [
    ...list.slice(0, idx + 1),
    created,
    ...list.slice(idx + 1),
  ];
  
  return created;
};
```

---

## 📄 Gestão de Documentos

### 5.1 Upload de Arquivo

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 633-658)

**Etapa 1: Conversão do Arquivo para Data URL**

```javascript
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
```

**Etapa 2: Preparação dos Metadados**

```javascript
const addProjectFile = async (projectId, file, source = 'exxata', author) => {
  // projectId: number
  // file: File (objeto do navegador)
  // source: 'client' | 'exxata'
  // author: { id, name, email }
  
  const dataUrl = await fileToDataUrl(file);
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const uploadedAt = new Date().toISOString();
  const uploader = author || { 
    id: user?.id ?? null, 
    name: user?.name ?? 'Usuário', 
    email: user?.email ?? '' 
  };
  
  const fileEntry = {
    id: Date.now() + Math.random(),    // number (único)
    name: file.name,                   // string
    size: file.size,                   // number (bytes)
    type: file.type,                   // string (MIME type)
    ext,                               // string (extensão)
    source,                            // string ('client' | 'exxata')
    url: dataUrl,                      // string (Data URL base64)
    uploadedAt,                        // string (ISO 8601)
    uploadedBy: uploader,              // object
    author: uploader,                  // object
  };
  
  return fileEntry;
};
```

**Dados do Arquivo:**

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | number | ID único | 1705320000123.456 |
| `name` | string | Nome do arquivo | "contrato_vale.pdf" |
| `size` | number | Tamanho em bytes | 2048576 |
| `type` | string | MIME type | "application/pdf" |
| `ext` | string | Extensão | "pdf" |
| `source` | string | Origem | "exxata" ou "client" |
| `url` | string | Data URL | "data:application/pdf;base64,..." |
| `uploadedAt` | string | Data de upload | "2024-01-15T10:30:00.000Z" |
| `uploadedBy` | object | Quem fez upload | { id, name, email } |

**Etapa 3: Salvamento no Supabase**

**NOTA:** Atualmente, os arquivos são salvos como Data URLs no localStorage. Para salvar no Supabase Storage:

```javascript
// Exemplo de upload para Supabase Storage (não implementado atualmente)
const uploadToSupabaseStorage = async (file, projectId) => {
  // 1. Upload do arquivo para o Storage
  const filePath = `projects/${projectId}/${Date.now()}_${file.name}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  // 2. Obter URL pública
  const { data: urlData } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath);
  
  // 3. Salvar metadados no banco
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,           // INTEGER (FK)
      name: file.name,                 // TEXT
      file_path: urlData.publicUrl,    // TEXT (URL pública)
      file_size: file.size,            // INTEGER
      mime_type: file.type,            // TEXT
      uploaded_by: user.id,            // UUID
      created_at: new Date().toISOString()  // TIMESTAMP
    })
    .select()
    .single();
  
  return data;
};
```

**Query SQL que seria executada:**

```sql
INSERT INTO project_files (
  project_id,
  name,
  file_path,
  file_size,
  mime_type,
  uploaded_by,
  created_at
)
VALUES (
  123,                                  -- INTEGER
  'contrato_vale.pdf',                  -- TEXT
  'https://supabase.co/storage/...',    -- TEXT
  2048576,                              -- INTEGER
  'application/pdf',                    -- TEXT
  'uuid-do-usuario',                    -- UUID
  NOW()                                 -- TIMESTAMP
)
RETURNING *;
```

### 5.2 Deletar Arquivo

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 660-666)

```javascript
const deleteProjectFile = (projectId, fileId) => {
  setProjects(prev => prev.map(p => {
    if (p.id !== Number(projectId)) return p;
    const prevFiles = Array.isArray(p.files) ? p.files : [];
    return { ...p, files: prevFiles.filter(f => f.id !== fileId) };
  }));
};
```

**Para deletar do Supabase Storage:**

```javascript
// Exemplo (não implementado)
const deleteFromSupabaseStorage = async (fileId, filePath) => {
  // 1. Deletar arquivo do Storage
  const { error: storageError } = await supabase.storage
    .from('project-files')
    .remove([filePath]);
  
  if (storageError) throw storageError;
  
  // 2. Deletar registro do banco
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', fileId);
  
  return { success: true };
};
```

### 5.3 Listar Arquivos

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 668-671)

```javascript
const getProjectFiles = (projectId) => {
  const p = getProjectById(projectId);
  return Array.isArray(p?.files) ? p.files : [];
};
```

**Filtros Disponíveis:**
- Por fonte: `source === 'client'` ou `source === 'exxata'`
- Por extensão: `ext === 'pdf'`, `ext === 'xlsx'`, etc.
- Por busca: nome do arquivo contém termo

---

## 📊 Gestão de Indicadores

### 6.1 Adicionar Indicador

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 543-560)

**Estrutura do Indicador:**

```javascript
const addProjectIndicator = (projectId, payload) => {
  const indicator = {
    id: Date.now() + Math.random(),          // number (único)
    title: payload.title || 'Indicador',     // string
    type: payload.type || 'bar',             // string ('bar' | 'line' | 'pie')
    labels: Array.isArray(payload.labels) 
      ? payload.labels : [],                 // array de strings
    datasets: Array.isArray(payload.datasets) 
      ? payload.datasets : [],               // array de objetos
    notes: payload.notes || '',              // string
    createdAt: new Date().toISOString(),     // string (ISO 8601)
    createdBy: {                             // object
      id: user?.id ?? null,
      name: user?.name ?? 'Usuário',
      email: user?.email ?? ''
    },
  };
  
  return indicator;
};
```

**Estrutura de Dataset:**

```typescript
{
  name: string,        // Nome da série: "Vendas 2024"
  color: string,       // Cor em hex: "#d51d07"
  values: number[]     // Valores: [10, 20, 15, 30]
}
```

**Exemplo de Indicador Completo:**

```javascript
{
  id: 1705320000123.456,
  title: "Progresso Mensal",
  type: "bar",
  labels: ["Jan", "Fev", "Mar", "Abr"],
  datasets: [
    {
      name: "Planejado",
      color: "#3b82f6",
      values: [100, 200, 300, 400]
    },
    {
      name: "Realizado",
      color: "#d51d07",
      values: [80, 180, 280, 350]
    }
  ],
  notes: "Análise do progresso mensal do projeto",
  createdAt: "2024-01-15T10:30:00.000Z",
  createdBy: {
    id: "uuid-do-usuario",
    name: "João Silva",
    email: "joao@exxata.com"
  }
}
```

**Salvamento no Supabase:**

**NOTA:** Atualmente, os indicadores são salvos apenas no localStorage. Para salvar no Supabase:

```javascript
// Exemplo (não implementado)
const { data, error } = await supabase
  .from('project_indicators')
  .insert({
    project_id: projectId,               // INTEGER (FK)
    name: indicator.title,               // TEXT
    type: indicator.type,                // TEXT
    value: JSON.stringify({              // JSONB
      labels: indicator.labels,
      datasets: indicator.datasets,
      notes: indicator.notes
    }),
    created_by: user.id,                 // UUID
    created_at: indicator.createdAt      // TIMESTAMP
  })
  .select()
  .single();
```

**Query SQL:**

```sql
INSERT INTO project_indicators (
  project_id,
  name,
  type,
  value,
  created_by,
  created_at,
  updated_at
)
VALUES (
  123,                          -- INTEGER
  'Progresso Mensal',           -- TEXT
  'bar',                        -- TEXT
  '{"labels": [...], "datasets": [...], "notes": "..."}'::jsonb,  -- JSONB
  'uuid-do-usuario',            -- UUID
  NOW(),                        -- TIMESTAMP
  NOW()                         -- TIMESTAMP
)
RETURNING *;
```

### 6.2 Atualizar Indicador

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 562-568)

```javascript
const updateProjectIndicator = (projectId, indicatorId, patch) => {
  // Campos atualizáveis:
  // - title: string
  // - type: string
  // - labels: string[]
  // - datasets: Dataset[]
  // - notes: string
  
  setProjects(prev => prev.map(p => {
    if (p.id !== Number(projectId)) return p;
    const prevList = Array.isArray(p.indicators) ? p.indicators : [];
    return { 
      ...p, 
      indicators: prevList.map(i => 
        i.id === indicatorId ? { ...i, ...patch } : i
      ) 
    };
  }));
};
```

### 6.3 Deletar Indicador

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 570-576)

```javascript
const deleteProjectIndicator = (projectId, indicatorId) => {
  setProjects(prev => prev.map(p => {
    if (p.id !== Number(projectId)) return p;
    const prevList = Array.isArray(p.indicators) ? p.indicators : [];
    return { ...p, indicators: prevList.filter(i => i.id !== indicatorId) };
  }));
};
```

### 6.4 Duplicar Indicador

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 579-605)

```javascript
const duplicateProjectIndicator = (projectId, indicatorId) => {
  const prevList = Array.isArray(project.indicators) ? project.indicators : [];
  const idx = prevList.findIndex(i => i.id === indicatorId);
  if (idx === -1) return;
  
  const src = prevList[idx];
  const copy = {
    ...src,
    id: Date.now() + Math.random(),
    title: src.title ? `${src.title} (cópia)` : 'Indicador (cópia)',
    createdAt: new Date().toISOString(),
    createdBy: { 
      id: user?.id ?? null, 
      name: user?.name ?? 'Usuário', 
      email: user?.email ?? '' 
    },
    labels: Array.isArray(src.labels) ? [...src.labels] : [],
    datasets: Array.isArray(src.datasets) 
      ? src.datasets.map(ds => ({ 
          ...ds, 
          values: Array.isArray(ds.values) ? [...ds.values] : [] 
        })) 
      : [],
  };
  
  return copy;
};
```

### 6.5 Reordenar Indicadores

#### Arquivo: `src/contexts/ProjectsContext.jsx` (linhas 608-622)

```javascript
const reorderProjectIndicators = (projectId, fromIndex, toIndex) => {
  const list = Array.isArray(project.indicators) ? [...project.indicators] : [];
  const len = list.length;
  if (len <= 1) return;
  
  const f = Math.max(0, Math.min(len - 1, Number(fromIndex)));
  const t = Math.max(0, Math.min(len - 1, Number(toIndex)));
  if (Number.isNaN(f) || Number.isNaN(t) || f === t) return;
  
  const [moved] = list.splice(f, 1);
  const insertIndex = f < t ? t - 1 : t;
  list.splice(insertIndex, 0, moved);
  
  updateProject(project.id, { indicators: list });
};
```

### 6.6 Importação de Dados (Excel/CSV)

#### Arquivo: `src/utils/excelImporter.js`

**Processo de Importação:**

1. **Leitura do Arquivo:**
   - Suporta `.xlsx`, `.xls`, `.csv`
   - Usa biblioteca `xlsx` (SheetJS)

2. **Transformação dos Dados:**
   - Primeira linha como cabeçalho (opcional)
   - Colunas numéricas identificadas automaticamente
   - Para gráficos de pizza: seleção de coluna específica

3. **Aplicação ao Indicador:**
   - Labels extraídos da primeira coluna
   - Datasets criados das colunas numéricas
   - Cores atribuídas automaticamente

**Exemplo de Transformação:**

```
Planilha Excel:
| Mês | Planejado | Realizado |
|-----|-----------|-----------|
| Jan | 100       | 80        |
| Fev | 200       | 180       |
| Mar | 300       | 280       |

Resultado:
{
  labels: ["Jan", "Fev", "Mar"],
  datasets: [
    {
      name: "Planejado",
      color: "#3b82f6",
      values: [100, 200, 300]
    },
    {
      name: "Realizado",
      color: "#d51d07",
      values: [80, 180, 280]
    }
  ]
}
```

---

## 📝 Gestão de Condutas

### 7.1 Estrutura de Conduta

**Arquivo:** `src/pages/ProjectDetails.jsx`

```javascript
{
  id: number,              // ID único
  text: string,            // Conteúdo da conduta
  urgency: string,         // 'Imediato' | 'Moderado' | 'Planejado'
  priority?: string,       // 'Alta' | 'Média' | 'Baixa' (legado)
  order?: number,          // Ordem de exibição
  createdAt?: string,      // ISO 8601 timestamp
  createdBy?: string       // UUID do criador
}
```

### 7.2 Adicionar Conduta

```javascript
const addConduct = () => {
  const list = Array.isArray(project.conducts) ? project.conducts : [];
  const newItem = { 
    id: Date.now() + Math.random(), 
    text: '', 
    urgency: 'Planejado' 
  };
  updateProject(project.id, { conducts: [...list, newItem] });
};
```

### 7.3 Atualizar Conduta

```javascript
const updateConduct = (conductId, patch) => {
  // patch pode conter:
  // - text: string
  // - urgency: string
  // - priority: string
  
  const list = Array.isArray(project.conducts) 
    ? project.conducts.map(c => c.id === conductId ? { ...c, ...patch } : c) 
    : [];
  updateProject(project.id, { conducts: list });
};
```

### 7.4 Deletar Conduta

```javascript
const deleteConduct = (conductId) => {
  const list = Array.isArray(project.conducts) 
    ? project.conducts.filter(c => c.id !== conductId) 
    : [];
  updateProject(project.id, { conducts: list });
};
```

### 7.5 Duplicar Conduta

```javascript
const duplicateConduct = (conductId) => {
  const list = Array.isArray(project.conducts) ? project.conducts : [];
  const idx = list.findIndex(c => c.id === conductId);
  if (idx === -1) return;
  
  const src = list[idx];
  const copy = { 
    ...src, 
    id: Date.now() + Math.random(), 
    text: src.text ? `${src.text} (cópia)` : 'Conduta (cópia)' 
  };
  
  const next = [...list.slice(0, idx + 1), copy, ...list.slice(idx + 1)];
  updateProject(project.id, { conducts: next });
};
```

### 7.6 Reordenar Condutas (Drag & Drop)

```javascript
const onDropConduct = (e, targetId) => {
  e.preventDefault();
  const sourceId = draggingConductId;
  
  const list = Array.isArray(project.conducts) ? [...project.conducts] : [];
  const fromIndex = list.findIndex(c => c.id === sourceId);
  const toIndex = list.findIndex(c => c.id === targetId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  const [moved] = list.splice(fromIndex, 1);
  const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  list.splice(insertIndex, 0, moved);
  
  updateProject(project.id, { conducts: list });
};
```

### 7.7 Salvamento no Supabase

**NOTA:** Atualmente, as condutas são salvas apenas no localStorage. Para salvar no Supabase, seria necessário criar uma tabela:

```sql
CREATE TABLE project_conducts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  urgency TEXT DEFAULT 'Planejado',
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Inserção:**

```javascript
const { data, error } = await supabase
  .from('project_conducts')
  .insert({
    project_id: projectId,
    content: conduct.text,
    urgency: conduct.urgency,
    display_order: conduct.order || 0,
    created_by: user.id,
    created_at: new Date().toISOString()
  })
  .select()
  .single();
```

---

## 🗄️ Schema do Supabase

### Tabelas Principais

#### 1. `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  status TEXT NOT NULL DEFAULT 'Ativo',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### 2. `projects`

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  description TEXT,
  location TEXT,
  contract_value TEXT,
  status TEXT DEFAULT 'Planejamento',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver projetos que criaram"
  ON projects FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Usuários podem ver projetos onde são membros"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project = id::text AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem ver todos os projetos"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### 3. `project_members`

```sql
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project TEXT NOT NULL,  -- Referência ao ID do projeto (como TEXT)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project, user_id)
);

-- Índices
CREATE INDEX idx_project_members_project ON project_members(project);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver outros membros do mesmo projeto"
  ON project_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project = project AND pm.user_id = auth.uid()
    )
  );
```

#### 4. `project_activities` (ou `project_activities_old`)

```sql
CREATE TABLE project_activities (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  custom_id TEXT,
  name TEXT NOT NULL,
  responsible TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'A Fazer',
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_activities_project ON project_activities(project_id);
CREATE INDEX idx_activities_status ON project_activities(status);
CREATE INDEX idx_activities_dates ON project_activities(start_date, end_date);

-- RLS
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver atividades de seus projetos"
  ON project_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project = project_id::text AND user_id = auth.uid()
    )
  );
```

#### 5. `project_files`

```sql
CREATE TABLE project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- URL do Supabase Storage
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_files_project ON project_files(project_id);
CREATE INDEX idx_files_uploaded_by ON project_files(uploaded_by);

-- RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver arquivos de seus projetos"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project = project_id::text AND user_id = auth.uid()
    )
  );
```

#### 6. `project_indicators`

```sql
CREATE TABLE project_indicators (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'bar',  -- 'bar' | 'line' | 'pie'
  value JSONB,  -- { labels: [], datasets: [], notes: "" }
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_indicators_project ON project_indicators(project_id);
CREATE INDEX idx_indicators_type ON project_indicators(type);

-- RLS
ALTER TABLE project_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver indicadores de seus projetos"
  ON project_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project = project_id::text AND user_id = auth.uid()
    )
  );
```

### Views

#### `v_projects_complete`

```sql
CREATE OR REPLACE VIEW v_projects_complete AS
SELECT 
  p.*,
  -- Membros do projeto
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'user_id', pm.user_id,
        'name', prof.name,
        'email', prof.email,
        'role', pm.role,
        'profile_role', prof.role,
        'status', prof.status,
        'added_at', pm.added_at,
        'added_by', pm.added_by
      )
    ) FILTER (WHERE pm.id IS NOT NULL),
    '[]'::json
  ) AS members,
  
  -- Condutas (se existir tabela)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pc.id,
        'content', pc.content,
        'urgency', pc.urgency,
        'display_order', pc.display_order,
        'created_at', pc.created_at,
        'created_by', pc.created_by
      )
    ) FILTER (WHERE pc.id IS NOT NULL),
    '[]'::json
  ) AS conducts

FROM projects p
LEFT JOIN project_members pm ON pm.project = p.id::text
LEFT JOIN profiles prof ON prof.id = pm.user_id
LEFT JOIN project_conducts pc ON pc.project_id = p.id
GROUP BY p.id;
```

### Triggers

#### Trigger para criar perfil automaticamente

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'cliente',
    'Ativo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### Trigger para atualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repetir para outras tabelas...
```

---

## 🔄 Fluxos de Dados

### Fluxo 1: Registro e Login de Usuário

```
┌─────────────┐
│   Usuário   │
│  preenche   │
│  formulário │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (LoginForm.jsx)           │
│  - Valida dados                     │
│  - Chama AuthContext.login()        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AuthContext.jsx                    │
│  - supabase.auth.signInWithPassword()│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│  - Valida credenciais               │
│  - Retorna session + user           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AuthContext.getUserProfile()       │
│  - Busca dados em profiles          │
│  - Monta objeto userData            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Global                      │
│  - setUser(userData)                │
│  - localStorage (fallback)          │
└─────────────────────────────────────┘
```

### Fluxo 2: Criação de Projeto

```
┌─────────────┐
│   Usuário   │
│  preenche   │
│    modal    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  NewProjectModal.jsx                │
│  - Coleta dados do formulário       │
│  - Valida campos obrigatórios       │
│  - Chama onCreate(payload)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectsContext.createProject()    │
│  - Cria objeto newProject           │
│  - ID temporário (Date.now())       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  saveProjectToSupabase()            │
│  - INSERT em projects               │
│  - Retorna projeto com ID real      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - Valida dados                     │
│  - Gera ID (SERIAL)                 │
│  - Executa triggers                 │
│  - Retorna projeto salvo            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Global                      │
│  - Substitui ID temporário          │
│  - Adiciona ao array de projetos    │
│  - Salva em localStorage            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  UI atualiza│
│  com novo   │
│  projeto    │
└─────────────┘
```

### Fluxo 3: Adicionar Membro ao Projeto

```
┌─────────────┐
│   Admin     │
│  seleciona  │
│   usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectDetails.jsx                 │
│  - handleConfirmAddMember()         │
│  - Chama projectService             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectsContext.addProjectMember() │
│  - Valida projectId e userId        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase                           │
│  - INSERT em project_members        │
│  - project: "123" (TEXT)            │
│  - user_id: UUID                    │
│  - role: "member"                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Validação RLS                      │
│  - Verifica permissões              │
│  - Valida UNIQUE constraint         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Retorno                            │
│  - Dados do membro inserido         │
│  - JOIN com profiles                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Local                       │
│  - Atualiza projectMembers          │
│  - Recarrega projetos               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  UI atualiza│
│  lista de   │
│  membros    │
└─────────────┘
```

### Fluxo 4: Upload de Arquivo

```
┌─────────────┐
│   Usuário   │
│  seleciona  │
│   arquivo   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectDetails.jsx                 │
│  - onBrowseInputChange()            │
│  - Captura File object              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectsContext.addProjectFile()   │
│  - fileToDataUrl(file)              │
│  - Converte para base64             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Criar Metadados                    │
│  - id, name, size, type, ext        │
│  - source, url (Data URL)           │
│  - uploadedBy, uploadedAt           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Global                      │
│  - Adiciona ao array de files       │
│  - Salva em localStorage            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  UI atualiza│
│  lista de   │
│  arquivos   │
└─────────────┘

NOTA: Para salvar no Supabase Storage:

┌─────────────────────────────────────┐
│  Supabase Storage                   │
│  - Upload do arquivo                │
│  - Gera URL pública                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - INSERT em project_files          │
│  - Salva metadados + URL            │
└─────────────────────────────────────┘
```

### Fluxo 5: Criação de Atividade

```
┌─────────────┐
│   Usuário   │
│  preenche   │
│  formulário │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectDetails.jsx                 │
│  - handleCreateActivity()           │
│  - Valida datas                     │
│  - Gera customId sequencial         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectsContext.addProjectActivity()│
│  - Cria objeto activity             │
│  - Calcula próximo seq              │
│  - Adiciona createdBy               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Global                      │
│  - Adiciona ao array de activities  │
│  - Salva em localStorage            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  UI atualiza│
│  Gantt e    │
│  tabela     │
└─────────────┘

NOTA: Para salvar no Supabase:

┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - INSERT em project_activities     │
│  - Salva todos os campos            │
└─────────────────────────────────────┘
```

### Fluxo 6: Criação de Indicador

```
┌─────────────┐
│   Usuário   │
│  preenche   │
│  formulário │
│  ou importa │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectDetails.jsx                 │
│  - saveIndicatorForm()              │
│  - Valida título e labels           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  ProjectsContext.addProjectIndicator()│
│  - Cria objeto indicator            │
│  - Adiciona metadados               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Estado Global                      │
│  - Adiciona ao array de indicators  │
│  - Salva em localStorage            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  UI renderiza│
│  gráfico    │
│  (Chart.js) │
└─────────────┘

NOTA: Para salvar no Supabase:

┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - INSERT em project_indicators     │
│  - value: JSONB com labels/datasets │
└─────────────────────────────────────┘
```

---

## 📊 Resumo de Tipos de Dados

### Tipos Enviados ao Supabase

| Entidade | Campo | Tipo SQL | Tipo TypeScript | Exemplo |
|----------|-------|----------|-----------------|---------|
| **User** | id | UUID | string | "550e8400-e29b-41d4-a716-446655440000" |
| | email | TEXT | string | "usuario@exemplo.com" |
| | password | TEXT | string | "senha_hash" |
| | name | TEXT | string | "João Silva" |
| | role | TEXT | string | "admin" |
| | status | TEXT | string | "Ativo" |
| **Project** | id | SERIAL | number | 123 |
| | name | TEXT | string | "Projeto Ferrovia" |
| | client | TEXT | string | "VALE S.A." |
| | description | TEXT | string | "Análise contratual..." |
| | location | TEXT | string | "Parauapebas, PA" |
| | contract_value | TEXT | string | "R$ 15.000.000,00" |
| | status | TEXT | string | "Em Andamento" |
| | created_by | UUID | string | "uuid-do-usuario" |
| | team | JSONB | array | [{"id": 1, "name": "João"}] |
| **Member** | id | SERIAL | number | 456 |
| | project | TEXT | string | "123" |
| | user_id | UUID | string | "uuid-do-usuario" |
| | role | TEXT | string | "member" |
| | added_by | UUID | string | "uuid-do-admin" |
| | added_at | TIMESTAMP | string | "2024-01-15T10:30:00Z" |
| **Activity** | id | SERIAL | number | 789 |
| | project_id | INTEGER | number | 123 |
| | custom_id | TEXT | string | "01" |
| | name | TEXT | string | "Análise Contratual" |
| | responsible | TEXT | string | "João Silva" |
| | start_date | DATE | string | "2024-01-15" |
| | end_date | DATE | string | "2024-02-15" |
| | status | TEXT | string | "A Fazer" |
| **File** | id | SERIAL | number | 101 |
| | project_id | INTEGER | number | 123 |
| | name | TEXT | string | "contrato.pdf" |
| | file_path | TEXT | string | "https://..." |
| | file_size | INTEGER | number | 2048576 |
| | mime_type | TEXT | string | "application/pdf" |
| | uploaded_by | UUID | string | "uuid-do-usuario" |
| **Indicator** | id | SERIAL | number | 202 |
| | project_id | INTEGER | number | 123 |
| | name | TEXT | string | "Progresso Mensal" |
| | type | TEXT | string | "bar" |
| | value | JSONB | object | {"labels": [...], "datasets": [...]} |

---

## 🔐 Segurança e Permissões

### Row Level Security (RLS)

Todas as tabelas principais têm RLS habilitado:

1. **Usuários só veem seus próprios dados**
2. **Admins veem todos os dados**
3. **Membros de projeto veem dados do projeto**
4. **Políticas específicas por operação (SELECT, INSERT, UPDATE, DELETE)**

### Validações

#### Frontend
- Campos obrigatórios
- Formatos de data
- Tamanhos de arquivo
- Tipos MIME permitidos

#### Backend (Supabase)
- Constraints de chave estrangeira
- Unique constraints
- Check constraints
- Triggers de validação

---

## 📝 Notas Importantes

### Sistema Híbrido

O Exxata Connect opera em modo híbrido:

1. **Primário**: Supabase (quando disponível)
2. **Fallback**: localStorage (quando Supabase falha ou não está configurado)

### Dados Não Persistidos no Supabase

Alguns dados são mantidos apenas no localStorage:

- **Condutas** (project.conducts)
- **Panorama** (project.panorama)
- **Configuração de Overview** (project.overviewConfig)
- **Alguns campos de projeto** (progress, phase, startDate, endDate)

### Campos Calculados

Alguns campos são calculados no frontend:

- **progress**: Calculado com base nas atividades
- **seq**: Número sequencial de atividades
- **permissions**: Derivado do role do usuário

### Limitações Atuais

1. **Arquivos**: Salvos como Data URLs no localStorage (não no Supabase Storage)
2. **Atividades**: Não persistidas automaticamente no Supabase
3. **Indicadores**: Não persistidos automaticamente no Supabase
4. **Condutas**: Não têm tabela no Supabase

---

## 🚀 Melhorias Futuras Sugeridas

1. **Implementar upload real para Supabase Storage**
2. **Criar tabela `project_conducts` no Supabase**
3. **Persistir atividades automaticamente no Supabase**
4. **Persistir indicadores automaticamente no Supabase**
5. **Adicionar campos faltantes no schema (progress, phase, dates)**
6. **Implementar sincronização bidirecional completa**
7. **Adicionar webhooks para notificações em tempo real**
8. **Implementar versionamento de documentos**
9. **Adicionar auditoria completa de mudanças**
10. **Implementar backup automático**

---

## 📚 Referências

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **React Context API**: https://react.dev/reference/react/useContext
- **Chart.js**: https://www.chartjs.org/docs/

---

**Documento criado em**: 2024-01-15  
**Versão**: 1.0  
**Autor**: Sistema Cascade AI  
**Projeto**: Exxata Connect
