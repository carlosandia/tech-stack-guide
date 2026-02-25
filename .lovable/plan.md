

## Adicionar Campos de Endereco (Cidade, Estado, CEP) como Campos do Sistema para Pessoa

### Contexto

Atualmente, os campos `endereco_cidade`, `endereco_estado` e `endereco_cep` ja existem na tabela `contatos` no banco de dados, mas **nao estao registrados como campos do sistema** para a entidade "pessoa" na tabela `campos_customizados`. Isso significa que eles nao aparecem no formulario de pessoa nem na pagina de configuracoes/campos.

Esses campos ja sao usados pela integracao Meta CAPI para melhorar a qualidade de correspondencia (parametros `ct`, `st`, `zp`), mas atualmente dependem de dados preenchidos apenas em empresas.

### O que sera feito

#### 1. Migracao SQL - Adicionar campos do sistema para tenants existentes

Uma migracao que insere os 3 campos como `sistema = true` na tabela `campos_customizados` para **todas as organizacoes existentes** que ainda nao possuem esses campos:

| Campo | Slug | Tipo | Ordem |
|---|---|---|---|
| Cidade | endereco_cidade | texto | 7 |
| Estado | endereco_estado | texto | 8 |
| CEP | endereco_cep | texto | 9 |

#### 2. Migracao SQL - Atualizar funcao `criar_campos_sistema`

Alterar a funcao para que novos tenants criados no futuro tambem recebam esses 3 campos automaticamente.

#### 3. Frontend - Mapeamentos no `useCamposConfig.ts`

Adicionar os novos slugs nos fallbacks e mapeamentos:
- `SLUG_TO_FIELD_KEY`: sem necessidade (slug = field key: `endereco_cidade`, `endereco_estado`, `endereco_cep`)
- `FALLBACK_PESSOA`: adicionar os 3 campos com labels adequados

#### 4. Frontend - Schema `PessoaFormSchema`

Adicionar `endereco_cidade`, `endereco_estado` e `endereco_cep` como campos opcionais no schema de formulario de pessoa.

#### 5. Frontend - Mapeamento `SLUG_TO_CONTATO_COLUMN` (Detalhes da Oportunidade)

Adicionar o mapeamento no hook `useCamposDetalhes.ts` para que os campos aparecam corretamente nos detalhes da oportunidade:

```text
endereco_cidade -> endereco_cidade
endereco_estado -> endereco_estado
endereco_cep    -> endereco_cep
```

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Nova migracao SQL | INSERT campos sistema para orgs existentes + ALTER funcao `criar_campos_sistema` |
| `src/modules/contatos/hooks/useCamposConfig.ts` | Adicionar fallbacks para os 3 campos |
| `src/modules/contatos/schemas/contatos.schema.ts` | Adicionar campos no `PessoaFormSchema` |
| `src/modules/negocios/hooks/useCamposDetalhes.ts` | Adicionar mapeamento `SLUG_TO_CONTATO_COLUMN` |

### Resultado esperado

- Os campos Cidade, Estado e CEP aparecerao automaticamente nos formularios de Pessoa (como campos do sistema, nao editaveis/removiveis pelo admin)
- Tenants existentes receberao os campos via migracao
- Novos tenants receberao automaticamente via `criar_campos_sistema`
- Quando preenchidos, os dados serao enviados automaticamente ao Meta CAPI (ja implementado no `send-capi-event`)

