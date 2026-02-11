# PRD — Melhorias do Módulo de Automações

## Resumo

Expandir o motor de automações com novas capacidades, adaptadas para a realidade do CRM Renove. O foco é adicionar novos tipos de ações, enriquecer o nó de condição com suporte a múltiplas condições (AND), criar um novo tipo de nó "Validação" para avaliar respostas de mensagens e adicionar triggers de comunicação. Nenhuma estrutura visual (React Flow) será alterada — apenas novos tipos e configurações dentro do sistema atual.

---

## O que já existe (não será duplicado)

| Funcionalidade | Status |
|---|---|
| Enviar WhatsApp (texto) | ✅ Existe |
| Enviar Email (básico) | ✅ Existe |
| Criar Tarefa | ✅ Existe |
| Alterar Responsável | ✅ Existe |
| Mover para Etapa | ✅ Existe |
| Atualizar Campo (Oportunidade/Contato) | ✅ Existe |
| Adicionar Segmento | ✅ Existe |
| Delay (Aguardar) | ✅ Existe |
| Condição (campo + operador + valor, única) | ✅ Existe |
| Notificação Interna | ✅ Existe |

---

## Parte 1 — Novas Ações

### 1.1 Enviar Mensagem WhatsApp com Mídia

Expandir a ação `enviar_whatsapp` existente para suportar:

- Texto com variáveis dinâmicas (já existe)
- Tipo de mídia: áudio ou anexo (arquivo/imagem)
- Campo `midia_url` para URL do arquivo
- Campo `midia_tipo` (`audio`, `imagem`, `documento`)

**Arquivos afetados:**
- `AcaoConfig.tsx` — adicionar campos condicionais quando tipo = `enviar_whatsapp`
- Edge Function `processar-eventos-automacao` — expandir case `enviar_whatsapp` para enviar mídia via WAHA

### 1.2 Adicionar Nota em Oportunidade

Nova ação `adicionar_nota` — insere registro na tabela `anotacoes_oportunidades`.

- Config: `conteudo` (textarea com variáveis dinâmicas), `tipo` (texto/observação)
- Requer que o evento tenha `oportunidade_id` no contexto

### 1.3 Alterar Status da Conversa WhatsApp

Nova ação `alterar_status_conversa` — atualiza o campo `status` da tabela `conversas`.

- Config: `status` (select: aberta, pendente, resolvida, fechada)
- Busca a conversa pelo `contato_id` do evento

### 1.4 Enviar Webhook

Nova ação `enviar_webhook` — dispara POST para uma URL configurada.

- Config: `webhook_id` (select dos webhooks_saída cadastrados) OU `url` manual
- Payload: dados do evento + variáveis do contato/oportunidade
- Registra na tabela `webhooks_saida_logs`

### 1.5 Enviar Email com Modelo

Expandir a ação `enviar_email` existente para suportar:

- Seleção de modelo pré-cadastrado (futuro: tabela `modelos_email`)
- Campos: `assunto`, `corpo` (HTML com editor rico), `destinatário`
- Checkbox: "Aplicar apenas ao contato principal"
- Variáveis dinâmicas no corpo

### 1.6 Definir/Alterar Campo Genérico (UX unificada)

Unificar `atualizar_campo_oportunidade` e `atualizar_campo_contato` em uma UX mais clara:

- Select de entidade (Oportunidade ou Contato)
- Select de campo (carregado dinamicamente dos `campos_customizados`)
- Input de valor (com suporte a variáveis)

> Os tipos existentes permanecem no backend, apenas a UI fica mais intuitiva.

---

## Parte 2 — Novo Tipo de Nó: Validação

Criar um novo tipo de nó `validacao` que avalia a **resposta da última mensagem** recebida do contato. Diferente da "Condição" que avalia campos do CRM, a "Validação" avalia o **conteúdo textual** da resposta.

### Operadores de Validação

| Operador | Descrição |
|---|---|
| `iguais` | Texto exato |
| `desiguais` | Texto diferente |
| `contem` | Contém substring |
| `nao_contem` | Não contém substring |
| `comprimento` | Tem X caracteres |
| `expressao_regular` | Regex match |

