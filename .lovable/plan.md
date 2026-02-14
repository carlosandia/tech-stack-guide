
# Plano de Correcao: Tipos de Campos em Modo Edicao

## Problemas Identificados

### 1. DetalhesCampos.tsx - FieldRow (modal de detalhes da oportunidade)
- **Booleano**: Nao tem tratamento no `renderEditField`. Cai no input de texto padrao ao inves de renderizar select Sim/Nao.
- **data_hora**: Recebe `inputType="date"` (linha 702/800) ao inves de `datetime-local`. O usuario nao consegue editar a hora.

### 2. DetalhesCampos.tsx - handleSaveCampoCustom
- **multi_select**: Cai no `default` do switch, salvando apenas `valor_texto`. Nao salva `valor_json` (array). Quando o sistema le de volta, `valor_json` esta null e perde dados.
- **texto_longo**: Funciona, mas renderiza como input de linha unica ao inves de textarea.

### 3. LigacaoModal.tsx - saveCustomField
- Usa heuristica `value.includes('|')` para detectar multi_select, mas nao trata corretamente `booleano`, `numero`, `decimal`, `data`, `data_hora` - tudo vai para `valor_texto`.
- Precisa receber o `campoTipo` para salvar na coluna correta.

### 4. LigacaoModal.tsx - getCustomValue
- Nao formata `booleano` (mostra "true"/"false" ao inves de "Sim"/"Nao").
- Nao formata datas (mostra ISO string).

---

## Correcoes Planejadas

### Arquivo 1: `src/modules/negocios/components/detalhes/DetalhesCampos.tsx`

**FieldRow.renderEditField** - Adicionar tratamento para:
- `booleano`: Renderizar `<select>` com opcoes "Sim"/"Não" (igual ao LigacaoModal)
- `texto_longo`: Renderizar `<textarea>` ao inves de input

**FieldRow props/inputType** - Corrigir nas chamadas:
- Campos `data_hora` devem receber `inputType="datetime-local"`

**handleSaveCampoCustom** - Adicionar case `multi_select`:
- Salvar `valor_texto` como pipe-delimited E `valor_json` como array JSON
- Garantir que `valor_json` tambem e populado para leitura consistente

### Arquivo 2: `src/modules/negocios/components/modals/LigacaoModal.tsx`

**saveCustomField** - Refatorar para receber `campoTipo` como parametro:
- `numero`/`decimal`: salvar em `valor_numero`
- `booleano`: salvar em `valor_booleano`
- `data`/`data_hora`: salvar em `valor_data`
- `multi_select`: salvar em `valor_json` + `valor_texto`
- Demais: salvar em `valor_texto`

**getCustomValue** - Receber campo tipo para formatacao:
- `booleano`: retornar "Sim"/"Nao"
- `data`/`data_hora`: formatar com `dd/MM/yyyy`
- `numero`/`decimal`: retornar numero formatado

**EditableInfoRow** - Ja trata `select`, `multi_select` e `booleano` corretamente. Nenhuma mudanca necessaria.

### Arquivo 3: `src/modules/contatos/components/ContatoFormModal.tsx`

- Ja trata `select`, `multi_select`, `booleano`, `telefone`, `texto_longo` corretamente.
- Nenhuma correcao necessaria.

### Arquivo 4: `src/modules/negocios/components/modals/ContatoInlineForm.tsx`

- Ja trata todos os tipos corretamente (`select`, `multi_select`, `booleano`, `telefone`, etc.).
- Nenhuma correcao necessaria.

### Arquivo 5: `src/modules/contatos/components/ContatoViewModal.tsx`

- Modal de visualizacao (somente leitura). Ja formata todos os tipos corretamente.
- Nenhuma correcao necessaria.

---

## Resumo das Alteracoes

| Arquivo | Correcao | Tipos Afetados |
|---------|----------|----------------|
| DetalhesCampos.tsx | FieldRow: add booleano select, texto_longo textarea | booleano, texto_longo |
| DetalhesCampos.tsx | inputType: data_hora -> datetime-local | data_hora |
| DetalhesCampos.tsx | handleSaveCampoCustom: add multi_select case com valor_json | multi_select |
| LigacaoModal.tsx | saveCustomField: tipagem correta por campo | numero, decimal, booleano, data, data_hora, multi_select |
| LigacaoModal.tsx | getCustomValue: formatacao por tipo | booleano, data, data_hora |
