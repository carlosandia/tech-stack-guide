
# Plano: Reestruturar Campos para Pessoas, Empresas e Oportunidades (3 Tabs)

## Problema Identificado

A estrutura atual tem **4 entidades** nos campos personalizados (`contato`, `pessoa`, `empresa`, `oportunidade`), mas na pratica o banco de dados usa uma tabela unica `contatos` com coluna `tipo` que diferencia entre `pessoa` e `empresa`. A entidade generica `contato` gera confusao porque:

1. O modulo `/contatos` (PRD-06) ja organiza tudo em **Pessoas** e **Empresas**
2. O formulario de criacao de contato (PRD-06 RF-010) ja separa campos por tipo (Pessoa vs Empresa)
3. Nao existe conceito de "campo geral" no padrao de mercado -- Pipedrive, HubSpot e RD Station usam apenas Pessoas + Empresas

## Solucao: Simplificar para 3 Tabs

Remover a entidade `contato` e redistribuir os campos nas entidades corretas:

| Tab | Campos do Sistema (bloqueados) | Campos Customizados |
|-----|-------------------------------|---------------------|
| **Pessoas** | Nome, Sobrenome, Email, Telefone, Cargo, LinkedIn | Admin adiciona livremente |
| **Empresas** | Nome Fantasia, Razao Social, CNPJ, Email, Telefone, Website, Segmento, Porte | Admin adiciona livremente |
| **Oportunidades** | (definidos no PRD-07) | Admin adiciona livremente |

Campos como Email e Telefone existem como campos de sistema em **ambas** as tabs, pois tanto Pessoa quanto Empresa possuem essas colunas na tabela `contatos`.

## Impacto e Seguranca

- A tabela `campos_customizados` esta **vazia** (zero registros), entao nao ha dados para migrar
- A coluna `entidade` no banco e do tipo `varchar`, nao e um enum do PostgreSQL -- pode receber qualquer valor sem migration
- A funcao SQL `criar_campos_sistema()` ja existe mas usa a entidade `contato` -- precisa ser atualizada

---

## Detalhes Tecnicos

### Arquivos a alterar

#### Frontend

1. **`src/modules/configuracoes/schemas/campos.schema.ts`**
   - Remover opcao `contato` do `entidadeOptions`
   - Atualizar enum Zod para aceitar apenas `pessoa`, `empresa`, `oportunidade`
   - Resultado: 3 tabs em vez de 4

2. **`src/modules/configuracoes/pages/CamposPage.tsx`**
   - Alterar estado inicial de `entidadeAtiva` de `'contato'` para `'pessoa'`

3. **`src/modules/configuracoes/components/campos/CampoFormModal.tsx`**
   - Remover referencia ao label "Contatos" no mapeamento de `entidadeLabel`

4. **`src/modules/configuracoes/services/configuracoes.api.ts`**
   - Remover `'contato'` do tipo `Entidade`
   - Tipo final: `'pessoa' | 'empresa' | 'oportunidade'`

#### Backend

5. **`backend/src/schemas/campos.ts`**
   - Remover `'contato'` do `EntidadeEnum`
   - Enum final: `z.enum(['pessoa', 'empresa', 'oportunidade'])`

6. **Funcao SQL `criar_campos_sistema`** (migration)
   - Reescrever para criar campos de sistema corretos:
     - **Pessoa (6 campos):** Nome, Sobrenome, Email, Telefone, Cargo, LinkedIn
     - **Empresa (8 campos):** Nome Fantasia, Razao Social, CNPJ, Email, Telefone, Website, Segmento de Mercado, Porte
   - Cada campo com `sistema: true`, tipo correto e flag `obrigatorio` adequada

### Campos de sistema a serem criados por tenant

**Entidade `pessoa`:**

| Nome | Slug | Tipo | Obrigatorio |
|------|------|------|-------------|
| Nome | nome | texto | Sim |
| Sobrenome | sobrenome | texto | Nao |
| Email | email | email | Nao |
| Telefone | telefone | telefone | Nao |
| Cargo | cargo | texto | Nao |
| LinkedIn | linkedin | url | Nao |

**Entidade `empresa`:**

| Nome | Slug | Tipo | Obrigatorio |
|------|------|------|-------------|
| Nome Fantasia | nome_fantasia | texto | Sim |
| Razao Social | razao_social | texto | Nao |
| CNPJ | cnpj | cnpj | Nao |
| Email | email | email | Nao |
| Telefone | telefone | telefone | Nao |
| Website | website | url | Nao |
| Segmento de Mercado | segmento | texto | Nao |
| Porte | porte | select | Nao |

### Sequencia de implementacao

1. Criar migration SQL que atualiza a funcao `criar_campos_sistema` com os novos campos
2. Atualizar o backend (schema do enum)
3. Atualizar o frontend (schema, page, modal, service types)
4. Verificar visualmente a tela de Campos
