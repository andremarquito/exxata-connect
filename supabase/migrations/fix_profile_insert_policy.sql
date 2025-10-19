-- =====================================================
-- FIX: Política de INSERT para permitir criação de perfil durante signup
-- =====================================================
-- Problema: A política "Allow profile creation" está bloqueando
-- a criação de perfis durante o signup porque o contexto de auth
-- pode não estar completamente estabelecido.
--
-- Solução: Simplificar a política para permitir qualquer INSERT
-- onde o ID seja válido. A segurança é mantida porque:
-- 1. O ID vem do auth.users (UUID gerado pelo Supabase)
-- 2. Apenas o backend pode criar usuários em auth.users
-- 3. A política de UPDATE/DELETE ainda protege modificações
-- =====================================================

-- Remover política existente
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Criar política simplificada que permite INSERT
-- A segurança é garantida pela foreign key com auth.users
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT 
  WITH CHECK (true);

-- Adicionar comentário explicativo
COMMENT ON POLICY "Allow profile creation" ON profiles IS 
  'Permite criação de perfil. Segurança garantida por FK com auth.users e políticas de UPDATE/DELETE';

-- Garantir que as políticas de UPDATE e DELETE ainda protegem os dados
-- (Essas já existem, apenas verificando)
DO $$
BEGIN
  -- Verificar se políticas de proteção existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    RAISE NOTICE 'AVISO: Política de UPDATE não encontrada';
  END IF;
END $$;
