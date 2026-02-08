
# Plano: Implementacao Frontend do Modulo de Feedback (PRD-15)

## Resumo

O backend do modulo de Feedback ja esta totalmente implementado (rotas Express, service, schemas Zod). As tabelas `feedbacks` e `notificacoes` existem no banco com RLS configurado. O frontend precisa ser construido do zero com 3 partes principais:

1. **Botao Flutuante + Popover** (Admin/Member) - visible em todas as paginas do CRM
2. **Pagina /admin/evolucao** (Super Admin) - lista, filtros, detalhes e resolucao
3. **Sino de Notificacoes** (Admin/Member) - badge no header + dropdown

## Arquitetura de Acesso ao Dados

O frontend usara **Supabase direto** (mesmo padrao do `admin.api.ts` e `conversas.api.ts`), sem depender do backend Express. As RLS policies ja suportam isso:
- `feedbacks`: INSERT via `organizacao_id = get_user_tenant_id()`, SELECT via `usuario_id` ou `role = super_admin`
- `notificacoes`: ALL via `usuario_id` com `auth.uid()`

---

## Componentes a Criar

### Parte 1: Botao Flutuante + Popover (Admin/Member)

**Arquivo:** `src/modules/feedback/components/FeedbackButton.tsx`
- Botao circular fixo, 56x56px, canto inferior direito (24px margem)
- Background: gradiente `linear-gradient(135deg, #7C3AED, #3B82F6)`
- Icone: `Lightbulb` (Lucide), branco, 24px
- Z-index: 9999 (conforme PRD)
- Estados: hover (scale 1.1), active (scale 0.95), focus (ring azul)
- Visivel apenas para `admin` e `member` (verificacao via `useAuth`)
- Ao clicar, abre/fecha o popover

**Arquivo:** `src/modules/feedback/components/FeedbackPopover.tsx`
- Largura: 400px, border-radius 12px
- Header com gradiente roxo/azul, icone lampada, titulo "Nos ajude a melhorar"
- Dropdown de tipo com 3 opcoes: Bug (vermelho), Sugestao (roxo), Duvida (azul)
- Textarea com contador de caracteres (min 10, max 10.000)
- Botoes Cancelar (outline) e Enviar Feedback (primary, desabilitado se invalido)
- Loading spinner durante envio
- Toast de sucesso/erro via sonner
- Fecha e limpa apos envio

**Integracao:** Adicionado no `AppLayout.tsx` (antes do fechamento de `</div>` do container principal), renderizado condicionalmente para `admin` e `member`

### Parte 2: Pagina /admin/evolucao (Super Admin)

**Arquivo:** `src/modules/admin/pages/EvolucaoPage.tsx`
- Titulo: "Evolucao do Produto"
- Barra de filtros: Empresa (select), Tipo (select), Status (select), Busca (input com debounce 300ms)
- Tabela com colunas: Empresa, Usuario, Tipo (badge colorido), Data (DD/MM HH:mm), Status (badge)
- Paginacao com 10 itens por pagina
- Click na linha abre modal de detalhes

**Arquivo:** `src/modules/admin/components/FeedbackDetalhesModal.tsx`
- Modal com campos readonly: Empresa, Usuario (nome + email + role), Tipo (badge), Data, Descricao (scrollable)
- Se aberto: botao "Marcar como Resolvido"
- Se resolvido: exibe info de resolucao (quem, quando)
- Ao resolver: toast de sucesso, invalida query

### Parte 3: Sino de Notificacoes (Admin/Member)

**Arquivo:** `src/modules/feedback/components/NotificacoesSino.tsx`
- Icone Bell no header, badge vermelho com contagem (9+ se > 9)
- Dropdown com ultimas 5 notificacoes
- Cada item: icone (CheckCircle verde para feedback_resolvido), titulo, mensagem truncada, data relativa
- Indicador de nao lida (bolinha azul)
- Botao "Marcar todas como lidas"
- Click em notificacao marca como lida

**Integracao:** Adicionado no header do `AppLayout.tsx`, entre a navegacao e o menu de usuario

---

## Servicos e Hooks

### Servico de Feedback
**Arquivo:** `src/modules/feedback/services/feedback.api.ts`
- `criarFeedback(tipo, descricao)` - Insert no Supabase com org do usuario logado
- `listarFeedbacksAdmin(filtros)` - Query com joins para organizacao e usuario (Super Admin)
- `resolverFeedback(id)` - Update status + criar notificacao + audit_log

### Servico de Notificacoes
**Arquivo:** `src/modules/feedback/services/notificacoes.api.ts`
- `listarNotificacoes(limit)` - Select com order by criado_em DESC
- `contarNaoLidas()` - Count com lida = false
- `marcarComoLida(id)` - Update lida = true, lida_em = now
- `marcarTodasComoLidas()` - Update all do usuario

### Hooks
**Arquivo:** `src/modules/feedback/hooks/useFeedback.ts`
- `useCriarFeedback()` - mutation com toast
- `useFeedbacksAdmin(filtros)` - useQuery para lista
- `useResolverFeedback()` - mutation com invalidacao

