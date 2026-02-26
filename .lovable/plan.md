

## Correcoes de Dark Mode no Modulo de Emails

### Problemas identificados

1. **Corpo do email (iframe) com texto preto invisivel no dark mode**: O iframe que renderiza o HTML do email nao define `background: white` nem `color: black` explicitamente. Emails sao projetados para fundo branco -- sem forccar isso, o browser pode herdar o fundo escuro do tema, tornando texto preto invisivel.

2. **Altura do iframe nao preenche 100%**: O iframe usa `minHeight: '400px'` fixo e depende de timeouts para ajustar. O `adjustIframeHeight` nao e confiavel para todos os emails, gerando scroll excessivo ou espaco insuficiente.

3. **Cores do avatar nao adaptam ao dark mode**: A funcao `getInitialColor` no `EmailViewer.tsx` usa classes como `bg-red-100 text-red-700` que ficam lavadas/ilegíveis no modo escuro.

### Solucao

**Arquivo 1: `src/modules/emails/components/EmailViewer.tsx`**

- **iframe containment CSS** (linhas 270-277): Adicionar `background: #ffffff !important; color: #1a1a1a !important;` ao `html, body` do CSS injetado no iframe. Isso garante que o conteudo do email sempre renderize em fundo branco com texto escuro, independente do tema do CRM. Emails com estilizacao propria (backgrounds coloridos, newsletters) continuam funcionando porque seus estilos inline tem prioridade. Esta e a mesma abordagem do Gmail.

- **Avatar colors** (linhas 90-103): Trocar de `bg-red-100 text-red-700` para cores com opacidade que funcionam em ambos os temas: `bg-red-500/15 text-red-400`, `bg-blue-500/15 text-blue-400`, etc.

- **Altura do iframe** (linhas 518-526): Trocar de `minHeight: '400px'` fixo para uma abordagem que use `height: 100%` quando o conteudo nao for auto-dimensionavel, e melhorar o `adjustIframeHeight` para considerar o container pai. Adicionar `ResizeObserver` no iframe document para reagir a mudancas de conteudo (imagens carregando, etc.) em vez de depender de timeouts arbitrarios.

**Arquivo 2: `src/modules/emails/components/EmailHistoricoPopover.tsx`**

- Os avatares usam `text-white` que funciona, mas as cores de fundo (`bg-blue-500`, etc.) sao aceitaveis -- nenhuma correcao necessaria aqui.

### Detalhes tecnicos

**CSS do iframe (principal correcao de dark mode):**
```css
html, body {
  overflow-x: hidden !important;
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin: 0;
  padding: 8px 16px;
  background: #ffffff !important;
  color: #1a1a1a !important;
}
```

**Avatar colors (dark-mode safe):**
```typescript
const colors = [
  'bg-red-500/15 text-red-400',
  'bg-blue-500/15 text-blue-400',
  'bg-green-500/15 text-green-400',
  'bg-purple-500/15 text-purple-400',
  'bg-amber-500/15 text-amber-400',
  'bg-teal-500/15 text-teal-400',
  'bg-pink-500/15 text-pink-400',
  'bg-indigo-500/15 text-indigo-400',
]
```

**Iframe height -- ResizeObserver:**
Substituir os timeouts por um `ResizeObserver` que reage automaticamente ao redimensionamento do conteudo do iframe:
```typescript
const adjustIframeHeight = useCallback(() => {
  const iframe = iframeRef.current
  if (!iframe) return
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc?.body) {
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 200)
      iframe.style.height = h + 'px'
    }
  } catch { /* sandbox */ }
}, [])
```
Manter os timeouts como fallback, mas adicionar um `MutationObserver` no `onLoad` do iframe para detectar quando imagens terminam de carregar.

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/emails/components/EmailViewer.tsx` | CSS do iframe (bg branco forcado), avatar colors, height melhorado |

### Recomendacao sobre dark mode no corpo do email

A abordagem correta (usada pelo Gmail, Outlook web, etc.) e **sempre renderizar o corpo do email em fundo branco com texto escuro**, pois:
- Emails HTML sao projetados para fundo branco
- Newsletters com backgrounds proprios continuam intactas (estilos inline prevalecem)
- Evita problemas de contraste com qualquer combinacao de cores do remetente
- O iframe esta isolado (sandbox), entao o estilo do CRM nao precisa vazar para dentro

