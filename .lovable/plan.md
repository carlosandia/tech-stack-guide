
# Navegacao Leve e Moderna - Remover Estilo Pesado

## Problema

Os itens de navegacao ativos no header usam `border border-primary/40 bg-primary/5 text-primary`, criando um visual com borda azul + fundo azul que chama muita atencao e causa cansaco visual.

## Proposta de UI

Substituir por um estilo minimalista inspirado em navegacoes modernas de SaaS (Linear, Notion, Figma):

- **Estado ativo**: Apenas texto escuro (foreground) com peso medium e um indicador sutil por baixo (underline ou dot), sem background, sem borda
- **Estado hover**: Background sutil `bg-accent` (cinza claro), sem borda
- **Estado inativo**: Texto `muted-foreground`, sem borda, sem background

Visualmente:

```text
Antes:  [  Dashboard  ]  [ Comercial v ]   <- caixas azuis com borda
Apos:    Dashboard      Comercial v        <- texto limpo, ativo = bold + underline sutil
```

## Detalhes Tecnicos

### Arquivo: `src/modules/app/layouts/AppLayout.tsx`

**1. NavDirectLink (linha ~128-134)** - Estado ativo do link direto (Dashboard):

De:
```
border border-primary/40 bg-primary/5 text-primary
```
Para:
```
text-foreground font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full relative
```
Estado inativo:
```
border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent
```
Permanece igual, apenas remove a borda para nao ter salto visual.

**2. NavHubDropdown (linha ~167-173)** - Botao do hub dropdown (Comercial, Atendimento, Ferramentas):

De:
```
border border-primary/40 bg-primary/5 text-primary
```
Para:
```
text-foreground font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full relative
```

Resultado: navegacao limpa, leve, sem caixas coloridas. O indicador de pagina ativa e um pequeno "dot/line" azul embaixo do texto, quase imperceptivel mas funcional.

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/app/layouts/AppLayout.tsx` | Alterar classes CSS de active state em NavDirectLink e NavHubDropdown |
