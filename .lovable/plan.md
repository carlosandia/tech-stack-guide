
# Correcao: Foto de Perfil Ausente em Grupo Especifico

## Diagnostico

O grupo "PROMOCOES MUNDO DO TENISTA #12" (chat_id: `120363423406118986@g.us`) tem `foto_url = NULL` na tabela `conversas`. Os demais grupos possuem a URL preenchida normalmente.

**Causa raiz**: Quando a conversa foi criada, a API do WAHA nao retornou a foto do grupo (falha temporaria, timeout, ou grupo sem foto naquele momento). O codigo atual so atualiza `foto_url` quando a API retorna um valor -- se a primeira tentativa falhou, nunca mais tenta novamente, pois o grupo ja tem conversa existente e `groupPhotoUrl` continua null.

Trecho do problema (linha ~2007-2009 do webhook):
```typescript
if (isGroup || isChannel) {
  if (groupName) updateData.nome = groupName;
  if (groupPhotoUrl) updateData.foto_url = groupPhotoUrl;  // so atualiza se veio preenchido
}
```

## Solucao

### 1. Correcao imediata: Atualizar foto via SQL

Buscar a foto do grupo diretamente e atualizar o registro. Porem, como nao temos acesso direto a API do WAHA daqui, a abordagem mais robusta e fazer o webhook tentar buscar a foto quando ela esta ausente.

### 2. Correcao sistemica no Webhook

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Quando a conversa ja existe (`existingConversa`) e e um grupo/canal, verificar se `foto_url` esta `NULL`. Se estiver, forcar uma nova tentativa de buscar a foto via API do WAHA, mesmo que o payload da mensagem atual nao traga `groupPhotoUrl`.

A logica atual ja faz a busca de foto para grupos em varias etapas (profile-picture endpoint, groups/{id}, etc). O problema e que essa busca so roda quando a conversa e **nova** ou quando o payload do evento ja traz a foto. A correcao adiciona uma tentativa extra quando `existingConversa.foto_url` e null.

**Mudanca**: Apos o bloco que monta `updateData` (linhas ~2007-2013), se `groupPhotoUrl` continuar null E a conversa existente nao tiver foto, disparar a mesma logica de busca de foto que ja existe no codigo (chamando o endpoint `/api/contacts/profile-picture` do WAHA).

```typescript
// Apos o bloco existente (linhas 2007-2013)
// Se grupo/canal sem foto, tentar buscar novamente
if ((isGroup || isChannel) && !groupPhotoUrl && !existingConversa.foto_url) {
  try {
    const picResp = await fetch(
      `${wahaApiUrl}/api/contacts/profile-picture?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
      { headers: { "Authorization": `Bearer ${wahaApiKey}` } }
    );
    if (picResp.ok) {
      const picData = await picResp.json();
      const retryPhoto = picData?.profilePictureURL || picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || null;
      if (retryPhoto) {
        updateData.foto_url = retryPhoto;
        console.log(`[waha-webhook] Retry fetched group photo for ${rawFrom}: ${retryPhoto}`);
      }
    }
  } catch (e) {
    console.log(`[waha-webhook] Retry fetch group photo failed for ${rawFrom}:`, e);
  }
}
```

Isso resolve o caso atual E previne que futuros grupos fiquem sem foto permanentemente.

### 3. Buscar foto_url na query de conversa existente

Para que o bloco acima funcione, a query que busca `existingConversa` precisa incluir o campo `foto_url` no `.select()`. Verificar se ja esta incluido e, se nao, adicionar.

## Arquivos a Modificar

| Arquivo | Acao |
|---|---|
| `supabase/functions/waha-webhook/index.ts` | Adicionar retry de busca de foto quando conversa de grupo existente tem `foto_url` null |

## Resultado Esperado

- Na proxima mensagem recebida no grupo "PROMOCOES MUNDO DO TENISTA #12", o webhook tentara buscar a foto e preenchera o campo
- Qualquer grupo futuro que tenha falhado na primeira busca de foto sera corrigido automaticamente na proxima mensagem
- Nenhum impacto em performance significativo (1 chamada HTTP extra apenas quando foto e null)
