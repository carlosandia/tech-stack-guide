
# Correcao: Nome do Canal nao Resolvido no WAHA GOWS

## Problema Identificado

O nome do canal (ex: CazéTV) nao e resolvido na primeira mensagem porque o webhook tenta endpoints incorretos ou ineficientes:

1. **Endpoint errado**: Tenta `GET /api/{session}/newsletters/{channelId}` que NAO existe no GOWS, retorna 404
2. **Fallback ineficiente**: Cai para `GET /api/{session}/channels` que lista TODOS os canais e depois faz `find()` -- isso pode ser lento ou falhar com muitos canais
3. **Endpoint correto nao usado**: O GOWS suporta `GET /api/{session}/channels/{ChannelID}` para buscar um canal especifico (documentado oficialmente)

O payload do GOWS (`_data`) para canais nao inclui o nome -- `PushName`, `Subject`, `Name` sao todos vazios/null para newsletters. A unica forma de obter o nome e via API.

O resultado: na criacao, `groupName` fica null e a conversa e criada com `nome = chatId` (ex: `120363170942886188@newsletter`). Eventualmente numa mensagem posterior, se uma das APIs funcionar, o nome e atualizado.

## Solucao

### Arquivo: `supabase/functions/waha-webhook/index.ts`

Refatorar a logica de busca de metadados de canal na secao `isChannel` (linhas ~1005-1045):

1. **Prioridade 1**: Usar o endpoint correto `GET /api/{session}/channels/{channelId}` (endpoint especifico e rapido)
   - URL: `/api/{sessionName}/channels/{rawFrom}` onde rawFrom = `120363170942886188@newsletter`
   - Resposta esperada: `{"id": "...@newsletter", "name": "CazéTV", ...}`
   - Extrair: `name`, `description`, `picture/preview` (para foto)

2. **Prioridade 2**: Manter fallback para `GET /api/{session}/channels` (lista completa) caso o endpoint especifico falhe

3. **Remover**: O endpoint `/newsletters/{id}` que nao existe no GOWS

4. **Adicionar log detalhado**: Registrar status HTTP e resposta de cada tentativa para facilitar debug futuro

### Mudanca tecnica no webhook

```typescript
// ANTES (errado):
const nlResp = await fetch(
  `${wahaApiUrl}/api/${sessionName}/newsletters/${rawFrom}`,
  ...
);

// DEPOIS (correto - endpoint suportado pelo GOWS):
const chResp = await fetch(
  `${wahaApiUrl}/api/${sessionName}/channels/${encodeURIComponent(rawFrom)}`,
  ...
);
if (chResp.ok) {
  const chData = await chResp.json();
  groupName = chData?.name || chData?.Name || chData?.subject || null;
  groupPhotoUrl = chData?.picture || chData?.preview || chData?.pictureUrl || null;
}
```

### Resultado esperado

- O nome do canal sera resolvido ja na primeira mensagem recebida
- A conversa sera criada com o nome correto (ex: "CazéTV") ao inves do ID numerico
- O contato do canal tambem tera o nome atualizado
- Menos chamadas de API (1 chamada direta vs 1 chamada falhada + 1 lista completa)
