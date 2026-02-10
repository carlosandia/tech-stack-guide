

# Correcoes no Modulo de Emails

## 1. Eliminar "Blocked script execution" no iframe

**Causa raiz:** O DOMPurify remove tags `<script>`, mas emails HTML complexos (como os do WP Mail SMTP) podem conter scripts em formatos que o DOMPurify nao captura totalmente em modo `WHOLE_DOCUMENT`. Alem disso, os regex de limpeza rodam DEPOIS do DOMPurify, mas nao antes - entao o HTML malformado pode confundir o parser.

**Solucao:** Abordagem em 3 camadas no `EmailViewer.tsx`:

1. Executar os regex de remocao de `<script>` ANTES do DOMPurify (pre-limpeza do HTML bruto)
2. Manter o DOMPurify com FORBID_TAGS como segunda camada
3. Manter os regex pos-sanitizacao como terceira camada
4. Adicionar `<meta http-equiv="Content-Security-Policy" content="script-src 'none'">` no `<head>` do iframe para silenciar qualquer warning residual

**Arquivo:** `src/modules/emails/components/EmailViewer.tsx`

No `useMemo` do `cleanHtml`, ANTES da chamada ao DOMPurify:
```text
// PRE-LIMPEZA: remover scripts antes do DOMPurify processar
html = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
html = html.replace(/<script\b[^>]*\/>/gi, '') // self-closing
html = html.replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, '')
```

Na injecao do `<base>`, adicionar tambem o CSP meta tag:
```text
const cspMeta = '<meta http-equiv="Content-Security-Policy" content="script-src \'none\'">'
// Injetar no <head>
```

---

## 2. Renomear "Historico" para "Historico de Abertura" e mudar logica

**O que muda:**

- O botao na toolbar passa de "Historico" para "Hist. Abertura"
- O titulo do popover muda de "Ultimos visualizados" para "Historico de Abertura"
- A logica muda completamente: em vez de registrar emails que o USUARIO visualizou no CRM, mostra emails ENVIADOS pelo usuario que foram ABERTOS pelo destinatario (dados da tabela `email_aberturas`)

**Arquivos afetados:**

### `src/modules/emails/hooks/useEmailHistorico.ts`
- Substituir completamente a logica de localStorage por uma query ao Supabase
- Consultar `email_aberturas` JOIN `emails_recebidos` para trazer os ultimos 20 emails enviados que tiveram abertura registrada
- Retornar dados como: nome destinatario, assunto, data da abertura, total de aberturas

### `src/modules/emails/components/EmailHistoricoPopover.tsx`
- Renomear titulo para "Historico de Abertura"
- Atualizar label do botao para "Hist. Abertura"
- Ajustar o layout dos itens para mostrar: destinatario, assunto, quantidade de aberturas, data da primeira abertura
- Remover botao "Limpar historico" (dados vem do banco, nao do localStorage)

### `src/modules/emails/pages/EmailsPage.tsx`
- Adaptar a integracao com o hook atualizado (remover `historico.adicionar`, `historico.limpar`)
- Remover o `useEffect` que adicionava ao historico ao selecionar email (linhas 170-184)
- Manter apenas o auto-marcar como lido

---

## Detalhes Tecnicos

### Pre-limpeza de scripts (EmailViewer.tsx)

A ordem de operacoes passa a ser:
1. Detectar HTML e decodificar quoted-printable (existente)
2. **NOVO:** Regex pre-limpeza para remover `<script>` e `<noscript>` do HTML bruto
3. DOMPurify.sanitize com FORBID_TAGS (existente)
4. Regex pos-sanitizacao (existente)
5. **NOVO:** Injetar CSP meta tag `script-src 'none'` no head

### Hook useEmailHistorico refatorado

```text
// Novo: query Supabase em vez de localStorage
// Busca emails_recebidos com pasta='sent' e total_aberturas > 0
// Ordenado por aberto_em DESC, LIMIT 20
// Retorna: { data, isLoading }
```

### Popover atualizado

- Icone: manter History ou trocar para MailOpen
- Cada item mostra: avatar + nome destinatario + assunto + "Aberto Xx" + data
- Ao clicar, navega para o email enviado correspondente

