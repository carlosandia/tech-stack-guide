

## Plano: Resolver mencoes com LID do GOWS

### Problema

Com WAHA GOWS, mencoes em grupos usam LIDs (Linked IDs) ao inves de numeros reais de telefone. O corpo da mensagem contem `@162826672971943` (um LID), e o array `mentionedJid` contem `162826672971943@lid`.

O resolver atual falha porque:
1. LID nao e um telefone real -- busca no DB de contatos nunca encontra
2. Se a pessoa mencionada nao enviou mensagem no grupo, nao ha pushName disponivel

### Solucao

Adicionar uma **terceira fonte de resolucao**: consultar a tabela `mensagens` para buscar mensagens onde o `participant` contem o LID mencionado, extraindo o `from_number` (numero real) ou o pushName do `raw_data` dessas mensagens.

Fluxo atualizado de resolucao:

```text
mentionedJid (LID) 
      |
      v
1. Busca no DB de contatos (por telefone) --> encontrou? usa nome
      |  nao
      v
2. Busca nos pushNames das mensagens carregadas --> encontrou? usa pushName
      |  nao
      v
3. [NOVO] Busca na tabela mensagens por participant LIKE %LID% 
   --> extrai from_number e/ou pushName do raw_data
   --> com from_number, busca nome no DB de contatos
      |  nao
      v
4. Exibe numero formatado (fallback atual)
```

### Alteracoes

**Arquivo**: `src/modules/conversas/hooks/useMentionResolver.ts`

1. Detectar quais numeros mencionados sao LIDs (numeros com mais de 13 digitos que nao foram resolvidos pelos contatos nem pushNames)

2. Criar funcao `resolveLids` que:
   - Recebe os LIDs nao resolvidos e o `conversaId` (ou `organizacaoId`)
   - Consulta a tabela `mensagens` buscando `participant.ilike.%{lid}%`
   - Extrai o `from_number` dessas mensagens (que e o numero real)
   - Extrai pushName do `raw_data` como fallback
   - Retorna Map de LID -> nome (via contato do DB usando from_number) ou LID -> pushName

3. Adicionar um segundo `useQuery` para resolver LIDs pendentes

4. No merge final do `contactMap`, incluir os resultados dos LIDs resolvidos

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

Nenhuma alteracao necessaria -- o `TextContent` ja usa o `contactMap` generico e funcionara automaticamente quando os LIDs estiverem mapeados.

### Detalhes tecnicos

A funcao `resolveLids` fara algo como:

```typescript
async function resolveLids(
  lids: string[], 
  conversaId: string
): Promise<Map<string, string>> {
  // Buscar mensagens onde participant contem o LID
  // para extrair from_number (numero real) e pushName
  const { data } = await supabase
    .from('mensagens')
    .select('from_number, participant, raw_data')
    .eq('conversa_id', conversaId)
    .in('participant', lids.map(l => [`${l}@lid`]).flat())
    .limit(50)

  // Para cada LID, pegar from_number e buscar contato
  // Ou extrair pushName do raw_data como fallback
}
```

Para identificar LIDs vs numeros reais: LIDs do WhatsApp tipicamente tem mais de 15 digitos e nao seguem padrao de telefone internacional. Mas a abordagem mais segura e verificar quais numeros NAO foram resolvidos pelas fontes 1 e 2.

### Props necessarias

O hook `useMentionResolver` precisa receber o `conversaId` como parametro adicional para fazer a query de mensagens por LID.

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/modules/conversas/hooks/useMentionResolver.ts` | Editar -- adicionar resolucao de LIDs via tabela mensagens |
| `src/modules/conversas/components/ChatMessages.tsx` | Editar -- passar `conversaId` para `useMentionResolver` |

