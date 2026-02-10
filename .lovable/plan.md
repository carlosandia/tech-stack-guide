

# Corrigir Erros de Console no Modulo de Emails

## Problema 1: "Maximum update depth exceeded" (Loop Infinito)

**Causa raiz identificada:** No `EmailsPage.tsx`, linha 164-177, o `useEffect` que auto-marca emails como lidos tem `atualizarEmail` nas dependencias. Como `atualizarEmail` e um objeto de mutation do TanStack Query que ganha uma nova referencia a cada render, isso cria um ciclo infinito:

```text
render -> useEffect dispara -> atualizarEmail.mutate() -> optimistic update altera cache -> re-render -> novo atualizarEmail -> useEffect dispara novamente -> loop
```

**Correcao:** Remover `atualizarEmail` do array de dependencias e usar uma ref estavel para chamar o mutate. Assim o efeito so dispara quando `selectedEmail?.id` muda de fato.

**Arquivo:** `src/modules/emails/pages/EmailsPage.tsx`

Alteracoes:
1. Criar um `useRef` para armazenar a funcao `atualizarEmail.mutate`
2. Atualizar o ref a cada render (sem causar re-execucao do efeito)
3. No `useEffect` da linha 164, usar o ref em vez do objeto mutacao diretamente
4. Remover `atualizarEmail` e `historico.adicionar` das dependencias, deixando apenas `selectedEmail?.id`

Codigo corrigido (conceito):
```text
const atualizarEmailRef = useRef(atualizarEmail.mutate)
atualizarEmailRef.current = atualizarEmail.mutate

const historicoAdicionarRef = useRef(historico.adicionar)
historicoAdicionarRef.current = historico.adicionar

useEffect(() => {
  if (selectedEmail && selectedEmail.id) {
    if (!selectedEmail.lido) {
      atualizarEmailRef.current({ id: selectedEmail.id, payload: { lido: true } })
    }
    historicoAdicionarRef.current({
      id: selectedEmail.id,
      de_nome: selectedEmail.de_nome,
      de_email: selectedEmail.de_email,
      assunto: selectedEmail.assunto,
    })
  }
}, [selectedEmail?.id]) // apenas o ID como dependencia
```

---

## Problema 2: "Blocked script execution in about:srcdoc"

**Causa raiz:** Emails HTML vindos de provedores como Gmail/WP Mail SMTP contem tags `<script>` e referencias a CDNs (ex: `cdn.tailwindcss.com`). O DOMPurify ja usa `FORBID_TAGS: ['script', 'noscript']`, mas existem 2 problemas remanescentes:

1. **`<link>` tags** que carregam JavaScript (ex: `<link rel="preload" as="script">`) nao sao filtradas
2. **Inline event handlers** em atributos como `onresize`, `oninput` etc nao estao na lista de FORBID_ATTR
3. **O regex de limpeza pos-sanitizacao** pode nao capturar todos os padroes (scripts multiline, etc)

**Correcao no arquivo:** `src/modules/emails/components/EmailViewer.tsx`

Alteracoes no `useMemo` que gera `cleanHtml`:

1. Expandir `FORBID_ATTR` para cobrir TODOS os event handlers HTML conhecidos
2. Adicionar regex para remover `<link>` tags que referenciam scripts
3. Adicionar regex para remover comentarios HTML condicionais do IE que podem conter scripts
4. Remover qualquer referencia a `cdn.tailwindcss.com` do HTML do email (causa o warning especifico no console)

Codigo adicional apos o DOMPurify.sanitize:
```text
// Remover link tags que carregam scripts
sanitized = sanitized.replace(/<link\b[^>]*\bas\s*=\s*["']?script["']?[^>]*>/gi, '')

// Remover referencia ao tailwindcss CDN (causa warning no console)
sanitized = sanitized.replace(/<script[^>]*cdn\.tailwindcss\.com[^>]*>[\s\S]*?<\/script>/gi, '')
sanitized = sanitized.replace(/<link[^>]*cdn\.tailwindcss\.com[^>]*>/gi, '')
```

---

## Resumo de Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/emails/pages/EmailsPage.tsx` | Corrigir loop infinito usando refs estaveis para mutation e historico |
| `src/modules/emails/components/EmailViewer.tsx` | Expandir sanitizacao para eliminar todos os scripts residuais |

