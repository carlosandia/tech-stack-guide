
# Metricas de Atendimento no Dashboard

## Objetivo

Adicionar uma secao compacta de metricas de atendimento baseada no modulo `/conversas` (tabelas `conversas` e `mensagens`), respeitando os filtros de periodo e funil ja existentes. Inclui configuracao de horario comercial para calcular metricas de tempo de resposta com precisao.

## Horario Comercial

A tabela `configuracoes_tenant` ja possui os campos `horario_inicio_envio` (time) e `horario_fim_envio` (time). Vamos reutilizar esses campos como referencia de horario comercial. Na tela de Configuracoes do tenant, basta garantir que esses campos estejam editaveis (ja devem estar, mas sera validado). Se nao estiverem, adicionaremos um campo simples na tela de configuracoes.

## Metricas de Atendimento (compactas)

### Linha 1 - Cards de alerta (3 cards com fundo de destaque)

| Metrica | Calculo | Tooltip |
|---------|---------|---------|
| **1a Resposta** | Tempo medio entre a primeira mensagem recebida (from_me=false) e a primeira resposta (from_me=true) em cada conversa criada no periodo | "Tempo medio que sua equipe leva para dar a primeira resposta ao cliente" |
| **Tempo Medio Resposta** | Media do tempo entre cada mensagem recebida e a proxima resposta enviada, SOMENTE dentro do horario comercial configurado | "Tempo medio para responder durante o horario comercial da empresa" |
| **Sem Resposta** | Conversas que possuem pelo menos 1 mensagem recebida (from_me=false) mas 0 mensagens enviadas (from_me=true), no periodo | "Conversas onde o cliente enviou mensagem e ainda nao recebeu nenhuma resposta" |

### Linha 2 - Cards secundarios (5 cards compactos)

| Metrica | Calculo | Tooltip |
|---------|---------|---------|
| **Total Conversas** | COUNT de conversas criadas no periodo | "Total de conversas iniciadas no periodo" |
| **Recebidas** | COUNT de mensagens com from_me=false no periodo | "Total de mensagens recebidas dos clientes" |
| **Enviadas** | COUNT de mensagens com from_me=true no periodo | "Total de mensagens enviadas pela equipe" |
| **WhatsApp** | COUNT de conversas com canal='whatsapp' no periodo | "Conversas via WhatsApp no periodo" |
| **Instagram** | COUNT de conversas com canal='instagram' no periodo | "Conversas via Instagram no periodo" |

## Layout Visual

O bloco de atendimento fica como uma secao propria entre os KPIs Secundarios e os graficos de Motivos de Perda. Titulo: **"Atendimento"** com tooltip explicativo.

```text
┌─────────────────────────────────────────────────────────┐
│  ATENDIMENTO                                            │
│                                                         │
│  ┌─────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │ 1a Resposta │ │ Tempo Medio Resp │ │ Sem Resposta │  │
│  │   5h 1m     │ │     4h 30m       │ │     37       │  │
│  │ (bg-amber)  │ │ (bg-amber)       │ │ (bg-red)     │  │
│  └─────────────┘ └──────────────────┘ └──────────────┘  │
│                                                         │
│  ┌────────┐┌──────────┐┌──────────┐┌─────────┐┌───────┐│
│  │ Total  ││ Recebidas││ Enviadas ││WhatsApp ││ Insta ││
│  │  72    ││  1426    ││  1392    ││   72    ││   0   ││
│  └────────┘└──────────┘└──────────┘└─────────┘└───────┘│
└─────────────────────────────────────────────────────────┘
```

Os 3 cards de alerta usam fundo com tom quente (amber/red) para destacar visualmente os gargalos, conforme a screenshot de referencia do usuario.

## Detalhamento Tecnico

### 1. Nova RPC `fn_metricas_atendimento`

Parametros: `p_organizacao_id`, `p_periodo_inicio`, `p_periodo_fim`, `p_horario_inicio` (time), `p_horario_fim` (time)

Retorna JSON com:
- `primeira_resposta_media_segundos` (avg do tempo da 1a resposta)
- `tempo_medio_resposta_segundos` (avg do tempo entre msgs recebidas e respostas, filtrado por horario comercial)
- `sem_resposta` (count)
- `total_conversas` (count)
- `mensagens_recebidas` (count)
- `mensagens_enviadas` (count)
- `conversas_whatsapp` (count)
- `conversas_instagram` (count)

A funcao busca o horario comercial de `configuracoes_tenant` automaticamente se nao fornecido.

### 2. Novos Types

```typescript
interface MetricasAtendimento {
  primeira_resposta_media_segundos: number | null
  tempo_medio_resposta_segundos: number | null
  sem_resposta: number
  total_conversas: number
  mensagens_recebidas: number
  mensagens_enviadas: number
  conversas_whatsapp: number
  conversas_instagram: number
}
```

### 3. Service + Hook

- `fetchMetricasAtendimento(query)` em `relatorio.service.ts`
- `useMetricasAtendimento(query)` em `useRelatorioFunil.ts`

### 4. Novo Componente `MetricasAtendimento.tsx`

Componente autonomo que renderiza as 2 linhas de cards. Formata tempos em "Xh Xm" ou "Xm Xs" conforme magnitude. Cards de alerta com cores quentes. Cards secundarios com estilo neutro.

### 5. DashboardPage

Adicionar `<MetricasAtendimento>` apos `KPIsSecundarios` e antes dos graficos.

## Filtros Respeitados

Todas as metricas filtram por:
- `organizacao_id` (tenant)
- `periodo` (data de criacao da conversa / data de criacao da mensagem dentro do periodo)
- O filtro de `funil_id` NAO se aplica diretamente a conversas (sao modulos separados), mas sera ignorado graciosamente

## Arquivos

| Arquivo | Acao |
|---------|------|
| Migration SQL (fn_metricas_atendimento) | Criar |
| `src/modules/app/types/relatorio.types.ts` | Editar - novo tipo |
| `src/modules/app/services/relatorio.service.ts` | Editar - nova funcao |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Editar - novo hook |
| `src/modules/app/components/dashboard/MetricasAtendimento.tsx` | Criar |
| `src/modules/app/pages/DashboardPage.tsx` | Editar - adicionar componente |
