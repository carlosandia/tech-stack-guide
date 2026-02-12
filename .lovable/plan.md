
# Correcao: Persistencia de Configuracao ao Colapsar/Expandir Categorias

## Problema Identificado

Ao configurar uma acao (ex: "Alterar responsavel", selecionar membro), a configuracao se perde quando o usuario colapsa e re-expande a categoria no painel lateral. O problema esta na funcao `updateConfig` dentro de `CamposContextuais` (linha 481 de `AcaoConfig.tsx`):

```text
const updateConfig = (patch) => onUpdate({ ...data, config: { ...config, ...patch } })
```

Esta funcao captura `data` e `config` do closure da renderizacao atual. Quando multiplas interacoes ou re-renders ocorrem (colapsar/expandir categoria, clicar no canvas, etc.), a referencia `data` pode ficar desatualizada (stale closure), fazendo com que o proximo `updateConfig` sobrescreva com dados antigos.

## Solucao

Usar `useRef` para manter sempre a referencia mais recente de `data`, garantindo que `updateConfig` nunca use dados desatualizados:

### Arquivo: `src/modules/automacoes/components/panels/AcaoConfig.tsx`

**Mudanca em `CamposContextuais`:**

```text
// ANTES (stale closure):
function CamposContextuais({ tipo, data, onUpdate }) {
  const config = (data.config as Record<string, string>) || {}
  const updateConfig = (patch) => onUpdate({ ...data, config: { ...config, ...patch } })
  ...
}

// DEPOIS (ref sempre atualizado):
function CamposContextuais({ tipo, data, onUpdate }) {
  const dataRef = useRef(data)
  dataRef.current = data          // atualiza a cada render

  const config = (data.config as Record<string, string>) || {}

  const updateConfig = useCallback((patch: Record<string, string>) => {
    const latest = dataRef.current
    const latestConfig = (latest.config as Record<string, string>) || {}
    onUpdate({ ...latest, config: { ...latestConfig, ...patch } })
  }, [onUpdate])

  const appendToConfig = useCallback((field: string, value: string) => {
    const latest = dataRef.current
    const latestConfig = (latest.config as Record<string, string>) || {}
    const current = latestConfig[field] || ''
    updateConfig({ [field]: current + value })
  }, [updateConfig])
  ...
}
```

**Importacoes necessarias:** Adicionar `useRef` e `useCallback` ao import de React.

## Por que isso resolve

- `dataRef.current` sempre aponta para o `data` mais recente, independente de quando a funcao callback e executada
- `useCallback` com dependencia apenas em `onUpdate` evita re-criacao desnecessaria das funcoes de update
- Qualquer interacao (colapsar categoria, clicar canvas, trocar abas) que cause re-render vai atualizar o ref antes de qualquer callback ser chamado

## Escopo

- Apenas 1 arquivo modificado: `AcaoConfig.tsx`
- Apenas a funcao `CamposContextuais` e alterada
- Nenhuma outra funcionalidade e impactada
