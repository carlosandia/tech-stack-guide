

## Correção: Erro "Cannot coerce" ao excluir campo

### Causa raiz

O painel de configuração (`CampoConfigPanel`) usa debounce de 800ms para persistir alterações. Quando o usuário exclui um campo, o timer do debounce ainda está ativo e dispara um `update` no campo que acabou de ser deletado. A função `atualizarCampo` usa `.single()` na query Supabase, que exige exatamente 1 resultado — como o campo já foi excluído, retorna 0 linhas e o Supabase lança o erro "Cannot coerce the result to a single JSON object".

### Solução

Duas alterações complementares:

**1. `src/modules/formularios/services/formularios.api.ts`** — Trocar `.single()` por `.maybeSingle()` na função `atualizarCampo`:

```typescript
// Linha 342: trocar .single() por .maybeSingle()
const { data, error } = await supabase
  .from('campos_formularios')
  .update(payload as Record<string, unknown>)
  .eq('formulario_id', formularioId)
  .eq('id', campoId)
  .select()
  .maybeSingle()  // <-- tolerante a 0 resultados

if (error) throw new Error(`Erro ao atualizar campo: ${error.message}`)
if (!data) return null as unknown as CampoFormulario  // campo já foi excluído, ignorar silenciosamente
return data as unknown as CampoFormulario
```

**2. `src/modules/formularios/pages/FormularioEditorPage.tsx`** — Ao excluir um campo, desselecionar ANTES de chamar o mutate, para que o painel de config desmonte e cancele o debounce pendente:

```typescript
const handleRemoveCampo = useCallback(
  (campoId: string) => {
    // Desselecionar ANTES de excluir — desmonta CampoConfigPanel e cancela debounce
    if (selectedCampoId === campoId) {
      setSelectedCampoId(null)
      setShowConfig(false)
    }
    excluirCampo.mutate(campoId)
  },
  [excluirCampo, selectedCampoId]
)
```

### Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/modules/formularios/services/formularios.api.ts` | `.single()` -> `.maybeSingle()` em `atualizarCampo` |
| `src/modules/formularios/pages/FormularioEditorPage.tsx` | Desselecionar campo antes de excluir |

### Garantias

- Elimina o erro toast ao excluir qualquer campo
- Se um debounce ainda disparar apos exclusao, sera ignorado silenciosamente
- Sem impacto em atualizacoes normais (quando campo existe, `.maybeSingle()` funciona igual a `.single()`)
