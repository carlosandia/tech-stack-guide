

# Reestruturar Configuracoes: Sub-navegacao como Sidebar Lateral

## Visao Geral

Transformar a navegacao interna do modulo de Configuracoes de tabs horizontais para uma sidebar fixa na lateral esquerda, mantendo o header principal horizontal no topo.

## Layout Final

```text
+------------------------------------------------------------------+
| HEADER (56px) - horizontal, fixo no topo                         |
| [<- CRM]  |  Configuracoes            [Avatar Carlos v]          |
+------------------------------------------------------------------+
|              |                                                    |
| SIDEBAR      | TOOLBAR (48px)                                    |
| (240px)      | Campos . Gerencie os campos...     [+ Novo Campo] |
|              |---------------------------------------------------|
| EQUIPE       |                                                    |
|  Membros     |              CONTENT AREA                         |
|  Perfis      |                                                    |
|  Metas       |                                                    |
|  Config Geral|                                                    |
|              |                                                    |
| CONEXOES     |                                                    |
|  Conexoes    |                                                    |
|  WH Entrada  |                                                    |
|  WH Saida    |                                                    |
|              |                                                    |
| PIPELINE     |                                                    |
|  > Campos    |                                                    |
|  Produtos    |                                                    |
|  Motivos     |                                                    |
|  Tarefas     |                                                    |
|  Etapas      |                                                    |
|  Regras      |                                                    |
|  Cards       |                                                    |
+------------------------------------------------------------------+
```

## Detalhes da Implementacao

### O que muda no Header
- Remove a navegacao de grupos (Pipeline, Integracoes, Equipe) do header
- Header fica simplificado: botao "Voltar ao CRM" + titulo "Configuracoes" + subtitulo descritivo + menu do usuario
- Header continua fixo, horizontal, com glass effect

### O que muda na Toolbar
- Remove a sub-navegacao horizontal (Campos, Produtos, Motivos...)
- Toolbar passa a ficar apenas como barra de titulo + acoes contextuais acima do conteudo
- Posicionada acima da area de conteudo (nao mais full-width)

### Nova Sidebar (Desktop lg+)
- Largura fixa: 240px (w-60)
- Fixa na lateral esquerda, abaixo do header (top-14)
- Fundo branco com borda direita sutil
- Cabecalho interno: "Configuracoes" + "Conexoes, integracoes e pipeline"
- Itens agrupados por secao (EQUIPE, CONEXOES, PIPELINE) com labels em caixa alta
- Cada item com icone + label
- Item ativo: fundo primario leve com borda (chip outline style do DS)
- Respeita adminOnly para esconder itens do Member

### Mobile (abaixo de lg)
- Sidebar escondida, usa o drawer existente (ja funciona)
- Sem alteracao significativa no comportamento mobile

### Icones por item (baseado na referencia)
- Membros/Perfis: Users
- Metas: Target
- Config Geral: Settings
- Conexoes: Plug
- Webhooks Entrada: Webhook (ou ArrowDownToLine)
- Webhooks Saida: Send
- Campos: FormInput (ou Settings2)
- Produtos: Package
- Motivos: Flag
- Tarefas: ListChecks
- Etapas: Layers
- Regras: Scale
- Cards: LayoutGrid

## Detalhes Tecnicos

### Arquivo a editar
- `src/modules/configuracoes/layouts/ConfiguracoesLayout.tsx` - Reestruturacao completa do layout

### Mudancas estruturais no componente
1. Remover navegacao de grupos do header (linhas 211-231)
2. Remover sub-navegacao horizontal do ToolbarWithSubNav (linhas 300-318)
3. Adicionar sidebar desktop com `hidden lg:flex flex-col w-60 fixed left-0 top-14 bottom-0 border-r`
4. Ajustar main content para ter `lg:ml-60` (margem esquerda da sidebar)
5. Toolbar continua sticky mas agora so na area de conteudo (com ml-60)
6. Reorganizar navGroups para incluir icones individuais por sub-item

### Estrutura CSS da sidebar
- Container: `fixed left-0 top-14 bottom-0 w-60 bg-white border-r border-gray-200/60 overflow-y-auto`
- Cabecalho: titulo "Configuracoes" + descricao
- Grupos: label uppercase `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Items: `px-4 py-2 text-sm` com icone e label
- Item ativo: `bg-primary/5 text-primary font-medium border-l-2 border-primary` ou o chip outline style

### Nenhuma mudanca em
- Rotas (App.tsx permanece igual)
- Paginas individuais (CamposPage, ProdutosPage, etc.)
- ConfigToolbarContext (continua funcionando igual)
- Hooks e services

## Ordem de Execucao
1. Atualizar navGroups para incluir icones individuais nos sub-itens
2. Reestruturar ConfiguracoesLayout: header simplificado + sidebar desktop + content area
3. Manter drawer mobile ja existente (com mesmos itens agrupados)
4. Testar responsividade

