
# Webhook Trigger com Debug/Inspecao no Motor de Automacoes

## Visao Geral

Adicionar um novo tipo de gatilho `webhook_recebido` ao motor de automacoes, permitindo que o usuario:
1. Receba dados de qualquer sistema externo via URL unica
2. Inspecione/debugue o payload recebido (como "Listen for test event" do N8N)
3. Mapeie campos do payload para entidades do CRM
4. Execute acoes encadeadas (condicoes, delays, webhook de saida, etc.)

O fluxo completo seria: **Sistema externo -> Webhook Entrada -> Trigger Automacao -> Condicoes -> Acoes -> Webhook Saida**

## O que ja existe e sera reutilizado

- Edge Function `webhook-entrada` (recebe POST externo com autenticacao via API Key)
- Tabela `webhooks_entrada` (URL, token, chaves)
- Tabela `eventos_automacao` (fila de eventos para o motor)
- Motor `processar-eventos-automacao` (consome eventos e executa acoes)
- Acao `enviar_webhook` (webhook de saida no final do fluxo)

## Plano de Implementacao

### 1. Novo Trigger: `webhook_recebido`

**Arquivo**: `src/modules/automacoes/schemas/automacoes.schema.ts`

Adicionar ao array `TRIGGER_TIPOS` uma nova categoria "Webhooks" com o trigger:

```
{ tipo: 'webhook_recebido', label: 'Webhook externo recebido', categoria: 'webhooks', icon: 'Webhook' }
```

E adicionar a categoria correspondente em `TRIGGER_CATEGORIAS`:

```
{ key: 'webhooks', label: 'Webhooks' }
```

### 2. Painel de Configuracao do Trigger Webhook

**Arquivo**: `src/modules/automacoes/components/panels/TriggerConfig.tsx`

Quando o usuario selecionar o trigger `webhook_recebido`, exibir:

- **Seletor de webhook de entrada** (dropdown com webhooks da tabela `webhooks_entrada`)
- **URL do webhook** (somente leitura, com botao de copiar)
- **Botao "Escutar Evento de Teste"** — ativa o modo debug
- **Painel de ultimo payload recebido** — mostra JSON formatado do ultimo request
- **Mapeamento de campos** — interface para mapear `payload.campo` -> `contato.campo`

O modo debug funciona assim:
1. Usuario clica "Escutar Evento de Teste"
2. O sistema faz polling (a cada 3s) na tabela `webhooks_entrada_logs` buscando novos requests
3. Quando detecta um novo request, exibe o payload completo na tela
4. O usuario pode clicar nos campos do JSON para mapear para campos do CRM

### 3. Tabela de Logs do Webhook de Entrada

**Migracao SQL**: Criar tabela `webhooks_entrada_logs` para registrar todos os requests recebidos:

```
webhooks_entrada_logs:
- id (uuid PK)
- organizacao_id (uuid FK)
- webhook_id (uuid FK -> webhooks_entrada)
- payload (jsonb) -- o body completo recebido
- headers (jsonb) -- headers do request
- ip_origem (text)
- status_code (int) -- resposta dada
- processado (boolean) -- se ja gerou evento_automacao
- criado_em (timestamptz)
```

Isso serve tanto para debug (ver o que chegou) quanto para auditoria.

### 4. Edge Function: Emitir evento de automacao

**Arquivo**: `supabase/functions/webhook-entrada/index.ts`

Alem de criar o contato (comportamento atual), a Edge Function deve:
1. Registrar o request em `webhooks_entrada_logs`
2. Verificar se ha automacoes com trigger `webhook_recebido` vinculadas a este webhook
3. Se sim, inserir um evento em `eventos_automacao` com tipo `webhook_recebido` e os dados do payload

