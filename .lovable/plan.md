# Plano: Sistema de Cortesia + Bloqueio - IMPLEMENTADO ✅

## Implementação Concluída

### Parte 1: Wizard com Toggle de Cortesia ✅
- **`organizacao.schema.ts`**: Adicionados campos `cortesia` e `cortesia_motivo` com validação
- **`Step2Expectativas.tsx`**: Toggle de cortesia visível apenas para planos pagos, com campo de motivo obrigatório

### Parte 2: Sistema de Bloqueio ✅
- **`admin.api.ts`**: Função `revogarCortesia()` que muda status da assinatura para 'bloqueada'
- **`OrganizacaoConfigTab.tsx`**: Botão "Revogar Cortesia" com modal de confirmação
- **`BlockedPage.tsx`**: Nova página para usuários bloqueados
- **`useBlockedRedirect.tsx`**: Hook que redireciona usuários de orgs bloqueadas
- **`AuthProvider.tsx`**: Busca status da organização e assinatura no login

### Fluxo Completo
1. Super Admin cria org com cortesia → Toggle + motivo no wizard
2. Super Admin visualiza cortesia → Badge + motivo na config
3. Super Admin revoga cortesia → Status vira "bloqueada"
4. Usuário tenta acessar → Redirecionado para `/bloqueado`
5. Usuário paga → Status volta "ativa"
