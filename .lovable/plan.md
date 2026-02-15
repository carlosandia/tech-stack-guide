
# Correcao: Filtrar Status/Broadcast do WhatsApp e Resolver Nomes Faltantes

## Problema 1: Conversa "status@broadcast"

O `status@broadcast` e o **Status do WhatsApp** (stories) - quando alguem posta uma foto/video no status. O WAHA captura esses eventos e envia como mensagens normais pelo webhook. Como o `chat_id` nao contem `@g.us` nem `@newsletter`, o webhook trata como conversa individual, criando:
- Uma conversa falsa chamada "status@broadcast"
- Um contato fantasma com telefone "status@broadcast"
- Mensagens (fotos/videos dos status de contatos) dentro dessa conversa

Isso **nao deveria existir no CRM** pois status do WhatsApp nao sao conversas reais.

## Problema 2: Conversa "554398510839" sem nome

O contato foi criado usando apenas o numero como fallback porque o `pushName` veio vazio no momento da criacao. O webhook salva o numero como nome e, em atualizacoes futuras, so sobrescreve se o `phoneName` vier preenchido.

## Solucao

### 1. Filtrar `status@broadcast` no webhook (prevencao)

No arquivo `supabase/functions/waha-webhook/index.ts`, adicionar um filtro logo apos extrair o `rawFrom`, antes do bloco de deteccao de tipo (linha ~925):

```typescript
// Ignorar mensagens de Status/Stories do WhatsApp
if (rawFrom === "status@broadcast") {
  console.log("[waha-webhook] Ignoring status@broadcast message (WhatsApp Status/Stories)");
  return new Response(
    JSON.stringify({ ok: true, message: "Status broadcast ignored" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

Isso impede que novas mensagens de status criem conversas ou contatos no CRM.

### 2. Limpar dados existentes no banco

Apagar a conversa e mensagens de `status@broadcast` ja criadas, e o contato fantasma associado:

- Apagar mensagens da conversa `bfb21f17-e8f8-42d5-8205-a7201b25de95`
- Apagar a conversa
- Apagar o contato com telefone "status@broadcast" (se nao estiver vinculado a outros dados)

### 3. Resolver nome da conversa "554398510839"

Esse e um problema pontual - o webhook ja tenta resolver o nome via `pushName`, mas nesse caso veio vazio. Nao ha correcao de codigo necessaria (o mecanismo ja existe). A proxima mensagem recebida desse contato com `pushName` preenchido atualizara o nome automaticamente.

Se desejar, posso atualizar manualmente o nome do contato no banco, caso voce saiba o nome real dessa pessoa.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-webhook/index.ts`

Adicionar filtro antes da linha 925 (antes do bloco "DETECT GROUP vs INDIVIDUAL vs CHANNEL"):

```typescript
// =====================================================
// IGNORE STATUS/STORIES BROADCAST
// =====================================================
if (rawFrom === "status@broadcast") {
  console.log("[waha-webhook] Ignoring status@broadcast (WhatsApp Status/Stories)");
  return new Response(
    JSON.stringify({ ok: true, message: "Status broadcast ignored" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Limpeza no banco (SQL manual)

```sql
-- Apagar mensagens do status@broadcast
DELETE FROM mensagens WHERE conversa_id = 'bfb21f17-e8f8-42d5-8205-a7201b25de95';

-- Apagar a conversa
DELETE FROM conversas WHERE id = 'bfb21f17-e8f8-42d5-8205-a7201b25de95';

-- Apagar contato fantasma (verificar se nao tem outros vinculos)
DELETE FROM contatos WHERE telefone = 'status@broadcast' AND nome = 'status@broadcast';
```

## Resumo das Alteracoes

| Arquivo / Acao | Alteracao |
|----------------|-----------|
| `waha-webhook/index.ts` | Adicionar filtro para ignorar `status@broadcast` |
| Banco de dados | Limpar conversa, mensagens e contato fantasma existentes |
