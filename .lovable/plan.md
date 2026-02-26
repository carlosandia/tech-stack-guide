
# Correção do overflow horizontal no mobile - Toolbar do Dashboard

## Problema
No mobile, os 5 botões (Investimento, Exibição, Visualizações, Exportar, Fullscreen) ficam todos na mesma linha, ultrapassando 100% da largura da tela.

## Solução
Reorganizar o container dos botões de ação (linha 236 do `DashboardPage.tsx`) para que no mobile:
- **Investimento** e **Exibição** ocupem a linha inteira (flex-wrap com cada um tomando ~50%)
- **Visualizações**, **Exportar** e **Fullscreen** vão para uma segunda linha

## Alteração Técnica

**Arquivo:** `src/modules/app/pages/DashboardPage.tsx` (linhas 236-257)

Substituir o `div` wrapper dos botões de ação por um layout com `flex-wrap` no mobile:

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {/* Primeira linha no mobile: Investimento + Exibição ocupam 100% */}
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <InvestModeWidget data={relatorio} />
    <DashboardDisplayConfig config={displayConfig} onToggle={toggleSection} />
  </div>
  {/* Segunda linha no mobile: 3 ícones */}
  <div className="flex items-center gap-2">
    <DashboardVisualizacoes ... />
    <ExportarRelatorioPDF ... />
    <FullscreenToggle ... />
  </div>
</div>
```

Isso garante que no mobile os botões quebrem em duas linhas, e no desktop (`sm:w-auto`) tudo fique na mesma linha como antes.
