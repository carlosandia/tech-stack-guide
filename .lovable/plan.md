
# Correcao Definitiva: Persistencia de Configuracao nas Acoes

## Diagnostico

O problema esta em **multiplos niveis de stale closure** que se acumulam na cadeia de update:

### Cadeia de atualizacao (3 niveis):

```text
CamposContextuais.updateConfig()
  -> AcaoConfig.onUpdate (prop)
    -> NodeConfigPanel.handleUpdate()
      -> useFlowState.updateNodeData()
        -> setNodes()
```

### Nivel 1 - CamposContextuais (ja corrigido)
O `useRef` para `data` foi adicionado, mas `updateConfig` depende de `onUpdate` via `useCallback([onUpdate])`. Se `onUpdate` mudar referencia, `updateConfig` e recriado, porem o problema nao esta aqui.

### Nivel 2 - NodeConfigPanel.handleUpdate (NAO corrigido - causa principal)
```text
const handleUpdate = (data) => {
    onUpdate(node.id, data)   // <-- `node` capturado do closure!
}
```
`handleUpdate` e recriado a cada render, mas **nao e estavel**. Quando `AcaoConfig` chama `onUpdate`, pode estar usando uma versao de `handleUpdate` que capturou um `node` antigo. Mais criticamente: `handleUpdate` e uma funcao nova a cada render de `NodeConfigPanel`, fazendo com que `AcaoConfig` receba um novo `onUpdate` prop a cada render, disparando re-renders desnecessarios em toda a arvore.

### Nivel 3 - AcaoConfig (NAO corrigido)
`AcaoConfig` passa `onUpdate` direto para `CamposContextuais`. Se `AcaoConfig` nao re-renderizar entre a digitacao do usuario e o toggle da categoria, `CamposContextuais` pode estar usando um `onUpdate` que fecha sobre dados antigos.

## Solucao: Ref pattern em todos os 3 niveis

### Arquivo 1: `src/modules/automacoes/components/panels/NodeConfigPanel.tsx`

**Mudanca**: Usar `useRef` + `useCallback` para `handleUpdate`:

```text
// ANTES:
const handleUpdate = (data: Record<string, unknown>) => {
    onUpdate(node.id, data)
}

// DEPOIS:
const nodeIdRef = useRef(node.id)
nodeIdRef.current = node.id
const onUpdateRef = useRef(onUpdate)
onUpdateRef.current = onUpdate

const handleUpdate = useCallback((data: Record<string, unknown>) => {
    onUpdateRef.current(nodeIdRef.current, data)
}, [])
```

Isso garante:
- `handleUpdate` e **estavel** (referencia nunca muda) -- evita re-renders cascata
- Sempre usa o `node.id` e `onUpdate` mais recentes via ref

### Arquivo 2: `src/modules/automacoes/components/panels/AcaoConfig.tsx`

**Mudanca**: Adicionar `useRef` para `data` e `onUpdate` no componente `AcaoConfig` (nao apenas em `CamposContextuais`):

```text
export function AcaoConfig({ data, onUpdate }: AcaoConfigProps) {
  // Refs para evitar stale closure no onClick dos tipos
  const dataRef = useRef(data)
  dataRef.current = data
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  // ...

  // No onClick dos botoes de tipo:
  onClick={() => {
    if (a.tipo === currentTipo) return
    onUpdateRef.current({ ...dataRef.current, tipo: a.tipo, config: {} })
  }}

  // No CamposContextuais:
  <CamposContextuais tipo={currentTipo} data={data} onUpdate={onUpdateRef.current} />
}
```

### `CamposContextuais` - ja corrigido (manter)

O `useRef` para `data` e `useCallback` para `updateConfig` ja estao corretos.

## Por que isso resolve definitivamente

1. **NodeConfigPanel.handleUpdate estavel**: referencia nunca muda, elimina re-renders cascata e garante que sempre usa o `node.id` correto
2. **AcaoConfig com refs**: o click nos botoes de tipo e o repasse para `CamposContextuais` sempre usam dados frescos
3. **CamposContextuais com refs** (ja implementado): `updateConfig` sempre le dados atuais

## Escopo

- 2 arquivos modificados: `NodeConfigPanel.tsx` e `AcaoConfig.tsx`
- Apenas adicao de refs e useCallback — zero mudanca de logica ou UI
