
# Correcao: Sincronizacao de etiquetas usando endpoint por chat

## Problema

O endpoint da WAHA `GET /labels/{labelId}/chats` retorna dados em cache/desatualizados. Nos logs, a label 3 (Pagamento pendente) ainda reporta o chat `5513988506995@c.us` mesmo apos a remocao no dispositivo. Isso causa dados stale no CRM.

## Solucao

Substituir a estrategia "chats por label" pela estrategia **"labels por chat"**, consultando `GET /labels/chats/{chatId}` para cada conversa ativa. Este endpoint retorna as labels reais atribuidas a cada chat e tende a ser mais preciso.

## Detalhes tecnicos

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

### Alteracao na action `labels_list` (linhas ~1374-1574)

Substituir o bloco que itera por label buscando chats (`/labels/{id}/chats`) por um bloco que:

1. Itera pelas **conversas ativas** (ja carregadas na variavel `conversasAtivas`)
2. Para cada conversa, chama `GET /labels/chats/{chatId}` para obter as labels reais daquele chat
3. Monta as associacoes `conversa_id + label_id` a partir da resposta
4. Mantem o DELETE ALL + INSERT em batch (estrategia atual de full sync)

```text
Fluxo atual (problematico):
  Para cada LABEL → buscar CHATS (endpoint com cache)
  
Fluxo proposto (mais preciso):
  Para cada CONVERSA ATIVA → buscar LABELS (endpoint mais confiavel)
```

### Logica do novo bloco:

```
1. Manter: delete ALL conversas_labels da org
2. Manter: mapa dbLabels (waha_label_id → uuid)
3. NOVO: Para cada conversa ativa (limite 500):
   a. GET /labels/chats/{chatId}
   b. Extrair array de label IDs retornados
   c. Para cada labelId retornado, buscar no mapa dbLabels o UUID
   d. Adicionar row { organizacao_id, conversa_id, label_id }
4. Manter: dedup + upsert batch
```

### Tratamento de @lid

- Se `chatId` termina com `@lid`, tentar resolver via `lidToCusMap` antes de chamar a API
- Usar o ID resolvido (@c.us) na chamada da API WAHA

### Performance

- Conversas ativas limitadas a 500 (mesmo limite atual)
- Cada chamada e leve (retorna array pequeno de labels)
- Para orgs com muitas conversas, isso pode gerar mais requests que a abordagem anterior, mas garante precisao

### Fallback

- Se o endpoint `/labels/chats/{chatId}` falhar para um chat especifico, logar warning e continuar
- Se retornar array vazio, nenhuma label e associada (comportamento correto)

## Resultado esperado

- Labels removidas no dispositivo serao refletidas imediatamente no proximo sync (15s polling)
- Eliminacao total do problema de cache do endpoint "chats por label"
- Melhoria na confiabilidade da sincronizacao bidirecional
