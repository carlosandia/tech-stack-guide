

# Correção: Conteúdo do email cortado e caracteres "�"

## Problema 1: Layout cortado / não centralizado

A CSS de contenção injetada no iframe é muito agressiva:

```css
table { max-width: 100% !important; table-layout: fixed; width: 100% !important; }
* { max-width: 100% !important; }
```

Emails profissionais (como os do eNotas) usam tabelas aninhadas com larguras fixas para layout. O `table-layout: fixed` e `width: 100%` forçados em TODAS as tabelas quebra completamente esse layout, causando o corte do conteúdo e a falta de centralização.

## Problema 2: Caracteres "�" (encoding quebrado)

O caractere "�" (U+FFFD) aparece em textos como "eletr**�**nica" e "Verifica**��**o". Isso indica que bytes de charset latin1/iso-8859-1 (ex: `0xF4` = "ô") foram interpretados como UTF-8 sem conversão correta.

**Causa**: O MIME parser detecta charset apenas dos headers MIME. Muitos emails declaram charset somente na tag `<meta>` do HTML (ex: `<meta charset="iso-8859-1">`), e o parser ignora isso, assumindo UTF-8 como fallback.

Adicionalmente, o iframe `srcDoc` não tem `<meta charset="utf-8">` declarado, o que pode causar problemas de interpretação.

## Alterações

### Arquivo 1: `src/modules/emails/components/EmailViewer.tsx`

**1a. Corrigir CSS de contenção (linhas 276-284)**

Remover as regras agressivas que quebram layout de tabelas:

```text
ANTES:
* { max-width: 100% !important; box-sizing: border-box; }
table { max-width: 100% !important; table-layout: fixed; width: 100% !important; }

DEPOIS:
* { box-sizing: border-box; }
table { border-collapse: collapse; }
```

Manter apenas as regras seguras: `overflow-x: hidden` no body, `img { max-width: 100%; height: auto; }`, e `pre/code { white-space: pre-wrap; }`.

**1b. Adicionar `<meta charset="utf-8">` na injeção do head (linhas 287-290)**

Garantir que o iframe interprete o conteúdo como UTF-8.

**1c. Adicionar detecção e re-decodificação de charset no frontend (no `cleanHtml` useMemo)**

Após o sanitize, verificar se o HTML contém "�" (replacement character). Se sim, tentar detectar o charset original da tag `<meta>` do HTML e re-decodificar o corpo original como latin1/iso-8859-1. Isso serve como fallback quando o backend já salvou dados com encoding errado.

### Arquivo 2: `supabase/functions/fetch-email-body/index.ts`

**2a. Adicionar fallback de detecção de charset via HTML meta (na função `parseMimeMessage`)**

Após decodificar o body com o charset dos headers MIME, verificar se o resultado contém "�". Se sim, procurar `<meta charset="...">` ou `<meta http-equiv="Content-Type" content="...; charset=...">` no HTML decodificado e re-decodificar com o charset correto.

### Arquivo 3: `supabase/functions/sync-emails/index.ts`

**3a. Mesma correção do fetch-email-body**: Adicionar o fallback de charset via HTML meta na função `parseMimeMessage` para que emails sincronizados automaticamente também resolvam o encoding corretamente.

## Resumo das mudanças

| Arquivo | Alteração |
|---|---|
| `EmailViewer.tsx` | CSS menos agressivo, meta charset, fallback re-decode |
| `fetch-email-body/index.ts` | Detecção de charset via HTML meta |
| `sync-emails/index.ts` | Detecção de charset via HTML meta |

## Nota sobre emails já salvos

Emails que já estão no banco com encoding errado precisarão ser re-sincronizados. Isso pode ser feito limpando o `corpo_html` dos registros afetados para que o `fetch-email-body` busque novamente do servidor IMAP com a correção aplicada.

