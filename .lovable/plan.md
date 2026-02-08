
# Plano de Correcao: Gaps do PRD-15 - Modulo de Feedback

## Resumo da Analise

Apos verificacao detalhada do PRD-15-FEEDBACK.md (1165 linhas) versus a implementacao atual, identifiquei **7 gaps** - sendo **2 criticos (bloqueantes)** relacionados a RLS no banco de dados que impedem funcionalidades core de funcionar.

---

## Gaps Identificados (por prioridade)

### GAP 1 - CRITICO: Falta policy de UPDATE na tabela `feedbacks`

**Problema:** A tabela `feedbacks` possui apenas policies de SELECT e INSERT. Nao existe policy para UPDATE. Quando o Super Admin tenta "Marcar como Resolvido", a operacao `supabase.from('feedbacks').update(...)` falha silenciosamente por falta de permissao RLS.

**Impacto:** A funcionalidade de resolver feedback (RF-006) esta 100% quebrada.

**Correcao:** Criar migration SQL com policy de UPDATE para Super Admin:
```text
CREATE POLICY "super_admin_update_feedback" ON feedbacks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'super_admin'
    )
  );
```

### GAP 2 - CRITICO: Policy de notificacoes impede INSERT pelo Super Admin

**Problema:** A tabela `notificacoes` tem uma policy `FOR ALL` que valida `usuario_id = auth.uid()`. Quando o Super Admin resolve um feedback, tenta inserir uma notificacao onde `usuario_id = feedback.usuario_id` (o usuario original), mas o RLS bloqueia porque o `usuario_id` da notificacao nao corresponde ao Super Admin logado.

**Impacto:** Notificacoes de resolucao nunca sao criadas. O usuario original nunca sabe que seu feedback foi resolvido.

**Correcao:** Adicionar policy especifica de INSERT que permite Super Admin criar notificacoes para qualquer usuario:
```text
CREATE POLICY "super_admin_insert_notificacao" ON notificacoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'super_admin'
    )
  );
```
E ajustar a policy existente para ser apenas SELECT/UPDATE (o usuario le e marca como lida suas proprias notificacoes).

### GAP 3 - MEDIO: Filtro de Empresa faltante na EvolucaoPage

**Problema:** O PRD (RF-004) especifica 4 filtros: Empresa, Tipo, Status, Busca. A implementacao atual da `EvolucaoPage` tem apenas 3 filtros (Tipo, Status, Busca). O filtro de Empresa (select com lista de tenants) esta faltando.

**Impacto:** Super Admin nao consegue filtrar feedbacks por empresa/organizacao, dificultando a gestao quando ha muitos tenants.

**Correcao:** Adicionar select de Empresa na barra de filtros da `EvolucaoPage.tsx`. Buscar lista de organizacoes com `supabase.from('organizacoes_saas').select('id, nome')` e passar `empresa_id` para o hook `useFeedbacksAdmin`.

### GAP 4 - MEDIO: Popover nao tem dropdown de tipo conforme PRD

**Problema:** O PRD (RF-002) especifica um dropdown select para escolha do tipo com icones coloridos. A implementacao usa botoes lado a lado (toggle buttons). Embora funcional, diverge do layout especificado e do padrao do Design System para selects.

**Impacto:** Divergencia visual do PRD. Funcionalidade ok, mas UX nao segue o design especificado.

