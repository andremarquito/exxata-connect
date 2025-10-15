# Comparação de Schemas SQL - V0 vs Sistema Atual

## 📊 Visão Geral

Este documento compara o schema SQL do repositório V0 com o schema atual do Exxata Connect, destacando diferenças e recomendações.

---

## 🗄️ Tabela: `profiles`

### ✅ Compatível - Estruturas Similares

| Campo | V0 | Sistema Atual | Status |
|-------|-----|---------------|--------|
| id | UUID (PK) | UUID (PK) | ✅ Igual |
| name | TEXT NOT NULL | TEXT NOT NULL | ✅ Igual |
| email | TEXT NOT NULL | TEXT UNIQUE NOT NULL | ✅ Igual |
| role | TEXT DEFAULT 'cliente' | TEXT DEFAULT 'cliente' | ✅ Igual |
| status | TEXT DEFAULT 'active' | TEXT DEFAULT 'Ativo' | ⚠️ Valores diferentes |
| created_at | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Igual |
| updated_at | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Igual |

**Diferenças:**
- V0 usa `'active'`, sistema atual usa `'Ativo'`
- Sistema atual tem mais campos: `invited_by`, `has_custom_password`, etc.

**Ação:** Nenhuma mudança necessária

---

## 🏗️ Tabela: `projects`

### ⚠️ Diferenças Significativas

#### Campos Comuns

| Campo | V0 | Sistema Atual | Status |
|-------|-----|---------------|--------|
| id | UUID (PK) | UUID (PK) | ✅ Igual |
| name | TEXT NOT NULL | TEXT NOT NULL | ✅ Igual |
| client | TEXT | TEXT | ✅ Igual |
| status | TEXT DEFAULT 'Planejamento' | TEXT DEFAULT 'Em Andamento' | ⚠️ Default diferente |
| progress | INTEGER DEFAULT 0 | INTEGER DEFAULT 0 | ✅ Igual |
| contract_value | TEXT | DECIMAL(15,2) | ⚠️ Tipo diferente |
| location | TEXT | TEXT | ✅ Igual |
| description | TEXT | TEXT | ✅ Igual |
| created_by | UUID (FK) | UUID (FK) | ✅ Igual |
| created_at | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Igual |
| updated_at | TIMESTAMPTZ | TIMESTAMPTZ | ✅ Igual |

#### Campos Exclusivos do V0 (JSONB)

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| **conducts** | JSONB | `'[]'::jsonb` | ❌ NÃO EXISTE no atual |
| **panorama** | JSONB | `'{}'::jsonb` | ❌ NÃO EXISTE no atual |
| **overview_cards** | JSONB | `'[]'::jsonb` | ❌ NÃO EXISTE no atual |
| **exxata_activities** | JSONB | `'[]'::jsonb` | ❌ NÃO EXISTE no atual |
| **ai_predictive_text** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **phase** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **start_date** | DATE | NULL | ❌ NÃO EXISTE no atual |
| **end_date** | DATE | NULL | ❌ NÃO EXISTE no atual |
| **sector** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **hourly_rate** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **disputed_amount** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **contract_summary** | TEXT | NULL | ❌ NÃO EXISTE no atual |
| **billing_progress** | INTEGER | 0 | ❌ NÃO EXISTE no atual |

#### Campos Exclusivos do Sistema Atual

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **overview_config** | JSONB | Configuração de widgets |
| **updated_by** | UUID | Quem atualizou por último |

**Ação Recomendada:** ✅ Adicionar campos do V0 ao sistema atual

---

## 👥 Tabela: `project_members`

### 🔴 DIFERENÇA CRÍTICA

#### V0 (Correto)
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id),
  UNIQUE(project_id, user_id)  -- ✅ Previne duplicação
);
```

#### Sistema Atual (Incorreto)
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT NOT NULL,  -- ❌ DEVERIA SER UUID!
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id)
  -- ❌ FALTA UNIQUE(project_id, user_id)
);
```

**Problemas Identificados:**
1. ❌ Coluna `project` é TEXT mas deveria ser UUID
2. ❌ Falta constraint UNIQUE para prevenir duplicação
3. ❌ Falta ON DELETE CASCADE no FK de project

**Ação Obrigatória:** 🔧 Corrigir estrutura (script de migração já implementa)

---

## 📋 Tabela: `project_activities` (V0) vs `activities` (Atual)

### ⚠️ Nomes e Estruturas Diferentes

#### V0: `project_activities`
```sql
CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  dependencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Sistema Atual: `activities`
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  custom_id TEXT,
  seq INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,  -- ⚠️ Nome do responsável (TEXT)
  assigned_user_id UUID REFERENCES profiles(id),  -- ✅ ID do usuário
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'A Fazer',  -- ⚠️ Valores diferentes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);
```

**Diferenças:**
- V0 tem `priority` (low/medium/high), atual não tem
- V0 tem `progress` (0-100), atual não tem
- V0 tem `dependencies` (JSONB), atual não tem
- Atual tem `custom_id` e `seq`, V0 não tem
- Valores de status são diferentes

**Ação:** ⚠️ Decidir qual estrutura manter (recomendo V0 + campos do atual)

---

## 📄 Tabela: `project_documents`

### ✅ Estruturas Similares

#### V0
```sql
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

#### Sistema Atual: `project_files`
```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'project-files',
  source TEXT DEFAULT 'exxata',
  category TEXT DEFAULT 'document',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Diferenças:**
- Sistema atual é mais completo (storage_path, bucket, source, category)
- V0 usa `url`, atual usa `storage_path`

