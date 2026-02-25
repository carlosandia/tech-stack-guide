

## Remover Campo LinkedIn de Pessoas

### Resumo

Remover completamente o campo "LinkedIn" (slug `linkedin`) como campo do sistema para a entidade "pessoa". Isso envolve:
- Deletar o campo de todos os tenants existentes no banco
- Remover da funcao `criar_campos_sistema` para novos tenants
- Limpar todas as referencias no frontend

### Alteracoes

#### 1. Migracao SQL

- `DELETE FROM campos_customizados WHERE slug = 'linkedin' AND entidade = 'pessoa' AND sistema = true`
- Atualizar a funcao `criar_campos_sistema` removendo a linha do LinkedIn
- Reajustar a ordem dos campos seguintes (Cidade: 6, Estado: 7, CEP: 8)

#### 2. Frontend - Remover referencias ao LinkedIn

| Arquivo | O que remover/alterar |
|---|---|
| `src/modules/contatos/hooks/useCamposConfig.ts` | Remover `linkedin` de `SLUG_TO_FIELD_KEY`, `FIELD_KEY_TO_SLUGS`, `COLUMN_KEY_TO_SLUGS` e `FALLBACK_PESSOA` |
| `src/modules/contatos/schemas/contatos.schema.ts` | Remover `linkedin_url` do `PessoaFormSchema` |
| `src/modules/contatos/components/ContatoFormFieldsToggle.tsx` | Remover `linkedin_url` de `CAMPO_KEYS_PESSOA` |
| `src/modules/contatos/components/ContatoViewFieldsToggle.tsx` | Remover `linkedin_url` de `CAMPO_KEYS_PESSOA` |
| `src/modules/contatos/components/ContatoViewModal.tsx` | Remover linha de exibicao do `linkedin_url` |
| `src/modules/contatos/components/ContatoFormModal.tsx` | Remover inicializacao de `linkedin_url` nos defaults |
| `src/modules/contatos/components/ContatoColumnsToggle.tsx` | Remover entrada `linkedin` das colunas |
| `src/modules/contatos/components/ImportarContatosModal.tsx` | Remover `linkedin_url` das opcoes de mapeamento |
| `src/modules/negocios/hooks/useCamposDetalhes.ts` | Remover `linkedin: 'linkedin_url'` do `SLUG_TO_CONTATO_COLUMN` |
| `src/modules/negocios/components/modals/LigacaoModal.tsx` | Remover `linkedin` de `SLUG_ICON_MAP` e `SLUG_TO_CONTATO_COL` |
| `src/modules/formularios/components/campos/CampoConfigPanel.tsx` | Remover `pessoa.linkedin_url` das opcoes de mapeamento |

### Nota

A coluna `linkedin_url` continuara existindo na tabela `contatos` no banco de dados (nao sera dropada), pois pode conter dados historicos. Apenas o campo do sistema e as referencias no frontend serao removidos.

