

# Scrollbar sempre visivel no Select dropdown

## Problema
O componente `SelectContent` do Radix UI usa `overflow-hidden` no wrapper e gerencia scroll internamente. As tentativas anteriores via CSS (`overflow-y: scroll`, `scrollbar-gutter`, `-webkit-appearance`) nao funcionam porque:
1. O `overflow-hidden` no `SelectContent` recorta qualquer scrollbar do viewport filho
2. Navegadores modernos (Chrome/macOS) usam "overlay scrollbars" que sao invisiveis ate o usuario rolar
3. O Radix renderiza dentro de um Portal, dificultando CSS global

## Solucao
Trocar a abordagem: em vez de tentar forcar scrollbar nativo via CSS, adicionar uma **scrollbar track visual customizada** diretamente no componente, usando uma div wrapper com estilos inline que garantem visibilidade.

### Mudancas

**1. `src/components/ui/select.tsx`**
- Remover `overflow-hidden` da className do `SelectContent`
- Envolver o `SelectPrimitive.Viewport` em uma div wrapper com:
  - `max-height` limitado
  - `overflow-y: scroll` via style inline (nao className, para evitar purge)
  - `scrollbar-width: thin` para Firefox
  - Custom `::-webkit-scrollbar` via classe utilitaria dedicada
- Adicionar classe CSS utilitaria `select-scroll` que forca scrollbar visivel com `!important`

**2. `src/index.css`**
- Simplificar as regras CSS existentes para `[data-radix-select-viewport]`
- Adicionar classe `.select-scroll` com regras de scrollbar que usam cores solidas (nao transparentes) para garantir visibilidade imediata
- Usar `scrollbar-gutter: stable` para reservar espaco permanente para a scrollbar track

### Detalhes tecnicos

No `SelectContent`, a estrutura passara de:
```
Content (overflow-hidden)
  ScrollUpButton
  Viewport (sem scroll proprio)
  ScrollDownButton
```

Para:
```
Content (overflow-visible)
  ScrollUpButton
  Viewport (overflow-y: scroll, max-height, scrollbar-gutter: stable)
  ScrollDownButton
```

A chave e combinar `overflow-y: scroll` com `scrollbar-gutter: stable` e definir cores de scrollbar via CSS que nao sejam transparentes, forcando o navegador a renderizar a track mesmo sem interacao.
