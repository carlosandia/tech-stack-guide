

# Responsividade: Toolbar de Selecao + Modal de Detalhes da Oportunidade

## Problema Atual

### 1. Toolbar de Selecao (OportunidadeBulkActions)
- No mobile, a barra fixa no bottom com todos os botoes lado a lado ultrapassa a largura da tela
- Os dropdowns (Mover, Tags) abrem para cima mas podem ficar cortados
- A confirmacao de exclusao expande a barra ainda mais, quebrando o layout
- Nao segue o Design System (7.7.2): "Bulk actions no mobile = Modo selecao"

### 2. Modal de Detalhes (DetalhesOportunidadeModal)
- As 3 colunas empilham verticalmente no mobile mas ficam todas dentro de um unico scroll, tornando a navegacao confusa
- O header com stepper de etapas ocupa muito espaco horizontal
- As abas mostram apenas icones sem labels no mobile, dificultando a identificacao
- O historico fica "perdido" no final do scroll, sem forma rapida de acessar

---

## Proposta de Solucao

### 1. Toolbar de Selecao - Refatoracao Mobile

**Abordagem:** No mobile (< 768px), simplificar a barra para mostrar apenas o contador + acoes como icones compactos, com os dropdowns abrindo como sheets/modais ao inves de popovers.

Mudancas no `OportunidadeBulkActions.tsx`:
- Reduzir padding e gap no mobile (`px-2 py-2 gap-1.5 sm:px-4 sm:py-3 sm:gap-3`)
- Garantir `max-w-[calc(100vw-32px)]` para nunca ultrapassar a tela
- Botoes: apenas icones no mobile (ja oculta labels com `hidden sm:inline`, mas o padding ainda e grande)
- Reduzir padding dos botoes no mobile (`px-2 py-1.5 sm:px-3`)
- Confirmacao de exclusao: simplificar para apenas "Sim/Nao" inline mais compacto
- Dropdowns (Mover/Tags): posicionar com `left-1/2 -translate-x-1/2` no mobile para centralizar e nao cortar nas bordas
- Touch targets minimos de 44px conforme Design System 7.7.3

### 2. Modal de Detalhes - Redesign Mobile

**Abordagem:** No mobile, o modal ocupa tela inteira (fullscreen) e reorganiza o conteudo em abas/secoes navegaveis ao inves de empilhar tudo.

#### 2.1 Container do Modal (`DetalhesOportunidadeModal.tsx`)
- Mobile: fullscreen (`inset-0, rounded-none, max-h-full`)
- Desktop: mantem o comportamento atual com `max-w-7xl`
- Classes: `w-full h-full sm:w-[calc(100%-16px)] sm:max-w-5xl lg:max-w-7xl sm:max-h-[90vh] sm:rounded-lg`

#### 2.2 Header (`DetalhesHeader.tsx`)
- Mobile: stepper de etapas em uma segunda linha abaixo do titulo com scroll horizontal
- Titulo truncado com `max-w-[180px]` no mobile
- Layout: `flex-wrap` para permitir a quebra de linha no mobile
- Stepper: `w-full order-last` no mobile, `flex-1` no desktop

#### 2.3 Body - Layout Adaptativo (`DetalhesOportunidadeModal.tsx`)
- **Mobile:** As 3 secoes (Campos, Abas, Historico) ficam em tabs internas ao inves de empilhadas
  - Criar um sistema de navegacao mobile com 3 botoes no topo do body: "Dados", "Atividades", "Historico"
  - Apenas a secao ativa fica visivel, com scroll proprio
  - Historico fica acessivel com um toque ao inves de rolar ate o final
- **Desktop (lg+):** Mantem as 3 colunas lado a lado como atualmente

#### 2.4 Abas (`DetalhesAbas.tsx`)
- Ja oculta labels no mobile com `hidden sm:inline` - manter
- Garantir que os icones tenham touch target de 44px minimo

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`src/modules/negocios/components/kanban/OportunidadeBulkActions.tsx`**
   - Ajustar classes responsivas do container principal
   - Reduzir padding/gap dos botoes no mobile
   - Centralizar dropdowns no mobile
   - Compactar confirmacao de exclusao

2. **`src/modules/negocios/components/detalhes/DetalhesOportunidadeModal.tsx`**
   - Modal fullscreen no mobile
   - Adicionar navegacao por abas mobile (Dados / Atividades / Historico)
   - Condicionar layout 3-colunas apenas para `lg+`

3. **`src/modules/negocios/components/detalhes/DetalhesHeader.tsx`**
   - Stepper em segunda linha no mobile com scroll horizontal
   - Ajustar truncamento e espacamento

### Sem dependencias novas
Todas as mudancas usam apenas Tailwind CSS responsivo e estado React local.

