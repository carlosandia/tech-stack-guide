

# Plano: GAP 9 — Campos Customizados Dinamicos nas Acoes de Automacao

## Status dos GAPs

- **GAP 5 (Validacao com branching):** JA CORRIGIDO. O `flowConverter.ts` faz traversal por edges com `match_acoes`/`nenhuma_acoes`, e as Edge Functions possuem o case `validacao` com `avaliarValidacao`.
- **GAP 9 (Campos customizados dinamicos):** PENDENTE. Os cases `atualizar_campo_contato` e `atualizar_campo_oportunidade` no `AcaoConfig.tsx` usam inputs de texto livre para "Nome do campo" em vez de carregar campos reais do banco.

## O que sera feito

### Arquivo: `src/modules/automacoes/components/panels/AcaoConfig.tsx`

**Alteracao no case `atualizar_campo_contato` / `atualizar_campo_oportunidade` (linhas 218-231):**

1. Importar o hook `useCampos` de `@/modules/configuracoes/hooks/useCampos`
2. Substituir o input de texto livre "Nome do campo" por um `<select>` que carrega os campos customizados da entidade correspondente:
   - `atualizar_campo_contato` carrega `useCampos('pessoa')`
   - `atualizar_campo_oportunidade` carrega `useCampos('oportunidade')`
3. Cada opcao do select exibe `campo.nome` e salva `campo.slug` no `config.campo`
4. Manter o input de "Novo valor" com suporte a variaveis dinamicas (adicionar `VariavelInserter`)

### Detalhes Tecnicos

- O hook `useCampos` ja existe em `src/modules/configuracoes/hooks/useCampos.ts` e retorna `{ campos: CampoCustomizado[], total: number }`
- O `CamposContextuais` e uma funcao interna (nao componente top-level), entao precisaremos chamar o hook no componente pai (`AcaoConfig`) e passar os dados via props, ou extrair o case para um sub-componente
- Abordagem: Criar um sub-componente `CamposDinamicos` que usa o hook internamente, respeitando as regras de hooks do React

### Resultado esperado

Em vez de digitar manualmente o nome do campo, o usuario vera um dropdown com todos os campos cadastrados (sistema + customizados) para a entidade correta, com UX consistente com o resto do sistema.

