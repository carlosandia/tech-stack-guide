

## Correcao: Planos nao aparecem na landing + CTAs faltando

### Problemas identificados

1. **Widget de planos nao carrega** -- O `PricingSection` injeta o script via `useEffect` mas o `scriptLoaded.current = true` impede que o script seja re-injetado apos navegacao SPA. Alem disso, o widget depende do container `#renove-pricing-widget` estar no DOM antes do script executar, e o `ref` de scroll reveal pode estar com `opacity: 0` bloqueando a renderizacao inicial.

2. **CTA "Ver planos" faltando no HowItWorksSection** -- O plano aprovado incluia adicionar um CTA secundario "Ver planos" apontando para `#planos` na secao "Como Funciona", mas nao foi implementado.

### Solucao

**1. Corrigir `PricingSection.tsx`**
- Remover o guard `scriptLoaded.current` que impede recarregamento
- Usar cleanup mais robusto: remover script e limpar container no unmount
- Garantir que o container `#renove-pricing-widget` exista antes do script carregar
- Adicionar um pequeno delay para garantir que o DOM esta pronto

**2. Adicionar CTA secundario no `HowItWorksSection.tsx`**
- Abaixo do botao "Comecar agora, e gratis", adicionar um link discreto "Ver planos" que faz scroll smooth para `#planos`

### Arquivos a editar

- `src/modules/public/components/landing/PricingSection.tsx` -- corrigir carregamento do widget
- `src/modules/public/components/landing/HowItWorksSection.tsx` -- adicionar CTA "Ver planos"

### Detalhes tecnicos

**PricingSection.tsx:**
```
useEffect(() => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  if (!supabaseUrl || !widgetRef.current) return

  // Limpar conteudo anterior
  const container = widgetRef.current
  container.innerHTML = '<div id="renove-pricing-widget"></div>'

  const script = document.createElement('script')
  script.src = `${supabaseUrl}/functions/v1/pricing-widget-loader?periodo=mensal`
  script.async = true
  container.appendChild(script)

  return () => {
    script.remove()
    // Limpar funcoes globais do widget
    delete (window as any)._rnvSetPeriodo
    delete (window as any)._rnvCheckout
  }
}, [])
```

**HowItWorksSection.tsx:**
- Adicionar abaixo do botao principal:
```
<button
  onClick={() => document.querySelector('#planos')?.scrollIntoView({ behavior: 'smooth' })}
  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
>
  Ver planos
</button>
```
- Wrapper dos CTAs muda de `text-center` para `flex flex-col items-center gap-3`

