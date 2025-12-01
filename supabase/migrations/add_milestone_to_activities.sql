-- Adicionar campo is_milestone à tabela project_activities_old
-- Este campo indica se a atividade é um marco (milestone) que será exibido como triângulo/bandeira no Gantt

ALTER TABLE project_activities_old 
ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN project_activities_old.is_milestone IS 'Indica se a atividade é um marco (milestone) exibido como triângulo no Gantt';
