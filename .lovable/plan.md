
# Plano: Compressao de Documentos + Produtos Vinculados na Oportunidade

## Resumo

Duas funcionalidades serao implementadas:

1. **Compressao de imagens no upload de documentos** - Quando o usuario subir uma imagem (JPG, PNG, WebP), ela sera comprimida no navegador antes do envio ao Supabase Storage, economizando espaco.

2. **Produtos vinculados na oportunidade** - Na lateral esquerda do modal de detalhes, abaixo dos campos da oportunidade, sera adicionado um bloco para vincular produtos cadastrados, com alternancia entre modo "Manual" (valor digitado) e "Produtos" (soma automatica dos itens).

---

## Parte 1: Compressao de Documentos/Imagens

### Comportamento

- Ao fazer upload de uma imagem (JPEG, PNG, WebP, GIF), o sistema comprime no client-side antes de enviar ao Storage.
- Imagens serao redimensionadas para max 1920px de largura/altura e comprimidas com qualidade 0.8.
- PDFs, DOCs, XLS e outros arquivos nao-imagem serao enviados sem alteracao.
- O tamanho registrado no banco sera o tamanho **apos** compressao.

### Arquivos a alterar

| Arquivo | Acao |
|---------|------|
| `src/modules/negocios/services/detalhes.api.ts` | Adicionar funcao `compressImage()` usando Canvas API. Chamar antes do upload no `uploadDocumento`. |
| `src/modules/negocios/components/detalhes/AbaDocumentos.tsx` | Nenhuma mudanca - a compressao e transparente na camada de service. |

### Logica de compressao

A funcao `compressImage(file: File)` usara a Canvas API nativa do browser:
1. Verificar se o MIME type e imagem (jpeg, png, webp, gif)
2. Criar um `Image` element e carregar via `URL.createObjectURL`
3. Calcular dimensoes proporcionais (max 1920px)
4. Desenhar no Canvas e exportar como JPEG com qualidade 0.8
5. Retornar novo `File` com tamanho reduzido

---

## Parte 2: Produtos Vinculados na Oportunidade

### Schema do banco (ja existente)

A tabela `oportunidades_produtos` ja existe com as colunas: `id`, `organizacao_id`, `oportunidade_id`, `produto_id`, `quantidade`, `preco_unitario`, `desconto_percentual`, `subtotal`, `criado_em`. RLS ja esta habilitado com politicas corretas.

### Migracao necessaria

Adicionar coluna `modo_valor` na tabela `oportunidades` para controlar se o valor e manual ou calculado pelos produtos:

```sql
ALTER TABLE oportunidades 
ADD COLUMN modo_valor varchar DEFAULT 'manual' 
CHECK (modo_valor IN ('manual', 'produtos'));
```

### UI - Bloco de Produtos na Lateral

No componente `DetalhesCampos.tsx`, abaixo da secao "Oportunidade" (campo Valor), sera adicionado:

1. **Toggle Manual/Produtos** - Dois botoes compactos lado a lado para alternar o modo.
2. **Modo Manual** (padrao atual) - Funciona como hoje: campo Valor editavel inline, MRR checkbox.
3. **Modo Produtos** - Mostra:
   - Total calculado (soma dos subtotais dos produtos vinculados)
   - Campo de busca compacto para adicionar produtos
   - Lista de produtos vinculados com quantidade, preco, desconto e subtotal
   - Botao para remover produto

### Comportamento do Modo Produtos

- Ao adicionar/remover/editar um produto, o valor da oportunidade e recalculado automaticamente.
- A busca de produtos usa a tabela `produtos` ja existente (via `produtosApi.listar`).
- Cada item vinculado permite editar: quantidade, preco unitario e desconto percentual.
- O subtotal de cada item = `(preco_unitario * quantidade) * (1 - desconto_percentual / 100)`.
- O valor total da oportunidade = soma de todos os subtotais.

### Arquivos a criar/alterar

| Arquivo | Acao |
|---------|------|
| `src/modules/negocios/components/detalhes/ProdutosOportunidade.tsx` | **Novo** - Componente compacto com busca, lista de produtos vinculados, edicao inline de quantidade/preco/desconto |
| `src/modules/negocios/components/detalhes/DetalhesCampos.tsx` | Integrar toggle Manual/Produtos e renderizar `ProdutosOportunidade` quando modo = 'produtos' |
| `src/modules/negocios/services/detalhes.api.ts` | Adicionar CRUD de `oportunidades_produtos`: listar, adicionar, atualizar, remover |
| `src/modules/negocios/hooks/useDetalhes.ts` | Adicionar hooks: `useProdutosOportunidade`, `useAdicionarProduto`, `useAtualizarProdutoOp`, `useRemoverProdutoOp` |
| `src/modules/negocios/services/negocios.api.ts` | Adicionar `modo_valor` ao type `Oportunidade` |

### Layout do componente ProdutosOportunidade (compacto)

```
OPORTUNIDADE
Valor                   [Manual] [Produtos]
-----------------------------------------------
(Modo Produtos ativo)
Total: R$ 1.500,00

[Q Buscar produto...]  

  Produto A    2x R$500  = R$1.000   [x]
  Produto B    1x R$500  = R$500     [x]
```

- Design compacto seguindo o design system: textos `text-xs` e `text-sm`, espacamento `gap-2`, botoes com `rounded-md`.
- Busca com debounce de 300ms, dropdown com resultados.
- Cada linha de produto com edicao inline ao clicar.

---

## Secao Tecnica - Detalhes de Implementacao

### 1. Compressao de Imagens (`detalhes.api.ts`)

```typescript
async function compressImage(file: File, maxDim = 1920, quality = 0.8): Promise<File> {
  const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp']
  if (!COMPRESSIBLE.includes(file.type)) return file
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) { resolve(file); return }
        resolve(new File([blob], file.name, { type: 'image/jpeg' }))
      }, 'image/jpeg', quality)
    }
    img.onerror = () => resolve(file) // fallback
    img.src = URL.createObjectURL(file)
  })
}
```

### 2. API Produtos da Oportunidade (`detalhes.api.ts`)

Novas funcoes no `detalhesApi`:
- `listarProdutosOportunidade(oportunidadeId)` - SELECT com JOIN no `produtos` para nome
- `adicionarProdutoOportunidade(oportunidadeId, produtoId, quantidade, precoUnitario, desconto)`
- `atualizarProdutoOportunidade(id, payload)` 
- `removerProdutoOportunidade(id)`
- `recalcularValorOportunidade(oportunidadeId)` - soma subtotais e atualiza `oportunidades.valor`

### 3. Migracao SQL

```sql
ALTER TABLE oportunidades 
ADD COLUMN IF NOT EXISTS modo_valor varchar DEFAULT 'manual';
```

### 4. Fluxo de dados

1. Usuario clica "Produtos" no toggle
2. `modo_valor` e atualizado para 'produtos' na oportunidade
3. Campo de busca aparece, usuario busca e seleciona produto
4. Registro e criado em `oportunidades_produtos` com preco do catalogo
5. `recalcularValorOportunidade` soma subtotais e atualiza `oportunidades.valor`
6. UI invalida queries e reflete o novo valor

### 5. Ordem de implementacao

1. Migracao SQL (adicionar `modo_valor`)
2. Compressao de imagens no upload
3. API + hooks de produtos da oportunidade
4. Componente `ProdutosOportunidade`
5. Integracao no `DetalhesCampos` com toggle Manual/Produtos
