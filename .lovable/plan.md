
# Plano: Correções Landing Page Planos + Admin

## Resumo das Correções

1. **Trial refletir na Landing Page** - Já funciona parcialmente, mas vamos garantir consistência
2. **Campo "Popular" no plano** - Adicionar toggle no admin para marcar qual plano é popular
3. **Desconto anual dinâmico** - Calcular o percentual real baseado nos preços cadastrados

---

## Análise Atual

| Item | Status Atual |
|------|--------------|
| Trial habilitado | Funciona - config `trial_habilitado` já é lida |
| Plano Popular | Hardcoded `index === 1` - precisa ser dinâmico |
| Desconto -20% | Hardcoded - precisa calcular dos preços reais |

### Preços Atuais no Banco

| Plano | Mensal | Anual | Desconto Real |
|-------|--------|-------|---------------|
| Starter | R$ 99 | R$ 990 | 16.7% |
| Pro | R$ 249 | R$ 2.490 | 16.7% |
| Enterprise | R$ 599 | R$ 5.990 | 16.7% |

---

## Alterações

### 1. Migração SQL - Adicionar campo `popular`

```sql
ALTER TABLE planos ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;
```

### 2. Atualizar tipos TypeScript

Adicionar `popular: boolean` em:
- `src/integrations/supabase/types.ts` (automático pela migração)
- `src/modules/admin/services/admin.api.ts` (interface Plano)

### 3. PlanoFormModal.tsx - Toggle "Plano Popular"

Adicionar na seção Status:
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    {...register('popular')}
    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
  />
  <span className="text-sm text-foreground">Plano Popular</span>
  <span className="text-xs text-muted-foreground">(destacado na landing)</span>
</label>
```

### 4. PlanosPage (Admin) - Badge "Popular"

Adicionar badge visual no card quando `plano.popular === true`:
```tsx
{plano.popular && (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
    Popular
  </span>
)}
```

### 5. PlanosPage (Landing) - Desconto Dinâmico

Substituir `-20%` hardcoded por cálculo real:
```tsx
// Calcular desconto médio dos planos com preço anual
const calcularDescontoMedio = (planos: PlanoDb[]) => {
  const planosComAnual = planos.filter(p => 
    p.preco_mensal && p.preco_mensal > 0 && 
    p.preco_anual && p.preco_anual > 0
  )
  
  if (planosComAnual.length === 0) return null
  
  const descontos = planosComAnual.map(p => {
    const mensalAnualizado = p.preco_mensal! * 12
    const desconto = ((mensalAnualizado - p.preco_anual!) / mensalAnualizado) * 100
    return Math.round(desconto)
  })
  
  return Math.round(descontos.reduce((a, b) => a + b, 0) / descontos.length)
}

// No toggle de período
{descontoMedio && (
  <span className="ml-1.5 text-xs font-semibold text-primary">
    -{descontoMedio}%
  </span>
)}
```

### 6. PlanosPage (Landing) - Popular Dinâmico

Substituir `index === 1` por:
```tsx
const isPopular = plano.popular === true
```

### 7. PlanosPage (Landing) - Trial Visibilidade

Já funciona corretamente - o card Trial só aparece se `trialConfig.trial_habilitado && trialPlan`

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar coluna `popular` |
| `src/modules/admin/services/admin.api.ts` | Adicionar `popular` na interface Plano |
| `src/modules/admin/components/PlanoFormModal.tsx` | Toggle para marcar popular |
| `src/modules/admin/pages/PlanosPage.tsx` | Badge popular no card |
| `src/modules/public/pages/PlanosPage.tsx` | Desconto dinâmico + popular dinâmico |

---

## Schema atualizado

```typescript
const planoSchema = z.object({
  // ... campos existentes
  popular: z.boolean().default(false), // NOVO
})
```

---

## Interface da Landing Atualizada

- **Toggle Mensal/Anual**: Mostra desconto real calculado (ex: "-17%" se for 16.7% arredondado)
- **Badge Popular**: Aparece no plano marcado como `popular: true` no banco
- **Card Trial**: Só aparece se trial estiver habilitado nas configurações globais
- **Dias de Trial**: Exibe corretamente o valor de `trial_dias` da config

---

## Lógica do Desconto

```text
Desconto % = ((Mensal x 12) - Anual) / (Mensal x 12) x 100

Exemplo Starter:
  Mensal x 12 = 99 x 12 = 1.188
  Anual = 990
  Desconto = (1188 - 990) / 1188 x 100 = 16.67% ≈ 17%
```

Se não houver preços anuais configurados, o toggle "Anual" não mostrará percentual de desconto.
