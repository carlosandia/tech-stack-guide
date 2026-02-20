

## Correções para Sincronização de Custom Audiences

### Problema 1: Codigo redundante no sync-audience-capi

Na linha 135-142, o primeiro `update` define `total_usuarios` como `undefined` (que nao faz nada no Supabase) e so define `ultimo_sync`. Logo depois (linhas 145-159), o bloco busca a contagem real do Meta e faz outro update com `total_usuarios` correto.

**Correcao**: Remover o primeiro update redundante e consolidar em um unico update apos buscar a contagem do Meta. Mover o `ultimo_sync` para o segundo update.

### Problema 2: Sincronizacao manual nao filtra por evento

O `sincronizarAudience` no `configuracoes.api.ts` (linhas 1697-1705) sempre busca todos os contatos tipo "pessoa" da organizacao, independente do `evento_gatilho`. Por exemplo, se o gatilho e "won" (oportunidade ganha), deveria sincronizar apenas contatos vinculados a oportunidades ganhas, nao todos.

**Correcao**: Manter o comportamento atual como "sync geral" (util para o primeiro carregamento), mas adicionar um aviso na UI de que a sincronizacao manual envia todos os contatos. A filtragem automatica por evento ja funciona corretamente no `processar-eventos-automacao`.

### Problema 3: Audiences com audience_id "pending_" nao funcionam

Audiences criadas localmente recebem `audience_id: "pending_xxx"`. Ao clicar "Sincronizar Agora", o `sync-audience-capi` envia para `https://graph.facebook.com/v21.0/pending_xxx/users`, que retorna erro 404 do Meta.

**Correcao**: 
- Desabilitar botao "Sincronizar Agora" para audiences com `audience_id` que comeca com `pending_`
- Mostrar tooltip explicando que o publico precisa ser criado no Meta primeiro ou importado

### Arquivos afetados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/sync-audience-capi/index.ts` | Remover update redundante, consolidar ultimo_sync + total_usuarios |
| `src/modules/configuracoes/components/integracoes/meta/CustomAudiencesPanel.tsx` | Desabilitar sync para audiences pending_, tooltip |

### Detalhes tecnicos

**sync-audience-capi/index.ts** - Substituir linhas 133-160 por:

```typescript
// Atualizar ultimo_sync e buscar contagem real do Meta
const accountId = ad_account_id?.replace("act_", "") || "";
let totalUsuarios: number | undefined;

if (accountId) {
  try {
    const countUrl = `https://graph.facebook.com/v21.0/${audience_id}?fields=approximate_count_lower_bound&access_token=${encodeURIComponent(accessToken)}`;
    const countRes = await fetch(countUrl);
    if (countRes.ok) {
      const countData = await countRes.json();
      totalUsuarios = countData.approximate_count_lower_bound || 0;
    }
  } catch (e) {
    console.warn("[sync-audience-capi] Erro ao buscar contagem:", e);
  }
}

const updateData: Record<string, unknown> = { ultimo_sync: new Date().toISOString() };
if (totalUsuarios !== undefined) updateData.total_usuarios = totalUsuarios;

await supabase
  .from("custom_audiences_meta")
  .update(updateData)
  .eq("audience_id", audience_id)
  .eq("organizacao_id", organizacao_id);
```

**CustomAudiencesPanel.tsx** - No botao "Sincronizar Agora":

- Verificar `aud.audience_id?.startsWith('pending_')` para desabilitar
- Adicionar `title` com mensagem explicativa

