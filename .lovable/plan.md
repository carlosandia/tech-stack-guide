
# Correcao de Matching de Canal: Case-Sensitive e Normalizacao

## Problema Raiz

Quando voce filtra por "Panfleto" ou "Meta Ads" no funil, o sistema nao encontra leads porque:

1. **A funcao SQL `fn_canal_match` faz comparacao case-sensitive no branch ELSE** — o canal de investimento salvo como `panfleto` e comparado com `o.origem` que pode estar como `Panfleto`, `PANFLETO` ou `panfleto`. Se nao bater exatamente, retorna zero.

2. **A geracao de slug no widget de investimento e diferente da geracao de slug nas origens** — O `InvestModeWidget` faz `toLowerCase().replace(/[^a-z0-9]+/g, '_')` mas o `generateSlug` das origens faz `toLowerCase().normalize('NFD').replace(acentos)...`. Sem a normalizacao NFD, acentos podem gerar slugs diferentes.

3. **O campo `origem` na oportunidade armazena o slug da tabela `origens`** — entao o matching deve comparar slug (investimento) com slug (origem da oportunidade), ambos em lowercase.

## Solucao

### 1. Corrigir `fn_canal_match` — branch ELSE case-insensitive

Alterar a funcao SQL para usar `LOWER()` em ambos os lados da comparacao:

```sql
ELSE
  LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) = LOWER(p_canal)
```

Isso garante que `panfleto` = `Panfleto` = `PANFLETO`.

**Arquivo**: Nova migration SQL

### 2. Normalizar slug no InvestModeWidget

Alinhar a funcao de slug do widget de investimento com a funcao `generateSlug` das origens (adicionar `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`). Assim, "Indicacao" gera `indicacao` em ambos os lugares.

**Arquivo**: `src/modules/app/components/dashboard/InvestModeWidget.tsx` — funcao `handleAdicionarCanalLivre`

### 3. Nao permitir caracteres especiais na criacao livre de canal

A funcao de slug ja remove caracteres especiais (`replace(/[^a-z0-9]+/g, '_')`). Basta adicionar a normalizacao de acentos para ficar identica a `generateSlug`.

## Sobre a pergunta "tem que usar o mesmo nome?"

**Sim, mas o sistema cuida disso automaticamente.** Quando o usuario seleciona uma origem da lista (ex: "Panfleto" com slug `panfleto`) e registra investimento selecionando da mesma lista, o slug e identico. O LOWER no SQL e uma protecao extra para casos edge.

A lista de canais no widget de investimento ja puxa as origens cadastradas do banco, entao o usuario nao precisa digitar — basta selecionar da lista e o slug sera o mesmo.

## Resultado Esperado

- Filtrar por "Panfleto" mostra leads cuja origem = `panfleto` (case-insensitive)
- Filtrar por "Meta Ads" continua funcionando via mapeamento UTM existente
- Slugs normalizados: acentos, maiusculas e caracteres especiais tratados de forma identica em todo o sistema
