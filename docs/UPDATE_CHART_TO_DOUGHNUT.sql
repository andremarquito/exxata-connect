-- Script para atualizar gráfico "Avanço do Prazo" de 'pie' para 'doughnut'
-- Execute este SQL no Supabase SQL Editor

-- Opção 1: Atualizar um gráfico específico pelo título
UPDATE project_indicators 
SET chart_type = 'doughnut'
WHERE title = 'Avanço do Prazo';

-- Opção 2: Atualizar TODOS os gráficos de pizza para rosca
-- (Descomente a linha abaixo se quiser converter todos)
-- UPDATE project_indicators SET chart_type = 'doughnut' WHERE chart_type = 'pie';

-- Verificar o resultado
SELECT id, title, chart_type 
FROM project_indicators 
WHERE title = 'Avanço do Prazo';
