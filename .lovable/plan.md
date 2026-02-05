
## Diagnóstico (com base nos seus logs + imagens)

1) **As requisições para o Supabase estão falhando no nível de rede**  
Nos logs aparece `Error: Failed to fetch` em chamadas como:
- `GET https://...supabase.co/rest/v1/planos?...`
- `GET https://...supabase.co/rest/v1/usuarios?...`

Esse tipo de erro geralmente **não é erro de permissão/RLS** (que retornaria 401/403 com resposta). É mais comum quando:
- a conexão está instável (ex.: `ERR_NETWORK_CHANGED`),
- o navegador “pausa” requisições (offline/intermitência),
- alguma camada que intercepta `fetch` falha (no stack trace aparece `window.fetch` vindo de `lovable.js`),
- DNS/Proxy/Extensão bloqueando domínios (você também tem `ERR_NAME_NOT_RESOLVED` para alguns recursos).

2) **A UI fica “presa” em loading porque não há timeout nem estado “paused/offline” tratado**  
- No wizard (Step2) você só trata `isLoading`. Se a promise do Supabase “fica pendurada”, o React Query mantém loading indefinidamente.
- Em outras telas, quando dá erro, a mensagem é genérica e sem botão de “tentar novamente”.

3) **Erro 404 de `/logo.svg` é ruído (mas vamos corrigir)**  
Não impede planos/organizações, mas polui console e passa sensação de “quebrado”.

---

## Objetivo

“Corrigir tudo” no sentido prático:
- Parar o comportamento de **loading infinito**.
- Mostrar **mensagem clara** quando estiver **sem conexão / requisição pausada / timeout**.
- Adicionar **botões de retry** (recarregar planos/organizações).
- Centralizar e endurecer o acesso ao Supabase com **timeout** (AbortController).
- Corrigir o 404 do logo.
- (Opcional, recomendado) Remover dependência de `import.meta.env` e do “backend Express local” nas partes que podem confundir no Lovable.

---

## Estratégia de correção (sem mexer no banco)

### A) Criar um “Supabase client” único com timeout + abort (para evitar loading infinito)
**O que faremos**
- Atualizar `src/lib/supabase.ts` para **criar um client próprio** via `createClient` com:
  - `global.fetch` customizado com **timeout** (ex.: 12–15s) usando `AbortController`.
  - log mínimo em caso de timeout (apenas para debug).
- Padronizar o app para importar Supabase de `@/lib/supabase` (não do auto-gerado).

**Por que isso ajuda**
- Se a rede estiver instável e o fetch “pendurar”, ele será abortado -> o React Query vai cair em `error` e a UI sai do “Carregando...”.

**Arquivos impactados**
- `src/lib/supabase.ts` (passa a criar client com timeout; mantém exports atuais)
- Ajustar imports em:
  - `src/providers/AuthProvider.tsx`
  - `src/modules/public/pages/PlanosPage.tsx`
  - `src/modules/public/pages/TrialCadastroPage.tsx`
  - (qualquer outro arquivo que use `@/integrations/supabase/client`)

---

### B) Tratar estados do React Query: loading vs error vs paused (offline)
**O que faremos**
- No Step 2 (Seleção de Planos), trocar:
  - `const { data, isLoading } = usePlanos()`
  por algo como:
  - `const { data, isLoading, isError, error, refetch, fetchStatus } = usePlanos()`

**Regras de UI**
- Se `isLoading && fetchStatus === 'fetching'`: mostrar “Carregando planos...”
- Se `fetchStatus === 'paused'` (sem conexão): mostrar um card/alert seguindo design system:
  - “Sem conexão. Verifique sua internet e tente novamente.”
  - Botão “Tentar novamente” -> `refetch()`
- Se `isError`: mostrar “Não foi possível carregar os planos.”
  - Exibir uma linha de detalhe (ex.: `String((error as Error)?.message ?? '')`) em texto pequeno
  - Botão “Recarregar” -> `refetch()`

**Aplicar o mesmo padrão nas telas**
- `src/modules/admin/pages/OrganizacoesPage.tsx`
- `src/modules/admin/pages/PlanosPage.tsx`
- (se necessário) outras páginas que dependem de queries.

**Resultado esperado**
- Nada mais fica “girando infinito”.
- O usuário sempre tem ação de “tentar de novo”.

---

