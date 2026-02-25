

## Plano: Unificar escopos Google OAuth (Calendar + Gmail)

### Problema

As conexoes Gmail e Google Calendar compartilham o mesmo registro na tabela `conexoes_google` e o mesmo token OAuth. Porem, os escopos sao definidos separadamente:

- `tipo=calendar` -> so pede escopos de Calendar
- `tipo=gmail` -> so pede escopos de Gmail

Quando o usuario conecta por um tipo, o token nao funciona para o outro.

### Solucao

Unificar todos os escopos em uma unica lista. Independentemente de o usuario conectar via "Gmail" ou "Google Calendar", o token tera permissoes para ambos. Isso e correto porque ambos compartilham o mesmo registro no banco.

### Alteracao

**Arquivo**: `supabase/functions/google-auth/index.ts`

1. Criar uma lista `ALL_SCOPES` combinando Calendar + Gmail:

```typescript
const ALL_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
```

2. Na action `auth-url` (linha 138), usar sempre `ALL_SCOPES`:

```typescript
// Antes:
const scopes = tipo === "calendar" ? CALENDAR_SCOPES : GMAIL_SCOPES;

// Depois:
const scopes = ALL_SCOPES;
```

3. Manter `CALENDAR_SCOPES` e `GMAIL_SCOPES` como constantes para referencia futura, mas nao usa-los na geracao da URL.

### Apos o deploy

O usuario precisa **reconectar** o Google (desconectar e conectar novamente) para obter um token com todos os escopos. Pode reconectar por qualquer um dos cards (Gmail ou Calendar) -- o resultado sera o mesmo.

### Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/google-auth/index.ts` | Editar -- unificar escopos OAuth |

Nenhuma migracao de banco necessaria.
