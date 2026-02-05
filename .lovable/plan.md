
# Plano de Implementação: Sistema de Email Personalizado para Convites de Admin

## Objetivo
Implementar um sistema completo de convite por email personalizado usando Auth Hook do Supabase + Resend, com template em PT-BR seguindo o Design System e página dedicada para definição de senha dentro do CRM.

---

## Visão Geral da Arquitetura

```text
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  invite-admin    │────►│  Supabase Auth      │────►│  Auth Hook       │
│  (Edge Function) │     │  inviteUserByEmail  │     │  send-invite-email│
└──────────────────┘     └─────────────────────┘     └────────┬─────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Resend API      │
                                                     │  (Email Custom)  │
                                                     └────────┬─────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Email Inbox     │
                                                     │  (Admin Convidado)│
                                                     └────────┬─────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  /auth/set-password│
                                                     │  (Pagina CRM)    │
                                                     └──────────────────┘
```

---

## Etapas de Implementação

### Etapa 1: Configuração do Secret RESEND_API_KEY
**Dependência**: Usuário precisa fornecer a API Key do Resend

- Solicitar ao usuário que crie conta no Resend (https://resend.com)
- Verificar domínio no Resend (https://resend.com/domains)
- Gerar API Key (https://resend.com/api-keys)
- Adicionar secret `RESEND_API_KEY` via ferramenta de secrets

---

### Etapa 2: Edge Function `send-invite-email`
**Arquivo**: `supabase/functions/send-invite-email/index.ts`

Cria uma Edge Function que:
- Recebe dados via Auth Hook (user, email_action_type)
- Renderiza template React Email personalizado
- Envia via Resend com branding do CRM

Parâmetros esperados do Auth Hook:
- `user.email` - Email do destinatário
- `user.user_metadata` - Dados customizados (nome, sobrenome, organizacao)
- `email_data.token` - Token OTP
- `email_data.token_hash` - Hash para URL de verificação
- `email_data.redirect_to` - URL de redirecionamento

---

### Etapa 3: Template de Email React
**Arquivo**: `supabase/functions/send-invite-email/_templates/invite-admin.tsx`

Template visual seguindo o Design System:
- Cores: Primary `#3B82F6`, Background `#FFFFFF`, Text `#0F172A`
- Tipografia: Inter font family
- Border-radius: `8px` para botões
- Logo do CRM no topo
- Mensagem de boas-vindas personalizada
- Botão CTA "Definir Minha Senha"
- Informações de expiração e suporte

Estrutura do email:
```text
┌────────────────────────────────┐
│          [LOGO CRM]            │
├────────────────────────────────┤
│                                │
│  Olá, {nome}!                  │
│                                │
│  Você foi convidado para       │
│  acessar o CRM como            │
│  Administrador da organização  │
│  {nome_organizacao}.           │
│                                │
│  ┌────────────────────────┐    │
│  │  DEFINIR MINHA SENHA   │    │
│  └────────────────────────┘    │
│                                │
│  Este link expira em 24 horas. │
│                                │
├────────────────────────────────┤
│  CRM Renove © 2026             │
│  Se precisar de ajuda...       │
└────────────────────────────────┘
```

---

### Etapa 4: Página `/auth/set-password`
**Arquivo**: `src/modules/auth/pages/SetPasswordPage.tsx`

Cria página dedicada para administradores convidados:
- Processa token da URL (via Supabase `verifyOtp` ou `exchangeCodeForSession`)
- Formulário de definição de senha com:
  - Campo "Nova Senha"
  - Campo "Confirmar Senha"
  - Checklist de requisitos em tempo real
- Após sucesso, redireciona para login com mensagem

Visual seguindo o Design System:
- Card centralizado com `rounded-lg`
- Inputs com `rounded-md`
- Botão primary `bg-primary text-primary-foreground`
- Gradiente de fundo `from-muted to-muted/50`

---

### Etapa 5: Configuração do Auth Hook no Supabase
**Arquivo**: `supabase/config.toml`

Adicionar configuração para interceptar eventos de email:

```toml
[functions.send-invite-email]
verify_jwt = false
```

**Nota**: O Auth Hook precisa ser configurado manualmente no Dashboard do Supabase:
- Authentication → Hooks → Enable email hook
- Selecionar a função `send-invite-email`

---

### Etapa 6: Atualização da Edge Function `invite-admin`
**Arquivo**: `supabase/functions/invite-admin/index.ts`

Modificações:
- Ajustar `redirectTo` para usar a nova rota `/auth/set-password`
- Incluir dados extras no `user_metadata`:
  - `organizacao_nome` - Nome da organização
  - `invite_type` - Tipo do convite ("admin")

---

### Etapa 7: Atualização de Rotas
**Arquivo**: `src/App.tsx`

Adicionar nova rota pública:
```tsx
<Route path="/auth/set-password" element={<SetPasswordPage />} />
```

---

### Etapa 8: Atualização do Módulo Auth
**Arquivo**: `src/modules/auth/index.ts`

Exportar nova página:
```tsx
export { SetPasswordPage } from './pages/SetPasswordPage'
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/send-invite-email/index.ts` | Edge function principal para envio de emails |
| `supabase/functions/send-invite-email/_templates/invite-admin.tsx` | Template React Email |
| `src/modules/auth/pages/SetPasswordPage.tsx` | Página de definição de senha |

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/config.toml` | Adicionar config da nova function |
| `supabase/functions/invite-admin/index.ts` | Atualizar redirectTo e metadata |
| `src/App.tsx` | Adicionar rota `/auth/set-password` |
| `src/modules/auth/index.ts` | Exportar SetPasswordPage |

---

## Configurações Manuais Necessárias

### 1. Resend (pelo usuário)
1. Criar conta em https://resend.com
2. Verificar domínio em https://resend.com/domains
3. Gerar API Key em https://resend.com/api-keys
4. Fornecer chave para adicionar como secret

### 2. Supabase Dashboard (pelo usuário)
1. Ir em Authentication → Hooks
2. Habilitar "Send email" hook
3. Selecionar função `send-invite-email`
4. Gerar e salvar `SEND_EMAIL_HOOK_SECRET`

### 3. URL Configuration no Supabase
Verificar em Authentication → URL Configuration:
- Site URL: URL do preview/produção
- Redirect URLs: Adicionar URLs permitidas

---

## Fluxo Completo Após Implementação

1. Super Admin cria organização via wizard
2. Sistema chama `invite-admin` com dados do admin
3. `invite-admin` chama `supabaseAdmin.auth.admin.inviteUserByEmail()`
4. Supabase Auth dispara Auth Hook → `send-invite-email`
5. `send-invite-email` renderiza template e envia via Resend
6. Admin recebe email personalizado em PT-BR
7. Admin clica "Definir Minha Senha"
8. Redireciona para `/auth/set-password?token_hash=xxx`
9. Página valida token e permite definir senha
10. Após definir senha, redireciona para `/login`
11. Admin faz login e acessa o CRM

---

## Detalhes Técnicos

### Validação do Token na SetPasswordPage

A página utilizará o método `supabase.auth.verifyOtp()` ou processsará o token via `getSession()` dependendo do tipo de token recebido:

```typescript
// Para tokens do tipo "invite"
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: tokenHash,
  type: 'invite'
})
```

### Requisitos de Senha (mesmo padrão do ResetPasswordPage)

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número

### CORS Headers da Edge Function

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type...',
}
```

---

## Checklist de Validação

Após implementação, validar:

- [ ] Email chega com template personalizado em PT-BR
- [ ] Link do email redireciona para `/auth/set-password`
- [ ] Página exibe formulário de definição de senha
- [ ] Validação de requisitos funciona em tempo real
- [ ] Após definir senha, usuário consegue fazer login
- [ ] Status do usuário muda de "pendente" para "ativo"
