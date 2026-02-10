
# Editor de Layout para Popup com Templates Pre-definidos

## Objetivo
Transformar o editor de formularios tipo "popup" para suportar layouts visuais com imagem + campos, usando templates pre-definidos. O usuario escolhe um template de layout (ex: imagem a esquerda, campos a direita) e configura a imagem via upload ou URL externa.

## Templates de Layout Disponíveis (6 opcoes)

```text
1. "so_campos"          - Layout padrao, apenas campos (sem imagem)
2. "imagem_esquerda"    - Imagem ocupa 40% a esquerda, campos 60% a direita
3. "imagem_direita"     - Campos 60% a esquerda, imagem 40% a direita
4. "imagem_topo"        - Imagem no topo (altura fixa), campos abaixo
5. "imagem_fundo"       - Imagem de fundo cobrindo o popup inteiro, campos sobrepostos com overlay
6. "imagem_lateral_full"- Imagem lateral 50% altura total, campos 50%
```

## Dados (ja existentes no banco)

A tabela `config_popup_formularios` ja possui:
- `popup_imagem_url` (text, nullable) - URL da imagem
- `popup_imagem_posicao` (varchar) - sera usado para guardar o template escolhido

Nao e necessaria nenhuma migracao SQL.

## Storage

Sera criado um bucket `formularios` no Supabase Storage via migracao SQL para uploads de imagens dos popups. Politica RLS: usuarios autenticados podem fazer upload e leitura.

## Arquivos a Criar

### 1. `src/modules/formularios/components/config/PopupLayoutSelector.tsx`
- Grade visual com 6 mini-previews dos templates
- Cada template representado por um card clicavel com icone/diagrama SVG inline
- O template ativo fica destacado com borda primary
- Abaixo do seletor de template, campo de imagem (upload + URL):
  - Toggle: "Upload" | "URL externa"
  - Upload: input file com preview da imagem, compressao via `compressMedia.ts`
  - URL: input text com preview ao perder foco
  - Botao "Remover imagem"

### 2. Migracao SQL para bucket de storage
- Criar bucket `formularios` (publico)
- RLS: authenticated pode INSERT, SELECT; proprietario pode DELETE

## Arquivos a Modificar

### 3. `src/modules/formularios/components/config/ConfigPopupForm.tsx`
- Importar e renderizar `PopupLayoutSelector` no topo do formulario
- Passar `popup_imagem_url` e `popup_imagem_posicao` como props
- Callbacks para atualizar o form state local

### 4. `src/modules/formularios/components/editor/FormPreview.tsx`
- Quando `formulario.tipo === 'popup'`, buscar config popup e aplicar o layout correspondente
- Para cada template, o preview envolve o container do formulario em uma estrutura diferente:
  - `imagem_esquerda`: flex-row com div imagem (40%) + div campos (60%)
  - `imagem_direita`: flex-row com div campos (60%) + div imagem (40%)
  - `imagem_topo`: flex-col com div imagem (altura fixa 200px) + div campos
  - `imagem_fundo`: div relativa com imagem absoluta + overlay + campos
  - `imagem_lateral_full`: flex-row 50/50
  - `so_campos`: sem alteracao (layout atual)
- A imagem usa `object-cover` e `rounded` seguindo o container

### 5. `src/modules/formularios/pages/FormularioEditorPage.tsx`
- Buscar `configPopup` via hook `useConfigPopup` quando `formulario.tipo === 'popup'`
- Passar `configPopup` como prop para `FormPreview`

## Detalhes Tecnicos

### Seletor de Template (mini-previews)
Cada template sera representado por um bloco com:
- Fundo `bg-muted` com divisoes visuais simples (retangulos coloridos)
- Label abaixo: "Sem imagem", "Imagem a esquerda", etc.
- Grid: `grid grid-cols-3 gap-2`
- Tamanho: ~80x60px cada mini-preview

### Upload de Imagem
- Usa `compressMedia.ts` existente para compressao client-side
- Upload para `formularios/{formularioId}/popup-image.{ext}` no Supabase Storage
- Preview inline com `max-h-32 object-cover rounded`
- Limite: aceita JPG, PNG, WebP

### Renderizacao do Layout no Preview
O componente `FormPreview` recebera uma nova prop `popupLayout` com:
```text
{
  template: 'so_campos' | 'imagem_esquerda' | 'imagem_direita' | 'imagem_topo' | 'imagem_fundo' | 'imagem_lateral_full'
  imagemUrl: string | null
}
```

O wrapper do container sera condicional:
- Se template tem imagem e imagemUrl existe: renderiza o layout correspondente
- Se template tem imagem mas imagemUrl e null: mostra placeholder cinza com texto "Adicione uma imagem"
- Se template e `so_campos`: renderiza normalmente sem alteracao

### Estrutura CSS dos Templates
- `imagem_esquerda/direita`: `flex` com imagem `w-2/5` e campos `w-3/5`
- `imagem_topo`: `flex-col` com imagem `h-48` e campos flex-1
- `imagem_fundo`: `relative` com imagem absolute inset-0 + overlay `bg-black/40`
- `imagem_lateral_full`: `flex` com ambos `w-1/2`