**Arquivo:** `src/modules/feedback/hooks/useNotificacoes.ts`
- `useNotificacoes(limit)` - useQuery
- `useContagemNaoLidas()` - useQuery com refetch interval (30s)
- `useMarcarLida()` - mutation
- `useMarcarTodasLidas()` - mutation

---

## Secao Tecnica

### Estrutura de Arquivos

```text
src/modules/feedback/
  components/
    FeedbackButton.tsx       -- Botao flutuante (FAB)
    FeedbackPopover.tsx      -- Formulario de envio
    NotificacoesSino.tsx     -- Sino + dropdown no header
  hooks/
    useFeedback.ts           -- Hooks de feedback
    useNotificacoes.ts       -- Hooks de notificacoes
  services/
    feedback.api.ts          -- API Supabase (feedbacks)
    notificacoes.api.ts      -- API Supabase (notificacoes)
  index.ts                   -- Barrel exports

src/modules/admin/
  pages/
    EvolucaoPage.tsx         -- Pagina /admin/evolucao (nova)
  components/
    FeedbackDetalhesModal.tsx -- Modal de detalhes (novo)
```

### Queries Supabase (feedback.api.ts)

**Criar Feedback (Admin/Member):**
```text
supabase.from('feedbacks').insert({
  organizacao_id,  // vem do user.organizacao_id
  usuario_id,      // vem do user.id
  tipo,
  descricao,
  status: 'aberto'
}).select('id, tipo, descricao, status, criado_em').single()
```

**Listar Feedbacks (Super Admin):**
```text
supabase.from('feedbacks').select(`
  *,
  organizacao:organizacoes_saas!feedbacks_organizacao_id_fkey(id, nome),
  usuario:usuarios!feedbacks_usuario_id_fkey(id, nome, email, role),
  resolvido_por_usuario:usuarios!feedbacks_resolvido_por_fkey(id, nome)
`, { count: 'exact' })
.is('deletado_em', null)
.order('criado_em', { ascending: false })
// + filtros dinamicos
.range(offset, offset + limit - 1)
```

**Resolver Feedback (Super Admin):**
```text
// 1. Update status
supabase.from('feedbacks').update({
  status: 'resolvido',
  resolvido_em: new Date().toISOString(),
  resolvido_por: userId,
  atualizado_em: new Date().toISOString()
}).eq('id', feedbackId)

// 2. Criar notificacao para usuario original
supabase.from('notificacoes').insert({
  usuario_id: feedback.usuario_id,
  tipo: 'feedback_resolvido',
  titulo: 'Seu feedback foi resolvido',
  mensagem: descricaoResumida,
  referencia_tipo: 'feedback',
  referencia_id: feedbackId
})
```

### Queries Supabase (notificacoes.api.ts)

**Listar:**
```text
supabase.from('notificacoes')
  .select('*')
  .eq('usuario_id', userId)
  .order('criado_em', { ascending: false })
  .limit(5)
```

**Contar nao lidas:**
```text
supabase.from('notificacoes')
  .select('id', { count: 'exact', head: true })
  .eq('usuario_id', userId)
  .eq('lida', false)
```

**Marcar como lida:**
```text
supabase.from('notificacoes')
  .update({ lida: true, lida_em: new Date().toISOString() })
  .eq('id', notificacaoId)
```

### Alteracoes em Arquivos Existentes

1. **`src/App.tsx`** - Adicionar rota `/admin/evolucao` com `<EvolucaoPage />`
2. **`src/modules/admin/index.ts`** - Exportar `EvolucaoPage`
3. **`src/modules/admin/layouts/AdminLayout.tsx`** - Adicionar item "Evolucao" no menu (icone Lightbulb)
4. **`src/modules/app/layouts/AppLayout.tsx`** - Adicionar `<NotificacoesSino />` no header + `<FeedbackButton />` no body
5. **`src/modules/admin/layouts/AdminLayout.tsx`** - Atualizar `getPageTitle` para incluir "Evolucao"

### Especificacoes de Cores (Design System)

**Badges de Tipo (PRD-15):**
| Tipo | Background | Text |
|------|------------|------|
| bug | #FEE2E2 | #991B1B |
| sugestao | #EDE9FE | #5B21B6 |
| duvida | #DBEAFE | #1E40AF |

**Badges de Status:**
| Status | Background | Text |
|--------|------------|------|
| aberto | #FEF3C7 | #92400E |
| resolvido | #D1FAE5 | #065F46 |

**Botao Flutuante:**
| Propriedade | Valor |
|-------------|-------|
| Tamanho | 56x56px (w-14 h-14) |
| Background | gradient roxo-azul |
| Shadow | shadow-lg (0 4px 12px) |
| Hover | scale-110, shadow-xl |
| Z-index | z-[9999] |

### Sequencia de Implementacao

1. Servicos: `feedback.api.ts` + `notificacoes.api.ts`
2. Hooks: `useFeedback.ts` + `useNotificacoes.ts`
3. Componentes Admin: `EvolucaoPage.tsx` + `FeedbackDetalhesModal.tsx`
4. Integracao Admin: rota + menu + exports
5. Componentes CRM: `FeedbackButton.tsx` + `FeedbackPopover.tsx`
6. Componente Notificacoes: `NotificacoesSino.tsx`
7. Integracao CRM: AppLayout (botao + sino)
