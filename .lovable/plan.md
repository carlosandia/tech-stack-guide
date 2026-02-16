
# Correcao: Labels Desaparecendo na Lista de Conversas

## Problema Identificado

O bug esta confirmado na edge function `waha-proxy`, na action `labels_list` (linhas 1405-1409). A cada 60 segundos (polling), ao montar a pagina, e ao voltar a aba do navegador, o sistema:

1. **Deleta TODAS** as associacoes `conversas_labels` da organizacao (DELETE ALL)
2. Busca chats por label na API WAHA (`/labels/{labelId}/chats`)
3. Re-insere as associacoes encontradas

O motor **WAHA GOWS** retorna arrays vazios intermitentemente para os chats de cada label. Quando isso acontece, o DELETE ALL ja executou e nenhuma associacao e re-inserida - resultado: todas as etiquetas somem.

## Solucao: Sync Diff-Based

Substituir a estrategia "delete-all + re-insert" por uma estrategia **diff-based** que protege contra respostas vazias.

### Logica Nova

```text
1. Coletar todas associacoes da API WAHA (como hoje)
2. Se coletou > 0 associacoes:
   a. Buscar associacoes atuais do DB
   b. Calcular diff: quais remover (estao no DB mas nao na API)
   c. Deletar APENAS as obsoletas
   d. Upsert as novas/existentes
3. Se coletou 0 associacoes:
   -> NAO apagar nada, preservar dados existentes
   -> Logar warning para monitoramento
```

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-proxy/index.ts`

**Remover** (linhas 1405-1411):
```typescript
// Clear ALL label associations for this org (full sync)
const { error: delErr } = await supabaseAdmin
  .from("conversas_labels")
  .delete()
  .eq("organizacao_id", organizacaoId);
if (delErr) console.error(...);
```

**Substituir por** (apos a deduplicacao, linhas ~1523-1531):

Em vez de inserir direto, implementar diff:

```typescript
if (insertRows.length > 0) {
  // Buscar associacoes atuais
  const { data: currentAssocs } = await supabaseAdmin
    .from("conversas_labels")
    .select("conversa_id, label_id")
    .eq("organizacao_id", organizacaoId);

  // Calcular quais remover
  const newKeys = new Set(insertRows.map(r => `${r.conversa_id}:${r.label_id}`));
  const toDelete = (currentAssocs || []).filter(
    cl => !newKeys.has(`${cl.conversa_id}:${cl.label_id}`)
  );

  // Deletar apenas obsoletas
  for (const del of toDelete) {
    await supabaseAdmin
      .from("conversas_labels")
      .delete()
      .eq("conversa_id", del.conversa_id)
      .eq("label_id", del.label_id)
      .eq("organizacao_id", organizacaoId);
  }

  // Upsert novas/existentes
  await supabaseAdmin
    .from("conversas_labels")
    .upsert(insertRows, { onConflict: "conversa_id,label_id" });
} else {
  // WAHA retornou 0 associacoes - preservar dados existentes
  console.warn("[waha-proxy] WAHA returned 0 label associations, preserving existing data");
}
```

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/waha-proxy/index.ts` | Remover DELETE ALL (linhas 1405-1411), substituir insert por diff-based sync (linhas 1523-1531) |
| Deploy | Redeploy automatico da edge function |

## Resultado Esperado

- Labels **nunca mais desaparecem** por respostas vazias do WAHA
- Labels removidas no WhatsApp sao corretamente removidas no CRM (quando WAHA retorna dados validos)
- Sem impacto em performance (diff calculado em memoria)
