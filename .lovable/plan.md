
# Corrigir formulario para pegar 100% do viewport no preview

## Problema
O `containerStyle` aplica o `max_width` configurado no estilo do container (ex: `600px`), o que limita a largura do formulario dentro do wrapper de viewport. Isso faz com que Desktop, Tablet e Mobile pareçam iguais porque o container interno nunca ultrapassa seu `max_width`.

## Solucao
Remover o `maxWidth` do `containerStyle` quando estiver no preview do editor. Assim o formulario sempre ocupara 100% da largura disponivel no wrapper de viewport, e a diferença entre Desktop (100%), Tablet (768px) e Mobile (390px) ficara visivel.

## Alteracao tecnica

**Arquivo:** `src/modules/formularios/components/editor/FormPreview.tsx`

1. Na construcao do `containerStyle` (linha 218), remover a propriedade `maxWidth`:

```typescript
// ANTES (linha 218):
maxWidth: rv(estiloContainer as any, 'max_width') || estiloContainer.max_width || undefined,

// DEPOIS - remover essa linha completamente do containerStyle
// O max_width sera controlado apenas pelo wrapper de viewport
```

2. Isso fara com que o `div` do form container ocupe `w-full` (ja esta na classe), preenchendo todo o wrapper de viewport.

3. O wrapper externo (linhas 423-431) ja controla a largura corretamente: `100%` para desktop, `768px` para tablet, `390px` para mobile.

## Resultado esperado
- **Desktop**: formulario ocupa toda a largura do preview
- **Tablet**: formulario limitado a 768px com borda tracejada
- **Mobile**: formulario limitado a 390px com borda tracejada
- A diferença visual entre os viewports fica clara
