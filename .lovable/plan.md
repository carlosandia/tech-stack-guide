
# Implementacao Completa: Impersonacao de Organizacao

## Visao Geral

A funcionalidade de impersonacao permite que o Super Admin "assuma" temporariamente a identidade de uma organizacao para visualizar o CRM exatamente como o administrador daquele tenant ve. Hoje o sistema tem apenas um stub (alert) na lista e uma implementacao parcial na pagina de detalhes que usa `sessionStorage` + `window.open`, mas nao funciona de fato -- o dashboard aberto continua usando os dados do super_admin.

## Abordagem Escolhida: Edge Function com Token Temporario

Baseado nas melhores praticas de mercado (N8N, Intercom, Stripe, referencia catjam.fi/supabase-admin-impersonation), a abordagem mais segura e auditavel e:

1. **Edge Function server-side** gera um token de sessao temporario para o admin do tenant alvo
2. O Super Admin recebe esse token e abre uma nova aba autenticado como o admin do tenant
3. Um **banner fixo** indica visualmente o modo impersonacao
4. A sessao de impersonacao tem **tempo limite** (1 hora)
5. Tudo e registrado no **audit_log**

## Plano de Implementacao

### 1. Tabela: `sessoes_impersonacao`

Criar tabela para rastrear sessoes ativas de impersonacao com TTL e auditoria:

```
sessoes_impersonacao:
- id (uuid PK)
- super_admin_id (uuid FK -> usuarios.id) -- quem esta impersonando
- organizacao_id (uuid FK -> organizacoes_saas.id) -- org alvo
- admin_alvo_id (uuid FK -> usuarios.id) -- admin do tenant que sera personificado
- motivo (text NOT NULL) -- justificativa obrigatoria
- token_hash (text NOT NULL) -- hash do token gerado (seguranca)
- ativo (boolean DEFAULT true)
- expira_em (timestamptz NOT NULL) -- TTL de 1h
- encerrado_em (timestamptz) -- quando foi encerrado manualmente
- ip_origem (text)
- user_agent (text)
- criado_em (timestamptz DEFAULT now())
```

Indices: `organizacao_id`, `super_admin_id`, `ativo + expira_em`.

RLS: Acesso exclusivo via `service_role` (Edge Functions). Nenhum SELECT direto para usuarios.

### 2. Edge Function: `impersonar-organizacao`

Nova Edge Function que:

**POST /impersonar-organizacao** (iniciar):
1. Valida que o chamador e `super_admin` (via JWT)
2. Busca o admin ativo da organizacao alvo
3. Gera um magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email: admin.email })`
4. Registra na tabela `sessoes_impersonacao` com TTL de 1h
5. Registra no `audit_log`
6. Retorna a URL do magic link para o frontend abrir em nova aba

**POST /impersonar-organizacao** (encerrar):
1. Marca a sessao como `ativo = false` e `encerrado_em = now()`
2. Registra no `audit_log`

### 3. Frontend: Fluxo de Impersonacao

**OrganizacoesPage.tsx** e **OrganizacaoDetalhesPage.tsx**:
- Substituir o `alert()` e a logica de `sessionStorage` por chamada real a Edge Function
- Modal de confirmacao (Dialog do shadcn) com campo de motivo obrigatorio (minimo 5 caracteres)
- Ao confirmar, chamar a Edge Function, receber a URL e abrir em `window.open('url', '_blank')`

**ImpersonationBanner.tsx** (novo componente):
- Banner fixo no topo da tela (z-50, bg-amber-500) exibido quando ha impersonacao ativa
- Texto: "Voce esta visualizando como [Nome da Org] | [Tempo restante] | Botao Encerrar"
- Detectado via `sessionStorage` ou via consulta a `sessoes_impersonacao`
- Botao "Encerrar" faz logout e redireciona para o painel admin

**Integracao no AppLayout**:
- Verificar se a sessao atual e uma impersonacao (flag no sessionStorage setado antes do redirect)
- Se sim, renderizar o `ImpersonationBanner` acima do conteudo

### 4. Seguranca e Auditoria

- **Magic Link com TTL**: O token gerado expira em 1 hora
- **Audit Log completo**: Registra inicio, acoes durante a sessao, e encerramento
- **Sem compartilhamento de senha**: Usa generateLink do Supabase Admin API
- **Indicador visual obrigatorio**: O banner nao pode ser fechado, apenas encerrado
- **Validacao server-side**: A Edge Function valida role super_admin via JWT antes de gerar o link

### 5. Fluxo Completo do Usuario

```text
1. Super Admin acessa Organizacoes > clica "Impersonar" no menu de acoes
2. Modal abre pedindo motivo obrigatorio
3. Super Admin preenche motivo e confirma
4. Edge Function valida, gera magic link, registra audit
5. Nova aba abre com o CRM logado como admin do tenant
6. Banner amarelo fixo no topo indica impersonacao
7. Super Admin navega normalmente vendo o que o cliente ve
8. Ao clicar "Encerrar", faz logout e volta ao painel admin
```

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---|---|
| Migracao SQL | **CRIAR** tabela `sessoes_impersonacao` |
| `supabase/functions/impersonar-organizacao/index.ts` | **CRIAR** Edge Function para iniciar/encerrar impersonacao |
| `src/modules/admin/components/ImpersonarModal.tsx` | **CRIAR** Modal de confirmacao com campo motivo |
| `src/components/ImpersonationBanner.tsx` | **CRIAR** Banner de indicacao visual |
| `src/modules/admin/services/admin.api.ts` | **MODIFICAR** funcao `impersonarOrganizacao` para chamar Edge Function |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | **MODIFICAR** handler do botao impersonar |
| `src/modules/admin/pages/OrganizacaoDetalhesPage.tsx` | **MODIFICAR** handler do botao impersonar |
| `src/App.tsx` ou `AppLayout` | **MODIFICAR** adicionar renderizacao do ImpersonationBanner |

## Consideracoes Tecnicas

- **generateLink vs signInWithPassword**: Usar `generateLink` do admin API e a forma mais segura. Nao requer saber a senha do usuario.
- **sessionStorage para deteccao**: Antes de abrir a nova aba, o frontend salva um flag no sessionStorage. Quando o magic link autentica, o AppLayout detecta esse flag e exibe o banner.
- **RLS transparente**: Como o super admin esta autenticado como o admin real do tenant, todas as policies de RLS funcionam automaticamente -- ele ve exatamente o que o cliente ve.
- **Sem cache de role**: O banner verifica periodicamente se a sessao ainda e valida (polling leve a cada 5 min).
