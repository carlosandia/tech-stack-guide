
# Adicionar Controles Responsivos nos Estilos dos Botoes

## Resumo

Os campos de Largura, Altura e Tamanho da Fonte nos estilos dos botoes (Enviar e WhatsApp) atualmente usam inputs simples sem opcao de override por dispositivo. O tipo `EstiloBotao` e a funcao `generateFormResponsiveCss` ja suportam os sufixos `_tablet` e `_mobile`, mas o painel de estilo nao expoe esses controles. A mudanca e adicionar o `DeviceSwitcher` nesses campos, igual ao que ja funciona no `EstiloBotaoForm.tsx` e nos blocos de colunas.

## Mudancas

### 1. BotaoConfigPanel.tsx - renderEstiloEnviar()

Substituir os inputs simples de **Largura**, **Altura** e **Tamanho** por campos com `ResponsiveField` + `DeviceSwitcher`:

- **Largura**: Select com opcoes (100%, 50%, auto) + DeviceSwitcher. Campos: `largura`, `largura_tablet`, `largura_mobile`
- **Altura**: Input + DeviceSwitcher. Campos: `altura`, `altura_tablet`, `altura_mobile`
- **Tamanho da Fonte**: Input + DeviceSwitcher. Campos: `font_size`, `font_size_tablet`, `font_size_mobile`

Adicionar estado `const [device, setDevice] = useState<DeviceType>('desktop')` e helpers `getKey`/`getVal`/`getPlaceholder` (mesmo padrao do `EstiloBotaoForm.tsx`).

### 2. BotaoConfigPanel.tsx - renderEstiloWhatsApp()

Mesma logica responsiva para os campos do botao WhatsApp:

- **Largura**: `whatsapp_largura`, `whatsapp_largura_tablet`, `whatsapp_largura_mobile`
- **Altura**: `whatsapp_altura`, `whatsapp_altura_tablet`, `whatsapp_altura_mobile`
- **Tamanho da Fonte**: `whatsapp_font_size`, `whatsapp_font_size_tablet`, `whatsapp_font_size_mobile`

### 3. Nenhuma mudanca necessaria em:

- `EstiloBotao` (tipo) - ja tem todos os campos `_tablet`/`_mobile`
- `responsiveStyles.ts` - `generateFormResponsiveCss` ja gera media queries para todos esses campos
- `FormPreview.tsx` / `FormularioPublicoPage.tsx` - ja consomem o CSS responsivo gerado

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `BotaoConfigPanel.tsx` | Importar `ResponsiveField` e `DeviceSwitcher`, adicionar estado de device, usar `ResponsiveField` nos campos de Largura, Altura e Tamanho da Fonte para ambos os botoes |

## Resultado

O usuario podera clicar nos icones Desktop/Tablet/Mobile ao lado de Largura, Altura e Tamanho nos estilos dos botoes e definir valores diferentes por viewport. As bolinhas indicadoras de override (amarela para tablet, azul para mobile) aparecerao quando houver valores customizados, exatamente como ja funciona nos blocos de colunas.
