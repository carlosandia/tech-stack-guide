

# Horário Comercial e Dias Úteis — Configuração Dedicada

## Problema

Atualmente o sistema confunde dois conceitos distintos:
- **Janela de envio de emails** (quando notificacoes sao enviadas)
- **Horario comercial** (expediente real da empresa, usado para calcular metricas de atendimento como 1a Resposta e TMA)

A tabela `configuracoes_tenant` nao possui campos para horario comercial nem dias uteis. Os Indicadores de Atendimento mencionam "horario comercial e dias uteis" nos tooltips, mas esses dados estao hardcoded. O admin nao tem como configurar.

## Solucao

Criar uma secao dedicada **"Horario Comercial"** na pagina Config Geral, separada da "Janela de envio de emails", com:

1. **Horario de inicio e fim do expediente** (ex: 08:00 - 18:00)
2. **Dias da semana uteis** — botoes toggle para cada dia (Seg a Dom), igual ao padrao ja usado em `ConfigDistribuicao.tsx`
3. **Persistencia no banco** via novos campos na tabela `configuracoes_tenant`
4. **Consumo pela RPC** `fn_metricas_atendimento` para calcular tempos corretamente

## Interface

A nova secao ficara **acima** de "Notificacoes por Email" na Config Geral:

```text
+--------------------------------------------------+
| Horario Comercial         [Somente Administradores] |
| Define o expediente da sua organizacao.           |
| Usado para calcular metricas de atendimento,      |
| SLA e alertas de inatividade.                      |
|                                                    |
| Inicio: [08:00]    Fim: [18:00]                   |
|                                                    |
| Dias uteis:                                        |
| [Seg] [Ter] [Qua] [Qui] [Sex] [ Sab ] [ Dom ]   |
|  (azul = ativo, cinza = inativo)                  |
+--------------------------------------------------+
```

## Alteracoes no Banco de Dados

Adicionar 2 novos campos a tabela `configuracoes_tenant`:

| Campo | Tipo | Default | Descricao |
|---|---|---|---|
| `horario_comercial_inicio` | `text` | `'08:00'` | Inicio do expediente (HH:mm) |
| `horario_comercial_fim` | `text` | `'18:00'` | Fim do expediente (HH:mm) |
| `dias_uteis` | `smallint[]` | `{1,2,3,4,5}` | Dias da semana (0=Dom, 1=Seg...6=Sab) |

Migration SQL:

```sql
ALTER TABLE configuracoes_tenant
  ADD COLUMN IF NOT EXISTS horario_comercial_inicio text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS horario_comercial_fim text DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS dias_uteis smallint[] DEFAULT '{1,2,3,4,5}';
```

## Alteracoes no Frontend

### 1. `ConfigGeralPage.tsx`
- Adicionar campos `horario_comercial_inicio`, `horario_comercial_fim` e `dias_uteis` ao state do form
- Criar nova secao visual "Horario Comercial" com inputs de time e botoes de dias (reutilizando o padrao visual de `ConfigDistribuicao.tsx`)
- Incluir no payload de save

### 2. `MetricasAtendimento.tsx`
- Atualizar o link "Configuracoes" de `/configuracoes` para `/configuracoes/config-geral` (rota correta)
- Atualizar tooltips para referenciar a configuracao real em vez de valores hardcoded

### 3. `useConfigTenant.ts`
- Nenhuma alteracao necessaria (ja e generico com `Record<string, unknown>`)

### 4. `src/integrations/supabase/types.ts`
- Sera regenerado automaticamente apos a migration para incluir os novos campos

## Atualizacao da RPC `fn_metricas_atendimento`

A funcao RPC no Supabase devera ser atualizada para:
1. Ler `horario_comercial_inicio`, `horario_comercial_fim` e `dias_uteis` da tabela `configuracoes_tenant`
2. Usar esses valores ao calcular `primeira_resposta_media_segundos` e `tempo_medio_resposta_segundos`
3. Excluir mensagens fora do expediente e em dias nao-uteis do calculo de tempo

## Sequencia de Implementacao

1. Executar migration SQL para adicionar os 3 campos
2. Regenerar types do Supabase
3. Adicionar secao "Horario Comercial" em `ConfigGeralPage.tsx`
4. Corrigir link em `MetricasAtendimento.tsx`
5. Atualizar a RPC `fn_metricas_atendimento` (se existir como Edge Function ou SQL function)

