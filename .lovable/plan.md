
# Corrigir botao "Salvar Configuracao" que desaparece na aba Distribuicao

## Problema

O botao "Salvar Configuracao" some quando o conteudo da aba Distribuicao ultrapassa a altura da tela. A tentativa anterior de usar `sticky bottom-0` nao funciona de forma confiavel porque:

1. O scroll acontece no elemento `<main>` do `PipelineConfigPage.tsx`
2. O botao sticky esta dentro de um `<div className="space-y-6">` que nao tem altura definida
3. Em contextos de flexbox aninhado, o `sticky` pode falhar silenciosamente

## Solucao

Reestruturar o layout para que o botao de salvar fique **fora** da area scrollavel, usando flex column com scroll interno.

### Alteracoes

**Arquivo 1: `src/modules/negocios/pages/PipelineConfigPage.tsx`**

Alterar o `<main>` para ser um flex container que passa a altura completa para os filhos:

```text
Antes:  <main className="flex-1 overflow-y-auto p-4 sm:p-6">
Depois: <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
           <div className="flex-1 min-h-0">
             {renderTab()}
           </div>
         </main>
```

- `overflow-hidden` em vez de `overflow-y-auto`: o scroll passa a ser responsabilidade de cada aba individualmente
- `flex flex-col` + `min-h-0`: permite que o filho ocupe exatamente a altura disponivel

**Arquivo 2: `src/modules/negocios/components/config/ConfigDistribuicao.tsx`**

Reestruturar o componente para usar flex column com scroll interno + footer fixo:

```text
Antes:
  <div className="space-y-6">
    {conteudo...}
    <div className="sticky bottom-0 ...">  <-- botao some
      <button>Salvar</button>
    </div>
  </div>

Depois:
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-y-auto space-y-6">
      {conteudo...}         <-- area scrollavel
    </div>
    <div className="flex-shrink-0 pt-3 border-t border-border flex justify-end">
      <button>Salvar</button>   <-- sempre visivel, fora do scroll
    </div>
  </div>
```

- `h-full flex flex-col`: ocupa toda a altura disponivel do parent
- `flex-1 overflow-y-auto`: conteudo rola internamente
- `flex-shrink-0`: footer do botao nunca encolhe nem some

## Por que esta solucao e definitiva

Em vez de depender do comportamento do `sticky` (que tem varias condicoes de falha em layouts flexbox), o botao fica em um container completamente separado da area de scroll. Independente de quanto conteudo exista, o botao estara sempre ancorado no rodape da area de conteudo.

## Secao tecnica

### Hierarquia de layout resultante

```text
PipelineConfigPage (h-screen, flex col)
  +-- header (h-14, flex-shrink-0)
  +-- body (flex-1, flex row)
       +-- sidebar (w-56)
       +-- main (flex-1, overflow-hidden, flex col, padding)
            +-- div (flex-1, min-h-0)
                 +-- ConfigDistribuicao (h-full, flex col)
                      +-- div.scrollable (flex-1, overflow-y-auto)
                      +-- div.footer (flex-shrink-0) -- botao Salvar
```

### Impacto nas outras abas

As demais abas (Etapas, Campos, Atividades, Qualificacao, Motivos) continuarao funcionando normalmente. Se alguma delas precisar de scroll, basta adicionar `overflow-y-auto` no proprio componente. Nenhuma quebra de compatibilidade.
