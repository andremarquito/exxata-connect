-- =====================================================
-- MIGRAÇÃO PARA LÓGICA V0 - EXXATA CONNECT
-- Script de migração do schema atual para lógica V0
-- =====================================================
-- ATENÇÃO: FAÇA BACKUP DO BANCO ANTES DE EXECUTAR!
-- =====================================================

-- =====================================================
-- PARTE 1: ADICIONAR CAMPOS JSONB NA TABELA PROJECTS
-- =====================================================

-- Adicionar campos que existem no V0 mas não no sistema atual
ALTER TABLE projects ADD COLUMN IF NOT EXISTS conducts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS panorama JSONB DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS overview_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS exxata_activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_predictive_text TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT;

-- Adicionar campos financeiros que faltam
ALTER TABLE projects ALTER COLUMN contract_value TYPE TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS disputed_amount TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_summary TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_progress INTEGER DEFAULT 0 CHECK (billing_progress >= 0 AND billing_progress <= 100);

-- Adicionar campo sector se não existir
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sector TEXT;

-- =====================================================
-- PARTE 2: MIGRAR DADOS DE PROJECT_CONDUCTS PARA JSONB
-- =====================================================

-- Migrar condutas existentes da tabela project_conducts para o campo JSONB
UPDATE projects p
SET conducts = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pc.id::text,
      'text', pc.content,
      'urgency', CASE 
        WHEN pc.urgency = 'Crítica' THEN 'Imediato'
        WHEN pc.urgency = 'Alta' THEN 'Imediato'
        WHEN pc.urgency = 'Normal' THEN 'Planejado'
        ELSE 'Planejado'
      END,
      'priority', CASE 
        WHEN pc.urgency = 'Crítica' THEN 'Alta'
        WHEN pc.urgency = 'Alta' THEN 'Alta'
        WHEN pc.urgency = 'Normal' THEN 'Média'
        ELSE 'Baixa'
      END
    ) ORDER BY pc.display_order
  ), '[]'::jsonb)
  FROM project_conducts pc
  WHERE pc.project_id = p.id
)
WHERE EXISTS (SELECT 1 FROM project_conducts WHERE project_id = p.id);

-- Inicializar panorama para projetos que não têm
UPDATE projects
SET panorama = '{
  "tecnica": {"status": "green", "items": []},
  "fisica": {"status": "green", "items": []},
  "economica": {"status": "green", "items": []}
}'::jsonb
WHERE panorama IS NULL OR panorama = '{}'::jsonb;

-- =====================================================
-- PARTE 3: CORRIGIR TABELA PROJECT_MEMBERS
-- =====================================================

-- ATENÇÃO: Esta parte altera a estrutura da tabela project_members
-- Certifique-se de ter backup!

-- Verificar se a coluna 'project' existe e é do tipo TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_members' 
    AND column_name = 'project'
  ) THEN
    -- Remover constraint antiga
    ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_fkey;
    
    -- Converter coluna de TEXT para UUID
    ALTER TABLE project_members ALTER COLUMN project TYPE UUID USING project::uuid;
    
    -- Renomear coluna
    ALTER TABLE project_members RENAME COLUMN project TO project_id;
    
    -- Adicionar foreign key
    ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Coluna project_members.project convertida para project_id (UUID)';
  ELSE
    RAISE NOTICE 'Coluna project_members.project não existe ou já foi migrada';
  END IF;
END $$;

-- Adicionar constraint UNIQUE para evitar duplicação de membros
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_unique_member;
ALTER TABLE project_members ADD CONSTRAINT project_members_unique_member 
  UNIQUE(project_id, user_id);

-- =====================================================
-- PARTE 4: CRIAR FUNÇÕES HELPER PARA RLS
-- =====================================================

-- Função para verificar se usuário é membro do projeto
-- SECURITY DEFINER permite que a função execute sem verificar RLS
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

-- Função para verificar se usuário é criador do projeto
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

-- Função para verificar se usuário é admin/manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_uuid 
    AND role IN ('admin', 'administrador', 'manager', 'gerente')
  );
END;
$$;

-- =====================================================
-- PARTE 5: RECRIAR POLÍTICAS RLS USANDO FUNÇÕES HELPER
-- =====================================================

