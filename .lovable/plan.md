

# Plano: Ajustes no InvestModeWidget + Painel de Configuracao de Exibicao do Dashboard

## 1. Corrigir nomenclatura do botao de Investimento

**Arquivo:** `src/modules/app/components/dashboard/InvestModeWidget.tsx`

O botao atualmente muda o texto de "Investimento" para "ROI" quando o invest mode esta ativo. A correcao e simples: manter sempre o texto "Investimento", apenas alterando o estilo visual (fundo verde) quando ativo.

**Alteracao:** Linha 88, trocar `{isAtivo ? 'ROI' : 'Investimento'}` por `Investimento` (texto fixo).

---

## 2. Remover CollapsibleSection individual e criar Painel de Configuracao de Exibicao

Substituir o mecanismo atual de hover em cada bloco por um unico botao/icone de configuracao no header do dashboard, ao lado do botao de Investimento. Ao clicar, abre um Popover com toggles (switches) para cada bloco.

**Arquivo novo:** `src/modules/app/components/dashboard/DashboardDisplayConfig.tsx`

### Comportamento:
- Icone de engrenagem (Settings2 do lucide) no header, ao lado do botao de Investimento
- Ao clicar, abre um Popover com lista de blocos, cada um com um Switch (on/off)
- Estado persistido no localStorage (chave `dashboard_display_config`)
- Todos iniciam como visivel por padrao

### Blocos configuráveis (labels sincronizados com o dashboard):

| ID | Label no Painel |
|----|-----------------|
| `metas` | Indicadores de metas |
| `funil` | Funil de conversao |
| `reunioes` | Indicadores de reunioes |
| `kpis-principais` | Principais |
| `canal` | Por canal de origem |
| `motivos` | Motivos de ganho e perda |

**Nota:** Os blocos KPIs Secundarios, Produtos Ranking e Metricas de Atendimento continuam visiveis sem toggle (nao foram solicitados pelo usuario).

### UI do Popover:
- Header: icone Settings2 + "Exibicao"
- Lista vertical com cada bloco: label a esquerda, Switch a direita
- Estilo seguindo o design system: `text-sm`, `rounded-lg`, cores semanticas

---

## 3. Alterar DashboardPage

**Arquivo:** `src/modules/app/pages/DashboardPage.tsx`

- Importar o novo `DashboardDisplayConfig` e renderiza-lo no header ao lado do `InvestModeWidget`
- Remover o `CollapsibleSection` wrapper dos blocos configuráveis
- Usar renderizacao condicional simples: `{visivel.metas && relatorioMetas && <RelatorioMetas ... />}`
- O estado de visibilidade vem do hook/estado do `DashboardDisplayConfig` (via estado local ou hook compartilhado)

### Abordagem tecnica:
- Criar um hook `useDashboardDisplay` que gerencia o estado de visibilidade com localStorage
- O hook retorna `{ config, toggleSection }` onde `config` e um objeto `Record<string, boolean>`
- Tanto o `DashboardDisplayConfig` (popover) quanto o `DashboardPage` (renderizacao) usam o mesmo hook

---

## 4. Remover CollapsibleSection

O componente `CollapsibleSection` pode ser removido pois sera substituido pelo painel centralizado.

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/modules/app/components/dashboard/InvestModeWidget.tsx` | Fixar texto "Investimento" |
| `src/modules/app/hooks/useDashboardDisplay.ts` | Criar hook de visibilidade |
| `src/modules/app/components/dashboard/DashboardDisplayConfig.tsx` | Criar componente do painel |
| `src/modules/app/pages/DashboardPage.tsx` | Integrar painel + renderizacao condicional |
| `src/modules/app/components/dashboard/CollapsibleSection.tsx` | Remover |
