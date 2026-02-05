
# Plano: Onboarding Pós-Checkout com Formulário Completo

## Resumo

Criar uma página `/onboarding` que recebe o usuário após o pagamento (ou trial com cartão) e coleta:
- **Nome da empresa** (obrigatório) - será o nome da organização
- **Segmento** (opcional)
- **Nome do admin** (obrigatório)
- **Sobrenome do admin** (obrigatório)
- **Email do admin** (obrigatório - pré-preenchido do Stripe)
- **Telefone do admin** (obrigatório)
- **Senha** (obrigatório) - definida pelo usuário

---

## Fluxo Visual

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────────────┐
│  /planos    │ --> │  Stripe Checkout │ --> │  /onboarding?session_id=xxx     │
│  Escolhe    │     │  (paga ou trial) │     │                                 │
│  plano      │     │                  │     │  ┌─────────────────────────┐    │
└─────────────┘     └──────────────────┘     │  │ Nome da Empresa *       │    │
                                              │  │ [________________]      │    │
                                              │  │                         │    │
                                              │  │ Segmento                │    │
                                              │  │ [▼ Selecione...]        │    │
                                              │  │                         │    │
                                              │  │ Nome *    Sobrenome *   │    │
                                              │  │ [_______] [__________]  │    │
                                              │  │                         │    │
                                              │  │ Email (preenchido)      │    │
                                              │  │ [email@exemplo.com] 🔒  │    │
                                              │  │                         │    │
                                              │  │ Telefone *              │    │
                                              │  │ [(11) 99999-9999]       │    │
                                              │  │                         │    │
                                              │  │ Senha *                 │    │
                                              │  │ [••••••••] 👁           │    │
                                              │  │ Min. 8 caracteres       │    │
                                              │  │                         │    │
                                              │  │ [Criar minha conta]     │    │
                                              │  └─────────────────────────┘    │
                                              └─────────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌───────────────────────────────┐
                                              │ /app (Dashboard)              │
                                              │ Logado automaticamente        │
                                              │ role: admin                   │
                                              └───────────────────────────────┘
```

---

## Componentes a Criar/Modificar

### Frontend

| Arquivo | Ação |
|---------|------|
| `src/modules/public/pages/OnboardingPage.tsx` | **CRIAR** - Formulário completo |
| `src/modules/public/schemas/onboarding.schema.ts` | **CRIAR** - Schema Zod de validação |
| `src/modules/public/index.ts` | Exportar OnboardingPage |
| `src/App.tsx` | Adicionar rota `/onboarding` |
| `supabase/functions/create-checkout-session/index.ts` | Mudar success_url para `/onboarding` |
| `src/modules/public/pages/PlanosPage.tsx` | Trial também vai pro Stripe com `trial_period_days` |

### Edge Functions

| Arquivo | Ação |
|---------|------|
| `supabase/functions/get-checkout-session/index.ts` | **CRIAR** - Busca dados da sessão |
| `supabase/functions/complete-onboarding/index.ts` | **CRIAR** - Finaliza cadastro completo |
| `supabase/functions/create-checkout-session/index.ts` | Adicionar suporte a trial com cartão |
| `supabase/config.toml` | Registrar novas functions |

---

## Detalhes Técnicos

### 1. Schema de Validação (onboarding.schema.ts)

```typescript
import { z } from 'zod'

export const SEGMENTOS_ONBOARDING = [
  { value: 'software', label: 'Software/Tecnologia' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'industria', label: 'Indústria' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'marketing', label: 'Marketing/Agência' },
  { value: 'outro', label: 'Outro' },
] as const

export const OnboardingSchema = z.object({
  nome_empresa: z
    .string()
    .min(2, 'Nome da empresa deve ter no mínimo 2 caracteres')
    .max(255, 'Nome da empresa deve ter no máximo 255 caracteres'),
  segmento: z.string().optional(),
  admin_nome: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres'),
  admin_sobrenome: z
    .string()
    .min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
  admin_email: z.string().email('Email inválido'),
  admin_telefone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  senha: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>
```

### 2. Edge Function: get-checkout-session

```typescript
// Input: { session_id: string }
// Output: { customer_email, plano_id, plano_nome, is_trial, periodo }

const session = await stripe.checkout.sessions.retrieve(session_id)

// Verificar se sessão é válida e não foi usada
const { data: existing } = await supabase
  .from('checkout_sessions_pendentes')
  .select('status')
  .eq('stripe_session_id', session_id)
  .single()

if (existing?.status === 'concluido') {
  throw new Error('Esta sessão já foi utilizada')
}

// Registrar sessão se primeira vez
if (!existing) {
  await supabase.from('checkout_sessions_pendentes').insert({
    stripe_session_id: session_id,
    customer_email: session.customer_email,
    plano_id: session.metadata.plano_id,
    is_trial: session.metadata.is_trial === 'true',
    status: 'pendente',
    metadata: session.metadata,
  })
}

return {
  customer_email: session.customer_email,
  plano_id: session.metadata.plano_id,
  plano_nome: session.metadata.plano_nome,
  is_trial: session.metadata.is_trial === 'true',
  periodo: session.metadata.periodo,
}
```

### 3. Edge Function: complete-onboarding

```typescript
// Input
interface CompleteOnboardingInput {
  session_id: string
  nome_empresa: string
  segmento?: string
  admin_nome: string
  admin_sobrenome: string
  admin_email: string
  admin_telefone: string
  senha: string
}

// Processo
1. Buscar sessão do Stripe
2. Verificar se não foi usada (tabela checkout_sessions_pendentes)
3. Buscar dados do plano selecionado
4. Criar organização com:
   - nome: nome_empresa
   - segmento: segmento || null
   - email: admin_email
   - telefone: admin_telefone
   - plano: plano.nome.toLowerCase()
   - status: is_trial ? 'trial' : 'ativa'
   - limite_usuarios: plano.limite_usuarios
   - limite_oportunidades: plano.limite_oportunidades
   - limite_storage_mb: plano.limite_storage_mb
   - trial_expira_em: is_trial ? now + 14 dias : null
5. Criar usuário no Supabase Auth com senha fornecida
6. Criar registro na tabela usuarios (role: admin)
7. Criar assinatura
8. Marcar checkout_session como 'concluido'
9. Fazer login e retornar tokens

// Output
{
  success: true,
  access_token: string,
  refresh_token: string,
  organizacao_id: string,
}
```

### 4. OnboardingPage.tsx (resumido)

```tsx
export function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  
  // Estados
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form com react-hook-form + zod
  const form = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingSchema),
  })
  
  // Buscar dados da sessão
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.functions.invoke('get-checkout-session', {
        body: { session_id: sessionId }
      })
      if (data) {
        setSessionData(data)
        form.setValue('admin_email', data.customer_email)
      }
      setLoading(false)
    }
    if (sessionId) fetchSession()
    else navigate('/planos') // Sem session_id, volta
  }, [sessionId])
  
  // Submit
  async function onSubmit(formData: OnboardingData) {
    setSubmitting(true)
    
    const { data, error } = await supabase.functions.invoke('complete-onboarding', {
      body: { session_id: sessionId, ...formData }
    })
    
    if (data?.access_token) {
      // Login automático
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      navigate('/app')
    }
  }
  
  // UI seguindo design system
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header com logo */}
      {/* Card centralizado com formulário */}
      {/* Campos conforme especificado */}
      {/* Botão "Criar minha conta" */}
    </div>
  )
}
```

### 5. Atualização create-checkout-session

```typescript
// Adicionar suporte a trial com cartão
const { plano_id, periodo, email, is_trial, utms } = body

