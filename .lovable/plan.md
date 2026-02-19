
# Corrigir dropdown do usuario que nao fecha ao clicar fora

## Problema
O overlay transparente que captura cliques fora do menu esta renderizado **dentro** do header (`z-[100]`). Isso cria um stacking context que impede o overlay de cobrir a area abaixo do header (conteudo principal, toolbar, etc). O clique fora so funciona se for dentro do proprio header.

O mesmo bug existe em 3 arquivos:
- `src/modules/app/layouts/AppLayout.tsx`
- `src/modules/admin/layouts/AdminLayout.tsx`
- `src/modules/configuracoes/components/layout/ConfigHeader.tsx`

## Solucao
Substituir o dropdown manual (useState + overlay) pelo componente `DropdownMenu` do Radix UI, que ja existe no projeto e resolve automaticamente:
- Posicionamento via portal (fora do stacking context)
- Fecha ao clicar em qualquer lugar fora
- Acessibilidade (keyboard navigation, ESC para fechar)
- Animacoes de entrada/saida

O projeto ja usa esse padrao no `OrganizacaoActionsMenu.tsx`.

## Alteracoes

### Arquivo 1: `src/modules/app/layouts/AppLayout.tsx`
- Remover estado `userMenuOpen` e `setUserMenuOpen`
- Importar `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel` de `@/components/ui/dropdown-menu`
- Substituir o bloco do user menu (linhas ~296-353) por:

```text
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button> ... avatar + nome + chevron ... </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>
      ... nome, email, badge de role ...
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick => navigate('/perfil')>
      Meu Perfil
    </DropdownMenuItem>
    <DropdownMenuItem onClick => handleLogout>
      Sair
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Arquivo 2: `src/modules/admin/layouts/AdminLayout.tsx`
- Mesma substituicao: remover estado manual, usar `DropdownMenu` do Radix

### Arquivo 3: `src/modules/configuracoes/components/layout/ConfigHeader.tsx`
- Mesma substituicao: remover estado manual, usar `DropdownMenu` do Radix

## Resultado esperado
- O menu fecha corretamente ao clicar em qualquer area fora dele
- Comportamento consistente em todos os layouts (App, Admin, Configuracoes)
- Suporte a teclado (ESC fecha, setas navegam)