```typescript
// Apos criar contato (logica existente)...
// Registrar log do request
await supabase.from("webhooks_entrada_logs").insert({
  organizacao_id: webhook.organizacao_id,
  webhook_id: webhook.id,
  payload: body,
  headers: Object.fromEntries(req.headers.entries()),
  ip_origem: req.headers.get("x-forwarded-for") || "unknown",
  status_code: 200,
  processado: false,
});

// Emitir evento para motor de automacoes
await supabase.from("eventos_automacao").insert({
  organizacao_id: webhook.organizacao_id,
  tipo: "webhook_recebido",
  entidade_tipo: "webhook",
  entidade_id: webhook.id,
  dados: {
    webhook_id: webhook.id,
    payload: body,
    contato_id: contato?.id,
    // Campos mapeados sao resolvidos pelo motor
  },
});
```

### 5. Motor de Automacao: Processar trigger webhook_recebido

**Arquivo**: `supabase/functions/processar-eventos-automacao/index.ts`

No matching de trigger, quando `trigger_tipo === 'webhook_recebido'`:
- Verificar se o `trigger_config.webhook_id` corresponde ao `evento.dados.webhook_id`
- Aplicar mapeamento de campos do `trigger_config.mapeamento` para resolver variaveis

Isso permite que o motor saiba: "este webhook de entrada X deve disparar esta automacao Y com estes campos mapeados Z".

### 6. Interface de Mapeamento de Campos (Debug)

O painel do trigger webhook tera 3 estados:

**Estado 1 - Configuracao inicial**: Selecionar webhook de entrada, ver URL, copiar.

**Estado 2 - Modo Escuta (Listen)**: Botao "Escutar Evento de Teste" ativo, polling por novos payloads. Mostra spinner "Aguardando dados... Envie um POST para a URL acima".

**Estado 3 - Payload recebido**: Mostra JSON formatado lado a lado com campos do CRM. O usuario arrasta/seleciona campo do JSON e indica para qual campo do CRM vai. Exemplo:
```
payload.name     ->  contato.nome
payload.email    ->  contato.email
payload.company  ->  contato.empresa
payload.phone    ->  contato.telefone
```

O mapeamento e salvo no `trigger_config.mapeamento` como:
```json
{
  "webhook_id": "uuid-do-webhook",
  "mapeamento": {
    "contato.nome": "name",
    "contato.email": "email",
    "contato.telefone": "phone"
  }
}
```

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---|---|
| `src/modules/automacoes/schemas/automacoes.schema.ts` | Adicionar trigger `webhook_recebido` e categoria `webhooks` |
| `src/modules/automacoes/components/panels/TriggerConfig.tsx` | Adicionar painel de configuracao do webhook trigger com modo debug |
| `src/modules/automacoes/components/panels/WebhookDebugPanel.tsx` | **NOVO** — Componente de debug/escuta com visualizador de JSON e mapeamento |
| `supabase/functions/webhook-entrada/index.ts` | Registrar log + emitir evento_automacao |
| `supabase/functions/processar-eventos-automacao/index.ts` | Suportar trigger `webhook_recebido` com mapeamento de campos |
| Migracao SQL | Criar tabela `webhooks_entrada_logs` |

## Fluxo Completo do Usuario

```text
1. Cria automacao com trigger "Webhook externo recebido"
2. Seleciona (ou cria) um webhook de entrada
3. Copia a URL e envia para o sistema externo
4. Clica "Escutar Evento de Teste" e faz um POST de teste
5. Ve o payload completo na tela e mapeia campos
6. Adiciona condicoes (ex: se payload.status == "new")
7. Adiciona acoes (criar contato, criar oportunidade, etc.)
8. Opcionalmente adiciona webhook de saida no final
9. Ativa a automacao
```

## Consideracoes Tecnicas

- **Polling vs Realtime**: Para o modo debug, usar polling simples (3s) na tabela `webhooks_entrada_logs`. Realtime nao e necessario aqui pois e usado pontualmente durante configuracao.
- **Seguranca**: O webhook de entrada ja tem autenticacao via API Key, nao muda.
- **Separacao de conceitos**: O webhook de entrada continua criando contatos por padrao. O trigger de automacao e um comportamento ADICIONAL que roda em paralelo. O usuario pode desativar a criacao automatica de contatos se preferir usar apenas via automacao.
- **Logs/Auditoria**: Todos os requests ficam registrados em `webhooks_entrada_logs` com payload completo, atendendo ao requisito de observabilidade do arquiteto de produto.
