-- ==============================================
-- CAMADA DE MAPEAMENTO SUPABASE - EXXATA CONNECT
-- Resolve incompatibilidades de tipos e cria tabelas necessárias
-- ==============================================

-- 0. SCHEMA ATUAL IDENTIFICADO E ANALISADO
-- ==============================================
-- ✅ profiles - Completa (uuid id → auth.users)
-- ✅ projects - Completa (bigint id, created_by → auth.users) ⚠️ INCONSISTENTE
-- ✅ project_files - Existe (bigint project_id, uploaded_by → auth.users) ⚠️ INCONSISTENTE
-- ✅ project_indicators - Existe (bigint project_id)
-- ✅ project_conducts - Existe (uuid project_id, created_by → profiles) ✅ CORRETO
-- ✅ project_members - Existe (uuid project_id, user_id → profiles) ✅ CORRETO  
-- ✅ project_activities_old - Existe (bigint project_id)
-- 🎯 project_id_map - Tabela de mapeamento disponível!

-- ⚠️ PROBLEMA: Algumas tabelas referenciam auth.users, outras profiles
-- SOLUÇÃO: Usar LEFT JOINs inteligentes para lidar com ambos os casos

-- Criar alias para project_activities_old (compatibilidade)
CREATE OR REPLACE VIEW project_activities AS 
SELECT * FROM project_activities_old;

-- 1. FUNÇÕES DE CONVERSÃO DE TIPOS
-- ==============================================

-- 🎯 USAR A TABELA project_id_map EXISTENTE!
-- Função para converter project.id (bigint) para UUID usando mapeamento real
CREATE OR REPLACE FUNCTION project_id_to_uuid(project_bigint_id bigint)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  mapped_uuid uuid;
BEGIN
  -- Buscar na tabela de mapeamento existente
  SELECT new_id INTO mapped_uuid 
  FROM project_id_map 
  WHERE old_id = project_bigint_id;
  
  -- Se não encontrar, criar novo mapeamento
  IF mapped_uuid IS NULL THEN
    mapped_uuid := uuid_generate_v4();
    INSERT INTO project_id_map (old_id, new_id) 
    VALUES (project_bigint_id, mapped_uuid)
    ON CONFLICT (old_id) DO NOTHING;
  END IF;
  
  RETURN mapped_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Função para converter UUID de volta para bigint usando mapeamento real
