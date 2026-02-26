
# Plano: Titulo + Seletor de Periodo Responsivo

## 1. Alterar titulo do Dashboard

**Arquivo:** `src/modules/app/pages/DashboardPage.tsx`

Trocar o texto do h2 de "Relatório de funil" para **"Relatório de Desempenho"**.

---

## 2. Substituir botoes de periodo por Select/Dropdown no mobile

**Arquivo:** `src/modules/app/components/dashboard/DashboardFilters.tsx`

Substituir os botoes inline de periodo por um componente `Select` (Radix) que funciona como dropdown compacto. Elimina completamente o scroll horizontal.

### Comportamento:
- Dropdown com as opcoes: "Ultimos 7 dias", "Ultimos 30 dias", "Ultimos 90 dias", "Personalizado"
- Quando "Personalizado" for selecionado, exibe o botao de date picker ao lado (ou abaixo no mobile)
- O select de funil permanece como esta
- Layout: todos os selects empilham verticalmente no mobile (`flex-col`) e ficam em linha no desktop (`sm:flex-row`)
- Background opaco (`bg-popover`) e `z-50` no dropdown para evitar transparencia

### Detalhes tecnicos:
- Usar os componentes `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` ja existentes em `src/components/ui/select.tsx`
- Remover os botoes de periodo e o container com `overflow-x-auto`
- Manter a mesma interface de props (sem mudancas no DashboardPage)
- SelectTrigger com classes: `h-9 text-xs w-full sm:w-[180px]`

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/modules/app/pages/DashboardPage.tsx` | Trocar titulo para "Relatorio de Desempenho" |
| `src/modules/app/components/dashboard/DashboardFilters.tsx` | Trocar botoes de periodo por Select dropdown |
