

## Otimizacoes do Modulo de Emails - Reducao de Carga no Servidor

### Resumo

Tres melhorias para evitar sobrecarga do banco de dados com o crescimento de emails sincronizados:

---

### 1. Sanitizacao do HTML antes de salvar no banco

**Problema:** Emails de marketing podem conter imagens base64 inline (100-500KB cada), scripts, e HTML excessivamente grande que infla a tabela `emails_recebidos`.

**Solucao:** Adicionar funcao `sanitizeEmailHtml()` no `sync-emails/index.ts` que:
- Remove imagens base64 inline (`src="data:image/..."`) substituindo por placeholder
- Remove tags `<script>`, `<style>` com conteudo excessivo (>5KB)
- Trunca HTML que ultrapasse 200KB (mantendo as primeiras 200KB + aviso de truncamento)

**Arquivo:** `supabase/functions/sync-emails/index.ts`
- Criar funcao `sanitizeEmailHtml(html: string): string` 
- Aplicar nos pontos onde `corpo_html` e salvo (linhas ~888 e ~928)

---

### 2. Politica de Retencao Automatica (TTL)

**Problema:** Emails na lixeira e arquivados acumulam indefinidamente no banco sem limpeza.

**Solucao:** Criar uma Edge Function `limpar-emails-antigos` + cron job que:
- Deleta emails da pasta `trash` com mais de 30 dias
- Deleta emails da pasta `archived` com mais de 90 dias (soft delete via `deletado_em`)
- Executa automaticamente via `pg_cron` a cada 24h

**Arquivos:**
- Novo: `supabase/functions/limpar-emails-antigos/index.ts`
- SQL: Cron job para executar diariamente

---

### 3. Lazy Loading do corpo_html

**Problema:** Atualmente o sync baixa o body completo de todos os emails novos, mesmo que o usuario nunca os abra. Isso consome banda IMAP e espaco no banco desnecessariamente.

**Solucao:** Alterar o fluxo de sincronizacao para:
- No sync: salvar apenas headers (remetente, assunto, data) — sem baixar o body
- Quando o usuario abrir um email no frontend: buscar o body via IMAP on-demand e salvar no banco
- Manter o backfill existente como fallback

**Arquivos:**
- `supabase/functions/sync-emails/index.ts` — remover fetch de bodies no sync principal
- Novo: `supabase/functions/fetch-email-body/index.ts` — busca body individual sob demanda
- Frontend: `src/modules/emails/` — ao abrir email sem `corpo_html`, chamar a nova Edge Function

---

### Secao Tecnica

**Sanitizacao (sync-emails/index.ts):**
```text
function sanitizeEmailHtml(html: string): string {
  // 1. Remove data:image base64 (substitui por placeholder)
  // 2. Remove <script> tags
  // 3. Remove <style> blocks > 5KB
  // 4. Trunca se > 200KB
  return sanitized;
}
```

**TTL (limpar-emails-antigos/index.ts):**
```text
- DELETE FROM emails_recebidos WHERE pasta = 'trash' AND atualizado_em < NOW() - INTERVAL '30 days'
- UPDATE emails_recebidos SET deletado_em = NOW() WHERE pasta = 'archived' AND atualizado_em < NOW() - INTERVAL '90 days' AND deletado_em IS NULL
```

**Cron via pg_cron:**
```text
SELECT cron.schedule('limpar-emails-antigos', '0 3 * * *', $$ ... $$);
```

**Lazy Loading (fetch-email-body/index.ts):**
```text
- Recebe email_id
- Busca conexao SMTP do usuario
- Conecta IMAP, faz UID FETCH do body
- Salva corpo_html/corpo_texto no banco
- Retorna o conteudo
```

**Ordem de implementacao:**
1. Sanitizacao (menor risco, maior impacto imediato)
2. TTL (simples, evita acumulo futuro)
3. Lazy Loading (maior mudanca, requer ajuste no frontend)

