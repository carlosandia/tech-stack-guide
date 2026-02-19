

## Correção: Botão "Configurar" do Meta Ads não abre modal

### Problema Identificado

Na `ConexoesPage.tsx`, a seção de **modais de configuração** (linhas 201-231) possui handlers para WhatsApp, Api4com, Email e Google Calendar, mas **falta o bloco para `meta_ads`**. O componente `MetaAdsDetailModal` já existe e está funcional, com as 3 abas (Lead Ads, Conversions API e Públicos), porém nunca é renderizado.

### Correção

Adicionar na `ConexoesPage.tsx`:

1. **Importar** o `MetaAdsDetailModal` no topo do arquivo
2. **Adicionar o bloco condicional** para `configAberto === 'meta_ads'` na seção de modais de configuração, passando o `integracaoId` da integração conectada

### Detalhes Técnicos

**Arquivo:** `src/modules/configuracoes/pages/ConexoesPage.tsx`

- Adicionar import: `import { MetaAdsDetailModal } from '../components/integracoes/MetaAdsDetailModal'`
- Adicionar entre os blocos de configuração existentes (após Google Calendar ou antes do fechamento):

```tsx
{configAberto === 'meta_ads' && integracoesPorPlataforma['meta_ads'] && (
  <MetaAdsDetailModal
    integracaoId={integracoesPorPlataforma['meta_ads'].id}
    onClose={() => setConfigAberto(null)}
  />
)}
```

Isso conecta o botão "Configurar" ao modal com as 3 abas: Lead Ads (mapeamento de formulários e pipelines), Conversions API (CAPI com Pixel ID e eventos) e Públicos Personalizados (Custom Audiences).

