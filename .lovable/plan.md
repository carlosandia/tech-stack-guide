
# Plano: Página de Planos com Stripe Checkout + Configuração de Trial

## Visão Geral

Implementar:
1. **Página `/planos`** - Landing page com cards de planos e checkout Stripe
2. **Configuração Global de Trial** - Ativar/desativar + definir dias
3. **Edge Function para Checkout** - Criar sessão do Stripe
4. **Edge Function Webhook** - Auto-criar organização após pagamento

---

## Parte 1: Configuração Global de Trial

### Alteração na Tab Stripe (ConfiguracoesGlobaisPage)

Adicionar novos campos na configuração do Stripe:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `trial_habilitado` | boolean | Ativar/desativar trial |
| `trial_dias` | number | Duração do trial (7, 14, 30) |

```text
┌─────────────────────────────────────────────────────────────┐
│ STRIPE                                          Configurado │
├─────────────────────────────────────────────────────────────┤
│ Publishable Key *                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ pk_live_...                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Secret Key *                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ●●●●●●●●●●●●●●●●●●●●                              [👁]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Webhook Secret                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ whsec_...                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ───────────────── Configurações de Trial ───────────────── │
│                                                             │
│ [✓] Permitir cadastro Trial                                 │
│                                                             │
│ Duração do Trial                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 14 dias                                            ▾   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Testar Conexão]                          [Salvar Alterações] │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 2: Página de Planos (`/planos`)

### URL Final

`crm.renovedigital.com.br/planos`

### Estrutura da Página

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   [LOGO]                                              [Já tem conta? Login] │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│             Escolha o plano ideal para seu negócio                          │
│          Comece grátis por 14 dias. Cancele quando quiser.                  │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   TRIAL     │  │   STARTER   │  │     PRO     │  │ ENTERPRISE  │        │
│   │             │  │             │  │  ★ Popular  │  │             │        │
│   │   Grátis    │  │  R$99/mês   │  │  R$249/mês  │  │  R$599/mês  │        │
│   │   14 dias   │  │             │  │             │  │             │        │
│   │             │  │             │  │             │  │             │        │
│   │ ✓ 2 usuários│  │ ✓ 5 usuários│  │ ✓ 15 users  │  │ ✓ 50 users  │        │
│   │ ✓ 100 leads │  │ ✓ 1000 leads│  │ ✓ 5000 leads│  │ ✓ Ilimitado │        │
│   │ ✓ 100MB     │  │ ✓ 1GB       │  │ ✓ 5GB       │  │ ✓ 20GB      │        │
│   │             │  │             │  │             │  │             │        │
│   │ [Começar]   │  │ [Assinar]   │  │ [Assinar]   │  │ [Assinar]   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tracking (UTMs e Pixels)

A página capturará automaticamente:
- UTM parameters da URL (`?utm_source=meta&utm_campaign=...`)
- Instalação de Meta Pixel e Google Tag para eventos de conversão

```typescript
// Exemplo de URL de campanha
crm.renovedigital.com.br/planos?utm_source=meta&utm_medium=cpc&utm_campaign=lancamento_crm

// Evento de conversão (após checkout)
fbq('track', 'Purchase', { value: 99.00, currency: 'BRL' });
gtag('event', 'conversion', { transaction_id: '...', value: 99.00 });
```

---

## Parte 3: Fluxo de Checkout

### Diagrama do Fluxo

```text
    USUÁRIO                    FRONTEND                EDGE FUNCTION              STRIPE
       │                           │                         │                       │
       │  Clica "Assinar Pro"      │                         │                       │
       ├──────────────────────────>│                         │                       │
       │                           │  POST /create-checkout  │                       │
       │                           ├────────────────────────>│                       │
       │                           │                         │  Create Session       │
       │                           │                         ├──────────────────────>│
       │                           │                         │                       │
       │                           │                         │<─────── session_url ──┤
       │                           │<──── { url } ───────────┤                       │
       │                           │                         │                       │
       │  Redirect Stripe Checkout │                         │                       │
       │<──────────────────────────┤                         │                       │
       │                           │                         │                       │
       │═══════ PAGAMENTO STRIPE ════════════════════════════════════════════════════│
       │                           │                         │                       │
       │                           │                         │  Webhook: completed   │
       │                           │                         │<──────────────────────┤
       │                           │                         │                       │
       │                           │                         │  [Criar Org + User]   │
       │                           │                         │  [Enviar Email]       │
       │                           │                         │                       │
       │  Redirect /sucesso        │                         │                       │
       │<══════════════════════════╪═════════════════════════╪═══════════════════════│
       │                           │                         │                       │
