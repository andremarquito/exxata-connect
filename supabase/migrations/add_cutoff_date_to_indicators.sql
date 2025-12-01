-- Adicionar campo cutoff_date (data de corte) à tabela project_indicators
-- Migração criada em: 01/12/2025
-- Descrição: Permite registrar até quando os dados do indicador são válidos

BEGIN;

-- Adicionar coluna cutoff_date (data de corte dos dados)
ALTER TABLE project_indicators 
ADD COLUMN IF NOT EXISTS cutoff_date DATE;

-- Comentário
COMMENT ON COLUMN project_indicators.cutoff_date IS 'Data de corte dos dados do indicador - indica até quando os dados são válidos/atualizados';

COMMIT;
