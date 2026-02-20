
## Exibir Pagina Conectada no Card Meta Ads

### Problema
O card do Meta Ads mostra apenas o nome do usuario (`meta_user_name`), mas nao exibe a pagina do Facebook conectada. A informacao da pagina ja existe na tabela `paginas_meta` (campo `page_name`), vinculada pela `conexao_id`.

### Dados existentes
- Tabela `paginas_meta`: contem `conexao_id`, `page_name`, `page_id`, `ativo`
- Exemplo atual: pagina "Carlos Andia" vinculada a conexao `76bea5e5-...`

### Alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/modules/configuracoes/services/configuracoes.api.ts` | Adicionar campo `meta_page_name` na interface `Integracao`. Na query de Meta Ads, buscar tambem a `paginas_meta` associada e preencher o campo. |
| `src/modules/configuracoes/components/integracoes/ConexaoCard.tsx` | No bloco `PlataformaDetails` para `meta_ads`, exibir a pagina conectada com icone apropriado. |

### Detalhes tecnicos

**1. Interface Integracao** - Adicionar campo opcional:
```text
meta_page_name?: string | null
```

**2. Query de listagem (integracoesApi.listar)** - Apos montar as integracoes Meta, buscar as paginas associadas:
```text
- Fazer query em paginas_meta filtrando pelos conexao_ids das integracoes meta
- Para cada integracao meta, encontrar a pagina ativa e preencher meta_page_name
```

**3. ConexaoCard - PlataformaDetails** - No bloco `meta_ads`, adicionar linha com icone de pagina (ex: `FileText` ou `BarChart3`) mostrando o nome da pagina quando disponivel:
```text
Pagina: Carlos Andia
```

### Resultado esperado
O card Meta Ads exibira, alem do nome do usuario, o nome da pagina do Facebook conectada, melhorando a visibilidade para o usuario saber exatamente qual pagina esta vinculada.
