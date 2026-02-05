-- Corrigir política de INSERT na tabela assinaturas para usar user_roles
DROP POLICY IF EXISTS assinaturas_insert_policy ON assinaturas;

CREATE POLICY assinaturas_insert_policy ON assinaturas
FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);