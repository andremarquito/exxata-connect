-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA DO SUPABASE
-- Exxata Connect - Sistema de Gestão de Projetos
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE PROFILES (USUÁRIOS)
-- =====================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant', 'client', 'cliente')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pendente', 'Inativo')),
  
  -- Campos de convite
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Campos de senha
  has_custom_password BOOLEAN DEFAULT FALSE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  password_reset_at TIMESTAMP WITH TIME ZONE,
  password_reset_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver e gerenciar todos os profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
  );

-- =====================================================
-- 2. TABELA DE PROJETOS
-- =====================================================

CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  sector TEXT,
  location TEXT,
  description TEXT,
  
  -- Datas
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Valores financeiros
  contract_value DECIMAL(15,2),
  hourly_rate DECIMAL(10,2),
  disputed_amount DECIMAL(15,2),
  contract_summary TEXT,
  
  -- Progresso
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  billing_progress INTEGER DEFAULT 0 CHECK (billing_progress >= 0 AND billing_progress <= 100),
  
  -- Status
  status TEXT DEFAULT 'Em Andamento' CHECK (status IN ('Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado')),
  
  -- Configurações
  exxata_activities TEXT[], -- Array de atividades Exxata
  overview_config JSONB DEFAULT '{"widgets": [], "layouts": {}}'::jsonb,
  
  -- Auditoria
  created_by UUID REFERENCES profiles(id) NOT NULL,
  updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 3. TABELA DE MEMBROS DO PROJETO
-- =====================================================

CREATE TABLE project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id),
  
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- RLS E POLÍTICAS PARA PROJECTS E PROJECT_MEMBERS
-- =====================================================

-- RLS para projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS para project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Políticas para projects
CREATE POLICY "Users can view projects they have access to" ON projects
  FOR SELECT USING (
    -- Admin/Manager podem ver todos
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente')
    )
    OR 
    -- Ou usuário está na equipe do projeto
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
    OR
    -- Ou é o criador do projeto
    created_by = auth.uid()
  );

CREATE POLICY "Authorized users can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant')
    )
  );

-- Políticas para project_members
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id
      AND (
        -- Admin/Manager podem ver
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'administrador', 'manager', 'gerente')
        )
        OR 
        -- Ou é membro do projeto
        EXISTS (
          SELECT 1 FROM project_members pm2
          WHERE pm2.project_id = projects.id 
          AND pm2.user_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- 4. TABELA DE ATIVIDADES
-- =====================================================

CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  custom_id TEXT, -- ID customizável pelo usuário
  seq INTEGER, -- Sequência numérica automática
  title TEXT NOT NULL,
  description TEXT,
  
  -- Responsabilidade
  assigned_to TEXT, -- Nome do responsável
  assigned_user_id UUID REFERENCES profiles(id), -- ID do usuário (opcional)
  
  -- Datas
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Progresso', 'Concluída', 'Pausada', 'Cancelada')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Índices para ordenação
  CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- Índices para activities
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_seq ON activities(project_id, seq);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_assigned_to ON activities(assigned_to);

-- RLS para activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities of accessible projects" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = activities.project_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'administrador', 'manager', 'gerente')
        )
        OR 
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id 
          AND user_id = auth.uid()
        )
        OR
        projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage activities" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant')
    )
  );

-- =====================================================
-- 5. TABELA DE ARQUIVOS
-- =====================================================

CREATE TABLE project_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Metadados do arquivo
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT,
  
  -- Storage
  storage_path TEXT NOT NULL, -- Caminho no Supabase Storage
  storage_bucket TEXT DEFAULT 'project-files',
  
  -- Classificação
  source TEXT DEFAULT 'exxata' CHECK (source IN ('client', 'exxata')),
  category TEXT DEFAULT 'document',
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Metadados extras
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para project_files
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_source ON project_files(source);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);

-- RLS para project_files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of accessible projects" ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_files.project_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'administrador', 'manager', 'gerente')
        )
        OR 
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id 
          AND user_id = auth.uid()
        )
        OR
        projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage files" ON project_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant')
    )
  );

-- =====================================================
-- 6. TABELA DE INDICADORES/GRÁFICOS
-- =====================================================

CREATE TABLE project_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuração do gráfico
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bar', 'bar-horizontal', 'line', 'pie')),
  
  -- Dados do gráfico (JSON)
  datasets JSONB NOT NULL DEFAULT '[]'::jsonb,
  labels JSONB DEFAULT '[]'::jsonb,
  
  -- Configurações de exibição
  colors TEXT[] DEFAULT ARRAY['#09182b', '#d51d07', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);

-- Índices para project_indicators
CREATE INDEX idx_project_indicators_project_id ON project_indicators(project_id);
CREATE INDEX idx_project_indicators_order ON project_indicators(project_id, display_order);

-- RLS para project_indicators
ALTER TABLE project_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicators of accessible projects" ON project_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_indicators.project_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'administrador', 'manager', 'gerente')
        )
        OR 
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id 
          AND user_id = auth.uid()
        )
        OR
        projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage indicators" ON project_indicators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant')
    )
  );

-- =====================================================
-- 7. TABELA DE CONDUTAS (INTELIGÊNCIA HUMANA)
-- =====================================================

CREATE TABLE project_conducts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal' CHECK (urgency IN ('Baixa', 'Normal', 'Alta', 'Crítica')),
  
  -- Ordenação
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);

-- Índices para project_conducts
CREATE INDEX idx_project_conducts_project_id ON project_conducts(project_id);
CREATE INDEX idx_project_conducts_order ON project_conducts(project_id, display_order);

-- RLS para project_conducts
ALTER TABLE project_conducts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conducts of accessible projects" ON project_conducts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_conducts.project_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'administrador', 'manager', 'gerente')
        )
        OR 
        EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_id = projects.id 
          AND user_id = auth.uid()
        )
        OR
        projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage conducts" ON project_conducts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'administrador', 'manager', 'gerente', 'collaborator', 'colaborador', 'consultor', 'consultant')
    )
  );

-- =====================================================
-- 8. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_indicators_updated_at BEFORE UPDATE ON project_indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_conducts_updated_at BEFORE UPDATE ON project_conducts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'cliente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para auto-incrementar seq em activities
CREATE OR REPLACE FUNCTION set_activity_seq()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seq IS NULL THEN
    SELECT COALESCE(MAX(seq), 0) + 1 INTO NEW.seq
    FROM activities 
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_activity_seq_trigger
  BEFORE INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION set_activity_seq();

-- =====================================================
-- 9. CONFIGURAR STORAGE BUCKETS
-- =====================================================

-- Criar bucket para arquivos de projeto
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. POLÍTICAS DO STORAGE (DEPOIS DE TODAS AS TABELAS)
-- =====================================================

-- Política de acesso ao storage
CREATE POLICY "Users can upload files to projects they have access to" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files' AND
    EXISTS (
      SELECT 1 FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = p.id::text
    )
  );

CREATE POLICY "Users can view files from accessible projects" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files' AND
    EXISTS (
      SELECT 1 FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = p.id::text
    )
  );

-- =====================================================
-- 11. DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir usuário admin inicial (será criado via trigger quando fizer signup)
-- Para criar usuários via SQL, você precisa usar a API do Supabase Auth

-- =====================================================
-- SCRIPT COMPLETO - EXECUTE NO SQL EDITOR DO SUPABASE
-- =====================================================

-- Comentários finais:
-- 1. Execute este script no SQL Editor do seu projeto Supabase
-- 2. Configure as variáveis de ambiente no seu .env
-- 3. Teste a conexão localmente
-- 4. Implemente as funções de migração de dados do localStorage