### C) Melhorar UX de erro nas telas admin (mantendo o design system)
**O que faremos**
- Trocar mensagens genéricas (“Erro ao carregar organizacoes”) por blocos de feedback padrão:
  - container `bg-destructive/10 border border-destructive/20 rounded-lg p-4`
  - título `text-destructive font-medium`
  - subtítulo `text-sm text-muted-foreground`
  - botões:
    - primário “Tentar novamente”
    - secundário “Recarregar página” (opcional, com `window.location.reload()`)

---

### D) Corrigir o 404 do logo
Você tem referência a `/logo.svg` em:
- `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`

**Opção 1 (mais simples e limpa)**
- Adicionar `public/logo.svg` (um SVG simples com o “R” em azul, coerente com seu header).

**Opção 2 (sem arquivo novo)**
- Trocar `<img src="/logo.svg" />` por um bloco inline igual ao do `AdminLayout` (quadrado azul com “R”).

Vamos preferir a opção 1 para manter o `<img>` e zerar o 404.

---

### E) (Recomendado) Remover `import.meta.env` e “API_URL localhost” para evitar confusão no Lovable
Pelo seu próprio ambiente (Lovable), não existe backend Express rodando em `http://localhost:3001`. Isso pode gerar chamadas quebradas se alguma tela usar `authApi`/`api.ts`.

**O que faremos**
- Em `src/modules/auth/pages/LoginPage.tsx`: substituir `PRIVACY_URL` e `TERMS_URL` por constantes vazias (ou, se você quiser, buscar de `configuracoes_globais` futuramente).
- Em `src/config/env.ts` e `src/lib/api.ts`: manter, mas deixar claro por código (comentário + não usar onde não deve). Se identificarmos usos ativos do `api` em rotas reais do app, a correção vira migração para Supabase/Edge Functions.

Obs.: Essa parte é para “blindar” o projeto contra comportamentos inesperados no ambiente Lovable.

---

## Checklist de implementação (ordem)

1) **Atualizar `src/lib/supabase.ts`** para criar client com `fetchWithTimeout`.
2) **Trocar imports** de Supabase para `@/lib/supabase` nos arquivos citados.
3) **Atualizar Step2Expectativas** para tratar `fetchStatus`, erro e retry.
4) **Atualizar OrganizacoesPage / PlanosPage (admin)** para:
   - mostrar erro com detalhe e botão “Tentar novamente”
   - opcional: mostrar estado “sem conexão” se `fetchStatus === 'paused'`.
5) **Adicionar `public/logo.svg`** (ou substituir uso por logo inline).
6) (Opcional) **Remover `import.meta.env`** do LoginPage e revisar `api.ts` para reduzir ruído.

---

## Testes (fim a fim)

1) Em `/admin/organizacoes`:
   - Com internet ok: deve mostrar “Nenhuma organização encontrada” (já que no banco está 0) sem erro.
   - Simular rede instável (offline no devtools):
     - deve aparecer mensagem “Sem conexão” e botão “Tentar novamente”.
2) Abrir modal “Nova Organização” > Etapa 2:
   - Deve carregar cards dos planos.
   - Se falhar/timeout: deve mostrar erro e permitir retry.
3) `/admin/planos`:
   - Deve listar os 4 planos existentes.
4) Conferir console:
   - `/logo.svg` não deve mais dar 404.
5) Testar no mobile (largura 390px) para garantir que a UI do Step 2 não quebre.

---

## Riscos / Observações

- Se o problema for de **bloqueio de rede/DNS do seu ambiente**, o código não “faz magia”, mas vai:
  - parar de travar em loading infinito,
  - orientar claramente o usuário,
  - permitir retry,
  - registrar erros com mais contexto.
- Se o fetch estiver sendo afetado por interceptação/instabilidade no preview, o timeout vai tornar o comportamento previsível.

---

## Arquivos que serão alterados (estimativa)

- `src/lib/supabase.ts`
- `src/providers/AuthProvider.tsx`
- `src/modules/admin/components/wizard/Step2Expectativas.tsx`
- `src/modules/admin/pages/OrganizacoesPage.tsx`
- `src/modules/admin/pages/PlanosPage.tsx`
- `src/modules/public/pages/PlanosPage.tsx`
- `src/modules/public/pages/TrialCadastroPage.tsx`
- `src/modules/auth/pages/LoginPage.tsx` (opcional)
- `public/logo.svg` (novo) ou substituir o uso do `<img>` (dependendo da opção escolhida)

