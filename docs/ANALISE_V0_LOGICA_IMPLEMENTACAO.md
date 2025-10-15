# Análise da Lógica V0 - Exxata Connect Clone

## 📋 Resumo Executivo

Este documento analisa a lógica de criação e gerenciamento de **project_members**, **atividades**, **condutas**, **documentos** e demais informações do repositório V0 (https://github.com/andremarquito/v0-exxata-connect-clone.git) para implementação no sistema Exxata Connect atual.

---

## 🎯 Principais Diferenças Identificadas

### 1. **Schema do Supabase**

#### V0 (Repositório Clone)
```sql
-- Campos JSONB armazenados diretamente na tabela projects
conducts JSONB DEFAULT '[]'::jsonb
panorama JSONB DEFAULT '{}'::jsonb
overview_cards JSONB DEFAULT '[]'::jsonb
exxata_activities JSONB DEFAULT '[]'::jsonb

-- Tabelas relacionadas
project_members (project_id UUID, user_id UUID, role TEXT)
project_activities (project_id UUID, title TEXT, status TEXT, priority TEXT)
project_documents (project_id UUID, name TEXT, url TEXT)
project_indicators (project_id UUID, name TEXT, type TEXT, data JSONB)
```

#### Sistema Atual (03_connect)
```sql
-- Tabelas separadas para cada entidade
project_conducts (project_id UUID, content TEXT, urgency TEXT)
project_members (project TEXT, user_id UUID, role TEXT) -- ⚠️ project é TEXT
activities (project_id UUID, title TEXT, status TEXT)
project_files (project_id UUID, name TEXT, storage_path TEXT)
project_indicators (project_id UUID, title TEXT, type TEXT, datasets JSONB)

-- Campos não existem na tabela projects
exxata_activities, panorama, overview_cards
```

### 2. **Lógica de Criação de Projetos**

#### V0 - Fluxo Completo
```javascript
// 1. Criar projeto
const { data: project } = await supabase
  .from("projects")
  .insert({
    name, client, description, location, contract_value,
    start_date, end_date, sector, phase, status,
    created_by: session.user.id,
    progress: 0
  })
  .select()
  .single()

// 2. Adicionar criador como membro automaticamente
await supabase.from("project_members").insert({
  project_id: project.id,
  user_id: session.user.id,
  role: "owner",
  added_by: session.user.id
})

// 3. Redirecionar para página do projeto
router.push(`/dashboard/projects/${project.id}`)
```

#### Sistema Atual - Implementação Parcial
```javascript
// ✅ Cria projeto
const newProject = await saveProjectToSupabase(project)

// ❌ NÃO adiciona criador como membro automaticamente
// ❌ NÃO usa UUID consistentemente (mistura TEXT e UUID)
```

---

## 🔧 Implementações Necessárias

### 1. **Corrigir Schema do Supabase**

#### Problema Atual
- Coluna `project_members.project` é **TEXT** mas deveria ser **UUID**
- Falta constraint `UNIQUE(project_id, user_id)` em `project_members`
- Campos JSONB (`conducts`, `panorama`) estão em tabelas separadas

#### Solução Recomendada

```sql
-- OPÇÃO 1: Migrar para schema V0 (RECOMENDADO)
-- Adicionar campos JSONB na tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS conducts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS panorama JSONB DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS overview_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS exxata_activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_predictive_text TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS disputed_amount TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_summary TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_progress INTEGER DEFAULT 0;

-- Corrigir project_members para usar UUID
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_fkey;
ALTER TABLE project_members ALTER COLUMN project TYPE UUID USING project::uuid;
ALTER TABLE project_members RENAME COLUMN project TO project_id;
ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_members ADD CONSTRAINT project_members_unique_member 
  UNIQUE(project_id, user_id);

-- OPÇÃO 2: Manter tabelas separadas (menos eficiente)
-- Manter project_conducts, mas corrigir project_members
```

### 2. **Implementar Funções Helper RLS**

O V0 usa funções helper para evitar recursão circular nas políticas RLS:

```sql
-- Função para verificar se usuário é membro do projeto
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.project_members 
    WHERE project_id = project_uuid 
    AND user_id = user_uuid
  );
END;
$$;

-- Função para verificar se usuário é criador
CREATE OR REPLACE FUNCTION public.is_project_creator(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.projects 
    WHERE id = project_uuid 
    AND created_by = user_uuid
  );
END;
$$;

-- Usar nas políticas RLS
CREATE POLICY "Users can view projects they are members of"
  ON public.projects FOR SELECT
  USING (
    projects.created_by = auth.uid() OR
    public.is_project_member(projects.id, auth.uid())
  );
```

### 3. **Atualizar Lógica de Criação de Projetos**

#### Arquivo: `src/services/supabaseService.js`

```javascript
// Atualizar função createProject
async createProject(projectData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Criar projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        location: projectData.location,
        contract_value: projectData.contractValue,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        sector: projectData.sector,
        phase: projectData.phase || 'Planejamento',
        status: projectData.status || 'Planejamento',
        progress: 0,
        created_by: user.id,
        updated_by: user.id,
        // Campos JSONB
        conducts: projectData.conducts || [],
        panorama: projectData.panorama || {
          tecnica: { status: 'green', items: [] },
          fisica: { status: 'green', items: [] },
          economica: { status: 'green', items: [] }
        },
        exxata_activities: projectData.exxataActivities || [],
        overview_cards: projectData.overviewCards || []
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // 2. ✅ ADICIONAR CRIADOR COMO MEMBRO AUTOMATICAMENTE
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        added_by: user.id
      });

    if (memberError) {
      console.warn('Erro ao adicionar criador como membro:', memberError);
      // Não falhar a criação do projeto por isso
    }

    return project;
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
}
```

### 4. **Implementar Modais de Gerenciamento**

#### A. Modal de Adicionar Membro

Criar: `src/components/projects/AddMemberModal.jsx`

```javascript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AddMemberModal({ projectId, onSuccess, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Buscar usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        alert('Usuário não encontrado com este email');
        return;
      }

      // 2. Verificar se já é membro
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', profile.id)
        .single();

      if (existing) {
        alert('Este usuário já é membro do projeto');
        return;
      }

      // 3. Adicionar membro
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: profile.id,
          role: role
        });

      if (insertError) throw insertError;

      alert('Membro adicionado com sucesso!');
      setEmail('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Adicionar Membro</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email do usuário"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="member">Membro</option>
          <option value="manager">Gerente</option>
          <option value="viewer">Visualizador</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
}
```

#### B. Modal de Adicionar Atividade

Criar: `src/components/projects/AddActivityModal.jsx`

```javascript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AddActivityModal({ projectId, members, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('project_activities')
        .insert({
          project_id: projectId,
          title: formData.title,
          description: formData.description || null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          assigned_to: formData.assignedTo || null,
          status: formData.status,
          priority: formData.priority
        });

      if (error) throw error;

      alert('Atividade criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      alert('Erro ao criar atividade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Nova Atividade</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Título *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Descrição"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
        <input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
        <select
          value={formData.assignedTo}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
        >
          <option value="">Selecione responsável</option>
          {members.map(member => (
            <option key={member.user_id} value={member.user_id}>
              {member.profiles?.name}
            </option>
          ))}
        </select>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="pending">Pendente</option>
          <option value="in_progress">Em Progresso</option>
          <option value="completed">Concluída</option>
        </select>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Atividade'}
        </button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
}
```

#### C. Modal de Upload de Documento

Criar: `src/components/projects/UploadDocumentModal.jsx`

```javascript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function UploadDocumentModal({ projectId, onSuccess, onClose }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Registrar no banco de dados
      const { error: dbError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          name: name || file.name,
          type: file.type,
          size: file.size,
          url: filePath,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      alert('Documento enviado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      alert('Erro ao enviar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Upload de Documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome do documento (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        {file && (
          <p>{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
        )}
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
}
```

---

## 📊 Comparação: Condutas (JSONB vs Tabela)

### V0 - Armazenamento JSONB
```javascript
// Vantagens:
// - Menos queries ao banco
// - Carregamento mais rápido
// - Estrutura simples

// Desvantagens:
// - Difícil fazer queries complexas
// - Sem validação de schema
// - Sem foreign keys

const project = {
  conducts: [
    { id: 101, text: 'Revisar cláusula 5.2', urgency: 'Imediato', priority: 'Alta' },
    { id: 102, text: 'Agendar reunião', urgency: 'Planejado', priority: 'Média' }
  ]
}

// Atualizar condutas
await supabase
  .from('projects')
  .update({ conducts: newConductsArray })
  .eq('id', projectId)
```

### Sistema Atual - Tabela Separada
```javascript
// Vantagens:
// - Queries complexas possíveis
// - Validação de schema
// - Foreign keys e constraints
// - Auditoria completa

// Desvantagens:
// - Mais queries necessárias
// - Carregamento mais lento
// - Estrutura mais complexa

// Criar conduta
await supabase
  .from('project_conducts')
  .insert({
    project_id: projectId,
    content: 'Revisar cláusula 5.2',
    urgency: 'Alta',
    display_order: 0
  })

// Listar condutas
const { data } = await supabase
  .from('project_conducts')
  .select('*')
  .eq('project_id', projectId)
  .order('display_order')
```

**Recomendação**: Manter tabela separada para condutas (mais robusto e escalável).

---

## 🔐 Políticas RLS Otimizadas

### Problema: Recursão Circular

O V0 resolve o problema de recursão circular entre `projects` e `project_members` usando funções helper:

```sql
-- ❌ PROBLEMA: Recursão infinita
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    )
  );

CREATE POLICY "Users can view members"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id
      -- Aqui tenta verificar se usuário tem acesso ao projeto
      -- Mas isso chama a política de projects novamente!
    )
  );

-- ✅ SOLUÇÃO: Usar funções SECURITY DEFINER
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  USING (
    projects.created_by = auth.uid() OR
    public.is_project_member(projects.id, auth.uid())
  );
```

---

## 📝 Script SQL Completo para Migração

Criar arquivo: `supabase-migration-v0-logic.sql`

```sql
-- =====================================================
-- MIGRAÇÃO PARA LÓGICA V0
-- =====================================================

-- 1. Adicionar campos JSONB na tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS conducts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS panorama JSONB DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS overview_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS exxata_activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_predictive_text TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT;

-- 2. Migrar dados de project_conducts para projects.conducts
UPDATE projects p
SET conducts = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pc.id,
      'text', pc.content,
      'urgency', pc.urgency,
      'priority', CASE 
        WHEN pc.urgency = 'Crítica' THEN 'Alta'
        WHEN pc.urgency = 'Alta' THEN 'Alta'
        WHEN pc.urgency = 'Normal' THEN 'Média'
        ELSE 'Baixa'
      END,
      'order', pc.display_order
    ) ORDER BY pc.display_order
  ), '[]'::jsonb)
  FROM project_conducts pc
  WHERE pc.project_id = p.id
);

-- 3. Corrigir project_members (TEXT para UUID)
-- ATENÇÃO: Backup antes de executar!
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_fkey;
ALTER TABLE project_members ALTER COLUMN project TYPE UUID USING project::uuid;
ALTER TABLE project_members RENAME COLUMN project TO project_id;
ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_members ADD CONSTRAINT project_members_unique_member 
  UNIQUE(project_id, user_id);

-- 4. Criar funções helper para RLS
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_project_creator(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_uuid AND created_by = user_uuid
  );
END;
$$;

-- 5. Recriar políticas RLS usando funções helper
DROP POLICY IF EXISTS "Users can view projects they have access to" ON projects;
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    projects.created_by = auth.uid() OR
    public.is_project_member(projects.id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view documents of their projects" ON project_documents;
CREATE POLICY "Users can view documents of their projects"
  ON project_documents FOR SELECT
  USING (
    public.is_project_creator(project_documents.project_id, auth.uid()) OR
    public.is_project_member(project_documents.project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view activities of accessible projects" ON activities;
CREATE POLICY "Users can view activities of their projects"
  ON activities FOR SELECT
  USING (
    public.is_project_creator(activities.project_id, auth.uid()) OR
    public.is_project_member(activities.project_id, auth.uid())
  );

-- 6. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
```

---

## ✅ Checklist de Implementação

### Fase 1: Schema e Banco de Dados
- [ ] Executar script de migração SQL
- [ ] Testar funções helper RLS
- [ ] Verificar políticas RLS funcionando
- [ ] Criar backup antes de aplicar mudanças

### Fase 2: Serviços Backend
- [ ] Atualizar `supabaseService.js` - função `createProject`
- [ ] Adicionar lógica de auto-adicionar criador como membro
- [ ] Atualizar função `getProjectById` para carregar membros
- [ ] Implementar funções de gerenciamento de membros

### Fase 3: Componentes UI
- [ ] Criar `AddMemberModal.jsx`
- [ ] Criar `AddActivityModal.jsx`
- [ ] Criar `UploadDocumentModal.jsx`
- [ ] Criar `TeamTab.jsx` para exibir membros
- [ ] Atualizar `ProjectDetails.jsx` para usar novos modais

### Fase 4: Testes
- [ ] Testar criação de projeto com auto-membro
- [ ] Testar adição/remoção de membros
- [ ] Testar criação de atividades
- [ ] Testar upload de documentos
- [ ] Testar permissões RLS

---

## 🎓 Lições Aprendidas do V0

1. **Auto-adicionar criador como membro**: Essencial para evitar problemas de acesso
2. **Funções helper RLS**: Evitam recursão circular e melhoram performance
3. **UNIQUE constraint**: Previne duplicação de membros
4. **JSONB vs Tabelas**: JSONB para dados simples, tabelas para dados complexos
5. **Validação no frontend**: Verificar se usuário já é membro antes de adicionar
6. **Feedback visual**: Toast notifications para todas as ações
7. **Tratamento de erros**: Não falhar criação de projeto se adicionar membro falhar

---

## 📚 Referências

- Repositório V0: https://github.com/andremarquito/v0-exxata-connect-clone.git
- Documentação Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Documentação JSONB: https://www.postgresql.org/docs/current/datatype-json.html
