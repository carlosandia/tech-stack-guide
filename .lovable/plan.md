
# Correção: Investimento não persiste valores no formulário

## Problema Identificado

Ao analisar o código e os requests de rede, confirmei que os dados **são salvos corretamente** no banco (a tabela `investimentos_marketing` retorna os valores por canal). Porém, o formulário do InvestModeWidget **não pré-preenche** os campos com os valores salvos ao reabrir ou editar. Isso dá a impressão de que nada foi salvo.

**Causa raiz:** A função `buscarInvestimentoPeriodo` retorna apenas o valor total somado, descartando os valores individuais por canal (meta_ads, google_ads, outros). O widget de edição não tem acesso a esses valores para pré-preencher os campos.

## Solução

### 1. Retornar valores por canal no invest_mode (relatorio.service.ts)

Modificar `buscarInvestimentoPeriodo` para retornar os valores individuais por canal alem do total:

```typescript
// Antes: retorna apenas number | null
// Depois: retorna { total, meta_ads, google_ads, outros } | null
```

### 2. Incluir breakdown por canal no tipo InvestMode (relatorio.types.ts)

Adicionar campos opcionais `meta_ads`, `google_ads`, `outros` ao tipo `InvestMode` quando ativo:

```typescript
export type InvestMode =
  | { ativo: false }
  | {
      ativo: true
      total_investido: number
      meta_ads: number    // NOVO
      google_ads: number  // NOVO
      outros: number      // NOVO
      cpl: number | null
      // ... demais campos
    }
```

### 3. Pré-preencher formulário no InvestModeWidget

No `handleEditar`, carregar os valores salvos do `investMode`:

```typescript
const handleEditar = () => {
  setModoEdicao(true)
  if (investMode.ativo) {
    setMetaAds(String(investMode.meta_ads || ''))
    setGoogleAds(String(investMode.google_ads || ''))
    setOutros(String(investMode.outros || ''))
  }
}
```

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/modules/app/types/relatorio.types.ts` | Adicionar `meta_ads`, `google_ads`, `outros` ao InvestMode ativo |
| `src/modules/app/services/relatorio.service.ts` | `buscarInvestimentoPeriodo` retorna valores por canal; `construirInvestMode` repassa os valores |
| `src/modules/app/components/dashboard/InvestModeWidget.tsx` | `handleEditar` pré-preenche campos com valores salvos |

## Impacto no Funil de Conversão

O FunilConversao.tsx ja consome `data.invest_mode` corretamente. Como o problema era o investimento nao persistir visualmente (formulario vazio ao reabrir), uma vez que os valores estejam corretos no invest_mode e pre-preenchidos no formulario, o funil tambem refletira os dados corretamente.