// Para trial: usar trial_period_days do Stripe
const sessionParams = {
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  customer_email: email,
  // MUDANÇA: success_url vai para /onboarding
  success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/planos`,
  // Se for trial, adiciona período de teste
  ...(is_trial && {
    subscription_data: {
      trial_period_days: trialDias, // ex: 14
    },
  }),
  metadata: {
    plano_id,
    plano_nome: plano.nome,
    periodo,
    is_trial: is_trial ? 'true' : 'false',
    ...utms,
  },
}
```

### 6. Atualização PlanosPage

```tsx
// Botão "Começar Trial" agora vai pro Stripe também
const handleTrial = async () => {
  setCheckoutLoading('trial')
  
  // Buscar plano Trial
  const { data: planoTrial } = await supabase
    .from('planos')
    .select('id')
    .or('nome.eq.Trial,preco_mensal.eq.0')
    .single()
  
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      plano_id: planoTrial?.id,
      periodo: 'mensal',
      is_trial: true, // Flag para trial
      utms,
    },
  })
  
  if (data?.url) window.location.href = data.url
}
```

---

## Migração SQL

```sql
-- Tabela para rastrear sessões de checkout pendentes
CREATE TABLE IF NOT EXISTS checkout_sessions_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  plano_id UUID REFERENCES planos(id),
  is_trial BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, concluido, expirado
  metadata JSONB,
  criado_em TIMESTAMPTZ DEFAULT now(),
  concluido_em TIMESTAMPTZ
);

-- Index para buscas rápidas
CREATE INDEX idx_checkout_sessions_stripe_id ON checkout_sessions_pendentes(stripe_session_id);

-- RLS: apenas service_role pode acessar
ALTER TABLE checkout_sessions_pendentes ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas - apenas edge functions com service_role
```

---

## Arquivos a Criar

1. `src/modules/public/schemas/onboarding.schema.ts`
2. `src/modules/public/pages/OnboardingPage.tsx`
3. `supabase/functions/get-checkout-session/index.ts`
4. `supabase/functions/complete-onboarding/index.ts`
5. Migração SQL

## Arquivos a Modificar

1. `supabase/functions/create-checkout-session/index.ts`
2. `src/modules/public/pages/PlanosPage.tsx`
3. `src/modules/public/index.ts`
4. `src/App.tsx`
5. `supabase/config.toml`

---

## Fluxos Finais

### Assinatura Paga

1. Usuário escolhe plano em `/planos`
2. Clica "Assinar" → Stripe Checkout
3. Paga com cartão
4. Redirecionado para `/onboarding?session_id=xxx`
5. Preenche: empresa, segmento, nome, sobrenome, telefone, senha
6. Clica "Criar minha conta"
7. Sistema cria org + usuário + assinatura
8. Login automático → `/app`
9. Status: `ativa`

### Trial com Cartão

1. Usuário clica "Começar Trial" em `/planos`
2. Vai pro Stripe Checkout (trial_period_days: 14)
3. Insere cartão (não é cobrado)
4. Redirecionado para `/onboarding?session_id=xxx`
5. Mesmo formulário
6. Clica "Criar minha conta"
7. Sistema cria org + usuário + assinatura trial
8. Login automático → `/app`
9. Status: `trial`, trial_expira_em: +14 dias
10. Ao fim do trial, Stripe cobra automaticamente

---

## Vantagens

- Senha definida pelo usuário (sem email com senha temporária)
- Login automático após cadastro
- Trial exige cartão (maior conversão)
- Dados completos coletados (empresa, segmento, telefone)
- Fluxo unificado para pago e trial
- Webhook simplificado (não precisa criar org/user)
