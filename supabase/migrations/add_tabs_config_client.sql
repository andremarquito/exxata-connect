-- Adiciona campo tabs_config_client para controlar visibilidade de abas especificamente para clientes
-- Este campo permite ocultar abas apenas para usuários com role 'client', mantendo visível para outros perfis

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS tabs_config_client JSONB DEFAULT '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true
}'::jsonb;

COMMENT ON COLUMN projects.tabs_config_client IS 'Configuração de visibilidade de abas especificamente para clientes. Controla quais abas são visíveis para usuários com role client.';
