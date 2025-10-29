-- Adicionar tipo 'combo' ao constraint de chart_type
-- Migração aplicada em: 2025-01-29
-- Descrição: Adiciona suporte para gráficos combo (barra + linha) na tabela project_indicators

ALTER TABLE project_indicators 
DROP CONSTRAINT IF EXISTS project_indicators_chart_type_check;

ALTER TABLE project_indicators 
ADD CONSTRAINT project_indicators_chart_type_check 
CHECK (chart_type IN ('bar', 'bar-horizontal', 'line', 'pie', 'doughnut', 'combo'));

COMMENT ON CONSTRAINT project_indicators_chart_type_check ON project_indicators IS 'Tipos de gráfico suportados: bar, bar-horizontal, line, pie, doughnut, combo';
