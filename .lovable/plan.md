
# Plano: Corrigir Envio de Email de Convite e Exibição de Usuários

## Problemas Identificados

### Problema 1: Email de Convite Não É Enviado
O campo `enviar_convite` é passado no payload, mas a função `criarOrganizacao` em `admin.api.ts` **NÃO implementa nenhuma lógica** para:
1. Criar o usuário no Supabase Auth (`auth.users`)
2. Enviar email de convite para definir senha
3. Linkar o usuário da tabela `usuarios` com `auth.users` via `auth_id`

Atualmente, apenas cria um registro na tabela `usuarios` com status "pendente", sem conexão com o sistema de autenticação.

### Problema 2: Usuários Não Aparecem na Tab
A RLS da tabela `usuarios` exige que o super_admin seja verificado via `is_super_admin_v2()`. Porém, a query de listagem pode estar falhando devido a dependências entre políticas. No network request, vemos que a query de organizações retorna array vazio, indicando problema de permissão.

---

## Solução Proposta

### Parte 1: Edge Function para Envio de Convite

Criar edge function `invite-admin` que:
1. Recebe dados do administrador
2. Usa `supabase.auth.admin.inviteUserByEmail()` para criar usuário e enviar email
3. Atualiza o registro em `usuarios` com o `auth_id` retornado

### Parte 2: Atualizar Lógica de Criação

Modificar `criarOrganizacao` para:
1. Criar registro em `usuarios` normalmente
2. Se `enviar_convite = true`: chamar edge function de convite
3. Se `enviar_convite = false`: criar usuário no auth com senha fornecida

### Parte 3: Corrigir RLS para Super Admin

Adicionar política mais permissiva para SELECT em `usuarios` que permita super_admin ver todos os usuários.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/invite-admin/index.ts` | CRIAR - Edge function para convite |
| `src/modules/admin/services/admin.api.ts` | MODIFICAR - Chamar edge function |
| Migration SQL | CRIAR - Corrigir RLS da tabela usuarios |

---

## Detalhes Técnicos

### 1. Edge Function `invite-admin`

```typescript
// supabase/functions/invite-admin/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { email, nome, sobrenome, usuario_id, organizacao_id } = await req.json();

  // Criar usuário via invite
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        nome,
        sobrenome,
        role: 'admin',
        tenant_id: organizacao_id,
      },
      redirectTo: `${req.headers.get("origin")}/auth/set-password`
    }
  );

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Atualizar registro em usuarios com auth_id
  await supabaseAdmin
    .from("usuarios")
    .update({ auth_id: authUser.user.id, status: "pendente" })
    .eq("id", usuario_id);

  return new Response(JSON.stringify({ success: true, auth_id: authUser.user.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

### 2. Atualizar `criarOrganizacao` (admin.api.ts)

Após criar o admin na tabela `usuarios`:

```typescript
// Se enviar_convite = true, chamar edge function
if (payload.enviar_convite) {
  const response = await fetch(
    `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/invite-admin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        email: payload.admin_email,
        nome: payload.admin_nome,
        sobrenome: payload.admin_sobrenome,
        usuario_id: adminUser.id,
        organizacao_id: org.id,
      }),
    }
  );

  if (!response.ok) {
    console.warn("Erro ao enviar convite:", await response.text());
    // Não aborta a criação, apenas loga o erro
  }
}
```

### 3. Migration para RLS

```sql
-- Permitir super_admin ver TODOS os usuarios (SELECT)
DROP POLICY IF EXISTS super_admin_usuarios_select ON usuarios;

CREATE POLICY super_admin_usuarios_select ON usuarios
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
  OR auth_id = auth.uid()
  OR organizacao_id IN (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
  )
);
```

---

## Fluxo Corrigido

```text
Wizard Etapa 3: Admin
  -> admin_nome, admin_sobrenome, admin_email, enviar_convite ✓

Submit:
  1. INSERT organizacoes_saas
  2. INSERT usuarios (status = pendente)
  3. INSERT assinaturas
  4. SE enviar_convite = true:
     -> Chama edge function invite-admin
     -> Supabase envia email "Definir sua senha"
     -> Atualiza usuarios.auth_id
  5. Retorna sucesso

Admin recebe email:
  -> Clica no link
  -> Define senha em /auth/set-password
  -> Login funciona
```

---

## Verificação Pós-Implementação

1. Criar organização com "Enviar convite" marcado
2. Verificar que email foi enviado para o admin
3. Acessar página de detalhes da organização
4. Verificar que tab "Usuários" mostra o admin corretamente
5. Admin define senha pelo link do email
6. Admin consegue fazer login
