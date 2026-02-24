

## Plano: Implementar Logica Contextual dos 4 Porques

### O Problema

A lingua portuguesa tem 4 formas de "porque", cada uma com uso diferente. Hoje o dicionario tem `pq` mapeado para `['porque', 'por que']` sem contexto -- o usuario precisa saber qual escolher. Alem disso, quando alguem digita `porque` no lugar errado, o sistema nao corrige.

### As 4 Regras

```text
1. "Por que"  → Inicio de pergunta ou antes de verbo
               Ex: "Por que voce fez isso?"

2. "Porque"   → Resposta/explicacao (= pois)
               Ex: "Fui porque precisei."

3. "Por que"  → Final de frase, antes de pontuacao
               Ex: "Nao sei por que."
               (Nota: a forma "por que" no final aceita
                tanto "por quê" quanto "por que")

4. "O porque" → Substantivo, precedido de artigo
               Ex: "Quero saber o porque."
               Correcao: "o porquê"
```

### Abordagem Tecnica

Em vez de tentar corrigir `porque` ja digitado (muito invasivo e impreciso), a estrategia e: **quando o usuario digitar `pq`, analisar o contexto para ordenar as sugestoes da forma mais provavel para a menos provavel**.

Isso funciona dentro da arquitetura atual sem mudancas estruturais.

---

### Arquivos a modificar

#### 1. Novo arquivo: `src/modules/conversas/utils/porques-contexto.ts`

Funcao pura que recebe o texto completo, a posicao da palavra `pq` e retorna as sugestoes ordenadas por probabilidade contextual.

Logica de deteccao:

```text
Regra 1: "pq" no inicio da frase (apos . ! ? ou inicio do texto)
  → Sugestoes: ["Por que", "Porque"]
  → Provavel pergunta, priorizar "Por que"

Regra 2: "pq" no meio da frase (nao e inicio)
  → Sugestoes: ["porque", "por que"]
  → Provavel explicacao, priorizar "porque"

Regra 3: "pq" precedido de artigo "o" ou "do" ou "pelo"
  → Sugestoes: ["porquê"]
  → E substantivo

Regra 4: "pq" seguido de ponto final ou interrogacao
  → Sugestoes: ["por quê", "por que"]
  → Final de frase
```

A funcao retorna `string[]` ordenado -- a primeira sugestao e a mais provavel.

#### 2. Modificar: `src/modules/conversas/hooks/useAutoCorrect.ts`

Antes de fazer o lookup no dicionario, verificar se a palavra e `pq` (ou variantes como `PQ`, `Pq`). Se for, chamar a funcao de contexto em vez do dicionario estatico.

Mudanca minima -- apenas um `if` antes da linha 51:

```text
if (key === 'pq') {
  // usar funcao contextual em vez do dicionario
  const sugestoes = resolverPorques(texto, start, end)
  return { palavraOriginal, sugestoes, start, end }
}
```

#### 3. Remover entrada do dicionario: `src/modules/conversas/utils/dicionario-correcoes.ts`

Remover a entrada `'pq': ['porque', 'por que']` do dicionario estatico, ja que agora sera tratada pela funcao contextual.

---

### Detalhes da deteccao de contexto

**Como saber se e inicio de frase:**
- Verificar o texto antes de `start` (ignorando espacos)
- Se o caractere anterior for `.`, `!`, `?`, ou se `start === 0` → inicio de frase

**Como saber se tem artigo antes:**
- Verificar a palavra imediatamente anterior a `pq`
- Se for `o`, `do`, `pelo`, `todo` → e substantivo → sugerir `porquê`

**Como saber se e final de frase:**
- Verificar o texto apos `end` (ignorando espacos)
- Se o caractere seguinte for `.`, `?`, `!`, ou fim do texto → final de frase

**Capitalizacao automatica:**
- Se inicio de frase, a primeira sugestao começa com maiuscula (`Por que`, `Porque`)

---

### Exemplos praticos de como vai funcionar

| Usuario digita | Contexto | Sugestoes mostradas |
|----------------|----------|---------------------|
| `pq voce...` | Inicio de frase | **Por que**, Porque |
| `fui pq precisei` | Meio de frase | **porque**, por que |
| `saber o pq` | Apos artigo "o" | **porquê** |
| `nao sei pq.` | Antes de ponto | **por quê**, por que |
| `pq?` | Antes de interrogacao | **Por quê**, Por que |

---

### O que NAO sera feito (e o motivo)

- **NAO corrigir `porque` ja digitado** → Muito invasivo. O usuario pode ter digitado a forma correta e o sistema nao tem 100% de certeza sem analise completa da frase
- **NAO tratar `por que` como duas palavras** → O sistema atual faz lookup de palavra unica, detectar pares de palavras exigiria refatoracao do hook inteiro
- **NAO bloquear nenhuma forma** → Todas as sugestoes sao opcionais, o usuario escolhe qual aplicar

### Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/modules/conversas/utils/porques-contexto.ts` | **Criar** -- funcao de analise contextual |
| `src/modules/conversas/hooks/useAutoCorrect.ts` | **Editar** -- adicionar if para `pq` antes do lookup |
| `src/modules/conversas/utils/dicionario-correcoes.ts` | **Editar** -- remover entrada `pq` |

