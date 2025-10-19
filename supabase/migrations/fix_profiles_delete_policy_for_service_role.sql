-- Remover a política antiga de DELETE que verifica apenas emails específicos
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Criar nova política de DELETE que permite:
-- 1. Service role (usado pelas Edge Functions) pode deletar qualquer profile
-- 2. Admins autenticados podem deletar profiles (exceto o próprio)
CREATE POLICY "Allow delete for service role and admins"
ON profiles
FOR DELETE
USING (
  -- Service role sempre pode deletar (auth.uid() será NULL para service role)
  auth.uid() IS NULL
  OR
  -- Ou usuário autenticado é admin e não está deletando a si mesmo
  (
    auth.email() = ANY (ARRAY['admin@exxata.com', 'andre.marquito@exxata.com.br'])
    AND auth.uid() != id
  )
);
