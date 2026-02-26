

# Plano: Corrigir Drop Zone do Drag and Drop no Dashboard

## Problema

A drop zone atual tem apenas 6px de altura e nao "empurra" visualmente os blocos adjacentes para abrir espaco. Alem disso, o calculo de posicao nao considera o ponto medio do bloco (se o cursor esta na metade superior ou inferior), causando posicionamento impreciso. O `onDragLeave` tambem causa flickering ao mover entre elementos filhos.

---

## Correcoes

### 1. DashboardSectionDraggable.tsx

- **Drop zone maior**: Aumentar de `h-[6px]` para `h-16` (64px) com transicao suave, simulando o espaco do bloco sendo inserido — isso "empurra" os blocos visivelmente
- **Calculo de metade superior/inferior**: Usar `e.clientY` comparado ao `getBoundingClientRect().top + height/2` do bloco para determinar se o drop deve ser acima (index) ou abaixo (index + 1)
- **Prevenir flickering no dragLeave**: Usar `e.currentTarget.contains(e.relatedTarget)` para ignorar dragLeave entre elementos internos do mesmo wrapper
- **Transicao suave**: `transition-all duration-200 ease-in-out` na drop zone para efeito de abertura/fechamento fluido

### 2. DashboardPage.tsx — handleDragOver

- Atualizar para receber o indice ja calculado pelo componente filho (com logica de metade superior/inferior)
- Remover `handleDragLeave` separado — o controle fica no componente draggable

---

## Arquivos a editar

| Arquivo | Acao |
|---------|------|
| `src/modules/app/components/dashboard/DashboardSectionDraggable.tsx` | Reescrever: drop zone maior, calculo de midpoint, anti-flickering |
| `src/modules/app/pages/DashboardPage.tsx` | Ajustar handleDragOver para novo calculo |

---

## Secao Tecnica

### Novo calculo de posicao (midpoint)

```text
onDragOver(e):
  rect = elemento.getBoundingClientRect()
  midY = rect.top + rect.height / 2
  se e.clientY < midY:
    onDragOver(e, index)      // dropar ACIMA deste bloco
  senao:
    onDragOver(e, index + 1)  // dropar ABAIXO deste bloco
```

### Drop zone visual expandida

```text
Quando ativa:
  h-16 (64px) — espaco visual significativo
  mb-3 — margem inferior para separar do bloco
  bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg
  transition-all duration-200 ease-in-out

Quando inativa:
  h-0 overflow-hidden
```

### Anti-flickering no dragLeave

```typescript
onDragLeave={(e) => {
  // Ignora se o mouse foi para um elemento filho
  if (e.currentTarget.contains(e.relatedTarget as Node)) return
  onDragLeave()
}}
```

Isso resolve o problema de a drop zone piscar quando o cursor passa sobre elementos internos do bloco.

