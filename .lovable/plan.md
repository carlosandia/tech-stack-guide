

# Correcao: Nomes e Identificadores no WAHA Plus GOWS

## Diagnostico

Analisei os `raw_data` reais das mensagens salvas no banco e encontrei que o motor **GOWS** do WAHA Plus estrutura os dados em locais **diferentes** do que o codigo atual espera. O codigo foi escrito para o motor padrao (WEBJS), onde os campos ficam em posicoes diferentes.

### Estrutura GOWS vs Onde o Codigo Procura

| Dado | Onde o GOWS coloca | Onde o codigo procura |
|------|--------------------|-----------------------|
| Nome do contato (pushName) | `_data.Info.PushName` (P maiusculo) | `payload._data?.pushName` (p minusculo) |
| Numero real (fromMe individual) | `_data.Info.RecipientAlt` (@s.whatsapp.net) | `_data.key.remoteJidAlt` (nao existe no GOWS) |
| Numero real (participante grupo) | `_data.Info.SenderAlt` (@s.whatsapp.net) | `_data.key.participant` (nao existe no GOWS) |
| Nome verificado (business) | `_data.Info.VerifiedName.Details.verifiedName` | Nao consultado |

### Evidencias do Banco de Dados

**Mensagem individual fromMe (chat_id `170991388987574@lid`):**
- `from`: `170991388987574@lid` (LID - nao resolvido)
- `_data.Info.RecipientAlt`: `554588045821@s.whatsapp.net` (numero REAL do destinatario)
- `_data.Info.PushName`: `Comercial Junior Santos` (nome do remetente)
- `_data.key.remoteJidAlt`: **NAO EXISTE** (o codigo atual depende disso)

**Mensagem de grupo (`120363404288566051@g.us`):**
- `participant`: `186036911124525@lid` (LID do participante)
- `_data.Info.SenderAlt`: `5511986205461@s.whatsapp.net` (numero REAL)
- `_data.Info.PushName`: `MD Monstro` (nome do participante)
- `_data.key.participant`: **NAO EXISTE**

**Resultado**: 80%+ das conversas tem numeros LID como nome porque todas as estrategias de resolucao falham para o motor GOWS.

---

## Solucao

Adicionar suporte ao formato GOWS em 3 pontos-chave do webhook, mantendo compatibilidade retroativa com WEBJS.

### 1. Funcao Helper para PushName (GOWS-aware)

Criar funcao que busca o nome na ordem correta:

```
1. payload._data?.Info?.PushName        (GOWS - campo principal)
2. payload._data?.pushName              (WEBJS fallback)
3. payload._data?.notifyName            (WEBJS fallback)
4. payload.notifyName                   (root fallback)
5. payload.pushName                     (root fallback)
6. payload._data?.Info?.VerifiedName?.Details?.verifiedName  (business accounts)
```

### 2. Resolucao LID para Individuais (fromMe)

Adicionar nova estrategia ANTES das existentes:

```
// GOWS Strategy: _data.Info.RecipientAlt
const recipientAlt = payload._data?.Info?.RecipientAlt
if (recipientAlt && recipientAlt.includes("@s.whatsapp.net")) {
  toField = recipientAlt.replace("@s.whatsapp.net", "@c.us")
}
```

### 3. Resolucao LID para Participantes de Grupo

Adicionar nova estrategia ANTES das existentes:

```
// GOWS Strategy: _data.Info.SenderAlt
const senderAlt = payload._data?.Info?.SenderAlt
if (senderAlt && senderAlt.includes("@s.whatsapp.net")) {
  resolvedParticipant = senderAlt.replace("@s.whatsapp.net", "@c.us")
}
```

### 4. Resolucao LID para Individuais (mensagens recebidas)

Para mensagens recebidas com @lid no `from`:

```
// GOWS Strategy: _data.Info.Sender or _data.Info.Chat
const senderField = payload._data?.Info?.Sender || payload._data?.Info?.Chat
if (senderField && senderField.includes("@s.whatsapp.net")) {
  resolvedFrom = senderField.replace("@s.whatsapp.net", "@c.us")
}
```

### 5. Correcao de Dados Existentes

Script SQL para buscar nomes via WAHA API nao e viavel em batch. A abordagem sera:
- As conversas existentes serao corrigidas **automaticamente** na proxima mensagem recebida de cada contato, pois o webhook atualiza nome e chat_id a cada mensagem
- Opcionalmente, podemos criar um script de limpeza que busca o `_data.Info.PushName` dos raw_data ja salvos nas mensagens e atualiza os contatos/conversas retroativamente

