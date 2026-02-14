

# Correcao definitiva: Scrollbar visivel no Select dropdown

## Causa raiz encontrada

O Radix UI **injeta dinamicamente uma tag `<style>`** dentro do DOM com o seguinte CSS:

```css
[data-radix-select-viewport] {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
[data-radix-select-viewport]::-webkit-scrollbar {
  display: none;
}
```

Isso significa que **nenhuma regra CSS externa consegue vencer**, porque essa tag `<style>` injetada dentro do portal tem a mesma especificidade e e aplicada depois. Alem disso, o viewport recebe `overflow: "hidden auto"` como inline style.

## Solucao

Abandonar a tentativa de forcar scrollbar nativo no Viewport do Radix (impossivel sem patch no pacote). Em vez disso, **envolver o conteudo em uma div propria com scroll**, que nao possui o atributo `data-radix-select-viewport` e portanto nao e afetada pela style tag injetada.

### Mudancas

**1. `src/components/ui/select.tsx` - SelectContent**

Manter o `SelectPrimitive.Viewport` como esta (Radix precisa dele para funcionalidade interna), mas adicionar uma **div wrapper dentro do Viewport** com:
- Classe `select-scroll`
- `max-height` via style inline
- `overflow-y: auto` via style inline

Estrutura:
```
Content
  ScrollUpButton
  Viewport (Radix gerencia, scrollbar escondido por ele - sem problema)
    <div class="select-scroll" style="max-height: 300px; overflow-y: auto">
      {children}
    </div>
  ScrollDownButton
```

Como a div interna **nao tem** o atributo `data-radix-select-viewport`, a style tag injetada pelo Radix nao a afeta, e nossas regras CSS `.select-scroll` funcionam normalmente.

**2. `src/index.css`**

Manter as regras `.select-scroll` ja existentes (estao corretas). Adicionar `overflow-y: auto !important` na regra base `.select-scroll` para garantir.

### Detalhes tecnicos

- O Viewport do Radix continuara funcionando normalmente (keyboard navigation, scroll interno)
- A div wrapper tera seu proprio scroll com scrollbar visivel
- As regras CSS `.select-scroll` ja definem cores solidas para track/thumb
- Remover os estilos inline de scroll do Viewport (maxHeight, overflowY, etc.) pois o scroll sera gerenciado pela div interna
