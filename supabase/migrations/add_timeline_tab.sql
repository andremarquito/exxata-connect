-- Adiciona suporte para a aba "Linha do Tempo"
-- Esta aba permite visualizar uma imagem estática da linha do tempo do projeto

-- 1. Adicionar campo para armazenar URL da imagem da linha do tempo
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS timeline_image TEXT;

COMMENT ON COLUMN projects.timeline_image IS 'URL da imagem da linha do tempo do projeto (PNG/JPEG). Armazenada no Supabase Storage.';

-- 2. Atualizar configuração padrão de abas para incluir 'timeline'
-- Atualiza apenas projetos que ainda não têm a chave 'timeline' configurada
UPDATE projects
SET tabs_config = jsonb_set(
  tabs_config,
  '{timeline}',
  'true'::jsonb,
  true
)
WHERE tabs_config IS NOT NULL
  AND NOT (tabs_config ? 'timeline');

-- 3. Atualizar configuração padrão de abas para clientes para incluir 'timeline'
UPDATE projects
SET tabs_config_client = jsonb_set(
  tabs_config_client,
  '{timeline}',
  'true'::jsonb,
  true
)
WHERE tabs_config_client IS NOT NULL
  AND NOT (tabs_config_client ? 'timeline');

-- 4. Atualizar o default para novos projetos
ALTER TABLE projects
ALTER COLUMN tabs_config SET DEFAULT '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true,
  "timeline": true
}'::jsonb;

ALTER TABLE projects
ALTER COLUMN tabs_config_client SET DEFAULT '{
  "overview": true,
  "onboarding": true,
  "documents": true,
  "team": true,
  "activities": true,
  "indicators": true,
  "panorama": true,
  "ai-insights": true,
  "timeline": true
}'::jsonb;

-- 5. Criar índice para otimizar consultas (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_projects_timeline_image 
ON projects(timeline_image) 
WHERE timeline_image IS NOT NULL;
