-- Criar tabela para documentos de onboarding
CREATE TABLE IF NOT EXISTS project_onboarding_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- A, B, C
  phase_name TEXT NOT NULL, -- Fase Pré-Contratual, etc
  code TEXT NOT NULL, -- A.1, A.2, B.1, etc
  description TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  observation TEXT,
  motivation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_onboarding_project ON project_onboarding_documents(project_id);
CREATE INDEX idx_onboarding_phase ON project_onboarding_documents(phase);

-- RLS Policies
ALTER TABLE project_onboarding_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver documentos de projetos que têm acesso
CREATE POLICY "Users can view onboarding documents of their projects"
  ON project_onboarding_documents
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Usuários podem inserir documentos em projetos que têm acesso de edição
CREATE POLICY "Users can insert onboarding documents in their projects"
  ON project_onboarding_documents
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'collaborator')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Usuários podem atualizar documentos em projetos que têm acesso de edição
CREATE POLICY "Users can update onboarding documents in their projects"
  ON project_onboarding_documents
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'collaborator')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Policy: Usuários podem deletar documentos em projetos que têm acesso de edição
CREATE POLICY "Users can delete onboarding documents in their projects"
  ON project_onboarding_documents
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'collaborator')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_documents_updated_at
  BEFORE UPDATE ON project_onboarding_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- Comentários
COMMENT ON TABLE project_onboarding_documents IS 'Documentos de onboarding por projeto';
COMMENT ON COLUMN project_onboarding_documents.phase IS 'Fase do documento (A, B, C)';
COMMENT ON COLUMN project_onboarding_documents.phase_name IS 'Nome da fase';
COMMENT ON COLUMN project_onboarding_documents.code IS 'Código do documento (A.1, A.2, etc)';
COMMENT ON COLUMN project_onboarding_documents.is_complete IS 'Se a documentação está completa';
