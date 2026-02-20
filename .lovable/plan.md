
# Correção: Inscrever App nos Eventos Leadgen da Página

## Problema
O Meta nao envia eventos de leadgen para o webhook porque o app nao esta inscrito na pagina. A ferramenta de teste confirma: "A Pagina selecionada nao tem nenhum app associado a ela." Isso acontece porque nunca chamamos o endpoint `POST /{page-id}/subscribed_apps` da Graph API.

## Solucao

### Arquivo: `supabase/functions/meta-sync/index.ts`

Apos o upsert de cada pagina (linha ~183), adicionar uma chamada para inscrever o app nos eventos `leadgen` da pagina:

```typescript
// Apos upsert bem-sucedido, inscrever app nos eventos leadgen da pagina
const subscribeRes = await fetch(
  `${GRAPH_API}/${page.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${page.access_token}`,
  { method: "POST" }
);
const subscribeData = await subscribeRes.json();

if (subscribeData.success) {
  console.log(`[meta-sync] App inscrito em leadgen para pagina ${page.name}`);
  // Atualizar leads_retrieval para true
  await supabase
    .from("paginas_meta")
    .update({ leads_retrieval: true })
    .eq("organizacao_id", orgId)
    .eq("page_id", page.id);
} else {
  console.warn(`[meta-sync] Falha ao inscrever app em leadgen para ${page.name}:`, subscribeData);
}
```

### O que isso faz

1. Para cada pagina sincronizada, chama `POST /{page_id}/subscribed_apps?subscribed_fields=leadgen` usando o page access token
2. Se bem-sucedido, atualiza `leads_retrieval = true` na tabela `paginas_meta`
3. Loga warnings se a inscricao falhar (ex: permissao faltando)

### Apos o deploy

O usuario precisa clicar em **"Sincronizar"** no card do Meta Ads na pagina de Conexoes. Isso vai:
1. Re-buscar as paginas
2. Inscrever o app nos eventos leadgen
3. A partir desse momento, leads de teste e reais serao enviados para o webhook

### Detalhes Tecnicos

- Endpoint da Graph API: `POST /v21.0/{page-id}/subscribed_apps`
- Parametro: `subscribed_fields=leadgen`
- Autenticacao: `page_access_token` (ja armazenado)
- Documentacao: https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps/
