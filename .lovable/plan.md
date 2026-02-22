
## Correção: Scroll duplo no LigacaoModal

### Problema
No mobile/tablet, o modal de ligação apresenta 2 barras de scroll:
1. O container externo tem `h-full overflow-y-auto`
2. O painel de informações (coluna direita) tem `md:overflow-y-auto` que ativa em telas >= 768px

Quando o dispositivo atinge o breakpoint `md`, ambos scrollam, criando a experiência ruim mostrada no screenshot.

### Solução

**Arquivo**: `src/modules/negocios/components/modals/LigacaoModal.tsx`

**Estratégia**: Usar layout flex com height constraints corretos para que apenas o painel de informações role internamente no desktop (2 colunas), e no mobile (1 coluna) apenas o container externo role.

**Alterações**:

1. **Container externo (linha ~1000)**: No mobile manter `h-full overflow-y-auto`. No desktop (`md:`), usar `md:h-auto md:max-h-[90vh] md:overflow-hidden` para que o container não role, delegando o scroll para o painel interno.

2. **Grid interno (linha ~1003)**: Adicionar `md:max-h-[90vh]` e `md:overflow-hidden` para constrair a altura no desktop.

3. **Coluna esquerda (linha ~1005)**: Adicionar `md:overflow-y-auto` para permitir scroll se necessário no desktop.

4. **Painel de informações (linha ~1182)**: Trocar `flex-shrink-0 md:overflow-y-auto` por `md:flex-1 md:min-h-0 md:overflow-y-auto`. No mobile, remover `flex-shrink-0` para que o conteúdo flua naturalmente no scroll único do container pai.

Resultado:
- **Mobile (< md)**: Uma única coluna, um único scroll no container externo
- **Desktop (>= md)**: Duas colunas lado a lado, cada uma com scroll independente se necessário, container externo sem scroll
