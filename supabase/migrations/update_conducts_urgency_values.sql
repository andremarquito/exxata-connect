-- Migração para atualizar os valores de urgência das condutas
-- De: Baixa, Normal, Alta, Crítica
-- Para: Fácil, Difícil, Complicado, Complexo, Crise

-- 1. PRIMEIRO: Remover a constraint antiga para permitir a atualização
ALTER TABLE project_conducts 
DROP CONSTRAINT IF EXISTS project_conducts_urgency_check;

-- 2. Atualizar os dados existentes que ainda usam valores antigos
UPDATE project_conducts
SET urgency = CASE 
  WHEN urgency = 'Baixa' THEN 'Fácil'
  WHEN urgency = 'Normal' THEN 'Difícil'
  WHEN urgency = 'Alta' THEN 'Complicado'
  WHEN urgency = 'Crítica' THEN 'Crise'
  ELSE urgency
END
WHERE urgency IN ('Baixa', 'Normal', 'Alta', 'Crítica');

-- 3. Adicionar a nova constraint com os novos valores
ALTER TABLE project_conducts 
ADD CONSTRAINT project_conducts_urgency_check 
CHECK (urgency IN ('Fácil', 'Difícil', 'Complicado', 'Complexo', 'Crise'));

-- 4. Atualizar o valor padrão
ALTER TABLE project_conducts 
ALTER COLUMN urgency SET DEFAULT 'Difícil';