CREATE OR REPLACE FUNCTION uuid_to_project_id(project_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  mapped_bigint bigint;
BEGIN
  -- Buscar na tabela de mapeamento existente
  SELECT old_id INTO mapped_bigint 
  FROM project_id_map 
  WHERE new_id = project_uuid;
  
  RETURN mapped_bigint;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 2. VIEW UNIFICADA PARA PROJECTS COM MEMBERS
-- ==============================================

CREATE OR REPLACE VIEW v_projects_with_members AS
SELECT 
  p.*,
  pm.id as member_id,
  pm.user_id as member_user_id,
  pm.role as member_role,
  pm.added_at as member_added_at,
  pm.added_by as member_added_by,
  pr.name as member_name,
  pr.email as member_email,
  pr.role as member_profile_role,
  pr.status as member_status
FROM projects p
LEFT JOIN project_members pm ON project_id_to_uuid(p.id) = pm.project_id
LEFT JOIN profiles pr ON pm.user_id = pr.id;

-- 3. VIEW PARA CONDUCTS COM PROJECTS
-- ==============================================

CREATE OR REPLACE VIEW v_project_conducts_with_projects AS
SELECT 
  pc.*,
  p.name as project_name,
  p.client as project_client,
  pr.name as created_by_name,
  pr.email as created_by_email
FROM project_conducts pc
LEFT JOIN projects p ON uuid_to_project_id(pc.project_id) = p.id
LEFT JOIN profiles pr ON pc.created_by = pr.id;

-- 4. FUNÇÕES CRUD PARA PROJECT MEMBERS
-- ==============================================

-- Função para adicionar membro a projeto (lida com conversão de tipos)
CREATE OR REPLACE FUNCTION add_project_member(
  p_project_id bigint,
  p_user_id uuid,
  p_role text DEFAULT 'member',
  p_added_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  member_id uuid;
  project_uuid_id uuid;
BEGIN
  -- Converter project_id para formato UUID usando mapeamento real
  project_uuid_id := project_id_to_uuid(p_project_id);
  
  -- Inserir member
  INSERT INTO project_members (project_id, user_id, role, added_by)
  VALUES (project_uuid_id, p_user_id, p_role, p_added_by)
  RETURNING id INTO member_id;
  
  RETURN member_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao adicionar membro: %', SQLERRM;
END;
$$;

-- Função para remover membro de projeto
CREATE OR REPLACE FUNCTION remove_project_member(
  p_project_id bigint,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  project_uuid_id uuid;
  rows_affected integer;
BEGIN
  -- Converter project_id para formato UUID usando mapeamento real
  project_uuid_id := project_id_to_uuid(p_project_id);
  
  -- Remover member
  DELETE FROM project_members 
  WHERE project_id = project_uuid_id 
    AND user_id = p_user_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao remover membro: %', SQLERRM;
END;
$$;

-- Função para listar membros de um projeto específico
CREATE OR REPLACE FUNCTION get_project_members(p_project_id bigint)
RETURNS TABLE(
  member_id uuid,
  user_id uuid,
  role text,
  added_at timestamptz,
  added_by uuid,
  name text,
  email text,
  profile_role text,
  status text
)
LANGUAGE plpgsql
AS $$
DECLARE
  project_uuid_id uuid;
BEGIN
  -- Converter project_id para formato UUID usando mapeamento real
  project_uuid_id := project_id_to_uuid(p_project_id);
  
  RETURN QUERY
  SELECT 
    pm.id,
    pm.user_id,
    pm.role,
    pm.added_at,
    pm.added_by,
    pr.name,
    pr.email,
    pr.role,
    pr.status
  FROM project_members pm
  LEFT JOIN profiles pr ON pm.user_id = pr.id
  WHERE pm.project_id = project_uuid_id;
END;
$$;

-- 5. FUNÇÃO PARA ADICIONAR CONDUCT COM CONVERSÃO
-- ==============================================

CREATE OR REPLACE FUNCTION add_project_conduct(
  p_project_id bigint,
  p_content text,
  p_created_by uuid,
  p_urgency text DEFAULT 'Normal',
  p_display_order integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  conduct_id uuid;
  project_uuid_id uuid;
BEGIN
  -- Converter project_id para formato UUID usando mapeamento real
  project_uuid_id := project_id_to_uuid(p_project_id);
  
  -- Inserir conduct
  INSERT INTO project_conducts (project_id, content, urgency, created_by, display_order)
  VALUES (project_uuid_id, p_content, p_urgency, p_created_by, p_display_order)
  RETURNING id INTO conduct_id;
  
  RETURN conduct_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao adicionar conduta: %', SQLERRM;
END;
$$;

-- 6. VIEW COMPLETA DE PROJETOS (PARA O FRONTEND)
-- ==============================================

-- Dropar view existente para recriar com nova estrutura
DROP VIEW IF EXISTS v_projects_complete;

CREATE VIEW v_projects_complete AS
SELECT 
  p.*,
  -- Informações do criador (resolvendo inconsistência)
  COALESCE(p_creator.name, au_creator.email, 'Usuário') as created_by_name,
  COALESCE(p_creator.email, au_creator.email) as created_by_email,
  -- Agregações de membros (sempre funciona)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pm.id,
        'user_id', pm.user_id,
        'role', pm.role,
        'added_at', pm.added_at,
        'added_by', pm.added_by,
        'name', pr.name,
        'email', pr.email,
        'profile_role', pr.role,
        'status', pr.status
      )
    ) FILTER (WHERE pm.id IS NOT NULL),
    '[]'::json
  ) as members,
  
  -- Agregações de condutas (sempre funciona)
  COALESCE(
    json_agg(
      jsonb_build_object(
        'id', pc.id,
        'content', pc.content,
        'urgency', pc.urgency,
        'display_order', pc.display_order,
        'created_at', pc.created_at,
        'updated_at', pc.updated_at,
        'created_by', pc.created_by
      ) ORDER BY pc.display_order
    ) FILTER (WHERE pc.id IS NOT NULL),
    '[]'::json
  ) as conducts,
  
  -- Agregações de atividades (agora vai funcionar!)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pa.id,
        'custom_id', pa.custom_id,
        'name', pa.name,
        'responsible', pa.responsible,
        'start_date', pa.start_date,
        'end_date', pa.end_date,
        'status', pa.status,
        'created_at', pa.created_at,
        'updated_at', pa.updated_at
      )
    ) FILTER (WHERE pa.id IS NOT NULL),
    '[]'::json
  ) as activities,
  
  -- Agregações de arquivos (com uploader info)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pf.id,
        'name', pf.name,
        'file_path', pf.file_path,
        'file_size', pf.file_size,
        'mime_type', pf.mime_type,
        'uploaded_by', pf.uploaded_by,
        'uploaded_by_name', COALESCE(pf_uploader.name, au_uploader.email, 'Usuário'),
        'uploaded_by_email', COALESCE(pf_uploader.email, au_uploader.email),
        'created_at', pf.created_at
      )
    ) FILTER (WHERE pf.id IS NOT NULL),
    '[]'::json
  ) as files,
  
  -- Agregações de indicadores (agora vai funcionar!)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pi.id,
        'name', pi.name,
        'value', pi.value,
        'type', pi.type,
        'created_at', pi.created_at,
        'updated_at', pi.updated_at
      )
    ) FILTER (WHERE pi.id IS NOT NULL),
    '[]'::json
  ) as indicators

