-- Adiciona campo tabs_config para controlar visibilidade de abas por projeto
-- Permite que Admin/Gerente personalize quais abas são exibidas

-- 1. Adicionar coluna tabs_config (JSONB)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tabs_config JSONB DEFAULT '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}'::jsonb;

-- 2. Comentário explicativo
COMMENT ON COLUMN projects.tabs_config IS 'Configuração de visibilidade das abas do projeto (JSONB)';

-- 3. Atualizar projetos existentes com configuração padrão (todas as abas visíveis)
UPDATE projects 
SET tabs_config = '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}'::jsonb
WHERE tabs_config IS NULL;

-- 4. Criar índice GIN para melhor performance em queries JSONB
CREATE INDEX IF NOT EXISTS idx_projects_tabs_config 
ON projects USING GIN (tabs_config);

-- 5. Adicionar constraint para garantir que tabs_config seja um objeto JSON válido
ALTER TABLE projects 
ADD CONSTRAINT tabs_config_is_object 
CHECK (jsonb_typeof(tabs_config) = 'object');
