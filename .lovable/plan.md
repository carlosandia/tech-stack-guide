
# Plano: Adicionar Campos Stripe Price ID no Modal de Planos

## Resumo

Adicionar os campos `stripe_price_id_mensal` e `stripe_price_id_anual` no modal de edição de planos para permitir a conexão direta entre os planos do CRM e os produtos/preços configurados no Stripe.

---

## Contexto do Fluxo Completo

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE MONETIZAÇÃO                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SUPER ADMIN                 2. LANDING PAGE               3. CHECKOUT       │
│  ┌─────────────────┐           ┌─────────────────┐          ┌──────────────┐   │
│  │ Admin > Planos  │ ────────► │ /planos         │ ───────► │ Stripe       │   │
│  │                 │           │                 │          │ Checkout     │   │
│  │ • Nome          │           │ • Mostra cards  │          │              │   │
│  │ • Preço         │           │ • Toggle Mensal/│          │ • Pagamento  │   │
│  │ • Limites       │           │   Anual         │          │ • Captura    │   │
│  │ • stripe_price_ │           │ • Botão Assinar │          │   dados      │   │
│  │   id_mensal  ◄──┼───────────┼─────────────────┼──────────┤              │   │
│  │ • stripe_price_ │           │                 │          │              │   │
│  │   id_anual   ◄──┼───────────┼─────────────────┼──────────┤              │   │
│  └─────────────────┘           └─────────────────┘          └──────────────┘   │
│           │                                                         │           │
│           │                                                         ▼           │
│           │                                                 ┌──────────────┐   │
│           │                                                 │ Webhook      │   │
│           │                                                 │ Stripe       │   │
│           │                                                 │              │   │
│           └─────────────────────────────────────────────────│ • Cria Org   │   │
│                   Validação: Price ID deve existir          │ • Cria Admin │   │
│                                                             └──────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## O Que Será Adicionado

### Nova Seção no Modal: "Integração Stripe"

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Editar Plano                                                            X  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ INFORMAÇÕES BÁSICAS                                                         │
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│ │ Nome do Plano *             │  │ Ordem                       │           │
│ │ [Professional            ]  │  │ [2                        ] │           │
│ └─────────────────────────────┘  └─────────────────────────────┘           │
│                                                                             │
│ Descrição                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Ideal para equipes em crescimento...                                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ PREÇOS                                                                      │
│ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐        │
│ │ Preço Mensal (R$) │  │ Preço Anual (R$)  │  │ Moeda             │        │
│ │ [97.00          ] │  │ [970.00         ] │  │ [BRL ▼          ] │        │
│ └───────────────────┘  └───────────────────┘  └───────────────────┘        │
│                                                                             │
│ INTEGRAÇÃO STRIPE   ← ✨ NOVA SEÇÃO                                        │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Vincule os Price IDs do Stripe para habilitar o checkout automático        │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Stripe Price ID (Mensal)                                               ││
│ │ [price_1ABC123def456...                                              ] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ Copie do Stripe Dashboard > Products > Seu Produto > Price ID              │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Stripe Price ID (Anual)                                                ││
│ │ [price_1XYZ789ghi012...                                              ] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ Opcional - deixe vazio se não oferecer plano anual                         │
│                                                                             │
│ LIMITES (-1 = ilimitado)                                                    │
│ ...                                                                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                        [Cancelar]  [Salvar Alterações]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### 1. Atualizar Schema Zod (`PlanoFormModal.tsx`)

Adicionar os campos de Stripe ao schema de validação:

```tsx
const planoSchema = z.object({
  // ... campos existentes ...
  
  // NOVOS CAMPOS
  stripe_price_id_mensal: z.string().optional(),
  stripe_price_id_anual: z.string().optional(),
})
```

### 2. Atualizar Tipo `Plano` (`admin.api.ts`)

Incluir os campos no tipo exportado:

```tsx
export interface Plano {
  id: string
  nome: string
  // ... campos existentes ...
  
  // NOVOS CAMPOS
  stripe_price_id_mensal?: string | null
  stripe_price_id_anual?: string | null
}
```

### 3. Atualizar `listarPlanos()` e `obterPlano()` 

Incluir os novos campos nas queries:

```tsx
return {
  // ... campos existentes ...
  stripe_price_id_mensal: p.stripe_price_id_mensal,
  stripe_price_id_anual: p.stripe_price_id_anual,
}
```

### 4. Atualizar `criarPlano()` e `atualizarPlano()`

Enviar os campos para o banco:

```tsx
const { data, error } = await supabase
  .from('planos')
  .insert({
    // ... campos existentes ...
    stripe_price_id_mensal: plano.stripe_price_id_mensal || null,
    stripe_price_id_anual: plano.stripe_price_id_anual || null,
  })
```

### 5. Adicionar Campos no Formulário (`PlanoFormModal.tsx`)

Nova seção após "Preços":

```tsx
{/* Integração Stripe */}
<div className="space-y-4">
  <div>
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
      Integração Stripe
    </h3>
    <p className="text-xs text-muted-foreground mt-1">
      Vincule os Price IDs do Stripe para habilitar o checkout automático
    </p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        Stripe Price ID (Mensal)
      </label>
      <input
        {...register('stripe_price_id_mensal')}
        placeholder="price_1ABC123..."
        className="w-full h-11 px-3 rounded-md border ..."
      />
      <p className="text-xs text-muted-foreground mt-1">
        Copie do Stripe Dashboard > Products
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        Stripe Price ID (Anual)
      </label>
      <input
        {...register('stripe_price_id_anual')}
        placeholder="price_1XYZ789..."
        className="w-full h-11 px-3 rounded-md border ..."
      />
      <p className="text-xs text-muted-foreground mt-1">
        Opcional - deixe vazio se não oferecer
      </p>
    </div>
  </div>
</div>
```

### 6. Atualizar `reset()` e `defaultValues`

Carregar valores existentes ao editar:

```tsx
defaultValues: {
  // ...
  stripe_price_id_mensal: '',
  stripe_price_id_anual: '',
}

// No useEffect
reset({
  // ...
  stripe_price_id_mensal: plano.stripe_price_id_mensal || '',
  stripe_price_id_anual: plano.stripe_price_id_anual || '',
})
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/components/PlanoFormModal.tsx` | Adicionar campos Stripe no schema e formulário |
| `src/modules/admin/services/admin.api.ts` | Atualizar tipo `Plano` e funções de CRUD |

---

## Resultado Final

Após a implementação:

1. **Super Admin** edita um plano e cola os Price IDs do Stripe
2. Os Price IDs são salvos no banco de dados
3. Na **Landing Page** `/planos`, quando o usuário clica "Assinar":
   - A Edge Function `create-checkout-session` busca o `stripe_price_id_mensal` ou `stripe_price_id_anual`
   - Cria a sessão de checkout do Stripe com o preço correto
   - Redireciona o usuário para o checkout do Stripe

---

## Como Obter os Price IDs no Stripe

Guia rápido para o Super Admin:

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Products** > **Add Product** (ou selecione existente)
3. Configure o preço (mensal/anual)
4. Após salvar, copie o **Price ID** (começa com `price_`)
5. Cole no modal de edição do plano no CRM

```text
Stripe Dashboard
┌─────────────────────────────────────────────────────────────┐
│ Products > Professional Plan                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRICING                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ R$ 97,00 / month                                       │ │
│  │ Price ID: price_1ABC123def456ghiJKL   [Copy]  ◄───────┼─┼─ Copie este ID
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
