
## Remover Formulario Lead Ads (ao inves de apenas Desativar)

### Problema
Atualmente o card do formulario Lead Ads so oferece "Desativar", mas o usuario quer poder **remover** a configuracao completamente.

### Alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/modules/configuracoes/services/configuracoes.api.ts` | Adicionar metodo `removerFormulario(id)` no `metaAdsApi` que faz soft delete (seta `deletado_em`) |
| `src/modules/configuracoes/components/integracoes/meta/LeadAdsPanel.tsx` | Trocar o botao "Desativar" por "Remover" com confirmacao e cor vermelha. Remover logica de toggle ativo/inativo |

### Detalhes tecnicos

**1. API - `metaAdsApi.removerFormulario`**
- Faz `update({ deletado_em: new Date().toISOString() }).eq('id', id)` na tabela `formularios_lead_ads`
- A listagem ja filtra por `.is('deletado_em', null)`, entao o formulario desaparece automaticamente

**2. LeadAdsPanel - Botao Remover**
- Substituir o botao "Desativar/Ativar" por "Remover"
- Estilo em vermelho (`text-destructive`) para indicar acao destrutiva
- Adicionar confirmacao via `window.confirm()` antes de executar
- Mutation chama `metaAdsApi.removerFormulario(id)`
- Apos sucesso, invalidar query e exibir toast de sucesso