**Ação:** ✅ Manter estrutura atual (mais robusta)

---

## 📊 Tabela: `project_indicators`

### ⚠️ Estruturas Diferentes

#### V0
```sql
CREATE TABLE project_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Sistema Atual
```sql
CREATE TABLE project_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,  -- ⚠️ V0 usa 'name'
  type TEXT NOT NULL CHECK (type IN ('bar', 'bar-horizontal', 'line', 'pie')),
  datasets JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ⚠️ V0 usa 'data'
  labels JSONB DEFAULT '[]'::jsonb,
  colors TEXT[] DEFAULT ARRAY[...],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);
```

**Diferenças:**
- V0 usa `name`, atual usa `title`
- V0 usa `data`, atual usa `datasets` + `labels`
- Atual tem `colors` e `created_by`

**Ação:** ✅ Manter estrutura atual (mais completa)

---

## 🎯 Tabela: `project_conducts`

### 🔴 EXISTE APENAS NO SISTEMA ATUAL

#### Sistema Atual
```sql
CREATE TABLE project_conducts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);
```

#### V0
```sql
-- ❌ NÃO EXISTE TABELA
-- Condutas são armazenadas como JSONB na tabela projects:
projects.conducts JSONB DEFAULT '[]'::jsonb

-- Estrutura do JSONB:
[
  {
    "id": 101,
    "text": "Revisar cláusula 5.2",
    "urgency": "Imediato",
    "priority": "Alta"
  }
]
```

**Comparação:**

| Aspecto | Tabela Separada | JSONB |
|---------|----------------|-------|
| Queries complexas | ✅ Fácil | ❌ Difícil |
| Performance leitura | ⚠️ Mais lento | ✅ Mais rápido |
| Validação | ✅ Schema enforced | ❌ Sem validação |
| Auditoria | ✅ Completa | ❌ Limitada |
| Simplicidade | ❌ Mais complexo | ✅ Mais simples |

**Ação Recomendada:** 
- **Opção 1 (Recomendada):** Migrar para JSONB como V0 (mais simples, mais rápido)
- **Opção 2:** Manter tabela separada (mais robusto, mais complexo)

---

## 🔐 Políticas RLS - Comparação

### V0 - Usa Funções Helper (✅ Melhor)

```sql
-- Função helper para evitar recursão
CREATE FUNCTION is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política usando função helper
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_project_member(id, auth.uid())  -- ✅ Sem recursão
  );
```

### Sistema Atual - Recursão Direta (❌ Problemático)

```sql
-- Política com possível recursão
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
      -- ⚠️ Pode causar recursão se project_members 
      -- também verificar acesso a projects
    )
  );
```

**Problema:** Recursão circular entre `projects` e `project_members`

**Solução:** ✅ Usar funções SECURITY DEFINER (já implementado no script de migração)

---

## 🔧 Trigger: Auto-adicionar Criador como Membro

### V0 - NÃO TEM TRIGGER (Faz Manualmente)

```javascript
// No código JavaScript
const { data: project } = await supabase.from("projects").insert({...})

// Adiciona criador manualmente
await supabase.from("project_members").insert({
  project_id: project.id,
  user_id: session.user.id,
  role: "owner"
})
```

### Sistema Atual - NÃO TEM

### Recomendação - ADICIONAR TRIGGER (✅ Melhor)

```sql
-- Trigger automático (já no script de migração)
CREATE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by)
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_creator_as_member_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();
```

**Vantagem:** Garante que criador sempre é membro, mesmo se código esquecer

---

## 📝 Resumo de Ações Necessárias

### 🔴 Crítico (Obrigatório)
1. ✅ Corrigir `project_members.project` de TEXT para UUID
2. ✅ Adicionar constraint UNIQUE em `project_members`
3. ✅ Criar funções helper RLS para evitar recursão
4. ✅ Recriar políticas RLS usando funções helper

### 🟡 Importante (Recomendado)
5. ✅ Adicionar campos JSONB em `projects` (conducts, panorama, etc.)
6. ✅ Migrar dados de `project_conducts` para `projects.conducts`
7. ✅ Adicionar trigger para auto-adicionar criador como membro
8. ✅ Adicionar índices para performance

### 🟢 Opcional (Melhorias)
9. ⚠️ Padronizar nomes de campos (name vs title)
10. ⚠️ Padronizar valores de status
11. ⚠️ Adicionar campos faltantes (phase, sector, etc.)

---

## 🚀 Script de Migração

Todas as ações acima estão implementadas no arquivo:
**`supabase-migration-v0-logic.sql`**

Execute o script no Supabase SQL Editor para aplicar todas as mudanças.

---

## ✅ Checklist Pós-Migração

Após executar o script, verificar:

- [ ] Coluna `project_members.project_id` é UUID
- [ ] Constraint UNIQUE existe em `project_members`
- [ ] Funções helper foram criadas (`is_project_member`, etc.)
- [ ] Políticas RLS foram recriadas
- [ ] Campos JSONB existem em `projects`
- [ ] Dados de condutas foram migrados
- [ ] Trigger de auto-membro foi criado
- [ ] Índices foram adicionados
- [ ] Testes básicos passam

---

## 📚 Referências

- Script SQL Completo: `supabase-migration-v0-logic.sql`
- Análise Detalhada: `ANALISE_V0_LOGICA_IMPLEMENTACAO.md`
- Guia de Implementação: `PROXIMOS_PASSOS_IMPLEMENTACAO.md`
- Repositório V0: https://github.com/andremarquito/v0-exxata-connect-clone.git
