-- Adicionar campo visible_to_client à tabela project_indicators
-- Migração criada em: 01/12/2025
-- Descrição: Permite controlar quais indicadores são visíveis para clientes

BEGIN;

-- Adicionar coluna visible_to_client (padrão: true - visível para todos)
ALTER TABLE project_indicators 
ADD COLUMN IF NOT EXISTS visible_to_client BOOLEAN DEFAULT true NOT NULL;

-- Comentário
COMMENT ON COLUMN project_indicators.visible_to_client IS 'Define se o indicador é visível para usuários com perfil de cliente';

-- Criar índice para otimizar filtros por visibilidade
CREATE INDEX IF NOT EXISTS idx_project_indicators_visible_to_client 
ON project_indicators(project_id, visible_to_client);

COMMIT;
