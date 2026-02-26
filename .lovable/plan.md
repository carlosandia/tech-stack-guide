

# Correcao do Logo RENOVE no Dark Mode

## Problema

O SVG `logotipo-renove.svg` tem cores hardcoded — o texto "RENOVE" usa cor escura (provavelmente preta/cinza) e o icone usa amarelo. Como o logo e renderizado via `<img src={...}>`, CSS nao consegue alterar as cores internas do SVG. No dark mode, o texto fica invisivel (preto sobre fundo escuro).

## Solucao

Criar um componente `LogoRenove` que renderiza o SVG **inline** (como JSX), substituindo a cor do texto de hardcoded para `currentColor`. Como `currentColor` herda a cor do texto do contexto CSS, no light mode sera escuro e no dark mode sera claro — automaticamente.

O icone amarelo (cerebro) mantem sua cor fixa `#FFD700` ou equivalente.

### Passo 1: Criar componente `LogoRenove`

**Novo arquivo**: `src/components/LogoRenove.tsx`

- Converter o SVG para JSX inline
- Substituir os `fill` das paths do texto "RENOVE" por `currentColor`
- Manter o `fill` amarelo do icone (cerebro) inalterado
- Aceitar props `className` e `height` para flexibilidade

### Passo 2: Substituir `<img src={renoveLogo}>` pelo componente

Nos arquivos que usam o logo, trocar:
```tsx
// Antes
<img src={renoveLogo} alt="Renove" className="h-7" />

// Depois
<LogoRenove className="h-7" />
```

**Arquivos afetados** (11 arquivos):
- `src/modules/app/layouts/AppLayout.tsx` (2 ocorrencias)
- `src/modules/admin/layouts/AdminLayout.tsx`
- `src/modules/auth/pages/LoginPage.tsx`
- `src/modules/auth/pages/ForgotPasswordPage.tsx`
- `src/modules/auth/pages/ResetPasswordPage.tsx`
- `src/modules/public/components/landing/LandingHeader.tsx`
- `src/modules/public/components/landing/LandingFooter.tsx`
- `src/modules/public/pages/PlanosPage.tsx`
- `src/modules/public/pages/ParceiroPage.tsx`
- `src/modules/public/pages/TermosServicoPage.tsx`
- `src/modules/public/pages/PoliticaPrivacidadePage.tsx`

## Detalhes tecnicos

- O componente usa `currentColor` que automaticamente herda `text-foreground` do contexto (claro no light, branco no dark)
- Zero mudanca no design system — apenas semantica correta de cores
- O icone amarelo permanece fixo pois tem fill explicito
- Preciso ler o SVG completo para converter os paths corretamente para JSX

## Resultado

- Light mode: icone amarelo + texto escuro (como hoje)
- Dark mode: icone amarelo + texto branco (corrigido)
- Automatico em todos os 11 arquivos que usam o logo

