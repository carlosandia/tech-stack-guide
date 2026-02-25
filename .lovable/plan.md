
## Melhorar Qualidade de Correspondencia do Meta CAPI

### Contexto

A qualidade de correspondencia atual esta em 3.0/10. A tabela `contatos` ja possui campos de endereco (`endereco_cidade`, `endereco_estado`, `endereco_cep`) que nao estao sendo enviados. Alem disso, o `contato_id` pode ser usado como `external_id` e o `action_source` pode ser ajustado para `system_generated` (mais adequado para eventos server-side de CRM).

### Parametros que serao adicionados

| Parametro Meta | Campo no CRM | Impacto estimado |
|---|---|---|
| `external_id` | `contato_id` (SHA-256) | Alto (~51% melhoria) |
| `ct` (city) | `contatos.endereco_cidade` | Medio |
| `st` (state) | `contatos.endereco_estado` | Medio |
| `zp` (zip code) | `contatos.endereco_cep` | Medio |
| `country` | `"br"` (fixo, todos os contatos sao BR) | Baixo |
| `action_source` | Mudar de `"website"` para `"system_generated"` | Melhor precisao |
| `client_user_agent` | Removido (nao aplicavel para server-side) | Evita penalizacao |
| `client_ip_address` | Removido (nao aplicavel para server-side) | Evita penalizacao |

### O que NAO precisa mudar

- Nenhuma migracao SQL necessaria (campos ja existem na tabela `contatos`)
- Nenhuma alteracao no frontend
- Nenhuma alteracao nas triggers

### Alteracoes tecnicas

#### Arquivo: `supabase/functions/send-capi-event/index.ts`

1. Expandir o SELECT do contato para incluir `endereco_cidade`, `endereco_estado`, `endereco_cep`
2. Adicionar `external_id` com hash SHA-256 do `contato_id`
3. Adicionar `ct`, `st`, `zp` com hash SHA-256 quando disponveis
4. Adicionar `country` fixo como hash de `"br"`
5. Mudar `action_source` de `"website"` para `"system_generated"`
6. Remover `client_ip_address` e `client_user_agent` placeholder (nao aplicaveis para `system_generated`)

### Resultado esperado

O score de qualidade de correspondencia deve subir significativamente (estimativa: de 3.0 para 6.0-8.0) com o envio de `external_id`, dados de localizacao e o `action_source` correto.
