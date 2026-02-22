
## Correções Identificadas

### 1. Deploy GitHub Actions (Erro SSH)

O deploy falha no step **"Add known host"** com o erro:
```
ssh: connect to host *** port 22: Connection timed out
Error: Process completed with exit code 255
```

**Causa**: O servidor de produção nao esta acessivel via SSH no momento do deploy. Isso nao e um problema de codigo -- e infraestrutura.

**Acoes necessarias (por voce, no servidor)**:
- Verificar se o servidor esta online
- Verificar se o firewall permite conexoes SSH (porta 22) de IPs externos
- Os IPs do GitHub Actions sao dinamicos, entao o ideal e liberar a porta 22 para qualquer IP ou usar uma faixa de IPs do GitHub
- Tentar re-executar o workflow manualmente depois de confirmar que o servidor esta acessivel

**Nenhuma alteracao de codigo necessaria para este item.**

---

### 2. AgendaQuickPopover no Mobile -- Fundo escuro e centralizacao

**Problema**: No mobile, ao clicar no icone de agendar reuniao no card da oportunidade, o Popover aparece sem fundo escuro e sem centralizacao, ficando confuso e misturado com o conteudo de fundo.

**Solucao**: Converter o componente para usar um modal/overlay no mobile (tela < sm), mantendo o Popover no desktop. O mesmo padrao ja usado no `ComposeEmailModal` e `WhatsAppConversaModal`.

**Arquivo**: `src/modules/negocios/components/kanban/AgendaQuickPopover.tsx`

**Alteracoes**:
1. Detectar se e mobile usando `window.innerWidth < 640` (ou media query)
2. No mobile: renderizar como overlay `fixed inset-0` com `bg-foreground/30` de backdrop e conteudo centralizado (`items-center justify-center`)
3. No desktop (sm+): manter o `Popover` atual do Radix sem alteracoes

**Estrutura no mobile**:
```
<div fixed inset-0 bg-foreground/30 z-500>  <!-- backdrop -->
  <div fixed inset-x-4 centered bg-background rounded-xl>  <!-- conteudo -->
    ... formulario/info da reuniao (mesmo conteudo atual) ...
  </div>
</div>
```

**Comportamento esperado**:
- Mobile: fundo escurecido, popover centralizado na tela, toque no backdrop fecha
- Desktop: comportamento atual preservado (Popover flutuante posicionado ao lado do botao)
