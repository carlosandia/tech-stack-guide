

## Plano: Checkout Dinâmico com price_data (sem criar produtos no Stripe)

### Problema Atual
Os Price IDs armazenados no banco de dados nao existem na conta Stripe conectada, causando erro `No such price`. Alem disso, o fluxo atual exige que o admin crie manualmente os produtos no Stripe Dashboard e copie os Price IDs -- um processo propenso a erros.

### Solucao Proposta
Modificar a Edge Function `create-checkout-session` para usar `price_data` em vez de `price` (Price ID pre-configurado). O Stripe permite criar precos dinamicamente no momento do checkout usando os dados do plano do banco de dados (nome, valor, periodo).

Isso elimina completamente a necessidade de:
- Criar produtos manualmente no Stripe Dashboard
- Copiar e colar Price IDs
- Manter sincronia entre banco e Stripe

### Como Funciona

Em vez de:
```text
line_items: [{ price: "price_1ABC123...", quantity: 1 }]
```

Passamos:
```text
line_items: [{
  price_data: {
    currency: 'brl',
    product_data: { name: 'Starter - Mensal' },
    unit_amount: 9900,  // R$ 99,00 em centavos
    recurring: { interval: 'month' }
  },
  quantity: 1
}]
```

### Arquivos Alterados

**1. `supabase/functions/create-checkout-session/index.ts`**
- Remover logica de buscar `stripe_price_id_mensal/anual`
- Buscar dados completos do plano (nome, preco_mensal, preco_anual, moeda)
- Construir `price_data` dinamicamente com `product_data`, `unit_amount` (em centavos) e `recurring.interval`
- Para periodo mensal: `interval: 'month'`, `unit_amount: preco_mensal * 100`
- Para periodo anual: `interval: 'year'`, `unit_amount: preco_anual * 100`
- Melhorar logs para debug

**2. `src/modules/admin/components/PlanoFormModal.tsx`**
- Tornar os campos de Stripe Price ID opcionais/informativos
- Adicionar nota explicando que os produtos sao criados automaticamente no Stripe

**3. Sem necessidade de alterar:**
- `stripe-webhook/index.ts` -- ja funciona com metadata (plano_id, periodo)
- `get-checkout-session/index.ts` -- ja funciona com metadata da sessao
- Tabela `planos` -- campos `stripe_price_id_*` continuam existindo mas nao sao mais obrigatorios

### Detalhes Tecnicos

**Conversao de preco para centavos:**
O Stripe exige `unit_amount` em centavos. `R$ 99,00` vira `9900`.

**Campos do price_data:**
- `currency`: vem da coluna `moeda` do plano (default 'brl')
- `product_data.name`: nome do plano + periodo (ex: "Starter - Mensal")
- `unit_amount`: preco em centavos
- `recurring.interval`: 'month' ou 'year'

**Validacoes adicionadas:**
- Se o preco for 0 ou null para o periodo selecionado, retorna erro claro
- Se o plano nao existir, retorna erro claro

**Nota sobre produtos duplicados no Stripe:**
Cada checkout criara um novo produto "ad-hoc" no Stripe. Isso e normal e funcional. Se no futuro quiser consolidar, pode-se adicionar logica para reusar produtos existentes pelo nome.

