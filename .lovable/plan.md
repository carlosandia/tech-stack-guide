
# Plano: Visualizacoes Salvas + Exportar PDF + Tela Cheia

## Visao Geral

Tres novas funcionalidades no header do Dashboard:

1. **Visualizacoes Salvas** — usuario cria/salva/carrega combinacoes de filtros com nome personalizado
2. **Exportar PDF** — gera PDF completo do relatorio visivel na tela
3. **Tela Cheia (Fullscreen)** — expande o dashboard para modo TV/apresentacao

---

## 1. Visualizacoes Salvas

### Banco de Dados

Criar tabela `visualizacoes_dashboard` no Supabase:

```text
visualizacoes_dashboard
├── id (uuid PK)
├── usuario_id (uuid FK → usuarios)
├── organizacao_id (uuid FK → organizacoes)
├── nome (varchar, NOT NULL) — ex: "Mensal - Funil Principal"
├── filtros (jsonb) — { periodo, funil_id, data_inicio, data_fim }
├── config_exibicao (jsonb) — { metas: true, funil: false, ... }
├── criado_em (timestamptz)
└── atualizado_em (timestamptz)
```

RLS: usuario so acessa suas proprias visualizacoes dentro da organizacao.

### Frontend

**Novo componente `DashboardVisualizacoes.tsx`:**
- Botao no header (icone `Bookmark` ou `LayoutList`) com label "Visualizacoes"
- Abre um **Popover** com:
  - Lista de visualizacoes salvas (nome + clique para aplicar)
  - Botao "Salvar visualizacao atual" que abre um mini formulario (input nome + botao salvar)
  - Cada item tem botao de excluir (icone lixeira)
- Ao clicar numa visualizacao salva, aplica automaticamente: periodo, funil, exibicao
- Se nenhum filtro especifico estiver setado na visualizacao, mantém o valor dinamico (aberto)

**Hook `useDashboardVisualizacoes.ts`:**
- CRUD via Supabase direto na tabela `visualizacoes_dashboard`
- `listar()`, `salvar(nome, filtros, configExibicao)`, `excluir(id)`, `aplicar(id)`
- Cache com TanStack Query

### Integracao com DashboardPage

- O `DashboardPage` recebe callback `onAplicarVisualizacao` que seta todos os estados (periodo, funilId, displayConfig) de uma vez
- O componente `DashboardVisualizacoes` fica ao lado dos botoes Investimento e Exibicao no header

---

## 2. Exportar PDF

### Abordagem

Usar **html2canvas** + **jsPDF** (bibliotecas client-side) para capturar o dashboard renderizado e gerar PDF.

### Dependencias Novas

- `html2canvas` — captura DOM como canvas
- `jspdf` — gera PDF a partir de canvas/imagens

### Componente `ExportarRelatorioPDF.tsx`

- Botao no header com icone `Download` e label "Exportar"
- Ao clicar:
  1. Mostra toast "Gerando relatorio..."
  2. Captura o container do dashboard via `html2canvas`
  3. Converte para PDF (A4, landscape para melhor visualizacao)
  4. Adiciona header com titulo "Relatorio de Desempenho" + periodo + data de geracao
  5. Se o conteudo for maior que 1 pagina, faz paginacao automatica
  6. Download automatico: `relatorio-desempenho-YYYY-MM-DD.pdf`

### Integracao

- O `DashboardPage` passa um `ref` do container principal para o componente de export
- Botao fica no header, ao lado de Visualizacoes

---

## 3. Tela Cheia (Fullscreen)

### Componente `FullscreenToggle.tsx`

- Botao com icone `Maximize2` / `Minimize2`
- Usa a **Fullscreen API** nativa do browser (`element.requestFullscreen()`)
- Aplica fullscreen no container do dashboard (nao no document inteiro, para esconder sidebar/navbar)
- Listener `fullscreenchange` para atualizar estado do icone
- No modo fullscreen, adiciona padding extra e fundo `bg-background` para visual limpo

### Integracao

- Botao fica no header do dashboard, ultimo item a direita
- O `DashboardPage` passa a `ref` do container para o `FullscreenToggle`

---

## Layout do Header (Desktop - uma linha)

```text
[Relatorio de Desempenho]  [Periodo ▼] [Funil ▼] [Visualizacoes] [Investimento] [Exibicao] [Exportar] [⛶]
```

No mobile, empilha verticalmente mantendo o padrao atual.

---

## Arquivos a Criar/Editar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx_visualizacoes_dashboard.sql` | Criar tabela + RLS |
| `src/modules/app/hooks/useDashboardVisualizacoes.ts` | Hook CRUD visualizacoes |
| `src/modules/app/components/dashboard/DashboardVisualizacoes.tsx` | Componente de visualizacoes salvas |
| `src/modules/app/components/dashboard/ExportarRelatorioPDF.tsx` | Botao + logica de export PDF |
| `src/modules/app/components/dashboard/FullscreenToggle.tsx` | Botao tela cheia |
| `src/modules/app/pages/DashboardPage.tsx` | Integrar os 3 novos componentes no header |
| `src/integrations/supabase/types.ts` | Atualizar types com nova tabela |

### Dependencias a instalar

- `html2canvas`
- `jspdf`

---

## Secao Tecnica

### Estrutura do JSONB `filtros` na tabela visualizacoes:

```json
{
  "periodo": "30d",
  "funil_id": "uuid-ou-null",
  "data_inicio": "2026-01-01",
  "data_fim": "2026-01-31"
}
```

Campos com valor `null` significam "aberto/dinamico" — o usuario pode mudar livremente apos aplicar.

### Fullscreen API

```typescript
// Entrar
containerRef.current?.requestFullscreen()
// Sair
document.exitFullscreen()
// Listener
document.addEventListener('fullscreenchange', handler)
```

### PDF — Paginacao

O html2canvas captura a altura total do container. O jsPDF divide em paginas A4 (landscape: 297mm x 210mm) iterando sobre fatias do canvas.
