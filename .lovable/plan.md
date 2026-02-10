
# Botao "Historico" com Popover de Emails Visualizados

## Objetivo
Adicionar um botao "Historico" na toolbar do modulo de Emails que abre um popover/dropdown com uma timeline dos ultimos emails visualizados pelo usuario. Cada item mostra nome do remetente, email e permite clicar para reabrir o email (marcando como lido).

## Como Funciona

O historico sera armazenado localmente no `localStorage` (maximo 20 itens). Toda vez que o usuario seleciona um email para ler, um registro e adicionado ao historico com: id, nome, email, assunto e timestamp. O popover exibe esses registros como uma lista cronologica.

## Arquivos a Criar

### 1. `src/modules/emails/components/EmailHistoricoPopover.tsx`
- Botao com icone `History` (lucide) e texto "Historico"
- Popover manual (mesmo padrao do MoreMenu no EmailViewer: div absoluta + click outside)
- Lista de ate 20 itens recentes, ordenados do mais recente para o mais antigo
- Cada item mostra:
  - Avatar circular com inicial colorida (mesmo `getInitialColor` do EmailViewer)
  - Nome do remetente (bold)
  - Email do remetente (muted)
  - Assunto truncado
  - Timestamp relativo (ex: "ha 5min", "ha 2h", "ontem")
  - Botao/area clicavel que dispara `onSelect(id)`
- Botao "Limpar historico" no rodape
- Estado vazio: "Nenhum email visualizado recentemente"
- z-index alto (z-50) e background solido `bg-background`

### 2. `src/modules/emails/hooks/useEmailHistorico.ts`
- Hook que gerencia o historico no localStorage (chave: `emails_historico_visualizados`)
- Funcoes: `adicionar(email)`, `listar()`, `limpar()`
- Tipo `HistoricoItem`: `{ id, nome, email, assunto, timestamp }`
- Limite de 20 itens (FIFO - remove o mais antigo)
- Deduplicacao: se o mesmo email for aberto novamente, move para o topo

## Arquivos a Modificar

### 3. `src/modules/emails/pages/EmailsPage.tsx`
- Importar `EmailHistoricoPopover` e `useEmailHistorico`
- No `useEffect` que marca email como lido (linha 185-189), adicionar chamada para `historico.adicionar(selectedEmail)` quando o email e carregado
- Adicionar o botao Historico na toolbar (entre Metricas e Assinatura)
- Passar `onSelect={handleSelect}` para o popover para navegar ao email clicado

## Detalhes Tecnicos

### Estrutura do item no historico
```text
{
  id: string           // ID do email
  nome: string         // de_nome ou de_email
  email: string        // de_email
  assunto: string      // assunto do email
  timestamp: number    // Date.now() de quando foi visualizado
}
```

### Layout do popover
- Largura: `w-80` (320px)
- Max height: `max-h-96` com scroll
- Header: "Ultimos visualizados" com icone History
- Lista: items com hover bg-accent, cursor-pointer
- Footer: botao "Limpar" discreto

### Toolbar - ordem dos botoes
Historico | Metricas | Assinatura