-- Remover políticas antigas que podem causar recursão
DROP POLICY IF EXISTS "Users can view projects they have access to" ON projects;
DROP POLICY IF EXISTS "Authorized users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can view documents of their projects" ON project_documents;
DROP POLICY IF EXISTS "Users can view activities of accessible projects" ON activities;
DROP POLICY IF EXISTS "Authorized users can manage activities" ON activities;
DROP POLICY IF EXISTS "Users can view files of accessible projects" ON project_files;
DROP POLICY IF EXISTS "Authorized users can manage files" ON project_files;
DROP POLICY IF EXISTS "Users can view indicators of accessible projects" ON project_indicators;
DROP POLICY IF EXISTS "Authorized users can manage indicators" ON project_indicators;
DROP POLICY IF EXISTS "Users can view conducts of accessible projects" ON project_conducts;
DROP POLICY IF EXISTS "Authorized users can manage conducts" ON project_conducts;

-- =====================================================
-- POLÍTICAS PARA PROJECTS
-- =====================================================

CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    projects.created_by = auth.uid() OR
    public.is_project_member(projects.id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update projects"
  ON projects FOR UPDATE
  USING (
    projects.created_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Project creators can delete projects"
  ON projects FOR DELETE
  USING (
    projects.created_by = auth.uid() OR
    public.is_admin_or_manager(auth.uid())
  );

-- =====================================================
-- POLÍTICAS PARA PROJECT_MEMBERS
-- =====================================================

CREATE POLICY "Users can view members of their projects"
  ON project_members FOR SELECT
  USING (
    project_members.user_id = auth.uid() OR
    public.is_project_creator(project_members.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Project creators can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    public.is_project_creator(project_members.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Project creators can remove members"
  ON project_members FOR DELETE
  USING (
    public.is_project_creator(project_members.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

-- =====================================================
-- POLÍTICAS PARA PROJECT_FILES (não project_documents)
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view documents of their projects" ON project_files;
DROP POLICY IF EXISTS "Users can view files of their projects" ON project_files;
DROP POLICY IF EXISTS "Users can upload documents to their projects" ON project_files;
DROP POLICY IF EXISTS "Users can upload files to their projects" ON project_files;
DROP POLICY IF EXISTS "Users can delete their own documents" ON project_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON project_files;

CREATE POLICY "Users can view files of their projects"
  ON project_files FOR SELECT
  USING (
    public.is_project_creator(project_files.project_id, auth.uid()) OR
    public.is_project_member(project_files.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can upload files to their projects"
  ON project_files FOR INSERT
  WITH CHECK (
    public.is_project_creator(project_files.project_id, auth.uid()) OR
    public.is_project_member(project_files.project_id, auth.uid())
  );

CREATE POLICY "Users can delete their own files"
  ON project_files FOR DELETE
  USING (
    project_files.uploaded_by = auth.uid() OR
    public.is_project_creator(project_files.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

-- =====================================================
-- POLÍTICAS PARA PROJECT_ACTIVITIES_OLD (não activities)
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view activities of their projects" ON project_activities_old;
DROP POLICY IF EXISTS "Users can view activities of accessible projects" ON project_activities_old;
DROP POLICY IF EXISTS "Users can create activities in their projects" ON project_activities_old;
DROP POLICY IF EXISTS "Users can update activities in their projects" ON project_activities_old;
DROP POLICY IF EXISTS "Users can delete activities in their projects" ON project_activities_old;
DROP POLICY IF EXISTS "Authorized users can manage activities" ON project_activities_old;

CREATE POLICY "Users can view activities of their projects"
  ON project_activities_old FOR SELECT
  USING (
    public.is_project_creator(project_activities_old.project_id, auth.uid()) OR
    public.is_project_member(project_activities_old.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can create activities in their projects"
  ON project_activities_old FOR INSERT
  WITH CHECK (
    public.is_project_creator(project_activities_old.project_id, auth.uid()) OR
    public.is_project_member(project_activities_old.project_id, auth.uid())
  );

CREATE POLICY "Users can update activities in their projects"
  ON project_activities_old FOR UPDATE
  USING (
    public.is_project_creator(project_activities_old.project_id, auth.uid()) OR
    public.is_project_member(project_activities_old.project_id, auth.uid())
  );

CREATE POLICY "Users can delete activities in their projects"
  ON project_activities_old FOR DELETE
  USING (
    public.is_project_creator(project_activities_old.project_id, auth.uid()) OR
    public.is_project_member(project_activities_old.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

-- =====================================================
-- POLÍTICAS PARA PROJECT_INDICATORS
-- =====================================================

CREATE POLICY "Users can view indicators of their projects"
  ON project_indicators FOR SELECT
  USING (
    public.is_project_creator(project_indicators.project_id, auth.uid()) OR
    public.is_project_member(project_indicators.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can create indicators in their projects"
  ON project_indicators FOR INSERT
  WITH CHECK (
    public.is_project_creator(project_indicators.project_id, auth.uid()) OR
    public.is_project_member(project_indicators.project_id, auth.uid())
  );

CREATE POLICY "Users can update indicators in their projects"
  ON project_indicators FOR UPDATE
  USING (
    public.is_project_creator(project_indicators.project_id, auth.uid()) OR
    public.is_project_member(project_indicators.project_id, auth.uid())
  );

CREATE POLICY "Users can delete indicators in their projects"
  ON project_indicators FOR DELETE
  USING (
    public.is_project_creator(project_indicators.project_id, auth.uid()) OR
    public.is_project_member(project_indicators.project_id, auth.uid()) OR
    public.is_admin_or_manager(auth.uid())
  );

-- =====================================================
-- POLÍTICAS PARA PROJECT_CONDUCTS (se ainda existir)
-- =====================================================

-- Nota: Se você migrou condutas para JSONB, pode deletar esta tabela
-- Caso contrário, mantenha as políticas

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_conducts') THEN
    EXECUTE 'CREATE POLICY "Users can view conducts of their projects"
      ON project_conducts FOR SELECT
      USING (
        public.is_project_creator(project_conducts.project_id, auth.uid()) OR
        public.is_project_member(project_conducts.project_id, auth.uid()) OR
        public.is_admin_or_manager(auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Users can create conducts in their projects"
      ON project_conducts FOR INSERT
      WITH CHECK (
        public.is_project_creator(project_conducts.project_id, auth.uid()) OR
        public.is_project_member(project_conducts.project_id, auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Users can update conducts in their projects"
      ON project_conducts FOR UPDATE
      USING (
        public.is_project_creator(project_conducts.project_id, auth.uid()) OR
        public.is_project_member(project_conducts.project_id, auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Users can delete conducts in their projects"
      ON project_conducts FOR DELETE
      USING (
        public.is_project_creator(project_conducts.project_id, auth.uid()) OR
        public.is_project_member(project_conducts.project_id, auth.uid()) OR
        public.is_admin_or_manager(auth.uid())
      )';
  END IF;
END $$;

-- =====================================================
-- PARTE 6: ADICIONAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON projects(sector);

-- Índices para project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Índices para project_activities_old (não activities)
CREATE INDEX IF NOT EXISTS idx_project_activities_old_project_id ON project_activities_old(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_old_status ON project_activities_old(status);

-- Índices para project_files (não project_documents)
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_files_source ON project_files(source);

-- Índices para project_indicators
CREATE INDEX IF NOT EXISTS idx_project_indicators_project_id ON project_indicators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_indicators_order ON project_indicators(project_id, display_order);

-- =====================================================
-- PARTE 7: TRIGGER PARA AUTO-ADICIONAR CRIADOR COMO MEMBRO
-- =====================================================

-- Função para adicionar criador como membro automaticamente
CREATE OR REPLACE FUNCTION public.add_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adicionar criador como membro com role 'owner'
  INSERT INTO public.project_members (project_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by)
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger para executar após inserção de projeto
DROP TRIGGER IF EXISTS add_creator_as_member_trigger ON projects;
CREATE TRIGGER add_creator_as_member_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_member();

-- =====================================================
-- PARTE 8: VERIFICAÇÕES E TESTES
-- =====================================================

-- Verificar se as funções foram criadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_project_member') THEN
    RAISE EXCEPTION 'Função is_project_member não foi criada!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_project_creator') THEN
    RAISE EXCEPTION 'Função is_project_creator não foi criada!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_or_manager') THEN
    RAISE EXCEPTION 'Função is_admin_or_manager não foi criada!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_creator_as_member') THEN
    RAISE EXCEPTION 'Função add_creator_as_member não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Todas as funções foram criadas com sucesso!';
END $$;

-- Verificar se os campos JSONB foram adicionados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'conducts'
  ) THEN
    RAISE EXCEPTION 'Campo conducts não foi adicionado!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'panorama'
  ) THEN
    RAISE EXCEPTION 'Campo panorama não foi adicionado!';
  END IF;
  
  RAISE NOTICE '✅ Todos os campos JSONB foram adicionados com sucesso!';
END $$;

-- Verificar se project_members foi corrigido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_members' 
    AND column_name = 'project_id'
    AND udt_name = 'uuid'
  ) THEN
    RAISE WARNING '⚠️ Coluna project_members.project_id não é UUID ou não existe!';
  ELSE
    RAISE NOTICE '✅ Coluna project_members.project_id está correta (UUID)!';
  END IF;
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '
  =====================================================
  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
  =====================================================
  
  Próximos passos:
  1. Testar criação de projetos
  2. Verificar se criador é adicionado automaticamente como membro
  3. Testar permissões RLS
  4. Atualizar código frontend para usar nova estrutura
  
  =====================================================
  ';
END $$;
