
# Correção: LID de 14 dígitos não é detectado como LID

## Problema Raiz

O número `64188537950415` tem **exatamente 14 dígitos**. A função `isLikelyLid()` usa `clean.length > 14` (estritamente maior), então retorna `false` para este número. Isso causa:
1. Card mostra "64188537950415" em vez de "Eletrikus Pós Venda"
2. Modal WhatsApp não encontra a conversa (mesmo bug de threshold)

O RPC `resolve_lid_conversa` funciona corretamente — retorna `conversa_id: b5ab9a7e-...` que aponta para "Eletrikus Pós Venda" (telefone real: 5513978014584).

## Solução

### 1. Corrigir threshold da heurística LID

**Arquivo:** `src/modules/negocios/services/pre-oportunidades.api.ts`

Alterar a função `isLikelyLid`:
```typescript
// ANTES: clean.length > 14 (exclui LIDs de 14 dígitos)
// DEPOIS: clean.length >= 14 (inclui LIDs de 14+ dígitos)
function isLikelyLid(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 14
}
```

Telefones brasileiros válidos têm no máximo 13 dígitos (55 + DDD + 9 dígitos). Qualquer número com 14 ou mais dígitos não é um telefone real.

### 2. Corrigir threshold no WhatsAppConversaModal

**Arquivo:** `src/modules/negocios/components/kanban/WhatsAppConversaModal.tsx`

Alterar a condição do Fallback 2 (RPC resolve_lid):
```typescript
// ANTES: phoneClean.length > 14
// DEPOIS: phoneClean.length >= 14
if (phoneClean.length >= 14) {
```

### 3. Corrigir dados existentes no banco (SQL one-time)

Atualizar o registro existente da pré-oportunidade para exibir corretamente sem esperar nova mensagem:

```sql
UPDATE pre_oportunidades
SET phone_number = '5513978014584',
    phone_name = 'Eletrikus Pós Venda'
WHERE id = 'a0e4ce36-5f1e-4a68-bc0a-4a98c44eae7b'
  AND phone_number = '64188537950415';
```

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/negocios/services/pre-oportunidades.api.ts` | `isLikelyLid`: `> 14` para `>= 14` |
| `src/modules/negocios/components/kanban/WhatsAppConversaModal.tsx` | Fallback 2: `> 14` para `>= 14` |
| Migration SQL | Corrigir registro existente no banco |
