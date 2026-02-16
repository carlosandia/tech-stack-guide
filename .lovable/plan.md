
# Correcao Definitiva: Duplicidade fromMe + @lid nao resolvido

## Diagnostico Completo

A duplicidade acontece em DOIS cenarios interligados no tenant Renove Digital:

### Cenario Real (Francisco Carlos)

1. **18:16:58** - Francisco envia audio para Carlos
   - `from = 82064342802621@lid` (GOWS nao resolve)
   - Codigo tenta resolver: `Info.Sender = 82064342802621@lid` (nao ajuda), `Info.Chat = 82064342802621@lid` (nao ajuda)
   - **Bug 1**: O campo `SenderAlt = 553599562143@s.whatsapp.net` (numero REAL) existe no payload mas NAO e verificado no branch de mensagens recebidas
   - Contato criado: "Francisco Carlos" com telefone `82064342802621` (LID, nao real)
   - Conversa criada: `chat_id = 82064342802621@lid`

2. **18:17:25** - Carlos responde pelo WhatsApp Web (fora do CRM), `fromMe = true`
   - `from = 553599562143@c.us` (numero real do Francisco)
   - `toField = payload.to || rawFrom = 553599562143@c.us`
   - chatId = `553599562143@c.us`, phoneNumber = `553599562143`
   - Busca contato com telefone `553599562143` -- NAO encontra (Francisco foi salvo com `82064342802621`)
   - Busca fuzzy `%99562143` -- NAO bate com `82064342802621`
   - **Cria NOVO contato** com nome "553599562143" (sem nome, pois fromMe nao usa pushName)
   - Busca conversa com `chat_id = 553599562143@c.us` -- NAO encontra (conversa tem `82064342802621@lid`)
   - Tentativas 2-5 todas checam `chatId.includes("@lid")` -- **PULA** pois chatId e `@c.us`
   - **Bug 2**: Nao existe nenhuma tentativa reversa: "procurar conversa @lid que pertenca ao mesmo contato real"
   - **Cria NOVA conversa duplicada**

### Bugs Identificados

1. **Branch nao-fromMe nao verifica `SenderAlt`**: Quando o payload tem `from = @lid`, o codigo tenta `Info.Sender` e `Info.Chat`, mas AMBOS sao @lid. O `SenderAlt` (que contem o numero real @s.whatsapp.net) NAO e verificado.

2. **Busca de conversa ignora cenario @c.us -> @lid**: As Tentativas 2-5 todas exigem `chatId.includes("@lid")`. Quando chatId e `@c.us` mas a conversa existente tem `@lid`, nenhuma tentativa funciona.

3. **Busca de contato nao cruza @lid com numero real**: Quando phoneNumber e `553599562143`, a busca fuzzy nao encontra contato com telefone `82064342802621` porque sao numeros completamente diferentes.

## Solucao (3 mudancas no webhook)

### Mudanca 1: Resolver @lid via SenderAlt no branch nao-fromMe

No branch de mensagens recebidas (linha ~1420), apos tentar `Info.Sender` e `Info.Chat`, adicionar verificacao de `SenderAlt`:

```typescript
// Apos verificar Info.Sender e Info.Chat:
if (resolvedFrom.includes("@lid")) {
  const senderAlt = (payload._data as any)?.Info?.SenderAlt;
  if (typeof senderAlt === "string" && senderAlt.includes("@s.whatsapp.net")) {
    resolvedFrom = senderAlt.replace("@s.whatsapp.net", "@c.us");
    console.log(`[waha-webhook] Resolved @lid via SenderAlt: ${rawFrom} -> ${resolvedFrom}`);
  }
}
```

Isso resolve o problema na RAIZ: a primeira mensagem ja cria contato e conversa com o numero real, impedindo toda a cadeia de duplicidade.

### Mudanca 2: Busca reversa de conversa @lid quando chatId e @c.us

Apos Tentativa 1b e ANTES da Tentativa 2, adicionar busca que conecta @c.us com @lid:

```typescript
// Tentativa 1c: chatId e @c.us mas pode existir conversa com @lid do mesmo contato
if (!existingConversa && !chatId.includes("@lid") && conversaTipo === "individual") {
  // Buscar por contato_id (o contato ja encontrado pode ter conversa com @lid)
  if (contatoId) {
    const { data: conversaByContato } = await supabaseAdmin
      .from("conversas")
      .select("id, total_mensagens, mensagens_nao_lidas, chat_id, contato_id")
      .eq("organizacao_id", sessao.organizacao_id)
      .eq("contato_id", contatoId)
      .eq("tipo", "individual")
      .is("deletado_em", null)
      .maybeSingle();

    if (conversaByContato) {
      existingConversa = conversaByContato;
      // Se conversa tem @lid, atualizar para @c.us
      if (conversaByContato.chat_id.includes("@lid")) {
        await supabaseAdmin
          .from("conversas")
          .update({ chat_id: chatId })
          .eq("id", conversaByContato.id);
      }
      chatId = conversaByContato.chat_id.includes("@lid") ? chatId : conversaByContato.chat_id;
    }
  }
}
```

### Mudanca 3: Busca cruzada de contato via raw_data (SenderAlt)

Na busca de contato, quando phoneNumber e @c.us e nao encontrou contato, buscar se existe conversa com outro chat_id cujo raw_data contenha o phoneNumber:

```typescript
// Apos Tentativa 3b: busca contato via conversas que referenciam este numero no raw_data
if (!existingContato && !chatId.includes("@lid") && conversaTipo === "individual") {
  const { data: rpcResult } = await supabaseAdmin
    .rpc("resolve_lid_conversa", {
      p_org_id: sessao.organizacao_id,
      p_lid_number: phoneNumber,
    });

  if (rpcResult && rpcResult.length > 0) {
    // Encontrou conversa que referencia este numero - buscar o contato dela
    const { data: conversaRef } = await supabaseAdmin
      .from("conversas")
      .select("contato_id")
      .eq("id", rpcResult[0].conversa_id)
      .maybeSingle();

    if (conversaRef?.contato_id) {
      const { data: contatoRef } = await supabaseAdmin
        .from("contatos")
        .select("id, nome, telefone")
        .eq("id", conversaRef.contato_id)
        .is("deletado_em", null)
        .maybeSingle();

      if (contatoRef) {
        existingContato = contatoRef;
        // Atualizar telefone para o real
        if (contatoRef.telefone !== phoneNumber) {
          await supabaseAdmin
            .from("contatos")
            .update({ telefone: phoneNumber })
            .eq("id", contatoRef.id);
        }
      }
    }
  }
}
```

### Mudanca 4: Limpeza SQL dos dados duplicados no Renove Digital

```sql
-- Mover mensagens da conversa @lid para a @c.us
-- Merge contatos duplicados
-- Soft-delete registros @lid
```

## Resultado Esperado

- **Mudanca 1** resolve 90% dos casos: SenderAlt presente na maioria dos payloads GOWS, resolve @lid na primeira mensagem
- **Mudanca 2** e safety net para mensagens fromMe: se a conversa foi criada com @lid, a resposta fromMe com @c.us encontra e atualiza
- **Mudanca 3** evita criar contato duplicado quando ja existe um com @lid
- Dados existentes limpos via migracao SQL
