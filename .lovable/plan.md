
# Plano: Vincular Pessoas a Empresas na Criacao/Edicao

## Problema
O modal de empresa ja possui a UI para selecionar pessoas vinculadas e envia `pessoa_ids` no payload. Porem, o `handleFormSubmit` em `ContatosPage.tsx` nunca processa esse campo -- ele simplesmente passa para a API que o ignora. Resultado: a vinculacao nunca acontece.

## Logica de vinculo
- Uma **Pessoa** possui coluna `empresa_id` que aponta para a **Empresa**
- Para vincular pessoas a uma empresa, basta fazer `UPDATE contatos SET empresa_id = <empresa_id> WHERE id IN (<pessoa_ids>)`
- Na edicao, tambem e necessario desvincular pessoas removidas (`SET empresa_id = null`)

## Alteracoes

### Arquivo: `src/modules/contatos/pages/ContatosPage.tsx`

**Na funcao `handleFormSubmit`**, em ambos os blocos (criacao e edicao):

1. Extrair `pessoa_ids` do `cleanData` e remove-lo antes de enviar para a API (a API nao conhece esse campo)
2. Apos a criacao/atualizacao do contato e dos campos custom, executar a vinculacao:

**Criacao de empresa:**
```
- Extrair pessoa_ids de cleanData (e deletar do payload)
- Apos salvar campos custom e segmentos, chamar supabase
  .from('contatos')
  .update({ empresa_id: novaEmpresa.id })
  .in('id', pessoaIds)
```

**Edicao de empresa:**
```
- Extrair pessoa_ids de cleanData (e deletar do payload)
- Apos salvar campos custom e segmentos:
  1. Desvincular pessoas removidas:
     supabase.from('contatos')
       .update({ empresa_id: null })
       .eq('empresa_id', editingContato.id)
       .eq('tipo', 'pessoa')
     (se houver pessoa_ids, adicionar .not('id', 'in', `(ids)`) )
  2. Vincular pessoas selecionadas:
     supabase.from('contatos')
       .update({ empresa_id: editingContato.id })
       .in('id', pessoaIds)
```

### Resumo das mudancas
- **1 arquivo modificado**: `src/modules/contatos/pages/ContatosPage.tsx`
- Nenhuma alteracao no banco de dados (a coluna `empresa_id` ja existe na tabela `contatos`)
- Nenhuma alteracao no modal (a UI de selecao de pessoas ja funciona corretamente)
