-- =====================================================
-- FIX: Dependência circular nas políticas RLS de profiles
-- =====================================================
-- Problema: A política "Admins can manage all profiles" consulta
-- a própria tabela profiles para verificar role, causando loop
-- infinito e timeout nas consultas.
--
-- Solução: Simplificar políticas para evitar auto-referência
-- =====================================================

-- Remover políticas existentes que causam dependência circular
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Política 2: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Política 3: Permitir INSERT de novos perfis (para signup)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Política 4: Admins/Managers podem ver todos os perfis
-- IMPORTANTE: Usar user_metadata do auth.users ao invés de consultar profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (
    -- Permitir se é o próprio usuário
    auth.uid() = id
    OR
    -- Permitir se é admin/manager (verificar via metadata ou email específico)
    (
      auth.email() IN (
        'admin@exxata.com',
        'andre.marquito@exxata.com.br'
      )
    )
  );

-- Política 5: Admins/Managers podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    -- Permitir se é o próprio usuário
    auth.uid() = id
    OR
    -- Permitir se é admin/manager
    (
      auth.email() IN (
        'admin@exxata.com',
        'andre.marquito@exxata.com.br'
      )
    )
  );

-- Política 6: Admins podem deletar perfis
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE 
  USING (
    auth.email() IN (
      'admin@exxata.com',
      'andre.marquito@exxata.com.br'
    )
  );

-- =====================================================
-- NOTA: Esta solução usa verificação por email específico
-- ao invés de consultar a tabela profiles, evitando
-- dependência circular. Para uma solução mais escalável,
-- considere usar custom claims no JWT ou uma função
-- PostgreSQL que não dependa de RLS.
-- =====================================================
