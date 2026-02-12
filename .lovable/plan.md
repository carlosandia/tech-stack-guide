

# Plano: Receber TODAS as mensagens (Grupos, Canais, fromMe)

## Problema Identificado

No arquivo `supabase/functions/waha-webhook/index.ts`, **linha 296-302**, existe um bloqueio explícito:

```typescript
if (isFromMe && (isGroup || isChannel)) {
  console.log("[waha-webhook] Skipping fromMe in group/channel");
  return ... // DESCARTA a mensagem
}
```

Isso significa que **qualquer mensagem enviada por você** em grupos ou canais é ignorada. E no caso de canais do WhatsApp (como "Fast Tennis"), todas as mensagens são enviadas pelo administrador do canal, ou seja, o WAHA pode interpretar como `fromMe` dependendo da configuracao, ou simplesmente nao ter `participant` no payload, fazendo o webhook descartar.

Adicionalmente, na linha 410-416, mensagens de grupo sem `participant` tambem sao descartadas.

## Solucao

### 1. Remover bloqueio de `fromMe` em grupos/canais

Em vez de descartar, processar normalmente. Para evitar criar contato duplicado do proprio numero, usar o `participant` (quem enviou no grupo) como contato, e quando for `fromMe`, marcar a mensagem como `from_me: true` mas ainda persistir.

### 2. Tratar canais sem `participant`

Canais (`@newsletter`) geralmente nao enviam `participant`. Nesses casos, usar o ID do canal como `chatId` e criar um contato generico representando o canal em si.

### 3. Tratar grupos sem `participant`

Quando um grupo nao tiver `participant` (ex: mensagens de sistema, notificacoes), em vez de descartar, registrar com um contato generico do grupo.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-webhook/index.ts`

**Mudanca 1 - Remover bloqueio fromMe (linhas 295-302):**
- Remover o `if (isFromMe && (isGroup || isChannel)) return`
- Para `fromMe` em grupos: usar o numero do proprio usuario (da sessao) como remetente, mas manter `from_me: true` na mensagem
- Para `fromMe` em canais: mesmo tratamento

**Mudanca 2 - Grupos sem participant (linhas 410-416):**
- Em vez de retornar "No participant", usar um fallback:
  - Se `fromMe`, buscar o phone_number da sessao do usuario
  - Senao, usar o ID do grupo como identificador e criar um contato generico "Participante desconhecido"

**Mudanca 3 - Canais sem participant (linhas 311-359):**
- Para canais, o `participant` quase nunca vem. O comportamento atual ja tenta usar `rawFrom.replace("@newsletter", "")` como fallback, mas pode falhar se `fromMe` bloqueia antes
- Com a remocao do bloqueio da Mudanca 1, canais passarao a funcionar

### Resumo das alteracoes

| O que muda | Onde | Impacto |
|---|---|---|
| Remove bloqueio fromMe grupo/canal | Linha 296-302 | Mensagens enviadas por voce em grupos/canais serao salvas |
| Fallback para grupo sem participant | Linha 410-416 | Mensagens de sistema/notificacao de grupo nao serao perdidas |
| Nenhuma mudanca no frontend | - | O frontend ja lista todos os tipos de conversa |

### Nenhuma mudanca de banco necessaria

A tabela `conversas` ja suporta `tipo` = "grupo", "canal", "individual". A tabela `mensagens` ja tem `from_me`. Nao ha migracao necessaria.