---

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-webhook/index.ts`

**Adicionar funcao helper (antes do handler principal):**

```typescript
function extractPushName(payload: Record<string, unknown>): string | null {
  const _data = payload._data as Record<string, unknown> | undefined;
  const info = _data?.Info as Record<string, unknown> | undefined;
  
  // GOWS: _data.Info.PushName (capital P)
  if (info?.PushName && typeof info.PushName === "string" && info.PushName.trim()) {
    return info.PushName;
  }
  // GOWS: VerifiedName for business accounts
  const verifiedName = (info?.VerifiedName as Record<string, unknown>)?.Details as Record<string, unknown>;
  if (verifiedName?.verifiedName && typeof verifiedName.verifiedName === "string") {
    return verifiedName.verifiedName as string;
  }
  // WEBJS fallbacks
  return (_data?.pushName as string) || (_data?.notifyName as string) 
    || (payload.notifyName as string) || (payload.pushName as string) || null;
}
```

**Bloco individual fromMe (~linha 1155-1230) - adicionar GOWS strategy:**

Na secao onde o codigo tenta resolver `@lid` do `toField` para mensagens `fromMe`, adicionar como Strategy 0 (antes da Strategy 1 existente):

```typescript
// GOWS Strategy 0: _data.Info.RecipientAlt
const recipientAlt = (payload._data as any)?.Info?.RecipientAlt;
if (typeof recipientAlt === "string" && recipientAlt.includes("@s.whatsapp.net")) {
  toField = recipientAlt.replace("@s.whatsapp.net", "@c.us");
  lidResolved = true;
  console.log(`[waha-webhook] LID resolved via GOWS RecipientAlt: ${originalLid} -> ${toField}`);
}
```

**Bloco grupo (~linha 1010-1056) - adicionar GOWS strategy:**

Na secao onde o codigo tenta resolver `@lid` do `participantRaw`, adicionar como Strategy 0:

```typescript
// GOWS Strategy 0: _data.Info.SenderAlt
const senderAlt = (payload._data as any)?.Info?.SenderAlt;
if (typeof senderAlt === "string" && senderAlt.includes("@s.whatsapp.net")) {
  resolvedParticipant = senderAlt.replace("@s.whatsapp.net", "@c.us");
  console.log(`[waha-webhook] Group participant LID resolved via GOWS SenderAlt: ${originalLidParticipant} -> ${resolvedParticipant}`);
}
```

**Bloco individual recebido (~linha 1230-1252) - adicionar GOWS strategy:**

Na secao onde resolve `rawFrom` com @lid para mensagens recebidas:

```typescript
// GOWS Strategy: _data.Info.Sender or _data.Info.Chat
const infoSender = (payload._data as any)?.Info?.Sender;
const infoChat = (payload._data as any)?.Info?.Chat;
const gowsFrom = [infoSender, infoChat].find(
  (v) => typeof v === "string" && v.includes("@s.whatsapp.net")
);
if (gowsFrom) {
  resolvedFrom = gowsFrom.replace("@s.whatsapp.net", "@c.us");
  console.log(`[waha-webhook] Resolved @lid via GOWS Info: ${rawFrom} -> ${resolvedFrom}`);
}
```

**Substituir todas as ocorrencias de extracao de phoneName:**

Trocar todas as linhas como:
```typescript
phoneName = payload._data?.pushName || payload._data?.notifyName || ...
```
Por:
```typescript
phoneName = extractPushName(payload);
```

Isso afeta 4 pontos: canal (~962), grupo (~1061), individual fromMe (~1228), individual recebido (~1251).

### 6. Migracao de Dados Existentes

Script SQL que retroativamente corrige nomes usando os raw_data ja salvos:

```sql
-- Atualizar conversas individuais onde o nome é um numero/LID
-- usando o PushName salvo nos raw_data das mensagens
UPDATE conversas c
SET nome = sub.push_name
FROM (
  SELECT DISTINCT ON (m.conversa_id) 
    m.conversa_id,
    COALESCE(
      m.raw_data->'_data'->'Info'->>'PushName',
      m.raw_data->'_data'->>'pushName'
    ) as push_name
  FROM mensagens m
  WHERE COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) IS NOT NULL
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) != ''
  ORDER BY m.conversa_id, m.criado_em DESC
) sub
WHERE c.id = sub.conversa_id
AND c.tipo = 'individual'
AND c.nome ~ '^\d+$';

-- Atualizar contatos com nomes numericos
UPDATE contatos ct
SET nome = sub.push_name
FROM (
  SELECT DISTINCT ON (c.contato_id)
    c.contato_id,
    COALESCE(
      m.raw_data->'_data'->'Info'->>'PushName',
      m.raw_data->'_data'->>'pushName'
    ) as push_name
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) IS NOT NULL
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) != ''
  ORDER BY c.contato_id, m.criado_em DESC
) sub
WHERE ct.id = sub.contato_id
AND ct.nome ~ '^\d+$';
```

---

## Resumo das Alteracoes

| Arquivo / Acao | Alteracao |
|----------------|-----------|
| `waha-webhook/index.ts` | Adicionar `extractPushName()` helper compativel GOWS+WEBJS |
| `waha-webhook/index.ts` | Adicionar GOWS LID resolution via `_data.Info.RecipientAlt` (individual fromMe) |
| `waha-webhook/index.ts` | Adicionar GOWS LID resolution via `_data.Info.SenderAlt` (grupos) |
| `waha-webhook/index.ts` | Adicionar GOWS LID resolution via `_data.Info.Sender/Chat` (individual recebido) |
| `waha-webhook/index.ts` | Substituir 4 pontos de extracao de phoneName pelo helper |
| Banco de dados | Migracao retroativa de nomes usando raw_data existentes |
| Deploy | Redeploy da edge function waha-webhook |

