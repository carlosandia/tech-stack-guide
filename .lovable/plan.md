

# Navegacao Ativa - Estilo Pill Cinza Arredondado

## Proposta

Substituir o indicador de underline azul por um **pill arredondado com fundo cinza** (`bg-accent`) no item ativo, similar ao estilo usado por GitHub, Figma e Slack. Texto escuro com `font-semibold`, sem bordas, sem underline.

```text
Antes:   Dashboard      Comercial v
              ___           ___          <- underline azul

Depois: [ Dashboard ]   Comercial v     <- pill cinza arredondado no ativo
```

## Detalhes Tecnicos

### Arquivo: `src/modules/app/layouts/AppLayout.tsx`

**NavDirectLink** (linha ~141-144) - Estado ativo:

De:
```
text-foreground font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full
```
Para:
```
bg-accent text-foreground font-semibold
```

**NavHubDropdown** (linha ~183-184) - Estado ativo:

De:
```
text-foreground font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full
```
Para:
```
bg-accent text-foreground font-semibold
```

Remover `relative` do className base ja que nao precisa mais do pseudo-element `after:`.

O hover dos itens inativos ja usa `hover:bg-accent`, entao a transicao entre hover e ativo fica natural e coesa.

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/app/layouts/AppLayout.tsx` | Trocar active state classes em NavDirectLink e NavHubDropdown |

