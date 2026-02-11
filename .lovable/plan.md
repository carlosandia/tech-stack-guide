

# Plano: Corrigir WhatsApp duplicado + Analytics zerado

## Problema 1: Numero WhatsApp duplicado

Na aba "Configuracao" do botao WhatsApp, existem dois campos para numero WhatsApp:
- **"Notificar WhatsApp"** em "Acoes ao Submeter" - envia notificacao para o dono quando alguem submete o formulario
- **"Configuracao WhatsApp > Numero"** - numero para onde o visitante sera redirecionado ao clicar no botao WhatsApp

Embora tenham funcoes diferentes, a duplicidade confunde o usuario. A correcao sera:

**Solucao**: Quando o tipo de botao for "Apenas WhatsApp" ou "Ambos", o campo "Notificar WhatsApp" na secao "Acoes ao Submeter" deve reaproveitar automaticamente o numero da "Configuracao WhatsApp" se o campo de notificacao estiver vazio. Alem disso, deixar claro nas labels:
- "Notificar WhatsApp" vira **"Avisar por WhatsApp"** com descricao "(voce recebe um aviso quando alguem preencher)"
- "Configuracao WhatsApp > Numero" vira **"Numero do Destinatario"** com descricao "(para onde o visitante sera redirecionado)"

Arquivo: `BotaoConfigPanel.tsx`

---

## Problema 2: Analytics zerado (inicios, abandonos, funil, desempenho)

Causa raiz identificada: **dois bugs no banco de dados**.

### Bug A: Inserts falhando silenciosamente
A pagina publica (`FormularioPublicoPage.tsx`) insere eventos com o campo `organizacao_id`, porem a tabela `eventos_analytics_formularios` **nao possui essa coluna**. Isso faz com que TODOS os inserts falhem silenciosamente (o erro e ignorado pelo `.then(() => {})`).

Colunas existentes na tabela: `id, formulario_id, visitor_id, session_id, tipo_evento, dados_evento, tempo_no_formulario_segundos, tempo_no_campo_segundos, url_pagina, referrer, tipo_dispositivo, navegador, variante_ab_id, criado_em`

**Nao existe `organizacao_id`.**

**Correcao**: Remover `organizacao_id` de todos os inserts na `FormularioPublicoPage.tsx`. Apenas `formulario_id` e necessario (a relacao com a organizacao ja existe via a tabela `formularios`).

### Bug B: RLS de leitura com coluna errada
A policy `eventos_analytics_tenant_isolation` usa `usuarios.id = auth.uid()`, mas o correto e `usuarios.auth_id = auth.uid()` (a coluna `id` da tabela `usuarios` e um UUID interno diferente do `auth.uid()`).

**Correcao**: Alterar a policy via SQL:

```text
DROP POLICY eventos_analytics_tenant_isolation ON eventos_analytics_formularios;
CREATE POLICY eventos_analytics_tenant_isolation ON eventos_analytics_formularios
FOR ALL USING (
  formulario_id IN (
    SELECT f.id FROM formularios f
    WHERE f.organizacao_id = (
      SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
    )
  )
) WITH CHECK (
  formulario_id IN (
    SELECT f.id FROM formularios f
    WHERE f.organizacao_id = (
      SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
    )
  )
);
```

### Bug C: Queries do frontend tambem enviam organizacao_id
A funcao `obterDesempenhoCampos` e `obterFunilConversao` no `formularios.api.ts` nao tem esse problema (nao enviam organizacao_id), entao estao corretas. O problema e apenas nos inserts da pagina publica.

---

## Resumo de arquivos afetados

1. **`BotaoConfigPanel.tsx`** - Renomear labels do WhatsApp para evitar confusao
2. **`FormularioPublicoPage.tsx`** - Remover `organizacao_id` de todos os inserts de eventos analytics
3. **SQL Migration** - Corrigir RLS policy `eventos_analytics_tenant_isolation` (trocar `usuarios.id` por `usuarios.auth_id`)

