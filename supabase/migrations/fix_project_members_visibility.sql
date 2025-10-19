-- =====================================================
-- MIGRAÇÃO: Permitir que membros vejam outros membros do mesmo projeto
-- Data: 2024-10-19
-- Versão: v6 FINAL (delegação para RLS de projects)
-- Descrição: Permite ver membros de projetos acessíveis delegando
--            verificação para RLS de projects. A aplicação usa JOIN
--            para carregar membros.
-- =====================================================

-- Remover política antiga
DROP POLICY IF EXISTS "project_members_select" ON project_members;

-- Criar política que delega para RLS de projects
CREATE POLICY "project_members_select"
  ON project_members FOR SELECT
  USING (
    -- Admin/Manager podem ver todos os membros
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR
    -- Usuário pode ver membros de projetos acessíveis
    -- Delega verificação para RLS de projects
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
    )
  );

-- Comentário explicativo
COMMENT ON POLICY "project_members_select" ON project_members IS 
  'Permite ver membros de projetos acessíveis. Delega verificação para RLS de projects sem causar recursão.';
