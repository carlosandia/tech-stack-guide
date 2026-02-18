
# Correção: Scroll horizontal e emails com corpo base64 não decodificado

## Problema 1: Scroll horizontal no iframe

O conteudo HTML dos emails e renderizado dentro de um iframe via `srcDoc`. Emails com tabelas largas, URLs longas ou conteudo sem `word-break` causam overflow horizontal.

**Solucao**: Injetar CSS de contencao no `<head>` do HTML sanitizado, forcando:
- `overflow-x: hidden` no body
- `word-wrap: break-word` e `overflow-wrap: break-word` globalmente
- `max-width: 100%` em tabelas e imagens
- `table-layout: fixed` em tabelas

## Problema 2: Email eNotas exibindo texto base64 bruto

O email da eNotas possui o corpo codificado em base64 que nao foi decodificado pelo parser MIME. Quando `corpo_html` fica `null` e `corpo_texto` contem o bloco base64 bruto, o viewer exibe esse texto ilegivel.

**Solucao**: Adicionar deteccao de base64 no `EmailViewer` como fallback. Se `corpo_texto` parece ser base64 (string longa sem espacos, caracteres A-Z/a-z/0-9/+/=), tentar decodificar e verificar se o resultado e HTML ou texto legivel.

---

## Detalhes Tecnicos

### Arquivo: `src/modules/emails/components/EmailViewer.tsx`

**Alteracao 1 - CSS de contencao no iframe (dentro do `cleanHtml` useMemo)**

Apos a linha que injeta o CSP meta tag, adicionar um bloco `<style>` com regras de contencao:

```css
html, body {
  overflow-x: hidden !important;
  max-width: 100% !important;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
table { max-width: 100% !important; table-layout: fixed; }
img { max-width: 100% !important; height: auto !important; }
pre, code { white-space: pre-wrap !important; word-break: break-all; }
a { word-break: break-all; }
```

**Alteracao 2 - Deteccao e decodificacao de base64 no fallback**

Criar funcao `tryDecodeBase64(str)` que:
1. Verifica se a string parece base64 (regex `/^[A-Za-z0-9+/=\s]+$/` e comprimento > 100)
2. Remove whitespace, tenta `atob()` e converte para UTF-8
3. Retorna o texto decodificado ou `null` se falhar

Usar essa funcao no `cleanHtml` useMemo: se `corpo_html` e vazio e `corpo_texto` parece base64, decodificar e verificar se o resultado e HTML (usar `looksLikeHtml`).

Tambem usar no fallback de texto plano (`corpo_texto`): se o texto parece base64, decodificar antes de exibir.

### Arquivo: `supabase/functions/sync-emails/index.ts`

**Alteracao 3 - Melhoria no parser MIME (prevencao futura)**

Na funcao `parseMimeMessage`, adicionar deteccao de encoding quando o Content-Transfer-Encoding nao esta presente mas o corpo parece ser base64. Isso evita que futuros emails cheguem com corpo bruto no banco.
