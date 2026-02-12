
# Correcao: Auto-Save + UI CondicaoNode

## Problema Raiz

Apos investigacao profunda, o problema de persistencia NAO e apenas stale closure — a correcao via `useRef` ja esta aplicada em todos os niveis. O problema real e que **os dados vivem apenas no React state (`nodes` array)** e qualquer re-render inesperado, interacao no canvas (selecao, drag), ou batching do React 18 pode causar perda. A unica forma confiavel de garantir persistencia e **salvar no banco automaticamente**.

## Solucao

### Parte 1: Auto-save com debounce (como formularios)

Ao inves de depender do botao "Salvar" manual, o fluxo sera salvo automaticamente no banco apos cada alteracao, com debounce de 1 segundo para nao sobrecarregar o servidor.

**Arquivo: `src/modules/automacoes/pages/AutomacoesPage.tsx`**

- Adicionar `useRef` para timer de debounce
- Criar funcao `debouncedSave` que converte nodes/edges para payload e chama `atualizarMutation.mutate`
- Disparar auto-save quando `nodes` ou `edges` mudam (via `useEffect`)
- Manter botao "Salvar" como fallback manual, mas o comportamento padrao sera auto-save
- Adicionar indicador visual sutil ("Salvando..." / "Salvo") no lugar do botao ou ao lado

**Logica:**

```text
useEffect:
  - Se nao tem selectedAutoId, ignorar
  - Se nodes tem menos de 1 no, ignorar (evita salvar estado vazio)
  - Limpar timer anterior
  - Setar novo timer (1000ms) que chama flowToAutomacao + atualizarMutation
  - Cleanup: limpar timer
  Dependencias: [nodes, edges, selectedAutoId]
```

### Parte 2: UI do CondicaoNode — Check/X nos handles

**Arquivo: `src/modules/automacoes/components/nodes/CondicaoNode.tsx`**

Substituir os labels de texto "Sim" e "Nao" por icones dentro dos proprios handles:

- Handle verde (sim): icone `Check` (lucide) dentro do circulo
- Handle vermelho (nao): icone `X` (lucide) dentro do circulo
- Remover o bloco `<div>` com os `<span>` de texto "Sim" e "Nao"
- Aumentar levemente o tamanho dos handles para acomodar os icones (de `!w-3 !h-3` para `!w-5 !h-5`)
- Posicionar os icones com CSS absoluto dentro de `<div>` wrappers ao lado dos handles

**Referencia visual (imagem 2 do usuario):**
- Circulo vermelho com X para a saida "nao"
- Circulo verde com check para a saida "sim"

### Parte 3: Mesma mudanca no ValidacaoNode

**Arquivo: `src/modules/automacoes/components/nodes/ValidacaoNode.tsx`**

Aplicar o mesmo padrao visual dos handles:
- Handle verde (match): icone `Check`
- Handle vermelho (nenhuma): icone `X`
- Remover labels de texto "Match" e "Nenhuma"

---

## Detalhes Tecnicos

### Auto-save (AutomacoesPage.tsx)

```text
// Ref para debounce timer
const saveTimerRef = useRef<NodeJS.Timeout>()

// Refs para evitar stale closure no useEffect
const nodesRef = useRef(nodes)
nodesRef.current = nodes
const edgesRef = useRef(edges)
edgesRef.current = edges

useEffect(() => {
  if (!selectedAutoId) return
  if (nodes.length < 1) return

  clearTimeout(saveTimerRef.current)
  saveTimerRef.current = setTimeout(() => {
    const payload = flowToAutomacao(nodesRef.current, edgesRef.current)
    atualizarMutation.mutate({ id: selectedAutoId, payload })
  }, 1000)

  return () => clearTimeout(saveTimerRef.current)
}, [nodes, edges, selectedAutoId])
```

### CondicaoNode handles

```text
// Ao lado de cada Handle source, um div posicionado com icone:
<div className="absolute" style={{ top: '35%', right: -6 }}>
  <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
    <Check className="w-3 h-3 text-white" />
  </div>
</div>

<div className="absolute" style={{ top: '65%', right: -6 }}>
  <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
    <X className="w-3 h-3 text-white" />
  </div>
</div>
```

Os `Handle` do React Flow serao sobrepostos por esses divs visuais (com `pointer-events-none`) para manter a funcionalidade de conexao.

## Arquivos Modificados

1. `src/modules/automacoes/pages/AutomacoesPage.tsx` — auto-save com debounce
2. `src/modules/automacoes/components/nodes/CondicaoNode.tsx` — icones check/X nos handles
3. `src/modules/automacoes/components/nodes/ValidacaoNode.tsx` — icones check/X nos handles
