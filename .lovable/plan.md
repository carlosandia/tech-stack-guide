

## Correcao: Renderizacao MIME e Altura do Iframe no EmailViewer

### Problema 1: Email nao renderizado (MIME bruto)

O corpo do email esta chegando como texto MIME bruto (com boundaries, Content-Type headers, etc.) em vez do HTML extraido. O backend nao parseou corretamente, e o frontend nao tem fallback para extrair o HTML de dentro da estrutura MIME.

**Solucao**: Adicionar uma funcao `extractHtmlFromMime(raw)` no frontend que:
- Detecta se o texto contem boundary MIME (`--boundary`)
- Localiza a parte com `Content-Type: text/html`
- Extrai o corpo HTML dessa parte
- Decodifica quoted-printable ou base64 se necessario
- Fallback: se nao encontrar HTML, extrai `text/plain` e converte para HTML basico

Essa funcao sera chamada no `useMemo` do `cleanHtml`, entre o fallback de `corpo_texto` e o `looksLikeHtml`.

### Problema 2: Altura do iframe travada em 200px

O atributo `sandbox="allow-popups"` nao inclui `allow-same-origin`, o que impede o JavaScript do CRM de acessar `iframe.contentDocument`. Resultado: `adjustIframeHeight()`, `ResizeObserver` e `MutationObserver` **nunca funcionam** — todos caem no `catch`.

**Solucao**: Adicionar `allow-same-origin` ao sandbox do iframe:
```
sandbox="allow-popups allow-same-origin"
```

Isso e seguro porque:
- `allow-scripts` NAO esta presente — scripts continuam bloqueados
- O CSP meta tag (`script-src 'none'`) e uma segunda camada de defesa
- DOMPurify remove scripts e event handlers antes de injetar no srcDoc
- Sem `allow-scripts`, `allow-same-origin` sozinho nao permite execucao de codigo

Com essa mudanca, `adjustIframeHeight()` conseguira acessar `doc.body.scrollHeight` e o iframe se dimensionara corretamente.

### Alteracoes no arquivo

**`src/modules/emails/components/EmailViewer.tsx`**

1. **Nova funcao `extractHtmlFromMime(raw: string)`** (antes do componente):
   - Extrai boundary do header Content-Type
   - Separa as partes pelo boundary
   - Procura a parte `text/html`, decodifica e retorna
   - Fallback para `text/plain` convertido em `<pre>`

2. **Atualizar `useMemo` do `cleanHtml`** (linha ~248-259):
   - Apos verificar `looksLikeHtml` e `tryDecodeBase64`, adicionar chamada a `extractHtmlFromMime`
   - Ordem de tentativa: corpo_html → corpo_texto como HTML → base64 → MIME parse → texto puro

3. **Atualizar sandbox do iframe** (linha 553):
   - De: `sandbox="allow-popups"`
   - Para: `sandbox="allow-popups allow-same-origin"`

### Logica do parser MIME (simplificado)

```typescript
function extractHtmlFromMime(raw: string): string | null {
  // Encontra boundary
  const boundaryMatch = raw.match(/boundary="?([^"\s;]+)"?/i)
  if (!boundaryMatch) return null

  const boundary = boundaryMatch[1]
  const parts = raw.split('--' + boundary)

  let htmlPart: string | null = null
  let textPart: string | null = null

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n') !== -1 
      ? part.indexOf('\r\n\r\n') 
      : part.indexOf('\n\n')
    if (headerEnd === -1) continue

    const headers = part.substring(0, headerEnd).toLowerCase()
    const body = part.substring(headerEnd).trim()

    if (headers.includes('text/html')) {
      htmlPart = decodePartBody(body, headers)
    } else if (headers.includes('text/plain') && !textPart) {
      textPart = decodePartBody(body, headers)
    }
  }

  if (htmlPart) return htmlPart
  if (textPart) return `<pre>${textPart}</pre>`
  return null
}
```

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/emails/components/EmailViewer.tsx` | Parser MIME, sandbox allow-same-origin |

