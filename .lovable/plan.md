
# Fundo cinza como regra global dos modulos

## Objetivo
Aplicar o fundo cinza claro (`hsl(220, 10%, 95%)`) como padrao para a area de conteudo de todos os modulos, mantendo header e toolbar com fundo branco. Isso cria coerencia visual entre o Kanban (que ja usa esse fundo) e os demais modulos como Contatos, Dashboard, etc.

## O que muda

### 1. AppLayout - Fundo cinza na area de conteudo (`main`)
Alterar o `<main>` no `AppLayout.tsx` para aplicar o fundo cinza globalmente, em vez de cada modulo definir o seu:

- **Antes:** `<main className="flex-1 overflow-hidden">`
- **Depois:** `<main className="flex-1 overflow-hidden" style={{ backgroundColor: 'hsl(220, 10%, 95%)' }}>`

Isso garante que **todos** os modulos herdem o fundo cinza automaticamente.

### 2. KanbanBoard - Remover fundo inline duplicado
O `KanbanBoard.tsx` ja define `backgroundColor: 'hsl(220, 10%, 95%)'` inline. Como o `main` agora trata disso, remover o style inline do wrapper do Kanban para evitar duplicacao.

### 3. MetricasPanel - Remover fundo inline duplicado
O `MetricasPanel.tsx` tambem define o mesmo fundo inline. Remover para herdar do `main`.

### 4. ContatosPage - Ajustar paginacao
A barra de paginacao na `ContatosPage` usa `bg-background` (branco puro). Manter assim para contraste com o fundo cinza -- sem alteracao necessaria.

## Resultado visual
- **Header (nav top):** branco com backdrop blur (sem mudanca)
- **Toolbar:** cinza sutil `bg-gray-50/50` (sem mudanca)
- **Area de conteudo (main):** fundo cinza `hsl(220, 10%, 95%)` em todos os modulos
- **Cards/tabelas:** brancos sobre fundo cinza, criando hierarquia visual

## Detalhes tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/app/layouts/AppLayout.tsx` | Adicionar `style={{ backgroundColor: 'hsl(220, 10%, 95%)' }}` no `<main>` (linha 348) |
| `src/modules/negocios/components/kanban/KanbanBoard.tsx` | Remover `style={{ backgroundColor: ... }}` do wrapper (linha 218) |
| `src/modules/negocios/components/toolbar/MetricasPanel.tsx` | Remover `style={{ backgroundColor: ... }}` do container (linha 140) |

Total: 3 arquivos, alteracoes minimas e sem impacto funcional.
