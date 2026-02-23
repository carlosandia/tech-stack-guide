
# Programa de Parceiros com Gamificacao e Bonificacao

## Visao Geral

Transformar a configuracao atual (simples toggle de gratuidade) em um sistema de **niveis progressivos** com recompensas escalonadas, criando uma logica de atracao comercial mais robusta para parceiros.

## Conceito de Negocio: Niveis de Parceiro

Em vez de apenas "atingiu meta = ganha gratuidade", o parceiro progride por niveis com beneficios crescentes:

```text
+------------------+------------------+------------------+------------------+
|    BRONZE        |    PRATA         |    OURO          |    DIAMANTE      |
|  2 indicados     |  5 indicados     |  10 indicados    |  20 indicados    |
|                  |                  |                  |                  |
|  Comissao: 10%   |  Comissao: 12%   |  Comissao: 15%   |  Comissao: 20%   |
|  Bonus: -        |  Bonus: R$100    |  Bonus: R$300    |  Bonus: R$500    |
|  Gratuidade: Nao |  Gratuidade: Nao |  Gratuidade: Sim |  Gratuidade: Sim |
+------------------+------------------+------------------+------------------+
```

Cada nivel e **100% configuravel** pelo Super Admin na tela de Configuracoes > Parceiros.

## O que muda na tela de Configuracoes (Parceiros)

A secao "Programa de Gratuidade" sera substituida por uma secao mais completa: **"Niveis e Recompensas"**.

### Estrutura da nova secao:

1. **Percentual padrao de comissao** (mantem como esta)
2. **Toggle "Programa de Niveis"** (substitui o toggle de gratuidade)
3. **Lista de niveis configuravel** (quando ativado):
   - Cada nivel tem: Nome, Icone/Cor, Meta (indicados ativos), Comissao (%), Bonus (R$), Gratuidade (sim/nao)
   - Vem com 4 niveis pre-configurados (Bronze, Prata, Ouro, Diamante) mas o admin pode editar valores
4. **Carencia (dias)** - mantem: tempo minimo que indicado precisa estar ativo para contar
5. **Periodo de avaliacao (meses)** - mantem: janela de renovacao
6. **URL base de indicacao** (mantem, mas campo exibe apenas o path editavel, com dominio fixo)
7. **Observacoes internas** (mantem)

## O que muda na Pagina de Detalhes do Parceiro

O card de meta atual sera substituido por um **card de progresso gamificado** mostrando:
- Nivel atual do parceiro (com icone e cor)
- Barra de progresso ate o proximo nivel
- Beneficios atuais (comissao %, bonus, gratuidade)
- Proximo nivel e o que falta para atingi-lo

## O que muda na Listagem de Parceiros

A coluna "Meta" sera substituida por uma coluna "Nivel" mostrando o badge do nivel atual.

## Alteracoes no Schema do Banco (regras_gratuidade -> regras_niveis)

O campo JSONB `regras_gratuidade` sera expandido para suportar a nova estrutura de niveis. Compatibilidade retroativa mantida.

---

## Plano Tecnico Detalhado

### 1. Migration SQL - Expandir regras no JSONB

Nenhuma alteracao de schema na tabela e necessaria pois `regras_gratuidade` ja e JSONB. Apenas o conteudo muda. A migration atualiza o valor default do JSONB para incluir a estrutura de niveis.

### 2. Schema Zod (`parceiro.schema.ts`)

Adicionar schema do nivel:
```text
NivelParceiroSchema = z.object({
  nome: z.string(),           // "Bronze", "Prata", etc.
  meta_indicados: z.number(), // qtd indicados ativos necessarios
  percentual_comissao: z.number(), // % comissao neste nivel
  bonus_valor: z.number(),    // valor fixo de bonificacao (R$)
  gratuidade: z.boolean(),    // se ganha gratuidade neste nivel
  cor: z.string(),            // tailwind color key (amber, gray, yellow, blue)
})
```

Atualizar `ConfigProgramaParceiroSchema.regras_gratuidade` para incluir `niveis: NivelParceiroSchema[]`.

### 3. Hook `useParceiros.ts` - `useStatusMetaParceiro`

Refatorar para calcular o nivel atual baseado nos niveis configurados (encontrar o maior nivel cujo `meta_indicados <= indicadosAtivos`).

### 4. Tela de Configuracoes (`ConfiguracoesGlobaisPage.tsx`)

Refatorar `ConfigProgramaParceiroForm`:
- Substituir os 4 campos de meta por uma lista editavel de niveis
- Cada nivel exibido como um card inline com campos: nome, meta, comissao, bonus, gratuidade, cor
- Botao para resetar aos valores padrao
- URL base: mostrar dominio fixo + campo editavel para o path

### 5. Detalhes do Parceiro (`ParceiroDetalhesPage.tsx`)

- Novo card de progresso com barra visual
- Badge do nivel atual com icone e cor
- Lista dos beneficios desbloqueados

### 6. Listagem de Parceiros (`ParceirosPage.tsx`)

- Coluna "Meta" vira "Nivel" com badge colorido

### Arquivos a serem criados/editados:

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx.sql` | Migration para popular niveis default no JSONB |
| `src/modules/admin/schemas/parceiro.schema.ts` | Adicionar NivelParceiroSchema, expandir regras |
| `src/modules/admin/hooks/useParceiros.ts` | Refatorar useStatusMetaParceiro para niveis |
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | Redesenhar secao de niveis |
| `src/modules/admin/pages/ParceiroDetalhesPage.tsx` | Card de progresso gamificado |
| `src/modules/admin/pages/ParceirosPage.tsx` | Coluna nivel com badge |
| `src/integrations/supabase/types.ts` | Atualizar tipos se necessario |

**Nota sobre URL**: O campo `base_url_indicacao` sera separado em dominio fixo (exibido como texto, nao editavel) + path editavel (ex: `/cadastro`). O dominio sera extraido da URL atual salva no banco.
