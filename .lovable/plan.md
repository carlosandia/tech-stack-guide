

## Diagnostico Completo

Encontrei **2 problemas criticos** que impedem o funcionamento:

### Problema 1: Sessao WhatsApp desconectada pelo `configurar_webhook`

O action `configurar_webhook` usa `PUT /api/sessions/{sessionId}` na API do WAHA. Esse endpoint **substitui** a configuracao inteira da sessao, causando um **restart** (o log mostra `"status":"STARTING"`). Isso desconectou o WhatsApp e por isso a mensagem "Tata" **nunca chegou** ao webhook.

A boa noticia e que o `iniciar` (action que cria a sessao) **ja configura o webhook** corretamente durante a criacao. Entao o `configurar_webhook` via PUT e desnecessario e prejudicial.

### Problema 2: `waha-webhook` nao cria conversas/mensagens

A Edge Function `waha-webhook` apenas cria registros em `pre_oportunidades`. Ela **nao cria** registros nas tabelas `conversas` nem `mensagens`. Por isso as mensagens recebidas via WhatsApp **nunca aparecem** no modulo `/conversas`.

---

## Plano de Correcao

### Etapa 1: Corrigir `configurar_webhook` para nao reiniciar a sessao

**Arquivo**: `supabase/functions/waha-proxy/index.ts`

Em vez de usar `PUT /api/sessions/{sessionId}` (que reinicia a sessao), o action `configurar_webhook` vai:

1. Primeiro verificar o status atual da sessao via `GET /api/sessions/{sessionId}`
2. Se estiver WORKING (conectada), usar `PUT /api/sessions/{sessionId}` mas preservando todos os dados existentes da sessao, OU melhor: simplesmente **parar e reiniciar** a sessao com a config atualizada usando `POST /api/sessions/stop` + `POST /api/sessions/start`
3. Na verdade, a melhor abordagem e: **nao chamar o WAHA** para configurar webhook, apenas salvar no banco. O webhook ja foi configurado durante o `iniciar`. Se a sessao ja existia antes do webhook ser implementado, o usuario deve desconectar e reconectar.

**Solucao escolhida**: Alterar `configurar_webhook` para usar a API correta do WAHA que atualiza webhooks sem reiniciar: `PUT /api/sessions/{sessionId}/config` (se disponivel) ou simplesmente verificar se o webhook ja esta configurado e, se nao, avisar o usuario para reconectar.

### Etapa 2: Atualizar `waha-webhook` para criar conversas e mensagens

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Adicionar logica para que, ao receber uma mensagem, o webhook tambem:

1. **Buscar ou criar contato** (`contatos` table)
   - Buscar por `telefone = phoneNumber` na organizacao
   - Se nao existir, criar com `nome = phoneName || phoneNumber`, `tipo = 'pessoa'`, `origem = 'whatsapp'`

2. **Buscar ou criar conversa** (`conversas` table)
   - Buscar conversa existente para este contato + sessao_whatsapp
   - Se nao existir, criar com `canal = 'whatsapp'`, `status = 'aberta'`, `sessao_whatsapp_id`, etc.

3. **Criar mensagem** (`mensagens` table)
   - Inserir registro com `from_me = false`, `tipo = 'text'`, `body = messageBody`, etc.

4. **Atualizar conversa** com contadores e timestamps
   - Incrementar `total_mensagens` e `mensagens_nao_lidas`
   - Atualizar `ultima_mensagem_em`

5. **Manter a logica de pre-oportunidades** existente (se `auto_criar_pre_oportunidade` estiver habilitado)

### Etapa 3: Reconectar sessao WAHA

Apos o deploy, sera necessario reconectar a sessao WhatsApp (desconectar e conectar novamente) para que o WAHA tenha a URL do webhook configurada. O webhook sera configurado automaticamente durante o `iniciar`.

---

## Detalhes Tecnicos

### Fluxo completo apos correcao:

```text
Mensagem WhatsApp
    |
    v
WAHA Server --> POST /functions/v1/waha-webhook
    |
    v
waha-webhook Edge Function
    |
    +---> 1. Buscar sessao_whatsapp pelo session_name
    +---> 2. Buscar/criar contato pelo telefone
    +---> 3. Buscar/criar conversa (contato + sessao)
    +---> 4. Inserir mensagem na conversa
    +---> 5. Atualizar contadores da conversa
    +---> 6. Se auto_criar_pre_oportunidade: criar/atualizar pre-op
    +---> 7. Realtime dispara para o frontend
```

### Alteracoes nos arquivos:

1. **`supabase/functions/waha-webhook/index.ts`** - Adicionar logica de conversas/mensagens/contatos (principal alteracao)
2. **`supabase/functions/waha-proxy/index.ts`** - Corrigir action `configurar_webhook` para nao reiniciar sessao
3. **Deploy das duas edge functions** apos alteracoes

### Tabelas envolvidas (ja existentes, sem migracao):

- `contatos` - buscar/criar contato pelo telefone
- `conversas` - buscar/criar conversa com `sessao_whatsapp_id`, `contato_id`, `canal='whatsapp'`
- `mensagens` - inserir mensagem recebida com `from_me=false`
- `pre_oportunidades` - manter logica existente