### Tipos de Conteúdo

| Tipo | Descrição |
|---|---|
| `numeros` | Apenas dígitos |
| `letras` | Apenas alfabético |
| `telefone` | Formato de telefone |
| `email` | Formato de email |
| `faixa_numeros` | Dentro de um range (ex: 1-10) |

### Arquivos novos

| Arquivo | Descrição |
|---|---|
| `ValidacaoNode.tsx` | Nó visual roxo/violeta com 2 saídas (Match / Nenhuma) |
| `ValidacaoConfig.tsx` | Painel de configuração da validação |

### Registros necessários

- `FlowCanvas.tsx` — registrar nodeType `validacao`
- `AddNodeMenu.tsx` — adicionar opção "Validação"
- `NodeConfigPanel.tsx` — renderizar `ValidacaoConfig` para nós de validação

### Backend

- Novo case `validacao` no `avaliarCondicoes` da Edge Function
- A validação usa `evento.dados.ultima_resposta` como texto-alvo

---

## Parte 3 — Condição com Múltiplas Regras (AND)

Expandir o nó de Condição atual para suportar **múltiplas condições AND** dentro do mesmo nó.

### Mudanças no CondicaoConfig

- Trocar de campos únicos para um array `condicoes[]`
- Cada condição tem: `campo` + `operador` + `valor`
- Botão "+ Adicionar condição (e)" para empilhar regras AND
- Botão de remover condição individual
- O nó já tem 2 saídas (Sim/Não), nenhuma mudança visual necessária

### Novos campos disponíveis no select

| Campo | Descrição |
|---|---|
| `contato.origem` | Origem do contato |
| `contato.status` | Status do contato |
| `oportunidade.responsavel` | Responsável |
| `oportunidade.titulo` | Título |
| `conversa.canal` | Canal da conversa (whatsapp/instagram) |
| `conversa.status` | Status da conversa |

### Backend

A função `avaliarCondicoes` já suporta array de condições com `.every()`. Basta garantir que o `CondicaoConfig` salve o array corretamente no `data.condicoes`.

---

## Parte 4 — Triggers de Comunicação

Adicionar novos triggers relacionados a conversas:

| Trigger | Descrição | Categoria |
|---|---|---|
| `mensagem_recebida` | Quando uma mensagem chega (WhatsApp/Instagram) | comunicação |
| `conversa_criada` | Quando uma nova conversa é iniciada | comunicação |

### Mudanças

- `automacoes.schema.ts` — adicionar na lista `TRIGGER_TIPOS` com categoria `comunicacao`
- Backend: criar trigger SQL `emitir_evento_mensagem_recebida()` na tabela `mensagens` (INSERT)
- Incluir dados no evento: `texto`, `contato_id`, `canal`, `chat_id`

---

## Resumo de Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `automacoes.schema.ts` | Novas ações, novos triggers, novos operadores |
| `AcaoConfig.tsx` | Campos contextuais por tipo de ação (mídia, webhook, nota, status conversa) |
| `CondicaoConfig.tsx` | Suporte a múltiplas condições AND, novos campos |
| `ValidacaoNode.tsx` | **NOVO** — nó visual roxo com 2 saídas |
| `ValidacaoConfig.tsx` | **NOVO** — painel de configuração da validação |
| `AddNodeMenu.tsx` | Adicionar opção "Validação" |
| `FlowCanvas.tsx` | Registrar nodeType `validacao` |
| `NodeConfigPanel.tsx` | Renderizar `ValidacaoConfig` para nós de validação |
| `processar-eventos-automacao/index.ts` | Novos cases de ação + validação + triggers SQL |

---

## Detalhes Técnicos

### Estrutura de dados da Validação (node.data)

```json
{
  "tipo": "validacao",
  "condicoes": [
    { "operador": "contem", "tipo_conteudo": "numeros", "valor": "" },
    { "operador": "faixa", "valor_min": 1, "valor_max": 10 }
  ]
}
```

### Estrutura de dados da Condição expandida (node.data)

