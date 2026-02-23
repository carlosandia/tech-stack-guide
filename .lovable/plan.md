
# Correcao: URLs `undefined` em todo o projeto

## Problema

11 arquivos usam `import.meta.env.VITE_SUPABASE_URL` diretamente, sem fallback. Apenas `src/lib/supabase.ts` tem fallback. Quando a variavel nao resolve, todas as URLs ficam `undefined/functions/v1/...`.

Isso afeta:
- Webhooks de Entrada (URL exibida ao usuario)
- Embed de Formularios (script gerado)
- Widget WhatsApp (script gerado)
- Debug de Webhooks nas automacoes
- Admin (invite, impersonar, SMTP)
- Reset de senha
- Formulario publico (submissao)
- Widget de pricing
- Pagina de planos (demo)

## Solucao

### Passo 1: Centralizar com fallback em `src/config/env.ts`

Adicionar fallback na `SUPABASE_URL` (mesmo padrao do `supabase.ts`):

```text
SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ybzhlsalbnxwkfszkloa.supabase.co',
SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string || '...',
```

### Passo 2: Substituir todos os usos diretos

Nos 10 arquivos restantes, trocar `import.meta.env.VITE_SUPABASE_URL` por `env.SUPABASE_URL` (importando de `@/config/env`):

| Arquivo | Linhas afetadas |
|---------|-----------------|
| `configuracoes/services/configuracoes.api.ts` | 1917, 1943, 1957 |
| `formularios/components/compartilhar/EmbedCodeCard.tsx` | 26 |
| `configuracoes/components/whatsapp-widget/generateWidgetScript.ts` | 9 |
| `automacoes/components/panels/WebhookDebugPanel.tsx` | 65 |
| `formularios/pages/FormularioPublicoPage.tsx` | 215, 293 |
| `admin/services/admin.api.ts` | 420, 597, 1091, 1286 |
| `admin/pages/PlanosPage.tsx` | 19 |
| `public/pages/PlanosPage.tsx` | 67 |
| `auth/pages/ForgotPasswordPage.tsx` | 48 |

### Passo 3: Melhoria de UX na pagina de Webhooks

Na `WebhooksEntradaPage.tsx`, a URL longa do Supabase fica feia para o usuario. Melhorias:

- Truncar visualmente a URL com `text-ellipsis` (ja tem `truncate`)
- Adicionar label descritivo acima: "Endpoint de recebimento"
- Manter botao "Copiar" como acao principal (o usuario nao precisa ler a URL, so colar)
- Adicionar dica: "Cole esta URL na sua plataforma de automacao"

Isso segue o padrao dos grandes SaaS: campo read-only com URL truncada + botao copiar proeminente.

## Resultado

- Zero ocorrencias de `undefined` em URLs
- Configuracao centralizada com fallback seguro
- UX mais limpa na pagina de webhooks
