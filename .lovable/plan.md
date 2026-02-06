
# Adicionar "Equipes" na Sidebar de Configuracoes

## Problema Identificado
A pagina de gestao de equipes (`EquipesPage`) ja existe e esta funcional, com rota configurada em `/app/configuracoes/equipes`. Porem, o item **nao aparece no menu lateral** de navegacao, tornando a funcionalidade inacessivel para o usuario.

Isso impacta diretamente o fluxo de Metas por Equipe, pois o seletor "Selecione a equipe..." fica vazio sem equipes cadastradas.

## Solucao

Adicionar o item "Equipes" no grupo "EQUIPE" da sidebar, entre "Membros" e "Perfis", com o icone `Users` (consistente com o padrao do modulo).

## Alteracao Necessaria

**Arquivo:** `src/modules/configuracoes/components/layout/ConfigSidebar.tsx`

- Adicionar no array `items` do grupo `equipe` (linha 51-55) o novo item:
  ```
  { label: 'Equipes', path: '/app/configuracoes/equipes', icon: Users }
  ```
- Posicionar entre "Membros" e "Perfis" para manter a ordem logica: Membros > Equipes > Perfis > Metas

**Arquivo:** `src/modules/configuracoes/components/layout/ConfigMobileDrawer.tsx`

- Verificar se o drawer mobile tambem utiliza o array `sidebarGroups` exportado. Se sim, a alteracao e automatica. Se nao, adicionar o mesmo item manualmente.

## Resultado Esperado

O menu lateral exibira:

```text
EQUIPE
  Membros
  Equipes    <-- novo
  Perfis
  Metas
```

O usuario podera acessar a pagina de Equipes, criar equipes com nome/descricao/cor, e entao selecionar essas equipes ao criar Metas no nivel "Equipe".
