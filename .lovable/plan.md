
# Responsividade por Dispositivo no Editor de Formularios (estilo Elementor)

## Resumo

Adicionar um sistema de configuracao responsiva por dispositivo (Desktop / Tablet / Mobile) no editor de formularios, permitindo que o usuario defina valores diferentes para propriedades visuais em cada breakpoint. Inspirado no Elementor Pro, onde um seletor de icones (monitor, tablet, celular) aparece ao lado dos campos que suportam override por dispositivo.

## Como funciona

O usuario vera 3 icones pequenos (Desktop, Tablet, Mobile) ao lado de campos especificos nos paineis de estilo. Ao clicar em um icone, os valores editados passam a valer apenas para aquele dispositivo. Por padrao, todos os valores sao "Desktop" e sao herdados pelos outros dispositivos, a menos que o usuario defina um override.

```text
Largura do Botao:
  [Desktop: 50%]  [Tablet: 50%]  [Mobile: 100%]
                                         ^
                              usuario definiu override
```

## Campos que recebem responsividade

| Componente | Campos responsiveis |
|---|---|
| **Botao (submit e WhatsApp)** | Largura, Altura, Tamanho da Fonte |
| **Container** | Padding (top/right/bottom/left), Largura Maxima |
| **Campos (inputs)** | Altura do campo, Tamanho da fonte do titulo |
| **Bloco de Colunas** | Larguras das colunas (ex: 50/50 no desktop, 100/100 empilhado no mobile) |
| **Elementos de layout** | Tamanho da fonte de titulos e paragrafos |

## Detalhamento Tecnico

### 1. Estrutura de dados responsiva

Cada propriedade responsiva sera armazenada como um objeto com chaves por dispositivo, usando sufixos `_tablet` e `_mobile` no tipo existente. Exemplo para `EstiloBotao`:

```typescript
// Valores existentes continuam sendo o "desktop" (default)
export interface EstiloBotao {
  largura?: string          // desktop (valor padrao/existente)
  largura_tablet?: string   // override tablet (novo)
  largura_mobile?: string   // override mobile (novo)
  altura?: string
  altura_tablet?: string
  altura_mobile?: string
  font_size?: string
  font_size_tablet?: string
  font_size_mobile?: string
  // ... demais campos existentes sem alteracao
}
```

A mesma logica se aplica a `EstiloContainer`, `EstiloCampos` e `EstiloBotao`. Isso evita migration de banco pois os estilos sao salvos como JSONB -- basta adicionar novas chaves no JSON.

### 2. Componente `DeviceSwitcher`

Um componente reutilizavel com 3 icones (Monitor, Tablet, Smartphone) que controla qual dispositivo esta sendo editado:

```text
[Monitor]  [Tablet]  [Smartphone]
    ^         
  ativo (highlight azul)
```

- Arquivo: `src/modules/formularios/components/estilos/DeviceSwitcher.tsx`
- Icones: `Monitor`, `Tablet`, `Smartphone` do lucide-react
- Estado controlado pelo pai (lifted state)

### 3. Componente `ResponsiveField`

Um wrapper que envolve qualquer campo de input e adiciona o DeviceSwitcher inline ao lado do label:

```text
Largura  [PC] [Tab] [Mob]
[___________50%___________]
```

- Arquivo: `src/modules/formularios/components/estilos/ResponsiveField.tsx`
- Recebe: `label`, `device`, `desktopValue`, `tabletValue`, `mobileValue`, `onChange(device, value)`
- Mostra indicador visual (bolinha azul) quando existe override para tablet/mobile

### 4. Alteracoes nos formularios de estilo

**EstiloBotaoForm.tsx:**
- Adicionar DeviceSwitcher no topo do componente
- Campos "Largura", "Altura" e "Tamanho da Fonte" usam ResponsiveField
- Demais campos (cores, texto, arredondamento) continuam universais

**EstiloContainerForm.tsx:**
- Campos "Padding" (4 lados) e "Largura Maxima" usam ResponsiveField

**EstiloCamposForm.tsx:**
- Campos "Altura do Campo" e "Tamanho da Fonte do Titulo" usam ResponsiveField

**BlocoColunasEditor.tsx (config panel):**
- Larguras das colunas recebem override para tablet/mobile
- No mobile, colunas empilham verticalmente por padrao

### 5. Renderizacao responsiva (pagina publica e preview)

Na renderizacao (FormPreview e FormularioPublicoPage), os estilos serao resolvidos usando CSS media queries injetadas via tag `<style>` ou inline styles condicionais:

- Criar funcao utilitaria `resolveResponsiveStyle(estilos, campo, breakpoints)` que gera o CSS correto
- Breakpoints: Desktop >= 1024px, Tablet 768-1023px, Mobile < 768px (conforme design system)
- Para botoes: gerar classe CSS que aplica `width: 100%` no mobile se configurado

### 6. Preview por dispositivo no editor

O editor ja possui os botoes "Desktop / Tablet / Mobile" no topo (conforme imagens de referencia). A troca de dispositivo no preview:
- Altera a largura do iframe/container de preview
- Sincroniza o DeviceSwitcher nos paineis laterais para mostrar os valores do dispositivo ativo

### 7. Arquivos novos

- `src/modules/formularios/components/estilos/DeviceSwitcher.tsx`
- `src/modules/formularios/components/estilos/ResponsiveField.tsx`
- `src/modules/formularios/utils/responsiveStyles.ts` (funcao de resolucao de estilos por breakpoint)

### 8. Arquivos alterados

- `src/modules/formularios/services/formularios.api.ts` -- adicionar campos `_tablet` e `_mobile` nas interfaces de tipo
- `src/modules/formularios/components/estilos/EstiloBotaoForm.tsx` -- usar ResponsiveField nos campos aplicaveis
- `src/modules/formularios/components/estilos/EstiloContainerForm.tsx` -- usar ResponsiveField no padding e largura maxima
- `src/modules/formularios/components/estilos/EstiloCamposForm.tsx` -- usar ResponsiveField na altura e tamanho de fonte
- `src/modules/formularios/components/editor/FormPreview.tsx` -- aplicar estilos responsivos via media queries
- `src/modules/formularios/pages/FormularioPublicoPage.tsx` -- aplicar estilos responsivos na pagina publica

### 9. Sem alteracao no banco de dados

Os estilos ja sao armazenados como JSONB nas colunas `container`, `cabecalho`, `campos`, `botao` e `pagina` da tabela `estilos_formularios`. As novas chaves (`_tablet`, `_mobile`) serao simplesmente adicionadas ao JSON existente sem necessidade de migration.
