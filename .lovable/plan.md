
# Plano: Melhorias no Modal "Nova Oportunidade"

## Resumo dos Problemas Identificados

1. **Titulo editavel manualmente** - deveria ser gerado automaticamente no formato `[Nome Contato] - #[sequencia]`
2. **Campo de valor sem mascara** - exibe `type="number"` sem formatacao BRL
3. **Campo de telefone sem mascara** - no formulario inline de novo contato
4. **Secao de Produtos longe** - aparece apos a secao UTM, obrigando scroll desnecessario
5. **Produtos do catalogo nao aparecem** - busca exige digitar pelo menos 1 caractere; nao carrega lista automaticamente
6. **Sem suporte a MRR** - tabela `oportunidades` nao tem colunas de recorrencia; produto "Trafego Pago - Start" e MRR mas isso nao reflete no modal
7. **Dados incompletos do produto no dropdown** - nao mostra se e recorrente, periodo, unidade, categoria

---

## Etapas de Implementacao

### Etapa 1: Migracao de Banco - Adicionar colunas MRR na tabela `oportunidades`

A tabela `oportunidades` atualmente NAO possui colunas para recorrencia. Para suportar MRR, sera necessario adicionar:

- `recorrente` (boolean, default false) - indica se o valor e recorrente
- `periodo_recorrencia` (varchar, nullable) - 'mensal', 'trimestral', 'semestral', 'anual'

```sql
ALTER TABLE oportunidades
  ADD COLUMN recorrente boolean DEFAULT false,
  ADD COLUMN periodo_recorrencia varchar(20) DEFAULT NULL;
```

---

### Etapa 2: Atualizar API de Produtos (`negocios.api.ts`)

**Problema atual:** A funcao `listarProdutos` retorna apenas `id, nome, preco, sku` e exige texto de busca.

**Correcoes:**
- Expandir os campos retornados para incluir: `recorrente`, `periodo_recorrencia`, `moeda`, `unidade`, `categoria_id`
- Carregar TODOS os produtos ativos quando `busca` for vazia (sem exigir texto minimo)
- Buscar categorias pelo `categoria_id` para exibir nome da categoria no dropdown

**Correcao na funcao `criarOportunidade`:**
- Adicionar campos `recorrente` e `periodo_recorrencia` no payload de insercao

---

### Etapa 3: Titulo Auto-Gerado

**Comportamento atual:** O titulo e preenchido automaticamente como `[Nome] - Nova Oportunidade`, mas o campo e editavel e o usuario precisa digitar manualmente se quiser outro.

**Novo comportamento:**
- O campo de titulo sera **removido** do formulario (nao visivel ao usuario)
- O titulo sera gerado automaticamente no momento do submit: `[Nome do Contato] - #[N]`
- O `N` sera obtido contando as oportunidades existentes do contato + 1
- Exemplo: "Trafego Pago - Start - #1", "Joao Silva - #3"

---

### Etapa 4: Mascara de Moeda no Campo Valor

**Problema atual:** O campo usa `type="number"` que exibe "30000" sem formatacao.

**Correcao:**
- Criar funcao `formatCurrency` em `src/lib/formatters.ts` para formatar como `R$ 30.000,00`
- Criar funcao `unformatCurrency` para extrair o numero puro
- Substituir o input numerico por input de texto com mascara BRL
- O valor sera convertido para numero na hora do submit

---

### Etapa 5: Mascara de Telefone no Contato Inline

**Problema atual:** O campo de telefone no formulario "Criar nova pessoa/empresa" nao aplica mascara.

**Correcao:**
- Importar `formatTelefone` de `src/lib/formatters.ts` (ja existe)
- Aplicar a mascara no `onChange` do campo de telefone
- Enviar o valor sem formatacao (`unformatTelefone`) no submit

---

### Etapa 6: Reposicionar Secao de Produtos

**Problema atual:** A secao PRODUTOS aparece APOS a secao UTM (que e colapsavel), gerando scroll excessivo.

**Nova ordem das secoes no modal:**
1. CONTATO
2. OPORTUNIDADE (titulo auto, valor com mascara, toggle Manual/Produtos/MRR, responsavel, previsao)
3. PRODUTOS (aparece inline quando tipo_valor = 'produtos', DENTRO da secao Oportunidade)
4. UTM (colapsavel, no final)

---

### Etapa 7: Carregamento Automatico de Produtos

**Problema atual:** O dropdown de produtos so busca quando o usuario digita pelo menos 1 caractere.

**Correcao:**
- Carregar todos os produtos do catalogo global ao montar o modal (via `useEffect`)
- Exibir a lista completa quando o usuario clicar/focar no campo de busca
- Filtrar localmente conforme o usuario digita
- Exibir badge "MRR" e informacoes de categoria/periodo nos itens do dropdown
- Quando um produto MRR for adicionado, marcar automaticamente `recorrente = true` na oportunidade

---

### Etapa 8: Suporte a MRR no Formulario

**Novo campo no formulario:**
- Adicionar toggle "Recorrente (MRR)" ao lado do toggle Manual/Produtos
- Quando ativado, exibir select de periodo: Mensal, Trimestral, Semestral, Anual
- Quando tipo_valor = 'produtos' e o produto selecionado for recorrente, herdar o `periodo_recorrencia` do produto automaticamente
- Salvar `recorrente` e `periodo_recorrencia` na tabela `oportunidades`

---

## Detalhamento Tecnico

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/lib/formatters.ts` | Adicionar `formatCurrency()` e `unformatCurrency()` |
| `src/modules/negocios/services/negocios.api.ts` | Expandir `listarProdutos` (campos + busca vazia), atualizar `criarOportunidade` (recorrente, periodo) |
| `src/modules/negocios/components/modals/NovaOportunidadeModal.tsx` | Reescrever layout: titulo auto, mascara valor, mascara telefone, reposicionar produtos, toggle MRR, carregar produtos no mount |

### Migracao SQL

```sql
ALTER TABLE oportunidades
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodo_recorrencia varchar(20) DEFAULT NULL;
```

### Fluxo do Titulo Auto-Gerado

1. Usuario seleciona contato (existente ou cria novo)
2. No submit, buscar `COUNT(*)` de oportunidades daquele `contato_id`
3. Gerar titulo: `[Nome] - #[count + 1]`
4. Se contato novo (criado inline), usar o nome digitado

### Fluxo MRR

1. Usuario escolhe "Manual" e ativa toggle "Recorrente (MRR)"
2. Seleciona periodo (mensal, trimestral, etc.)
3. Digita valor com mascara BRL
4. No submit: `recorrente = true`, `periodo_recorrencia = 'mensal'`

OU

1. Usuario escolhe "Produtos"
2. Seleciona produto que e MRR (ex: "Trafego Pago - Start")
3. Sistema herda `recorrente = true` e `periodo_recorrencia = 'semestral'` do produto
4. Badge visual "MRR" aparece na tabela de produtos selecionados