**Correcao:** Manter os toggle buttons (a UX e melhor que um dropdown para apenas 3 opcoes), mas ajustar para que o icone do tipo Bug use `Settings2` (conforme PRD especifica "Settings2" e nao "Bug") e garantir que as cores correspondam exatamente ao PRD (vermelho #EF4444, roxo #7C3AED, azul #3B82F6).

### GAP 5 - BAIXO: Modal de detalhes nao atualiza apos resolucao

**Problema:** Quando o Super Admin clica "Marcar como Resolvido", o modal fecha imediatamente (`onClose()`). O PRD (RF-005) especifica que o modal deve permanecer aberto e atualizar para exibir as informacoes de resolucao (quem resolveu, quando).

**Impacto:** Super Admin nao ve confirmacao visual dentro do modal de que a resolucao foi salva. Precisa reabrir o item na tabela para confirmar.

**Correcao:** No `FeedbackDetalhesModal`, apos resolver com sucesso, atualizar o estado local do feedback para refletir o novo status ao inves de fechar o modal. Invalidar a query e recarregar os dados do feedback.

### GAP 6 - BAIXO: Falta "Marcar todas como lidas" fechar o dropdown

**Problema:** O PRD (RF-007) especifica que ao clicar "Marcar todas como lidas", o dropdown deve fechar. Atualmente o dropdown permanece aberto.

**Correcao:** No `NotificacoesSino.tsx`, adicionar `setOpen(false)` apos chamar `marcarTodasLidas.mutate()`.

### GAP 7 - BAIXO: Falta Supabase Realtime para notificacoes

**Problema:** O PRD (RF-007) especifica que o badge de notificacoes deve atualizar em tempo real via Supabase Realtime. A implementacao atual usa apenas polling a cada 30 segundos.

**Impacto:** Atraso de ate 30 segundos para o usuario ver que tem uma nova notificacao.

**Correcao:** Adicionar subscription Realtime no hook `useContagemNaoLidas` para a tabela `notificacoes` com filtro `usuario_id=eq.{userId}`. Ao receber evento INSERT, invalidar a query de contagem.

---

## Secao Tecnica

### Migration SQL (GAP 1 + GAP 2)

Criar migration unica com as seguintes operacoes:

```text
-- GAP 1: Policy de UPDATE para feedbacks (Super Admin resolver)
CREATE POLICY "super_admin_update_feedback" ON public.feedbacks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- GAP 2: Ajustar policies de notificacoes
-- Dropar a policy existente (FOR ALL) que bloqueia INSERT do Super Admin
DROP POLICY IF EXISTS "usuario_proprias_notificacoes" ON public.notificacoes;

-- Recriar como SELECT + UPDATE apenas para o usuario dono
CREATE POLICY "usuario_ler_notificacoes" ON public.notificacoes
  FOR SELECT
  USING (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "usuario_atualizar_notificacoes" ON public.notificacoes
  FOR UPDATE
  USING (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid()
    )
  );

-- INSERT: usuario pode criar para si mesmo OU super_admin pode criar para qualquer um
CREATE POLICY "inserir_notificacao" ON public.notificacoes
  FOR INSERT
  WITH CHECK (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'super_admin'
    )
  );
```

### Alteracoes em Arquivos

**1. `src/modules/admin/pages/EvolucaoPage.tsx` (GAP 3)**
- Adicionar estado `empresa` para filtro de empresa
- Adicionar query para buscar lista de organizacoes (`organizacoes_saas`)
- Adicionar select de Empresa na barra de filtros
- Passar `empresa_id` ao hook `useFeedbacksAdmin`

**2. `src/modules/feedback/components/FeedbackPopover.tsx` (GAP 4)**
- Trocar icone `Bug` por `Settings2` no tipo "bug" (conforme PRD)
- Ajustar cores dos icones para corresponder exatamente ao PRD

**3. `src/modules/admin/components/FeedbackDetalhesModal.tsx` (GAP 5)**
- Remover `onClose()` do handler de sucesso
- Adicionar estado local mutavel para o feedback
- Apos `resolver.mutateAsync`, atualizar estado local com novo status/data/resolvido_por
- Adicionar prop `onResolved` para notificar o parent que a lista precisa ser atualizada

**4. `src/modules/feedback/components/NotificacoesSino.tsx` (GAP 6)**
- Adicionar `setOpen(false)` no onClick de "Marcar todas como lidas"

**5. `src/modules/feedback/hooks/useNotificacoes.ts` (GAP 7)**
- Adicionar `useEffect` com `supabase.channel('notificacoes-realtime')` para ouvir INSERTs na tabela `notificacoes`
- Ao receber evento, chamar `queryClient.invalidateQueries(['notificacoes'])`
- Cleanup do channel no return do useEffect

### Sequencia de Implementacao

1. Migration SQL (GAP 1 + GAP 2) - sem isso nada funciona
2. `FeedbackDetalhesModal.tsx` (GAP 5) - comportamento pos-resolucao
3. `EvolucaoPage.tsx` (GAP 3) - filtro de empresa
4. `FeedbackPopover.tsx` (GAP 4) - icones corretos
5. `NotificacoesSino.tsx` (GAP 6) - fechar dropdown
6. `useNotificacoes.ts` (GAP 7) - Supabase Realtime
