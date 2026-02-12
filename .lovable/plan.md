
# Correcao: Select de Pipeline nao funciona

## Causa Raiz

Dentro de `FunilEtapaSelect`, ao selecionar um funil, duas callbacks sao chamadas sequencialmente:

```
onFunilChange(val)     --> updateConfig({ funil_id: val })
onEtapaChange('')      --> updateConfig({ etapa_id: '' })
```

Ambas usam o mesmo closure de `config` (estado antigo). A segunda chamada recria o objeto config SEM o `funil_id` que a primeira definiu, sobrescrevendo a selecao. Resultado: o valor volta a string vazia imediatamente apos selecionar.

## Solucao

**1. Mudar `FunilEtapaSelect.tsx`**: Remover a chamada separada a `onEtapaChange('')` dentro do `onChange` do funil. O reset da etapa sera responsabilidade do parent.

**2. Mudar todos os locais em `AcaoConfig.tsx`** onde `onFunilChange` e usado: combinar ambos os campos em um unico `updateConfig`:

```typescript
onFunilChange={id => updateConfig({ funil_id: id, etapa_id: '' })}
```

Isso garante que `funil_id` e `etapa_id` sejam atualizados atomicamente, sem race condition.

## Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| `FunilEtapaSelect.tsx` | Remover `if (onEtapaChange) onEtapaChange('')` do onChange do funil |
| `AcaoConfig.tsx` | Nos cases `mover_etapa`, `criar_oportunidade` e `distribuir_responsavel`, alterar `onFunilChange` para incluir `etapa_id: ''` no mesmo updateConfig |

## Detalhes Tecnicos

- O problema nao e de cache, z-index ou evento bloqueado
- E uma race condition classica de closures stale no React
- A correcao e pontual e nao afeta nenhuma outra funcionalidade
