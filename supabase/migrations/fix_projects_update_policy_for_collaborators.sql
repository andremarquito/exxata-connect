-- =====================================================
-- MIGRAÇÃO: Corrigir política de UPDATE para colaboradores
-- Data: 2024-12-02
-- Descrição: Permite que colaboradores editem projetos dos quais são membros
--            Corrige problema onde colaboradores não conseguem salvar alterações
--            na aba "Visão Geral" e outras abas
-- =====================================================

-- =====================================================
-- 1. REMOVER POLÍTICA ATUAL DE UPDATE
-- =====================================================

-- Remover política atual que bloqueia colaboradores
-- Nome exato da política no Supabase: projects_update
DROP POLICY IF EXISTS "projects_update" ON projects;

-- Remover outras políticas antigas (se existirem)
DROP POLICY IF EXISTS "Project creators can update projects" ON projects;
DROP POLICY IF EXISTS "Authorized users can manage projects" ON projects;

-- =====================================================
-- 2. CRIAR POLÍTICA DE UPDATE CORRETA
-- =====================================================

-- Política específica para UPDATE que permite:
-- 1. Criador do projeto
-- 2. Admin/Manager (todos os projetos)
-- 3. Colaboradores que são membros do projeto
CREATE POLICY "Users can update projects they have access to"
  ON projects FOR UPDATE
  USING (
    -- Criador do projeto
    created_by = auth.uid()
    OR
    -- Admin/Manager podem editar todos os projetos
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR
    -- Colaboradores que são membros do projeto
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('collaborator', 'colaborador', 'consultor', 'consultant')
      )
      AND
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "Users can update projects they have access to" ON projects IS 
  'Permite UPDATE se: (1) é o criador, (2) é admin/manager, ou (3) é colaborador E membro do projeto';

-- =====================================================
-- 3. CRIAR POLÍTICA DE INSERT (manter como estava)
-- =====================================================

DROP POLICY IF EXISTS "Users can create projects" ON projects;

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
  );

COMMENT ON POLICY "Users can create projects" ON projects IS 
  'Apenas admin e manager podem criar projetos';

-- =====================================================
-- 4. CRIAR POLÍTICA DE DELETE (manter como estava)
-- =====================================================

DROP POLICY IF EXISTS "Project creators can delete projects" ON projects;

CREATE POLICY "Users can delete projects they created"
  ON projects FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador')
    )
  );

COMMENT ON POLICY "Users can delete projects they created" ON projects IS 
  'Apenas criador ou admin podem deletar projetos';

-- =====================================================
-- 5. MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Política de UPDATE corrigida com sucesso!';
  RAISE NOTICE '   - Colaboradores agora podem editar projetos dos quais são membros';
  RAISE NOTICE '   - Admin/Manager podem editar todos os projetos';
  RAISE NOTICE '   - Criadores podem editar seus próprios projetos';
END $$;
