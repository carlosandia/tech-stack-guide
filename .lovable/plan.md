
# Atualizar PRD de Melhorias do Modulo de Automacoes

## Resumo

Adicionar ao documento `docs/prds/melhoriasautomacao.md` novas funcionalidades identificadas a partir da referencia do RD Station que ainda NAO constam no PRD atual e que sao implementaveis com os modulos existentes do CRM (contatos, negocios, conversas, tarefas, formularios, emails).

---

## O que ja esta no PRD (nao sera duplicado)

- WhatsApp com midia, Nota em oportunidade, Status conversa, Webhook, Email com modelo, Campo generico
- Validacao (no novo), Condicao AND, Triggers mensagem_recebida e conversa_criada

## Novos itens a adicionar ao PRD

### Parte 5 — Novos Triggers (inspirados no RD Station)

| Trigger | Descricao | Categoria |
|---|---|---|
| `contato_entrou_segmento` | Quando contato entra em lista de segmentacao | contatos |
| `oportunidade_qualificada` | Quando oportunidade e marcada como MQL ou SQL | oportunidades |
| `campo_contato_alterado` | Quando um campo especifico do contato muda (config: qual campo) | contatos |
| `email_recebido` | Quando um email e recebido vinculado a oportunidade | comunicacao |
| `conversa_finalizada` | Quando conversa WhatsApp e marcada como resolvida/fechada | comunicacao |

Nota: `contato_entrou_segmento` e similar a `contato_segmento_adicionado` que ja existe no schema mas com outro nome. Verificar se e o mesmo — se for, apenas manter o existente. `campo_contato_alterado` e diferente de `contato_atualizado` porque permite configurar QUAL campo especifico dispara o trigger.

### Parte 6 — Novas Acoes

#### 6.1 Criar Oportunidade
Nova acao `criar_oportunidade` — cria uma nova oportunidade no CRM automaticamente.
- Config: `funil_id` (select de funis), `etapa_id` (select de etapas do funil selecionado), `titulo` (com variaveis), `valor` (opcional), `responsavel_id` (select de usuarios ou "manter atual")
- Util quando: formulario preenchido, contato qualificado, mensagem recebida

#### 6.2 Adicionar/Remover Tag (Segmento)
A acao `adicionar_segmento` ja existe. Adicionar a acao inversa:
- Nova acao `remover_segmento` — remove contato de um segmento
- Config: `segmento_id` (select de segmentos da organizacao)

#### 6.3 Marcar Oportunidade como Ganha/Perdida
Nova acao `marcar_resultado_oportunidade` — fecha a oportunidade com resultado.
- Config: `resultado` (select: ganho ou perda), `motivo_id` (select de motivos_resultado)
- Move automaticamente para etapa de ganho/perda do funil

#### 6.4 Alterar Status do Contato
Nova acao `alterar_status_contato` — atualiza o campo `status` do contato.
- Config: `status` (select: ativo, inativo, etc.)

#### 6.5 Distribuir para Responsavel (Round Robin)
Nova acao `distribuir_responsavel` — distribui o contato/oportunidade entre responsaveis usando a configuracao de distribuicao existente do funil.
- Config: `funil_id` (usa a config de distribuicao ja cadastrada em `configuracoes_distribuicao`)
- Aproveita a logica de round-robin que ja existe no modulo de negocios

#### 6.6 Delay com Data/Hora Especifica
Expandir a acao `aguardar` existente para suportar dois modos:
- **Modo tempo** (ja existe): aguardar X minutos/horas/dias
- **Modo agendado** (novo): aguardar ate uma data/hora especifica ou ate um dia da semana + horario
- Config adicional: `modo` (tempo | agendado), `data_hora` ou `dia_semana` + `horario`

### Parte 7 — Melhorias na Organizacao da UI de Acoes

Reorganizar as categorias do `AcaoConfig.tsx` para ficar mais intuitiva (inspirado na organizacao do RD Station):

| Categoria | Acoes |
|---|---|
| Comunicacao | Enviar WhatsApp, Enviar Email, Notificacao interna |
| CRM | Criar Oportunidade, Criar Tarefa, Mover para Etapa, Marcar Resultado, Adicionar Nota |
| Gerenciar Contato | Alterar Campo, Adicionar Segmento, Remover Segmento, Alterar Status Contato |
| Responsavel | Alterar Responsavel, Distribuir (Round Robin) |
| Controle | Aguardar (delay), Aguardar ate data/hora |
| Integracoes | Enviar Webhook, Alterar Status Conversa |

Isso implica renomear o campo `categoria` em `ACAO_TIPOS` no schema para refletir os novos agrupamentos.

---

## Resumo de itens NOVOS adicionados (nao duplicados)

| Item | Tipo | Ja existia? |
|---|---|---|
| `oportunidade_qualificada` | Trigger | Nao |
| `campo_contato_alterado` | Trigger | Nao |
| `email_recebido` | Trigger | Nao |
| `conversa_finalizada` | Trigger | Nao |
| `criar_oportunidade` | Acao | Nao |
| `remover_segmento` | Acao | Nao |
| `marcar_resultado_oportunidade` | Acao | Nao |
| `alterar_status_contato` | Acao | Nao |
| `distribuir_responsavel` | Acao | Nao |
| Delay com data/hora | Expansao do delay | Nao |
| Reorganizacao de categorias UI | UX | Nao |

## Detalhes tecnicos adicionais

### Novo trigger campo_contato_alterado (trigger_config)
```text
{
  "campo_monitorado": "email",
  "valor_esperado": "" // opcional, se vazio dispara em qualquer mudanca
}
```

### Nova acao criar_oportunidade (config)
```text
{
  "funil_id": "uuid",
  "etapa_id": "uuid",
  "titulo": "{{contato.nome}} - Novo negocio",
  "valor": "0",
  "responsavel_id": "uuid" // ou "manter_atual"
}
```

### Nova acao marcar_resultado_oportunidade (config)
```text
{
  "resultado": "ganho" | "perda",
  "motivo_id": "uuid-do-motivo"
}
```

### Delay agendado (config expandida)
```text
{
  "modo": "agendado",
  "dia_semana": "segunda", // ou null para data fixa
  "horario": "09:00",
  "data_hora": "2025-03-01T09:00:00" // se modo data fixa
}
```

## Arquivo alterado

| Arquivo | Alteracao |
|---|---|
| `docs/prds/melhoriasautomacao.md` | Adicionar Partes 5, 6 e 7 ao final do documento sem alterar o conteudo existente |