FROM projects p
LEFT JOIN project_members pm ON project_id_to_uuid(p.id) = pm.project_id
LEFT JOIN profiles pr ON pm.user_id = pr.id
LEFT JOIN project_activities pa ON p.id = pa.project_id
LEFT JOIN project_files pf ON p.id = pf.project_id  
LEFT JOIN project_indicators pi ON p.id = pi.project_id
LEFT JOIN project_conducts pc ON project_id_to_uuid(p.id) = pc.project_id
-- Adicionar JOINs para resolver referências inconsistentes
LEFT JOIN profiles p_creator ON p.created_by = p_creator.id  -- Para projects.created_by
LEFT JOIN auth.users au_creator ON p.created_by = au_creator.id  -- Fallback para auth.users
LEFT JOIN profiles pf_uploader ON pf.uploaded_by = pf_uploader.id  -- Para project_files.uploaded_by
LEFT JOIN auth.users au_uploader ON pf.uploaded_by = au_uploader.id  -- Fallback para auth.users

GROUP BY p.id, p.name, p.client, p.description, p.location, p.contract_value, p.status, p.created_by, p.team, p.created_at, p.updated_at,
         p_creator.name, p_creator.email, au_creator.email;

-- 7. ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índice para busca por project_id convertido em project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id_converted 
ON project_members USING btree (project_id);

-- Índice para busca por project_id convertido em project_conducts
CREATE INDEX IF NOT EXISTS idx_project_conducts_project_id_converted 
ON project_conducts USING btree (project_id);

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION project_id_to_uuid(bigint) IS 
'Converte project.id (bigint) para UUID usando tabela de mapeamento project_id_map';

COMMENT ON FUNCTION uuid_to_project_id(uuid) IS 
'Converte UUID de volta para project.id (bigint) usando tabela de mapeamento project_id_map';

COMMENT ON VIEW v_projects_complete IS 
'View completa de projetos com todos os relacionamentos (members, activities, files, indicators, conducts) já agregados em JSON';

COMMENT ON FUNCTION add_project_member(bigint, uuid, text, uuid) IS 
'Adiciona membro a projeto, fazendo conversão automática de tipos bigint->uuid';

COMMENT ON FUNCTION remove_project_member(bigint, uuid) IS 
'Remove membro de projeto, fazendo conversão automática de tipos bigint->uuid';

COMMENT ON FUNCTION get_project_members(bigint) IS 
'Lista todos os membros de um projeto específico com dados do profile';

-- ==============================================
-- FIM DA CAMADA DE MAPEAMENTO
-- ==============================================
