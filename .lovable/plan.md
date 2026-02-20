

## Correção: Constraint Unique + Token de Página

### Problema
A tabela `paginas_meta` não possui nenhuma constraint unique. O `upsert` na função `meta-sync` usa `onConflict: "organizacao_id,page_id"`, mas essa constraint não existe no banco. Resultado: o upsert falha silenciosamente e o campo `page_access_token_encrypted` fica `null`. Sem esse token, o webhook `meta-leadgen-webhook` não consegue buscar dados do lead na Graph API.

Dados atuais confirmam o problema:
- `page_access_token_encrypted` = **null**
- Nenhuma constraint na tabela

### Plano de Ação

**Passo 1 - Criar constraint unique no banco**

Executar SQL para adicionar a constraint:

```sql
ALTER TABLE paginas_meta
ADD CONSTRAINT paginas_meta_org_page_unique UNIQUE (organizacao_id, page_id);
```

Isso precisa ser feito via **Cloud View > Run SQL** ou diretamente pelo Supabase Dashboard.

**Passo 2 - Re-sincronizar**

Após criar a constraint, clicar em "Sincronizar" no card da integração Meta. O `meta-sync` vai executar o upsert corretamente e salvar o `page_access_token_encrypted`.

**Passo 3 - Validar**

Confirmar que o campo `page_access_token_encrypted` foi preenchido na tabela `paginas_meta`.

### Detalhes Técnicos

| Ação | Detalhe |
|------|---------|
| Tabela | `paginas_meta` |
| Constraint | `UNIQUE (organizacao_id, page_id)` |
| Impacto | Permite que o `upsert` com `onConflict` funcione corretamente |
| Arquivos alterados | Nenhum arquivo de código -- apenas DDL no banco |

Nenhuma alteração de código é necessária. O `meta-sync` já usa `onConflict: "organizacao_id,page_id"` corretamente -- só falta a constraint no banco para que funcione.

