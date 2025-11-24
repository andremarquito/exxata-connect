-- Adicionar campo de categoria aos arquivos do projeto
-- Data: 2025-11-24

-- Adicionar coluna category à tabela project_files
ALTER TABLE project_files
ADD COLUMN IF NOT EXISTS category TEXT;

-- Adicionar constraint para validar categorias permitidas
ALTER TABLE project_files
ADD CONSTRAINT valid_category CHECK (
  category IS NULL OR 
  category IN (
    'Correspondência',
    'ATA',
    'E-mail',
    'RDO',
    'Relatório',
    'Análise',
    'Singularidades',
    'Notificação',
    'Plano de Ação',
    'Parecer',
    'Checklist',
    'Procedimento'
  )
);

-- Adicionar comentário explicativo
COMMENT ON COLUMN project_files.category IS 'Categoria do documento para organização e filtros';

-- Criar índice para melhorar performance de filtros por categoria
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);

-- Criar índice para filtros combinados (projeto + categoria)
CREATE INDEX IF NOT EXISTS idx_project_files_project_category ON project_files(project_id, category);
