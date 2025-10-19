-- =====================================================
-- Adicionar campo de telefone na tabela profiles
-- =====================================================

-- Adicionar coluna de telefone
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN profiles.phone IS 'Número de telefone do usuário (formato livre)';