```

### Metadata no Checkout

```typescript
// Dados enviados ao Stripe
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: plano.stripe_price_id_mensal, quantity: 1 }],
  success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/planos`,
  metadata: {
    plano_id: 'uuid-do-plano',
    plano_nome: 'Pro',
    utm_source: 'meta',
    utm_medium: 'cpc',
    utm_campaign: 'lancamento_crm',
  },
});
```

---

## Parte 4: Edge Functions

### 1. `create-checkout-session`

Cria sessão de checkout do Stripe.

| Input | Output |
|-------|--------|
| `plano_id`, `periodo` (mensal/anual), UTMs | `{ url: string }` |

### 2. `stripe-webhook`

Processa eventos do Stripe:
- `checkout.session.completed` → Cria organização + usuário
- `invoice.paid` → Atualiza status
- `customer.subscription.deleted` → Cancela assinatura

### 3. `iniciar-trial`

Para o botão "Começar Trial":
- Coleta dados básicos (nome, email, empresa)
- Cria organização com status `trial`
- Define `trial_expira_em` baseado na configuração global

---

## Parte 5: Pré-requisitos Stripe

Antes de implementar, você precisa criar no Dashboard do Stripe:

| Item | Onde Criar | O que copiar |
|------|------------|--------------|
| **Products** | Stripe > Products | Criar 4 produtos (Trial, Starter, Pro, Enterprise) |
| **Prices** | Stripe > Products > Add Price | Copiar `price_id` mensal e anual |
| **Webhook** | Stripe > Developers > Webhooks | Copiar `whsec_...` |

### Configurar Webhook no Stripe

URL do Webhook: `https://<seu-projeto>.supabase.co/functions/v1/stripe-webhook`

Eventos a escutar:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/modules/public/pages/PlanosPage.tsx` | **Criar** - Página de planos |
| `src/modules/public/pages/CheckoutSucessoPage.tsx` | **Criar** - Página pós-checkout |
| `src/modules/public/pages/TrialCadastroPage.tsx` | **Criar** - Modal/página para trial |
| `src/modules/public/hooks/usePlanos.ts` | **Criar** - Hook para buscar planos |
| `src/modules/public/hooks/useCheckout.ts` | **Criar** - Hook para criar checkout |
| `supabase/functions/create-checkout-session/index.ts` | **Criar** - Edge function |
| `supabase/functions/stripe-webhook/index.ts` | **Criar** - Edge function |
| `supabase/functions/iniciar-trial/index.ts` | **Criar** - Edge function |
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | **Modificar** - Adicionar config Trial |
| `src/App.tsx` | **Modificar** - Adicionar rotas públicas |

---

## Banco de Dados

### Colunas já existentes (não precisa migração)

| Tabela | Coluna | Uso |
|--------|--------|-----|
| `organizacoes_saas` | `trial_expira_em` | Data de expiração do trial |
| `organizacoes_saas` | `status` | `trial`, `ativa`, `suspensa` |
| `planos` | `stripe_price_id_mensal` | ID do preço no Stripe |
| `planos` | `stripe_price_id_anual` | ID do preço anual |
| `configuracoes_globais` | `configuracoes` (JSONB) | Guardar `trial_habilitado`, `trial_dias` |

### Atualização necessária na tabela `planos`

Após criar os Products/Prices no Stripe, atualizar:

```sql
UPDATE planos SET 
  stripe_price_id_mensal = 'price_xxx',
  stripe_price_id_anual = 'price_yyy'
WHERE nome = 'Starter';
-- Repetir para Pro e Enterprise
```

---

## Sequência de Implementação

1. **Configuração Trial** - Atualizar ConfiguracoesGlobaisPage com toggle e dias
2. **Edge Functions** - Criar as 3 functions (checkout, webhook, trial)
3. **Página de Planos** - Criar PlanosPage com cards e botões
4. **Página de Sucesso** - Criar CheckoutSucessoPage
5. **Rotas** - Adicionar rotas públicas no App.tsx
6. **Testes** - Testar fluxo completo com Stripe Test Mode

---

## Segurança

| Aspecto | Implementação |
|---------|---------------|
| Stripe Secret Key | Armazenada como secret no Supabase, nunca exposta |
| Webhook | Validação de assinatura Stripe |
| Checkout | Sessão criada server-side, apenas URL retornada |
| Trial | Rate limit para evitar abusos |

---

## Métricas e Tracking

A página de planos incluirá:

```typescript
// Meta Pixel
<script>
  fbq('init', 'SEU_PIXEL_ID');
  fbq('track', 'PageView');
</script>

// Google Tag
<script>
  gtag('config', 'G-XXXXXXXX');
</script>

// Evento de conversão (na página de sucesso)
fbq('track', 'Purchase', { value, currency: 'BRL' });
gtag('event', 'purchase', { transaction_id, value });
```
