
# Correcoes: Etapas Globais (Lapis) + Filtrar Canais das Conversas

## 1. Remover lapis de edicao das etapas sistema em /configuracoes/etapas

**Arquivo**: `src/modules/configuracoes/pages/EtapasTemplatesPage.tsx`

Atualmente o lapis aparece para TODAS as etapas (incluindo sistema). Conforme pedido, deve aparecer apenas para etapas customizadas (tipo `normal`).

**Mudanca**: Condicionar o botao de edicao para esconder quando `template.sistema` ou `template.tipo !== 'normal'`:

```typescript
{isAdmin && !template.sistema && template.tipo === 'normal' && (
  <button onClick={() => handleEdit(template)} ...>
    <Pencil />
  </button>
)}
```

---

## 2. Nao trazer mais conversas de canal (@newsletter) na listagem

Duas acoes:

### 2a. Backend: Filtrar canais na listagem

**Arquivo**: `backend/src/services/conversas.service.ts`

Adicionar `.neq('tipo', 'canal')` na query de listagem para que conversas de canal nunca aparecam:

```typescript
let query = supabase
  .from('conversas')
  .select(...)
  .eq('organizacao_id', organizacaoId)
  .is('deletado_em', null)
  .neq('tipo', 'canal')  // <-- NOVO: excluir canais
```

### 2b. Webhook: Ignorar mensagens de canal no WAHA

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Adicionar um early return quando `isChannel` e detectado (logo apos a deteccao de `@newsletter`), para que o webhook nao crie conversas nem salve mensagens de canais:

```typescript
if (isChannel) {
  console.log(`[waha-webhook] Channel message ignored: ${rawFrom}`);
  return new Response(
    JSON.stringify({ ok: true, message: "Channel message ignored" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## 3. Excluir dados existentes de canal

Soft delete (marcar `deletado_em`) em todas as mensagens e conversas de tipo `canal`:

```sql
-- Soft delete mensagens de conversas de canal
UPDATE mensagens 
SET deletado_em = NOW() 
WHERE conversa_id IN (SELECT id FROM conversas WHERE tipo = 'canal')
AND deletado_em IS NULL;

-- Soft delete conversas de canal
UPDATE conversas 
SET deletado_em = NOW() 
WHERE tipo = 'canal' AND deletado_em IS NULL;
```

Dados afetados: 5 conversas e 99 mensagens em todas as organizacoes.

---

## Arquivos a Modificar

1. `src/modules/configuracoes/pages/EtapasTemplatesPage.tsx` -- Esconder lapis para etapas sistema
2. `backend/src/services/conversas.service.ts` -- Filtrar tipo canal na listagem
3. `supabase/functions/waha-webhook/index.ts` -- Ignorar mensagens @newsletter
4. Migracao SQL -- Soft delete de conversas/mensagens de canal existentes

## Resultado Esperado

- Em /configuracoes/etapas, o lapis aparece apenas para etapas customizadas
- Em /conversas, conversas de canal nao aparecem mais na lista
- O webhook ignora novas mensagens de canais @newsletter
- Dados existentes de canal sao removidos (soft delete)
