
# Painel de Informacoes no Modal de Ligacao

## Objetivo
Expandir o `LigacaoModal` para exibir os dados completos da oportunidade, contato e empresa durante a chamada, permitindo que o usuario consulte as informacoes sem sair do modal.

## O que muda

### 1. Props do LigacaoModal
- Adicionar prop `oportunidadeId` (string) ao componente
- Usar o hook `useOportunidade(oportunidadeId)` ja existente para buscar todos os dados

### 2. Layout do Modal - Duas colunas (desktop) / Scroll (mobile)
O modal sera expandido de `sm:max-w-sm` para `sm:max-w-2xl` com layout dividido:

```text
+-----------------------------------+
|  HEADER (telefone + status)       |
+----------------+------------------+
| CONTROLES      | INFORMACOES      |
| (ligar/deslig) | (dados completos)|
|                |                  |
| Status chamada | OPORTUNIDADE     |
| Saldo          | - Valor          |
| Checklist      | - Responsavel    |
| Botao ligar    | - Prev. fech.    |
|                |                  |
|                | CONTATO          |
|                | - Nome/Sobrenome |
|                | - Email          |
|                | - Telefone       |
|                | - Cargo          |
|                | - LinkedIn       |
|                |                  |
|                | EMPRESA          |
|                | - Nome fantasia  |
|                | - Razao social   |
+----------------+------------------+
|  FOOTER (fechar)                  |
+-----------------------------------+
```

Em mobile, as duas colunas viram scroll vertical (controles em cima, informacoes embaixo).

### 3. Secoes de informacao exibidas (somente leitura)
- **Oportunidade**: valor (formatado R$), MRR, responsavel, previsao de fechamento, observacoes
- **Contato (pessoa)**: nome, sobrenome, email, telefone, cargo, LinkedIn
- **Empresa** (se vinculada): nome fantasia, razao social

### 4. Chamadores atualizados
Nos dois pontos que instanciam o `LigacaoModal`:
- `KanbanCard.tsx`: passar `oportunidadeId={oportunidade.id}`
- `DetalhesCampos.tsx`: passar `oportunidadeId` disponivel no contexto

---

## Detalhes tecnicos

### Arquivos modificados
- `src/modules/negocios/components/modals/LigacaoModal.tsx` - adicionar prop `oportunidadeId`, usar `useOportunidade`, renderizar painel de informacoes ao lado dos controles
- `src/modules/negocios/components/kanban/KanbanCard.tsx` - passar `oportunidadeId` ao `LigacaoModal`
- `src/modules/negocios/components/detalhes/DetalhesCampos.tsx` - passar `oportunidadeId` ao `LigacaoModal`

### Estilizacao (conforme Design System)
- Textos label: `text-[11px] text-muted-foreground uppercase tracking-wide`
- Textos valor: `text-xs text-foreground`
- Separadores entre secoes: `border-b border-border`
- Secao de informacoes com scroll independente (`max-h` + `overflow-y-auto`) para nao expandir o modal demais
- Icones Lucide consistentes com o modal de detalhes (DollarSign, User, Calendar, Mail, Building2, etc.)
