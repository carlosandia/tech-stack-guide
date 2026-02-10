

# Plano: Correcao de Notificacao Duplicada + Newsletter com Layouts e Boas Praticas

## 1. Correcao: Notificacao Duplicada ao Salvar

**Causa raiz**: Ao clicar "Salvar" no `EstiloPopover`, o `handleSaveAll` executa duas funcoes em sequencia:
1. `onSaveConfig` -> `BotaoConfigPanel.saveConfig()` que exibe `toast.success('Configuracao salva')`
2. `onSave` -> `handleSaveEstilos()` que dispara `useSalvarEstilos` com `toast.success('Estilos salvos')`

Resultado: 2 toasts aparecem simultaneamente.

**Solucao**: Remover o toast de dentro do `BotaoConfigPanel.saveConfig()` quando chamado via `EstiloPopover`, pois o `handleSaveAll` ja unifica o salvamento. Alternativa mais limpa: remover o `toast.success` do `saveConfig` no `BotaoConfigPanel.tsx` e deixar apenas o toast do `useSalvarEstilos` no hook, que ja cobre o feedback.

## 2. Newsletter com Layouts, Boas Praticas e Preview

### Contexto de Mercado
Newsletters de alta conversao seguem padroes:
- Layout limpo, geralmente com imagem de destaque (hero) no topo
- Campos minimalistas: somente Email (basico) ou Nome + Email (padrao) ou Nome + Email + Telefone (completo)
- Checkbox de consentimento LGPD visivel
- Indicacao clara da frequencia de envio
- Branding (logo) proeminente

### Implementacao

#### 2.1 Seletor de Layout para Newsletter (`NewsletterLayoutSelector`)
Criar componente similar ao `PopupLayoutSelector` com templates especificos:

| Template | Descricao |
|----------|-----------|
| `simples` | Somente campos (padrao atual) |
| `hero_topo` | Imagem hero no topo + campos abaixo |
| `hero_lateral` | Imagem lateral + campos (50/50) |
| `so_imagem` | Somente imagem com link |

Cada template tera mini-preview SVG, upload/URL de imagem e campo de link (mesmo padrao do popup).

#### 2.2 Atualizacoes no Banco de Dados
Adicionar colunas na tabela `config_newsletter_formularios`:
- `newsletter_layout` (text) - template selecionado
- `newsletter_imagem_url` (text) - URL da imagem hero
- `newsletter_imagem_link` (text) - link ao clicar na imagem

#### 2.3 Atualizacoes no Editor (`FormularioEditorPage.tsx`)
- Quando `formulario.tipo === 'newsletter'`, renderizar `NewsletterLayoutSelector` na paleta (mesma posicao do `PopupLayoutSelector` para popups)
- Passar `newsletterLayout` como prop para `FormPreview`

#### 2.4 Atualizacoes no Preview (`FormPreview.tsx`)
- Adicionar prop `newsletterLayout` com mesma estrutura de `popupLayout`
- Aplicar os templates de layout quando `formulario.tipo === 'newsletter'`
- Reutilizar a logica de imagem clicavel ja existente
- Os layouts `hero_topo` e `hero_lateral` seguem a mesma mecanica dos layouts de popup (`imagem_topo`, `imagem_lateral_full`)

#### 2.5 Atualizacao na API e Tipos
- Atualizar `ConfigNewsletter` em `formularios.api.ts` com os novos campos
- Atualizar hooks `useConfigNewsletter` e `useSalvarConfigNewsletter`

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/formularios/components/config/BotaoConfigPanel.tsx` | Remover `toast.success` do `saveConfig` |
| `src/modules/formularios/components/config/NewsletterLayoutSelector.tsx` | **NOVO** - Seletor de layout com templates e upload de imagem |
| `src/modules/formularios/services/formularios.api.ts` | Adicionar campos de layout no `ConfigNewsletter` |
| `src/modules/formularios/pages/FormularioEditorPage.tsx` | Integrar layout newsletter na paleta e passar ao preview |
| `src/modules/formularios/components/editor/FormPreview.tsx` | Suportar layouts de newsletter (hero topo, lateral, so imagem) |
| `src/modules/formularios/hooks/useFormularioConfig.ts` | Sem mudanca (hooks ja sao genericos) |
| **Migracao SQL** | Adicionar 3 colunas em `config_newsletter_formularios` |

## Detalhes Tecnicos

- O `NewsletterLayoutSelector` reutiliza a logica de upload do `PopupLayoutSelector` (bucket `formularios`, compressao via `compressImage`)
- Os templates de newsletter no `FormPreview` seguem a mesma arquitetura de renderizacao condicional ja usada nos templates de popup
- O drag-and-drop sobre a area de imagem tambem funcionara para newsletter (mesma logica de proxy drop zone)
- Preview final e visualizacao publica (`/f/:slug`) respeitarao o layout selecionado