```json
{
  "tipo": "condicao",
  "condicoes": [
    { "campo": "contato.origem", "operador": "igual", "valor": "whatsapp" },
    { "campo": "oportunidade.valor", "operador": "maior", "valor": "1000" }
  ]
}
```

### Nova ação enviar_webhook (config)

```json
{
  "tipo": "enviar_webhook",
  "config": {
    "webhook_id": "uuid-do-webhook-saida",
    "payload_customizado": {}
  }
}
```

### Ordem de implementação sugerida

1. Schema (tipos e constantes)
2. Novos nós visuais (Validação)
3. Painéis de configuração (Validação, Condição expandida, Ação expandida)
4. Registro no canvas e menu
5. Backend (Edge Function — novos cases de ação + validação + triggers SQL)

---

## Parte 5 — Novos Triggers

Adicionar triggers que complementam os já existentes, sem duplicar.

| Trigger | Descrição | Categoria |
|---|---|---|
| `oportunidade_qualificada` | Quando oportunidade é marcada como MQL ou SQL | oportunidades |
| `campo_contato_alterado` | Quando um campo específico do contato muda (configurável) | contatos |
| `email_recebido` | Quando um email é recebido vinculado a oportunidade | comunicação |
| `conversa_finalizada` | Quando conversa é marcada como resolvida/fechada | comunicação |

> **Nota:** `contato_segmento_adicionado` já existe no schema e cobre o caso de "contato entrou em segmento". Não será duplicado.

> **Diferença:** `campo_contato_alterado` é diferente de `contato_atualizado` porque permite configurar **qual campo específico** dispara o trigger via `trigger_config.campo_monitorado`.

### trigger_config do `campo_contato_alterado`

```json
{
  "campo_monitorado": "email",
  "valor_esperado": ""
}
```

Se `valor_esperado` estiver vazio, dispara em qualquer mudança do campo. Se preenchido, dispara apenas quando o campo assume aquele valor.

### Backend

- `emitir_evento_automacao()` — expandir o case de `contato` (UPDATE) para emitir `campo_contato_alterado` com o nome do campo que mudou
- `emitir_evento_automacao()` — expandir o case de `oportunidade` (UPDATE) para emitir `oportunidade_qualificada` quando `qualificado_mql` ou `qualificado_sql` mudam para `true`
- Novo trigger SQL na tabela `emails_recebidos` (INSERT) para emitir `email_recebido`
- Novo trigger SQL na tabela `conversas` (UPDATE de `status` para `resolvida`/`fechada`) para emitir `conversa_finalizada`

---

## Parte 6 — Novas Ações

### 6.1 Criar Oportunidade

Nova ação `criar_oportunidade` — cria uma nova oportunidade no CRM automaticamente.

- Config: `funil_id` (select de funis), `etapa_id` (select de etapas do funil selecionado), `titulo` (textarea com variáveis dinâmicas), `valor` (input numérico, opcional), `responsavel_id` (select de usuários ou opção "manter atual")
- Requer `contato_id` no contexto do evento
- Útil quando: formulário preenchido, contato qualificado, mensagem recebida

```json
{
  "tipo": "criar_oportunidade",
  "config": {
    "funil_id": "uuid",
    "etapa_id": "uuid",
    "titulo": "{{contato.nome}} - Novo negócio",
    "valor": "0",
    "responsavel_id": "uuid"
  }
}
```

### 6.2 Remover Segmento

Nova ação `remover_segmento` — remove contato de um segmento (inverso do `adicionar_segmento` existente).

- Config: `segmento_id` (select de segmentos da organização)
- Remove registro da tabela `contatos_segmentos`

### 6.3 Marcar Resultado da Oportunidade

Nova ação `marcar_resultado_oportunidade` — fecha a oportunidade com resultado de ganho ou perda.

- Config: `resultado` (select: `ganho` ou `perda`), `motivo_id` (select de `motivos_resultado`)
- Move automaticamente para a etapa correspondente (tipo `ganho` ou `perda`) do funil
- Define `fechado_em` e `motivo_resultado_id`

```json
{
  "tipo": "marcar_resultado_oportunidade",
  "config": {
    "resultado": "ganho",
    "motivo_id": "uuid-do-motivo"
  }
}
```

