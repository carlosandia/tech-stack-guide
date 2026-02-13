
# Correcao: URL da API4COM e UX do campo URL

## Problema
O usuario esta inserindo `https://renovedigital.api4com.com` (URL do painel web) no campo "URL da API". A URL correta da API REST e sempre `https://api.api4com.com`, conforme documentacao oficial (https://developers.api4com.com/authentication.html). Os logs confirmam: a chamada para `renovedigital.api4com.com/api/v1/users/me` retorna 404 nginx.

## Alteracoes

### 1. Modal `Api4comConexaoModal.tsx`
- Deixar o campo URL da API como **somente leitura** ou removê-lo, ja que a URL da API e sempre `https://api.api4com.com`
- Adicionar nota explicativa clara: "A URL da API e sempre `api.api4com.com`, nao confundir com a URL do painel (ex: renovedigital.api4com.com)"
- Atualizar as instrucoes para esclarecer a diferenca entre URL do painel e URL da API

### 2. Edge Function `api4com-proxy/index.ts`
- Nenhuma alteracao necessaria no codigo backend. O endpoint `/api/v1/users/me`, header `Authorization: token` e URL padrao `https://api.api4com.com` ja estao corretos.

## Detalhes tecnicos

No modal, o campo URL sera alterado para:
- Valor fixo `https://api.api4com.com` (read-only ou hidden)
- Adicionar texto de ajuda explicando que `renovedigital.api4com.com` e o painel, nao a API
- Manter possibilidade de override apenas para casos muito especificos, mas com aviso claro

Arquivo modificado:
- `src/modules/configuracoes/components/integracoes/Api4comConexaoModal.tsx`
