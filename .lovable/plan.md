
# Automacoes - Builder Visual (estilo N8N)

## Resumo

Transformar o modulo de Automacoes de uma listagem simples em cards para um **editor visual de fluxos** com canvas interativo, nos conectados por linhas (edges), drag-and-drop para criar e posicionar nos — similar ao N8N, RD Station, Kommo e SprintHub. O modulo sera promovido para rota exclusiva acessivel diretamente pelo header principal do CRM.

## O que muda

1. **Navegacao**: Automacoes sai de `/app/configuracoes/automacoes` e vai para `/app/automacoes`, com link proprio no header do AppLayout (icone Zap)
2. **UI**: Troca lista de cards por um canvas visual com nos arrastáveis conectados por linhas (edges)
3. **Biblioteca**: Instalar `@xyflow/react` (React Flow) — a biblioteca padrao de mercado para editores de fluxo em React

## Estrutura de Telas

```text
/app/automacoes
  +------------------------------------------+
  | Header do CRM (existente)                |
  +--------+---------------------------------+
  | Lista  |  Canvas (React Flow)            |
  | lateral|                                 |
  | de     |  [Trigger] ---> [Condicao]      |
  | fluxos |        |                        |
  |        |  [Acao 1] ---> [Acao 2]         |
  |        |        |                        |
  |        |  [Delay] ---> [Acao 3]          |
  |        |                                 |
  +--------+---------------------------------+
```

- **Painel lateral esquerdo (240px)**: Lista das automacoes existentes com busca e botao "Nova Automacao"
- **Area central (canvas)**: Editor visual React Flow com zoom, pan, minimap e grid de fundo
- **Painel lateral direito (drawer)**: Abre ao clicar em um no para editar suas propriedades (configuracao de trigger, condicao, acao)

## Tipos de Nos (Nodes)

| Tipo | Cor/Estilo | Descricao |
|------|-----------|-----------|
| **Trigger** | Borda primary, icone Zap | Primeiro no do fluxo, nao removivel |
| **Condicao** | Borda warning (amarelo) | Filtro condicional com 2 saidas (Sim/Nao) |
| **Acao** | Borda success (verde) | Acoes como enviar WhatsApp, criar tarefa |
| **Delay** | Borda info (azul claro) | Aguardar X minutos/horas antes de continuar |

## Detalhamento Tecnico

### 1. Dependencia nova
- `@xyflow/react` — editor de fluxos com nos, edges, handles, drag-and-drop

### 2. Alteracoes no roteamento (`App.tsx`)
- Adicionar rota `/app/automacoes` e `/app/automacoes/:id` dentro do bloco `<AppLayout>`
- Remover rota de automacoes do `ConfiguracoesLayout`

### 3. Alteracoes no menu (`AppLayout.tsx`)
- Adicionar item "Automacoes" (icone `Zap`) no array `menuItems` entre "Formularios" e antes do fim

### 4. Novos arquivos do modulo

```text
src/modules/automacoes/
  pages/
    AutomacoesPage.tsx          -- (reescrever) lista lateral + canvas
    AutomacaoEditorPage.tsx     -- pagina fullscreen do editor de um fluxo
  components/
    AutomacaoSidebar.tsx        -- painel lateral com lista de automacoes
    FlowCanvas.tsx              -- wrapper do ReactFlow com config
    nodes/
      TriggerNode.tsx           -- no customizado de trigger
      CondicaoNode.tsx          -- no customizado de condicao
      AcaoNode.tsx              -- no customizado de acao
      DelayNode.tsx             -- no customizado de delay
    edges/
      AnimatedEdge.tsx          -- edge customizada com animacao
    panels/
      NodeConfigPanel.tsx       -- painel lateral direito para editar no selecionado
      TriggerConfig.tsx         -- config do trigger
      CondicaoConfig.tsx        -- config da condicao
      AcaoConfig.tsx            -- config da acao
      DelayConfig.tsx           -- config do delay
    AddNodeMenu.tsx             -- menu dropdown ao clicar "+" para add novo no
  hooks/
    useFlowState.ts             -- gerenciar nos/edges/posicoes no canvas
    useAutomacaoFlow.ts         -- converter automacao (DB) <-> nodes/edges (React Flow)
  utils/
    flowConverter.ts            -- logica de conversao automacao <-> flow
```

### 5. Schema do banco (sem alteracoes)
A estrutura atual do banco (`automacoes.acoes` como array JSON) ja suporta o modelo de fluxo. As posicoes dos nos serao salvas no campo `trigger_config` (adicionando um campo `flow_positions` no JSON).

### 6. Comportamento do Canvas

- **Adicionar no**: Clicar no handle "+" de qualquer no abre menu para escolher tipo (Acao, Condicao, Delay)
- **Conectar nos**: Arrastar de um handle de saida para um handle de entrada cria uma edge
- **Mover nos**: Drag livre no canvas com snap-to-grid opcional
- **Deletar**: Selecionar no e pressionar Delete ou clicar no botao de lixeira
- **Zoom/Pan**: Scroll para zoom, arrastar fundo para pan
- **Minimap**: Canto inferior direito com visao geral do fluxo
- **Salvar**: Botao no toolbar que converte o grafo visual de volta para o formato `acoes[]` e salva via API

### 7. Estilizacao dos nos (Design System)

Cada no seguira o padrao de Card do design system:
- `rounded-lg`, `border`, `shadow-sm`, padding `p-4`
- Header com icone + titulo do tipo
- Body com resumo da config (ex: "Enviar WhatsApp para {{contato.telefone}}")
- Handles circulares (8px) nas bordas superior (entrada) e inferior (saida)
- Hover: `shadow-md`, borda mais visivel
- Selecionado: `ring-2 ring-primary`

### 8. Fluxo de uso

1. Usuario clica em "Automacoes" no header
2. Ve lista de automacoes existentes no painel lateral
3. Clica em "Nova Automacao" -> cria uma automacao com no Trigger padrao
4. No canvas, configura o trigger clicando nele (abre painel direito)
5. Clica no "+" abaixo do trigger para adicionar Condicao ou Acao
6. Arrasta e reorganiza os nos
7. Clica "Salvar" no toolbar
8. Pode ativar/desativar via toggle no painel lateral

### 9. Remocoes

- Remover `AutomacaoFormModal.tsx` (substituido pelo editor visual)
- Remover `AutomacaoCard.tsx` (substituido pelo item da sidebar)
- Remover rota de automacoes do `ConfiguracoesLayout` no `App.tsx`
- Remover link de automacoes do `ConfigSidebar.tsx`