### 6.4 Alterar Status do Contato

Nova ação `alterar_status_contato` — atualiza o campo `status` do contato.

- Config: `status` (select: ativo, inativo)

### 6.5 Distribuir para Responsável (Round Robin)

Nova ação `distribuir_responsavel` — distribui o contato/oportunidade entre responsáveis usando a configuração de distribuição existente do funil.

- Config: `funil_id` (usa a config de distribuição já cadastrada em `configuracoes_distribuicao`)
- Aproveita a lógica de round-robin que já existe no módulo de negócios
- Atualiza `posicao_rodizio` e `ultimo_usuario_id` na config de distribuição

### 6.6 Delay com Data/Hora Específica

Expandir a ação `aguardar` existente para suportar dois modos:

- **Modo tempo** (já existe): aguardar X minutos/horas/dias
- **Modo agendado** (novo): aguardar até uma data/hora específica ou até um dia da semana + horário

Config adicional no `DelayConfig.tsx`:

```json
{
  "modo": "agendado",
  "dia_semana": "segunda",
  "horario": "09:00",
  "data_hora": "2025-03-01T09:00:00"
}
```

Se `dia_semana` estiver preenchido, ignora `data_hora` e agenda para o próximo dia da semana no horário indicado.

---

## Parte 7 — Reorganização da UI de Ações

Reorganizar as categorias do `AcaoConfig.tsx` para uma experiência mais intuitiva, inspirada na organização do RD Station.

### Novas Categorias

| Categoria | Label UI | Ações |
|---|---|---|
| `comunicacao` | Comunicação | Enviar WhatsApp, Enviar Email, Notificação interna |
| `crm` | CRM | Criar Oportunidade, Criar Tarefa, Mover para Etapa, Marcar Resultado, Adicionar Nota |
| `contato` | Gerenciar Contato | Atualizar Campo (Contato), Atualizar Campo (Oportunidade), Adicionar Segmento, Remover Segmento, Alterar Status Contato |
| `responsavel` | Responsável | Alterar Responsável, Distribuir (Round Robin) |
| `controle` | Controle | Aguardar (delay) |
| `integracoes` | Integrações | Enviar Webhook, Alterar Status Conversa |

### Mudanças

- `automacoes.schema.ts` — atualizar o campo `categoria` em `ACAO_TIPOS` para refletir os novos agrupamentos
- `AcaoConfig.tsx` — atualizar o mapa `catLabels` com os novos nomes de categoria

---

## Resumo Completo de Arquivos Alterados (atualizado)

| Arquivo | Alteração |
|---|---|
| `automacoes.schema.ts` | Novas ações, novos triggers, novos operadores, novas categorias |
| `AcaoConfig.tsx` | Campos contextuais por tipo de ação + reorganização de categorias |
| `CondicaoConfig.tsx` | Suporte a múltiplas condições AND, novos campos |
| `DelayConfig.tsx` | Suporte a modo agendado (data/hora + dia da semana) |
| `ValidacaoNode.tsx` | **NOVO** — nó visual roxo com 2 saídas |
| `ValidacaoConfig.tsx` | **NOVO** — painel de configuração da validação |
| `AddNodeMenu.tsx` | Adicionar opção "Validação" |
| `FlowCanvas.tsx` | Registrar nodeType `validacao` |
| `NodeConfigPanel.tsx` | Renderizar `ValidacaoConfig` para nós de validação |
| `processar-eventos-automacao/index.ts` | Novos cases de ação + validação + triggers SQL |
| `emitir_evento_automacao()` | Novos eventos: qualificação, campo alterado |
| Triggers SQL novos | `email_recebido`, `conversa_finalizada` |

### Ordem de implementação sugerida (atualizada)

1. Schema (tipos, constantes, categorias) — Partes 1-6
2. Novos nós visuais (Validação) — Parte 2
3. Painéis de configuração (Validação, Condição AND, Ação expandida, Delay agendado) — Partes 1-6
4. Reorganização UI de ações — Parte 7
5. Registro no canvas e menu — Parte 2
6. Backend: triggers SQL + Edge Function (novos cases) — Partes 4-6
