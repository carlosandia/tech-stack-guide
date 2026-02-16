
# Correcao: Fotos de Grupos Nao Aparecendo no CRM

## Problema Identificado

Alguns grupos do WhatsApp (ex: "PROMOÇÕES MUNDO DO TENISTA") aparecem com iniciais ao inves da foto real, enquanto no app WhatsApp a foto aparece normalmente.

### Causa Raiz (Webhook)

O webhook faz **duas chamadas de API separadas** para grupos:
1. Uma para buscar o **nome** via `GET /api/{session}/groups/{groupId}` (linhas 1194-1230)
2. Outra para buscar a **foto** via `GET /api/contacts/profile-picture` (linhas 1254-1261)

O problema e que:
- A resposta da API de grupos (chamada 1) **ja contem a foto**, mas o codigo **NAO extrai** esse campo -- descarta a informacao
- A chamada separada de profile-picture (chamada 2) pode falhar com 404 para alguns grupos (restricao de privacidade)
- O fallback (linhas 1267-1277) refaz a mesma chamada de grupos, duplicando trabalho

Resultado: grupos cuja API profile-picture retorna 404 ficam sem foto, mesmo que a API de grupos JA tenha retornado a URL.

### Dados no Banco

- Grupos COM foto: GESTOR HIGH LEVEL, ARCOLI 2 (foto_url populado)
- Grupos SEM foto: PROMOÇÕES MUNDO DO TENISTA (foto_url = NULL)
- O grupo foi criado sem foto e as mensagens subsequentes tambem nao conseguiram buscar

## Solucao

### Arquivo: `supabase/functions/waha-webhook/index.ts`

**Mudanca 1**: Extrair foto da resposta da API de grupos (mesma chamada que busca o nome)

Na secao de grupos (linhas ~1198-1206), apos extrair o nome, tambem extrair a foto do mesmo response:

```typescript
// ANTES: so extrai nome
groupName = groupData?.subject || groupData?.Subject || ...

// DEPOIS: extrai nome E foto na mesma chamada
groupName = groupData?.subject || groupData?.Subject || ...
if (!groupPhotoUrl) {
  groupPhotoUrl = groupData?.profilePictureURL || groupData?.profilePictureUrl 
    || groupData?.picture || groupData?.pictureUrl || groupData?.PictureURL || null;
}
```

Aplicar a mesma logica no fallback de lista de grupos (linhas ~1223-1226).

**Mudanca 2**: Reordenar prioridade dos campos de foto na chamada profile-picture

Colocar `profilePictureURL` (formato GOWS, com URL maiusculo) como **primeira opcao** ao inves de quarta:

```typescript
// ANTES (profilePictureURL e a 4a opcao):
groupPhotoUrl = picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || picData?.profilePictureURL || null;

// DEPOIS (profilePictureURL primeiro, pois e o formato GOWS):
groupPhotoUrl = picData?.profilePictureURL || picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || null;
```

**Mudanca 3**: Separar try/catch da busca de foto da busca de nome

Atualmente, se a busca de nome lancar uma excecao, a busca de foto (que esta no mesmo try/catch) e pulada inteiramente. Separar em blocos independentes:

```typescript
// Buscar nome do grupo
try {
  if (!groupName) { /* ... fetch name ... */ }
} catch (e) { console.log("Error fetching group name:", e); }

// Buscar foto do grupo (independente)
try {
  if (!groupPhotoUrl) { /* ... fetch photo ... */ }
} catch (e) { console.log("Error fetching group photo:", e); }
```

**Mudanca 4**: Aplicar mesmas correcoes para canais (@newsletter)

A secao de canais (linhas ~1006-1104) tem a mesma estrutura -- extrair foto da resposta do endpoint `/channels/{id}` e reordenar campos.

### Resultado Esperado

- Grupos que retornam foto na API de detalhes terao a foto capturada na mesma chamada (sem depender da API profile-picture)
- O formato GOWS (`profilePictureURL`) sera verificado primeiro, evitando falsos negativos
- Falha na busca de nome nao impedira a busca de foto (try/catch separados)
- Menos chamadas de API redundantes (foto ja extraida junto com o nome)
