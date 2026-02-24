

# Correção: Importação limitada a 100 registros + Suporte XLSX

## Problema 1: Limite de 100 registros hardcoded

Na função `handleImport` (linhas 134 e 181), há um `Math.min(..., 100)` que limita a importação a apenas 100 registros, independente do tamanho do arquivo. Isso explica porque de 3.558 registros encontrados, apenas 88 foram importados (100 - 12 erros = 88).

## Problema 2: Sem suporte a XLSX

Na linha 121, quando o arquivo é `.xlsx`, o modal exibe um erro dizendo "Por enquanto, use CSV" em vez de processar o arquivo.

## Problema 3: Parser CSV frágil

A função `parseCSV` (linha 55-57) usa `line.split(separator)` simples, que quebra campos entre aspas que contenham o separador (ex: `"Rua X, 123"` seria dividido incorretamente).

---

## Plano de Correção

### 1. Remover limite de 100 e implementar batch processing

**Arquivo**: `src/modules/contatos/components/ImportarContatosModal.tsx`

- Remover `Math.min(contatos.length, 100)` nas linhas 134 e 181
- Usar `contatos.length` completo
- Manter processamento sequencial (1 a 1 via API) mas sem limite artificial
- Adicionar pequeno `await delay` a cada 50 registros para não travar a UI

### 2. Adicionar suporte XLSX com biblioteca `xlsx` (SheetJS)

- Instalar dependência `xlsx` (SheetJS Community Edition)
- No bloco `else` (linha 120-122), ao invés de mostrar erro, ler o arquivo XLSX no client-side usando `XLSX.read()` e converter para o mesmo formato `{ headers, rows }` que o CSV usa
- O restante do fluxo (mapeamento, importação) permanece idêntico

### 3. Melhorar parser CSV

- Implementar parser que respeita campos entre aspas (quoted fields)
- Tratar corretamente separadores dentro de aspas e aspas escapadas

### Resumo técnico de alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/contatos/components/ImportarContatosModal.tsx` | Remover limite 100, adicionar parse XLSX, melhorar parseCSV |
| `package.json` | Adicionar dependência `xlsx` |

