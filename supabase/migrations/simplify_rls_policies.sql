-- =====================================================
-- MIGRAÇÃO: Simplificar políticas RLS
-- Data: 2024-10-21
-- Descrição: Remove redundâncias e simplifica lógica de acesso
--            - Garante que membros vejam projetos dos quais fazem parte
--            - Remove verificação redundante de admin em project_members
-- =====================================================

-- =====================================================
-- 1. SIMPLIFICAR POLÍTICA DE PROJECTS (SELECT)
-- =====================================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;

-- Criar política simplificada
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    -- Criador do projeto
    created_by = auth.uid()
    OR
    -- Admin/Manager veem todos os projetos
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR
    -- Membro do projeto (owner, member, etc.)
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view projects they are members of" ON projects IS 
  'Permite visualizar projetos se: (1) é o criador, (2) é admin/manager, ou (3) é membro listado em project_members';

-- =====================================================
-- 2. SIMPLIFICAR POLÍTICA DE PROJECT_MEMBERS (SELECT)
-- =====================================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
DROP POLICY IF EXISTS "project_members_select" ON project_members;

-- Criar política simplificada (delega para RLS de projects)
CREATE POLICY "project_members_select"
  ON project_members FOR SELECT
  USING (
    -- Se você pode ver o projeto, pode ver seus membros
    -- Delega toda verificação para a política RLS de projects
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id
    )
  );

COMMENT ON POLICY "project_members_select" ON project_members IS 
  'Permite ver membros de qualquer projeto acessível. Delega verificação para RLS de projects (sem redundância).';

-- =====================================================
-- 3. VERIFICAR POLÍTICAS DE INSERT/DELETE (manter como estão)
-- =====================================================

-- Estas políticas já estão corretas e não precisam de alteração:
-- - "Project creators can add members" (INSERT)
-- - "Project creators can remove members" (DELETE)

-- =====================================================
-- 4. MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS simplificadas com sucesso!';
  RAISE NOTICE '   - projects: Garante acesso para criadores, admins e membros';
  RAISE NOTICE '   - project_members: Delega verificação para projects (sem redundância)';
END $$;
