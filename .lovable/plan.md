
# Implementacao: Senha Aleatoria + Correcao Recuperacao de Senha

## Resumo

Tres alteracoes principais conforme plano aprovado:

### 1. Refatorar `supabase/functions/invite-admin/index.ts`

Substituir completamente a logica de convite por link/token por:

- **Gerador de senha segura**: funcao `generateSecurePassword(12)` usando `crypto.getRandomValues()` com maiusculas, minusculas, numeros e caracteres especiais
- **Criacao do usuario**: trocar `generateLink(type: "invite")` por `supabase.auth.admin.createUser()` com a senha gerada e `email_confirm: true`
- **Status ativo**: atualizar usuario na tabela `usuarios` para `status: 'ativo'` (nao mais `'pendente'`)
- **Se usuario ja existe**: usar `updateUser()` com a nova senha ao inves de magiclink
- **Novo template de email**: email de "Boas-vindas" mostrando credenciais (email + senha temporaria), botao "Acessar o CRM" apontando para `/login`, e aviso LGPD sobre troca de senha no primeiro acesso
- **Subject do email**: "Bem-vindo ao CRM Renove - Seus dados de acesso"
- **Remover**: toda logica de `generateLink`, `magiclink`, `tokenHash`, `confirmUrl`, aviso de 24h

### 2. Corrigir `supabase/functions/send-password-reset/index.ts`

- Adicionar `status` no select da query de usuarios (linha ~311)
- Apos verificar que o usuario existe, checar se `status === 'ativo'`
- Se status diferente de `'ativo'`, retornar `{ success: false, error: "user_not_active" }` com status 400

### 3. Atualizar `src/modules/auth/pages/ForgotPasswordPage.tsx`

- Tratar o novo erro `user_not_active` no `onSubmit`
- Exibir mensagem: "Esta conta ainda nao foi ativada. Entre em contato com o administrador."

## Arquivos alterados

| Arquivo | Tipo de alteracao |
|---------|-------------------|
| `supabase/functions/invite-admin/index.ts` | Reescrita completa da logica de criacao + template email |
| `supabase/functions/send-password-reset/index.ts` | Adicionar verificacao de status ativo |
| `src/modules/auth/pages/ForgotPasswordPage.tsx` | Tratar erro user_not_active |

## Deploy

As edge functions serao redeployadas automaticamente apos as alteracoes.
