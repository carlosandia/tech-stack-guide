

# Localização: Corrigir Funcionamento + Melhorar UX/UI

## Problema Principal

As configuracoes de **Moeda**, **Fuso Horario** e **Formato de Data** sao salvas no banco mas **nao sao consumidas por nenhum componente do sistema**. Todos os 37+ arquivos que formatam moeda, data ou timezone estao hardcoded para `pt-BR` / `BRL` / timezone do navegador.

Alem disso, a secao nao explica **para que serve** cada campo nem **onde ele vai impactar**.

## O que muda

### 1. Hook global `useLocalizacao` (novo arquivo)

Cria um hook centralizado que le as configs do tenant e expoe funcoes de formatacao:
- `formatarMoeda(valor)` -- usa a moeda configurada (BRL/USD/EUR)
- `formatarData(data)` -- usa o formato configurado (DD/MM/YYYY, etc.)
- `getTimezone()` -- retorna o timezone do tenant

O hook usa React Query com cache longo (as configs raramente mudam).

**Arquivo:** `src/hooks/useLocalizacao.ts`

### 2. Atualizar `src/lib/formatters.ts`

A funcao `formatCurrency` ganha um parametro opcional `moeda` (default `BRL`). Assim, componentes que usam o hook passam a moeda configurada, e componentes legados continuam funcionando sem quebrar.

### 3. Substituir hardcodes nos modulos principais

Os arquivos mais criticos que serao atualizados para usar `useLocalizacao`:

- `src/modules/negocios/components/detalhes/DetalhesCampos.tsx` -- valores de oportunidade
- `src/modules/negocios/components/detalhes/ProdutosOportunidade.tsx` -- precos de produtos
- `src/modules/negocios/components/kanban/` -- valores nos cards do Kanban
- `src/modules/admin/pages/DashboardPage.tsx` -- MRR e metricas financeiras
- `src/modules/tarefas/components/TarefaItem.tsx` -- datas de vencimento
- `src/modules/conversas/components/ChatMessages.tsx` -- separadores de data

Componentes que nao usam React (funcoes puras) receberao os parametros de locale como argumento.

### 4. Melhorar UX/UI da secao Localizacao

Alteracoes na `ConfigGeralPage.tsx`:

**a) Descricao da secao:**
Adicionar texto explicativo: "Estas configuracoes afetam como valores monetarios, datas e horarios sao exibidos em todo o CRM para todos os usuarios da organizacao."

**b) Preview em tempo real:**
Abaixo dos 3 selects, adicionar um bloco de preview discreto mostrando:

```text
Preview: R$ 1.234,56 | 25/02/2026 | Brasilia (GMT-3)
```

Que muda dinamicamente conforme o usuario seleciona as opcoes. Assim ele ve o impacto antes de salvar.

**c) Descricoes por campo:**
- Moeda: "Simbolo e formato usados nos valores de oportunidades, produtos e relatorios"
- Fuso Horario: "Horario de referencia para agendamentos, notificacoes e logs de atividade"
- Formato de Data: "Como datas sao exibidas em todo o sistema"

**d) Badge Admin:**
Adicionar o mesmo badge `Somente Administradores` usado nas outras secoes.

## Detalhes Tecnicos

### Hook `useLocalizacao`

```text
useLocalizacao() retorna:
  - moeda: string (BRL/USD/EUR)
  - timezone: string (America/Sao_Paulo)
  - formatoData: string (DD/MM/YYYY)
  - formatarMoeda(valor: number): string
  - formatarData(data: string | Date): string
  - formatarDataHora(data: string | Date): string
```

Internamente faz `useQuery` na tabela `config_tenant` com `staleTime: 5min`.

### Mapeamento moeda para Intl

```text
BRL -> { locale: 'pt-BR', currency: 'BRL' }
USD -> { locale: 'en-US', currency: 'USD' }
EUR -> { locale: 'de-DE', currency: 'EUR' }
```

### Mapeamento formato data

```text
DD/MM/YYYY -> dia/mes/ano
MM/DD/YYYY -> mes/dia/ano
YYYY-MM-DD -> ano-mes-dia
```

Usa `Intl.DateTimeFormat` com as opcoes corretas em vez de hardcoded `pt-BR`.

### Preview na UI

Componente `LocalizacaoPreview` que recebe os valores atuais do form e renderiza exemplos formatados. Usa `bg-muted/30 rounded-md border p-3` seguindo o design system.

### Arquivos que serao criados ou editados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useLocalizacao.ts` | Criar (hook global) |
| `src/lib/formatters.ts` | Editar (parametro moeda) |
| `src/modules/configuracoes/pages/ConfigGeralPage.tsx` | Editar (UI melhorada) |
| `src/modules/negocios/components/detalhes/DetalhesCampos.tsx` | Editar (usar hook) |
| `src/modules/negocios/components/detalhes/ProdutosOportunidade.tsx` | Editar (usar hook) |
| `src/modules/admin/pages/DashboardPage.tsx` | Editar (usar hook) |
| `src/modules/tarefas/components/TarefaItem.tsx` | Editar (usar hook) |
| `src/modules/conversas/components/ChatMessages.tsx` | Editar (usar hook) |

Demais arquivos com hardcode serao atualizados progressivamente -- os listados acima sao os de maior impacto visual para o usuario.

