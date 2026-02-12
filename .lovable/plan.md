
# Correcao: Campos Dinamicos no Select de Automacoes

## Problema
O select de "Atualizar campo (Contato)" exibe uma categoria "Endereco" separada, que nao existe no sistema global de campos (`/configuracoes/campos`). O sistema tem apenas 3 categorias: **Pessoa**, **Empresa** e **Oportunidade**.

## O que existe hoje no banco (`campos_customizados`)
- **Pessoa (sistema):** Nome, Sobrenome, Email, Telefone, Cargo, LinkedIn
- **Pessoa (custom):** resultado pessoa
- **Empresa (sistema):** Nome Fantasia, Razao Social, CNPJ, Email, Telefone, Website, Segmento de Mercado, Porte
- **Empresa (custom):** resultado empresa, teste
- **Oportunidade (custom):** resultado oportunidade

Os campos de endereco (CEP, logradouro, etc.) sao colunas diretas da tabela `contatos`, nao sao campos customizados. Pertencem logicamente ao contato (pessoa).

## Solucao

Refatorar o `CamposDinamicosSelect` em `AcaoConfig.tsx` para:

1. **Remover o array hardcoded `CAMPOS_ENDERECO`** como grupo separado
2. **Mover os campos de endereco para dentro do grupo "Pessoa"**, pois sao colunas da tabela contatos que se aplicam a pessoas
3. **Remover os arrays hardcoded `CAMPOS_CONTATO_PESSOA` e `CAMPOS_CONTATO_EMPRESA`** e substituir pela consulta real ao banco via `useCampos`
4. **Para contato:** Usar os campos do `campos_customizados` (sistema + custom) de `pessoa` e `empresa`, adicionando os campos de endereco e campos extras da tabela (`status`, `origem`, `observacoes`) no grupo Pessoa
5. **Para oportunidade:** Manter campos hardcoded da tabela `oportunidades` (titulo, valor, etc.) + carregar customizados da entidade `oportunidade`

## Estrutura final do select

**Atualizar campo (Contato):**
- **Pessoa**: Nome, Sobrenome, Email, Telefone, Cargo, LinkedIn, Status, Origem, Observacoes, CEP, Logradouro, Numero, Complemento, Bairro, Cidade, Estado + campos custom de pessoa
- **Empresa**: Nome Fantasia, Razao Social, CNPJ, Email, Telefone, Website, Segmento, Porte + campos custom de empresa

**Atualizar campo (Oportunidade):**
- **Oportunidade**: Titulo, Valor, Tipo valor, Moeda, Previsao fechamento, Observacoes, Recorrente, etc.
- **UTM**: UTM Source, Campaign, Medium, Term, Content
- **Customizados**: campos custom da entidade oportunidade

## Detalhes tecnicos

### Arquivo alterado
`src/modules/automacoes/components/panels/AcaoConfig.tsx` - funcao `CamposDinamicosSelect`

### Logica
- Carregar `useCampos('pessoa')`, `useCampos('empresa')`, `useCampos('oportunidade')` conforme a entidade
- Para contato: separar em 2 optgroups (Pessoa e Empresa), colocando campos sistema do banco + campos extras da tabela contatos (endereco, status, origem) + campos custom
- Para oportunidade: manter hardcoded os campos da tabela oportunidades (nao estao em campos_customizados) + adicionar optgroup de customizados da entidade oportunidade
- Nao altera banco, nao altera outros modulos, apenas refatora a logica de montagem do select
