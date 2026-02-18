

# Plano: Corrigir Estilos Individuais no Widget Embed + Migrar para REM

## Problemas Identificados

1. **Widget embed ignora estilos individuais por campo**: O `widget-formulario-loader` usa apenas o estilo global (`estilos.campos`) para todos os campos. Ele nao le `campo.validacoes.estilo_campo`, entao qualquer personalizacao individual feita no editor nao aparece no formulario embedado.

2. **Valores numericos sem unidade no widget**: A funcao `ensurePx` existe apenas no frontend React. O widget loader (edge function) nao tem essa logica, entao valores como "300" nao recebem "px" automaticamente.

3. **Nenhum feedback visual ao salvar estilo de campo**: O hook `useAtualizarCampo` nao exibe toast de sucesso ao salvar — apenas mostra erro. Isso causa a impressao de que "nada aconteceu".

4. **Migracao para rem**: Font sizes e alturas serao convertidos automaticamente de numeros puros para `rem` (em vez de `px`), melhorando a responsividade.

---

## Solucao

### 1. Atualizar o Widget Loader (edge function)

**Arquivo**: `supabase/functions/widget-formulario-loader/index.ts`

- Adicionar funcao `ensurePx` inline no JS gerado
- Adicionar funcao `mergeCampoEstilo` inline que faz merge de `campo.validacoes.estilo_campo` com o estilo global `fS`
- No loop de renderizacao de campos, calcular `labelCss` e `inputCss` POR CAMPO usando o merge
- Isso garante que estilos individuais configurados no editor aparecam no formulario embedado

### 2. Adicionar Toast de Sucesso ao Salvar Campo

**Arquivo**: `src/modules/formularios/hooks/useFormularioCampos.ts`

- Adicionar `toast.success('Campo atualizado')` no `onSuccess` do `useAtualizarCampo`
- Isso da feedback claro ao usuario quando altera qualquer configuracao de campo (incluindo estilos)

### 3. Migrar para REM

**Arquivo**: `src/modules/formularios/utils/campoEstiloUtils.ts`

- Criar funcao `ensureUnit` que:
  - Para `fontSize` e `height`: converte numero puro para `rem` (ex: "14" vira "0.875rem", usando divisao por 16)
  - Para `borderRadius`, `borderWidth`: mantem `px`
  - Se ja tem unidade, retorna como esta

**Arquivos**: `src/modules/formularios/components/editor/FormPreview.tsx` e `src/modules/formularios/pages/FormularioPublicoPage.tsx`

- Substituir chamadas de `ensurePx` por `ensureUnit` com o tipo correto de propriedade

---

## Detalhes Tecnicos

### Merge no Widget (JS inline)

```text
// Pseudo-codigo do merge que sera adicionado ao loader
function mergeFieldStyle(globalFS, campo) {
  var ec = (campo.validacoes || {}).estilo_campo || {};
  var merged = {};
  // Copia global
  for (var k in globalFS) merged[k] = globalFS[k];
  // Aplica overrides individuais
  for (var k in ec) { if (ec[k] !== '' && ec[k] != null) merged[k] = ec[k]; }
  return merged;
}
```

### Funcao ensureUnit

```text
// Para fontSize/height: numero puro -> rem
// Para border: numero puro -> px
ensureUnit("14", "fontSize")   -> "0.875rem"
ensureUnit("40", "height")     -> "2.5rem"  
ensureUnit("6", "border")      -> "6px"
ensureUnit("14px", "fontSize") -> "14px" (ja tem unidade)
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/widget-formulario-loader/index.ts` | Merge de estilos individuais + ensurePx no JS |
| `src/modules/formularios/hooks/useFormularioCampos.ts` | Toast de sucesso no `onSuccess` |
| `src/modules/formularios/utils/campoEstiloUtils.ts` | Nova funcao `ensureUnit` para rem/px |
| `src/modules/formularios/components/editor/FormPreview.tsx` | Usar `ensureUnit` |
| `src/modules/formularios/pages/FormularioPublicoPage.tsx` | Usar `ensureUnit` |

