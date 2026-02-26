

# Investimento Dinamico por Canal + Atribuicao de Leads

## Problema Atual

O sistema de investimento tem 3 canais fixos (Meta Ads, Google Ads, Outros). Se o usuario investe em "Panfleto", "Evento" ou "Radio", tudo cai no balde generico "Outros" — impossivel medir eficiencia individual. Alem disso, nao fica claro para o usuario como os leads sao atribuidos a cada canal.

## Como a Atribuicao de Canal Funciona (e vai funcionar)

A logica de vinculacao lead-canal ja existe e funciona assim:

```text
Prioridade de Atribuicao:
1. UTM Source (automatico) — Meta Ads, Google Ads preenchem automaticamente
2. Origem da oportunidade — campo "Origem" no card do negocio (manual, whatsapp, formulario, etc.)
3. Fallback — "direto" quando nenhum dos dois existe

Exemplos:
- Lead do Meta Ads → utm_source = "facebook" → canal = Meta Ads (automatico)
- Lead do Google Ads → utm_source = "google" → canal = Google Ads (automatico)
- Lead criado manualmente com origem "Panfleto" → canal = Panfleto
- Lead do WhatsApp → origem = "whatsapp" → canal = WhatsApp
```

O ponto-chave: **para canais offline (Panfleto, Evento, Radio), o usuario deve selecionar a Origem correta ao criar a oportunidade**. O sistema ja suporta origens dinamicas — basta o admin criar "Panfleto" em Configuracoes > Origens.

## Solucao Proposta

### 1. Investimento com canais dinamicos

Trocar os 3 campos fixos por uma lista dinamica de canais com valores:

```text
Formulario de investimento (novo):
┌──────────────────────────────────────┐
│  $ Informar investimento             │
│  Ultimos 30 dias                     │
│                                      │
│  [+ Adicionar canal]                 │
│                                      │
│  Meta Ads          R$ [500,00]   [x] │
│  Google Ads        R$ [300,00]   [x] │
│  Panfleto          R$ [200,00]   [x] │
│                                      │
│  Total: R$ 1.000,00                  │
│  [Salvar]                            │
└──────────────────────────────────────┘
```

- O usuario clica em "+ Adicionar canal" e escolhe de uma lista que inclui:
  - Canais pre-definidos: Meta Ads, Google Ads
  - Origens cadastradas na tabela `origens` (Panfleto, Evento, WhatsApp, etc.)
  - Opcao de digitar nome livre
- Cada canal recebe seu valor de investimento
- Tudo salvo na tabela `investimentos_marketing` (que ja suporta canal como varchar)

### 2. Filtro do funil por canal dinamico

Os chips de filtro no funil passam a listar todos os canais com investimento > 0:

```text
Canal: [Todos] [Meta Ads: R$500] [Google Ads: R$300] [Panfleto: R$200]
```

Ao selecionar "Panfleto", o funil filtra oportunidades cuja origem = "panfleto" e calcula CPL/CAC/ROMI usando os R$ 200 investidos.

### 3. fn_canal_match — adicionar else generico (ja existe!)

A funcao SQL `fn_canal_match` ja tem o caso `ELSE` que faz match exato:
```sql
ELSE COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto') = p_canal
```
Isso significa que se o usuario salvar investimento com canal = "panfleto", ao filtrar o funil por "panfleto", ele vai buscar oportunidades com `origem = 'panfleto'`. **Nenhuma alteracao SQL necessaria.**

### 4. Tooltip informativo no Funil de Conversao

Adicionar um icone `(?)` ao lado do titulo "FUNIL DE CONVERSAO" com um tooltip/popover explicativo:

```text
Como funciona o Funil de Conversao?

O funil mostra a jornada dos seus leads desde a entrada ate o fechamento.

COMO OS LEADS SAO ATRIBUIDOS A UM CANAL:
- Canais digitais (Meta Ads, Google Ads): a atribuicao e automatica via parametros UTM 
  capturados nos formularios e integraccoes.
- Canais offline (Panfleto, Evento, Indicacao): ao criar uma oportunidade,
  selecione a Origem correta no card do negocio. Isso vincula o lead ao canal.

COMO FUNCIONA O INVESTIMENTO:
- Registre quanto investiu em cada canal no botao "Investimento"
- O sistema calcula automaticamente CPL, CAC e ROMI por canal
- Filtre por canal para ver a eficiencia individual de cada investimento

METRICAS:
- CPL: Custo por Lead (investido / leads)
- CAC: Custo de Aquisicao de Cliente (investido / ganhos)
- ROMI: Retorno sobre Investimento em Marketing ((receita - investido) / investido)
```

## Alteracoes Tecnicas

### Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/modules/app/types/relatorio.types.ts` | Editar — InvestMode e SalvarInvestimentoPayload para canais dinamicos |
| `src/modules/app/components/dashboard/InvestModeWidget.tsx` | Editar — Formulario dinamico com lista de canais |
| `src/modules/app/components/dashboard/FunilConversao.tsx` | Editar — Chips dinamicos + tooltip informativo |
| `src/modules/app/services/relatorio.service.ts` | Editar — buscarInvestimentoPeriodo e construirInvestMode para canais dinamicos |

### Mudancas no Banco

**Nenhuma migration necessaria.** A tabela `investimentos_marketing` ja tem `canal varchar` e a funcao `fn_canal_match` ja suporta match exato para canais nao mapeados.

### Tipo InvestMode (novo)

```typescript
type InvestMode =
  | { ativo: false }
  | {
      ativo: true
      total_investido: number
      canais: Record<string, number>  // { meta_ads: 500, google_ads: 300, panfleto: 200 }
      cpl: number | null
      cpmql: number | null
      // ... demais metricas
    }
```

### SalvarInvestimentoPayload (novo)

```typescript
interface SalvarInvestimentoPayload {
  periodo_inicio: string
  periodo_fim: string
  canais: Array<{ canal: string; valor: number }>  // dinamico
}
```

### Logica de Salvamento

O `salvarInvestimento` recebe array de canais e salva cada um + calcula total:
```typescript
const canais = payload.canais
const total = canais.reduce((s, c) => s + c.valor, 0)
// Salvar cada canal + 'total' na tabela investimentos_marketing
```

## Resultado

- Usuario pode registrar investimento em qualquer canal (Panfleto, Evento, Radio, etc.)
- O funil filtra corretamente por cada canal individual
- CPL, CAC e ROMI sao calculados por canal
- Tooltip explicativo orienta o usuario sobre como usar o sistema corretamente
- Para canais offline, basta o usuario selecionar a Origem correta na oportunidade (sistema ja existente)

