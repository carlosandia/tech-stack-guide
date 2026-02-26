
# Dark Mode - Toggle de Tema no Menu do Usuario

## Objetivo

Adicionar alternancia entre tema claro (atual) e escuro no dropdown do usuario (canto superior direito), com persistencia em `localStorage` e transicao suave.

## Analise do Estado Atual

- `tailwind.config.ts` ja possui `darkMode: ['class']` -- pronto para dark mode via classe CSS
- `index.css` ja possui bloco `.dark { ... }` com variaveis, porem com valores genericos do shadcn que precisam refinamento para harmonia visual com a identidade do Renove
- Existem cores **hardcoded** no layout (`bg-white/80`, `bg-gray-50/50`, `border-gray-200/60`) que nao respondem ao dark mode e precisam ser convertidas para tokens semanticos
- O design system (`docs/designsystem.md`) documenta variaveis dark porem nenhuma implementacao existe

## Alteracoes

### 1. Criar hook `useTheme` com persistencia

Novo arquivo `src/hooks/useTheme.ts`:
- Le preferencia de `localStorage` (chave `theme`)
- Fallback para `system` (respeita `prefers-color-scheme`)
- Aplica/remove classe `dark` no `<html>`
- Opcoes: `light`, `dark`, `system`

### 2. Criar `ThemeProvider` no root

Novo arquivo `src/providers/ThemeProvider.tsx`:
- Context provider que inicializa o tema antes do primeiro render (evita flash)
- Exporta `useTheme()` para consumo em qualquer componente

### 3. Refinar variaveis CSS do dark mode

Atualizar `src/index.css` bloco `.dark`:
- Ajustar `--primary` para manter o azul Renove visivel no fundo escuro (nao inverter para branco)
- Adicionar `--content-bg` para o dark
- Ajustar `--success`, `--warning` e `--success-muted`, `--warning-muted` para dark
- Garantir contraste WCAG AA em todos os pares foreground/background

Paleta dark proposta (harmonizada com identidade Renove):

```text
--background:          222 47% 11%    (fundo principal escuro)
--foreground:          210 40% 98%    (texto claro)
--card:                223 47% 13%    (cards levemente elevados)
--card-foreground:     210 40% 98%
--popover:             223 47% 13%
--muted:               217 33% 17%   (backgrounds neutros)
--muted-foreground:    215 20% 65%   (texto secundario)
--primary:             220 72% 58%   (MESMO azul do light!)
--primary-foreground:  0 0% 100%
--border:              217 33% 20%
--input:               217 33% 20%
--content-bg:          222 47% 9%    (area de conteudo)
--destructive:         0 63% 31%
--success:             142 71% 35%
--success-muted:       142 40% 18%
--warning:             38 92% 40%
--warning-muted:       38 40% 18%
```

### 4. Corrigir cores hardcoded no AppLayout

Em `src/modules/app/layouts/AppLayout.tsx`:
- `bg-white/80` → `bg-background/80`
- `border-gray-200/60` → `border-border/60`
- `bg-gray-50/50` → `bg-muted/50`

Isso garante que header e toolbar respondam ao tema.

### 5. Adicionar toggle no User Dropdown Menu

No dropdown do usuario (AppLayout, linha ~586-594), adicionar item com icone `Sun`/`Moon`:
- Exibe "Tema Escuro" com um `Switch` toggle inline
- Posicionado entre "Meu Perfil" e "Sair"
- Ao clicar, alterna entre light e dark

### 6. Adicionar toggle no menu mobile (drawer)

No drawer mobile, adicionar o mesmo toggle proximo ao botao "Sair" na parte inferior.

### 7. Registrar no main.tsx

Envolver a app com `ThemeProvider` logo apos `BrowserRouter` para garantir que o tema seja aplicado antes de qualquer render visual.

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useTheme.ts` | Criar |
| `src/providers/ThemeProvider.tsx` | Criar |
| `src/index.css` | Editar (refinar `.dark`) |
| `src/modules/app/layouts/AppLayout.tsx` | Editar (toggle + fix hardcoded) |
| `src/main.tsx` | Editar (adicionar ThemeProvider) |

## Resultado

O usuario podera alternar entre tema claro e escuro pelo menu do avatar. A preferencia persiste entre sessoes. O dark mode mantem a identidade visual do Renove (azul primario preservado) com contraste adequado em todos os componentes.
