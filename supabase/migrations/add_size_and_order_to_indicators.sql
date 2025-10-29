-- Adicionar campos size e order à tabela project_indicators
-- Migração aplicada em: 2025-01-29
-- Descrição: Adiciona suporte para tamanho variável (1 ou 2 colunas) e ordenação customizada de indicadores

-- Adicionar coluna size (tamanho do card: normal ou large)
ALTER TABLE project_indicators 
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'normal' CHECK (size IN ('normal', 'large'));

-- Adicionar coluna order (ordem de exibição)
ALTER TABLE project_indicators 
ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Comentários
COMMENT ON COLUMN project_indicators.size IS 'Tamanho do card: normal (1 coluna) ou large (2 colunas)';
COMMENT ON COLUMN project_indicators."order" IS 'Ordem de exibição do indicador (usado para drag & drop)';
