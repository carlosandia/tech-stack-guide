

# Auditoria Final: Gaps entre PRD e Implementacao

## Gaps Identificados

### GAP 1 — WhatsApp com Midia (PRD 1.1) - NAO IMPLEMENTADO

O PRD especifica que `enviar_whatsapp` deve suportar envio de midia (audio, imagem, documento) com campos `midia_url` e `midia_tipo`.

**Status atual:** O `AcaoConfig.tsx` so tem campos `destino` e `mensagem`. O backend (Edge Function) so envia texto via `send-text`.

**Correcao:**
- `AcaoConfig.tsx`: Adicionar select de tipo de midia (`texto`, `audio`, `imagem`, `documento`) e campo `midia_url` condicional
- `processar-eventos-automacao`: Expandir case `enviar_whatsapp` para usar action `send-image`/`send-file` do WAHA quando `midia_tipo` estiver presente
- `processar-delays-automacao`: Mesma expansao

---

### GAP 2 — Delay Agendado no Backend - NAO PROCESSADO

O `DelayConfig.tsx` ja suporta modo `agendado` com `data_agendada` e `hora_agendada`, e o `flowConverter.ts` serializa corretamente. Porem as Edge Functions NAO tratam o modo agendado.

**Status atual:** Ambas as Edge Functions calculam `executar_em` apenas com `minutos` (modo relativo). Quando `modo_delay === 'agendado'`, o campo `minutos` fica `undefined` e o delay usa o fallback de 5 minutos.

**Correcao:**
- `processar-eventos-automacao` (linha ~213): Antes de calcular `executarEm`, verificar se `acao.config.modo_delay === 'agendado'` e usar `data_agendada + hora_agendada` diretamente como `executar_em`
- `processar-delays-automacao` (linha ~90): Mesma logica no encadeamento de delays

---

### GAP 3 — Dia da Semana no Delay Agendado (PRD 6.6) - NAO IMPLEMENTADO

O PRD especifica que o delay agendado deve suportar `dia_semana` + `horario` (ex: "proximo segunda as 09:00"). O `DelayConfig.tsx` atual so tem `data` e `hora`, sem opcao de dia da semana.

**Correcao:**
- `DelayConfig.tsx`: Adicionar um sub-modo dentro de "agendado" — "Data fixa" vs "Dia da semana". Se dia da semana, exibir select com dias (segunda a domingo) + input de horario
- `flowConverter.ts`: Serializar `dia_semana` e `horario`
- Backend: Calcular proximo dia da semana a partir de `Date.now()` quando `dia_semana` estiver preenchido

---

### GAP 4 — Condições AND: Apenas primeira regra salva no DB

O `flowConverter.ts` (linha 130-136) ao serializar condicoes com multiplas regras AND, salva **apenas a primeira regra** no array `condicoes[]`. As regras adicionais sao perdidas na persistencia.

**Correcao:**
- `flowConverter.ts`: Quando houver `regras[]`, mapear TODAS as regras para o array de `condicoes`, nao so a primeira
- Isso ja e compativel com o backend que usa `.every()` no array

---

### GAP 5 — Validacao no Backend - CASE FALTANDO

O PRD Parte 2 especifica que o backend deve ter um case `validacao` no `avaliarCondicoes` que usa `evento.dados.ultima_resposta`. Nenhuma das Edge Functions tem logica para processar acoes do tipo `validacao`.

**Status atual:** `validacao` e serializado como acao no `flowConverter` mas o backend trata como acao desconhecida (`default: console.warn`).

**Correcao:**
- `processar-eventos-automacao`: Adicionar case `validacao` que avalia `evento.dados.ultima_resposta` contra as condicoes de validacao (regex, contem, formato telefone/email, faixa numerica). Se match, continuar fluxo normalmente. Se nao match, pular para a proxima acao conectada via handle "nenhuma" (requer refatoracao da logica sequencial para suportar branching)

> **Nota importante:** Este e o gap mais complexo. O motor atual processa acoes sequencialmente, sem suporte a branching. Para validacao funcionar com 2 saidas (Match/Nenhuma), o backend precisaria de uma refatoracao para processar o fluxo como grafo (usando edges) em vez de array linear. Isso e uma mudanca arquitetural significativa.

---

### GAP 6 — Trigger `campo_contato_alterado` sem config no TriggerConfig

O trigger `campo_contato_alterado` exige configuracao de `campo_monitorado` e `valor_esperado` no `trigger_config`. O `TriggerConfig.tsx` nao tem campos condicionais — ele apenas lista os triggers para selecao.

**Correcao:**
- `TriggerConfig.tsx`: Quando o trigger selecionado for `campo_contato_alterado`, exibir campos extras: select de campo monitorado (nome, email, telefone, status) e input opcional de valor esperado

---

### GAP 7 — Trigger `email_recebido` sem trigger SQL

O PRD Parte 5 menciona criar um trigger SQL na tabela `emails_recebidos` (INSERT) para emitir o evento `email_recebido`. A migration aplicada criou triggers para `conversa_finalizada` e `oportunidade_qualificada`, mas NAO criou trigger para `email_recebido`.

