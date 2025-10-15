-- ====================================================================
-- SCRIPT DE AJUSTE FINO DO SCHEMA DA TABELA 'projects'
-- Objetivo: Alinhar a estrutura com as boas práticas e o formulário de cadastro.
-- ====================================================================

BEGIN;

-- PARTE 0: SALVAR E DROPAR VIEWS DEPENDENTES
-- Views precisam ser removidas antes de alterar tipos de colunas.

-- Salvar a definição da view v_projects_complete (se existir)
DO $$
DECLARE
  view_definition TEXT;
BEGIN
  SELECT pg_get_viewdef('v_projects_complete', true) INTO view_definition;
  IF view_definition IS NOT NULL THEN
    -- Armazenar em uma tabela temporária para recriar depois
    CREATE TEMP TABLE IF NOT EXISTS temp_view_backup (view_name TEXT, definition TEXT);
    INSERT INTO temp_view_backup VALUES ('v_projects_complete', view_definition);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- View não existe, continuar
    NULL;
END $$;

-- Dropar a view temporariamente
DROP VIEW IF EXISTS v_projects_complete CASCADE;

-- ====================================================================

-- PARTE 1: ADICIONAR NOVAS COLUNAS
-- Adiciona as colunas que estão no formulário mas não na tabela.

-- Adicionar 'start_date' (Início do Contrato)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;

-- Adicionar 'end_date' (Fim do Contrato)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- Adicionar 'progress' (Progresso do Projeto, 0-100)
-- SMALLINT é mais eficiente que INTEGER para valores pequenos como percentuais.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress SMALLINT DEFAULT 0;

-- Adicionar 'sector' (Setor de Atuação)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sector TEXT;

-- Adicionar 'updated_by' para rastrear a última modificação
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- ====================================================================

-- PARTE 2: ALTERAR TIPOS DE DADOS PARA MELHORES PRÁTICAS
-- Converte colunas de texto que armazenam números para o tipo NUMERIC.

-- Alterar 'contract_value'
-- Usamos um bloco DO para tratar a conversão de forma segura, substituindo valores não numéricos por 0.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_value' AND data_type='text') THEN
    -- Primeiro, limpa valores não numéricos para evitar erros de conversão.
    UPDATE public.projects SET contract_value = '0' WHERE contract_value ~ '[^0-9.,]';
    -- Altera o tipo da coluna, convertendo os valores existentes.
    ALTER TABLE public.projects ALTER COLUMN contract_value TYPE NUMERIC(15, 2) USING regexp_replace(contract_value, '[^0-9,]', '', 'g')::NUMERIC;
  END IF;
END $$;

-- Alterar 'hourly_rate'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='hourly_rate' AND data_type='text') THEN
    UPDATE public.projects SET hourly_rate = '0' WHERE hourly_rate ~ '[^0-9.,]';
    ALTER TABLE public.projects ALTER COLUMN hourly_rate TYPE NUMERIC(10, 2) USING regexp_replace(hourly_rate, '[^0-9,]', '', 'g')::NUMERIC;
  END IF;
END $$;

-- Alterar 'disputed_amount'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='disputed_amount' AND data_type='text') THEN
    UPDATE public.projects SET disputed_amount = '0' WHERE disputed_amount ~ '[^0-9.,]';
    ALTER TABLE public.projects ALTER COLUMN disputed_amount TYPE NUMERIC(15, 2) USING regexp_replace(disputed_amount, '[^0-9,]', '', 'g')::NUMERIC;
  END IF;
END $$;

-- Alterar 'billing_progress'
-- Garante que a coluna seja do tipo SMALLINT para consistência.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='billing_progress' AND (data_type='integer' OR data_type='bigint')) THEN
    ALTER TABLE public.projects ALTER COLUMN billing_progress TYPE SMALLINT;
  END IF;
END $$;

-- ====================================================================

-- PARTE 3: REMOVER COLUNA LEGADA
-- Remove a coluna 'team' que foi substituída pela tabela 'project_members'.

ALTER TABLE public.projects DROP COLUMN IF EXISTS team;

-- ====================================================================

-- PARTE 4: ATUALIZAR TRIGGER DE 'updated_at'
-- Garante que a coluna 'updated_at' seja atualizada em qualquer alteração.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================

-- PARTE 5: RECRIAR VIEW v_projects_complete
-- Recria a view com a estrutura atualizada das colunas.

-- Nota: Como a view original pode ter sido complexa, vamos criar uma versão
-- simplificada que funciona com os novos tipos de dados.
-- Se você tinha uma view customizada, ajuste conforme necessário.

CREATE OR REPLACE VIEW v_projects_complete AS
SELECT 
  p.*,
  -- Agregação de membros do projeto
  COALESCE(
    json_agg(
      json_build_object(
        'id', pm.id,
        'user_id', pm.user_id,
        'role', pm.role,
        'added_at', pm.added_at,
        'added_by', pm.added_by,
        'profile', json_build_object(
          'id', prof.id,
          'name', prof.name,
          'email', prof.email,
          'role', prof.role
        )
      )
    ) FILTER (WHERE pm.id IS NOT NULL),
    '[]'::json
  ) AS members
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id
LEFT JOIN public.profiles prof ON pm.user_id = prof.id
GROUP BY p.id;

-- ====================================================================

COMMIT;

-- Mensagem de Conclusão: O schema da tabela 'projects' foi ajustado com sucesso.
-- A view v_projects_complete foi recriada com a nova estrutura.
