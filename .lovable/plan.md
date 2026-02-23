

## Corrigir gradiente da hero section na ParceiroPage

### Problema
O gradiente radial na hero section tem um fade suave no lado esquerdo, mas no lado direito aparece uma transicao mais brusca (como uma "linha"), em vez de um degradê suave igual.

### Solucao
Ajustar os dois gradientes radiais existentes para que ambos os lados tenham a mesma suavidade:

1. O primeiro gradiente (`ellipse_at_top`) ja funciona bem no centro/esquerda. Manter.
2. O segundo gradiente (`circle_at_bottom_right`) cria o efeito assimetrico. Trocar para um gradiente espelhado que repita o mesmo efeito suave nos dois lados.

Adicionar um terceiro gradiente radial posicionado no lado direito (`ellipse_at_top_right`) com a mesma intensidade e comportamento do lado esquerdo, criando simetria.

### Detalhes tecnicos

**Arquivo:** `src/modules/public/pages/ParceiroPage.tsx`

Nas linhas dos gradientes da hero section, substituir os dois `div` de gradiente por tres:

```tsx
{/* Gradiente central-esquerdo (existente) */}
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15)_0%,transparent_60%)] pointer-events-none" />

{/* Gradiente central topo (existente, ajustado) */}
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12)_0%,transparent_50%)] pointer-events-none" />

{/* NOVO: Gradiente espelhado no lado direito */}
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15)_0%,transparent_60%)] pointer-events-none" />
```

Isso cria um efeito suave e simetrico em ambos os lados, sem linha de corte.