**Correcao:**
- Nova migration SQL: Criar funcao `emitir_evento_email_recebido()` e trigger na tabela de emails (INSERT) para inserir em `eventos_automacao` com tipo `email_recebido`

---

### GAP 8 — Enviar Email com Modelo (PRD 1.5) - PARCIAL

O PRD menciona selecao de modelo pre-cadastrado e checkbox "Aplicar apenas ao contato principal". Esses campos nao existem no `AcaoConfig.tsx` para `enviar_email`.

**Correcao (parcial — modelos_email ainda nao existe como tabela):**
- `AcaoConfig.tsx` (`enviar_email`): Adicionar checkbox "Apenas contato principal" que salva `config.apenas_contato_principal`
- Quando a tabela `modelos_email` for criada futuramente, adicionar select de modelos

---

### GAP 9 — Campo Generico UX Unificada (PRD 1.6) - NAO IMPLEMENTADO

O PRD pede unificar `atualizar_campo_oportunidade` e `atualizar_campo_contato` em uma UX mais clara com:
1. Select de entidade (Oportunidade ou Contato)
2. Select de campo carregado dinamicamente dos `campos_customizados`
3. Input de valor com suporte a variaveis

**Status atual:** Os dois cases existem separados no `AcaoConfig` com inputs de texto simples (sem carregar campos reais).

**Correcao:**
- `AcaoConfig.tsx`: Para ambos os cases, usar um hook para carregar `campos_customizados` da organizacao e renderizar como select em vez de input de texto livre

---

## Resumo de Prioridade

| Gap | Impacto | Complexidade | Prioridade |
|---|---|---|---|
| GAP 4 — Condicoes AND perdendo regras | Critico (dados perdidos) | Baixa | 1 |
| GAP 2 — Delay agendado no backend | Alto (feature quebrada) | Baixa | 2 |
| GAP 1 — WhatsApp com midia | Medio | Baixa | 3 |
| GAP 6 — Config do trigger campo_contato | Medio | Baixa | 4 |
| GAP 3 — Dia da semana no delay | Medio | Media | 5 |
| GAP 7 — Trigger SQL email_recebido | Medio | Baixa | 6 |
| GAP 5 — Validacao no backend | Alto (arquitetural) | Alta | 7 |
| GAP 9 — Campos customizados dinamicos | Baixo (UX) | Media | 8 |
| GAP 8 — Email com modelo | Baixo (futuro) | Baixa | 9 |

---

## Plano de Implementacao

### Bloco A — Correcoes Criticas (Gaps 4, 2)

**Arquivo: `src/modules/automacoes/utils/flowConverter.ts`**
- Corrigir `flowToAutomacao` para mapear TODAS as regras AND para o array `condicoes[]`, nao apenas a primeira

**Arquivos: `supabase/functions/processar-eventos-automacao/index.ts` e `processar-delays-automacao/index.ts`**
- No case `aguardar`, verificar `acao.config.modo_delay`. Se `'agendado'`, construir `executar_em` a partir de `data_agendada` + `hora_agendada` em vez de calcular com `minutos`

### Bloco B — Features Frontend Faltantes (Gaps 1, 6, 3)

**Arquivo: `src/modules/automacoes/components/panels/AcaoConfig.tsx`**
- Case `enviar_whatsapp`: Adicionar select de tipo de midia e campo condicional `midia_url`

**Arquivo: `src/modules/automacoes/components/panels/TriggerConfig.tsx`**
- Renderizar campos extras quando trigger = `campo_contato_alterado`: select de campo monitorado + input de valor esperado

**Arquivo: `src/modules/automacoes/components/panels/DelayConfig.tsx`**
- No modo agendado, adicionar sub-opcao "Dia da semana" com select (segunda-domingo) + horario

### Bloco C — Backend Complementar (Gaps 1, 3, 7)

**Arquivos: ambas Edge Functions**
- `enviar_whatsapp`: Detectar `config.midia_tipo` e usar action correspondente do WAHA (`send-image`, `send-file`)
- `aguardar` agendado por dia da semana: Calcular proximo dia da semana

**Migration SQL:**
- Criar trigger na tabela de emails para emitir `email_recebido`

### Bloco D — Melhoria UX (Gaps 8, 9)

- Adicionar checkbox "apenas contato principal" no enviar_email
- Carregar campos customizados dinamicamente no atualizar_campo (quando hook/dados estiverem disponiveis)

### Bloco E — Validacao Backend (Gap 5) — Fase Futura

Este gap requer uma refatoracao arquitetural significativa. O motor atual processa acoes como array linear. Para suportar branching (2 saidas do no de validacao), o backend precisaria:
1. Receber o grafo completo (nodes + edges) em vez de apenas `acoes[]`
2. Processar o fluxo seguindo edges em vez de iterando array
3. Isso impacta toda a logica de `executarAutomacao` e `processar-delays`

Recomendacao: implementar em uma fase separada dedicada a refatoracao do motor para suporte a grafos.

