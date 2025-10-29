-- Adicionar tipo 'doughnut' (rosca) ao constraint de chart_type em project_indicators
-- Data: 2025-01-28

BEGIN;

-- Remover constraint antigo (pode ter nome diferente)
ALTER TABLE project_indicators 
DROP CONSTRAINT IF EXISTS project_indicators_type_check;

ALTER TABLE project_indicators 
DROP CONSTRAINT IF EXISTS project_indicators_chart_type_check;

-- Adicionar novo constraint com 'doughnut' usando o nome correto da coluna
ALTER TABLE project_indicators 
ADD CONSTRAINT project_indicators_chart_type_check 
CHECK (chart_type IN ('bar', 'bar-horizontal', 'line', 'pie', 'doughnut'));

COMMIT;

-- Comentário: Gráfico de rosca (doughnut) funciona igual ao gráfico de pizza,
-- mas com um círculo vazio no centro (innerRadius > 0)
