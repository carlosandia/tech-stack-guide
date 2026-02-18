

## Melhorias no Sistema de Correção Ortográfica — Módulo /conversas

Análise dos problemas atuais e proposta de melhorias para facilitar a escrita do usuário.

---

### Problemas Identificados

1. **Dicionário com entradas desnecessárias**: Palavras como `obrigado`, `obrigada`, `garantia`, `proposta`, `contrato`, `metodologia`, `tecnologia`, `aqui`, `pra`, `entretanto`, `todavia` estão no dicionário mas a sugestão é a mesma palavra — nunca disparam correção útil.

2. **Falta de abreviaturas**: O teclado do celular (imagem de referência) sugere expansões como `Vc` → `Você`, `Vcs` → `Vocês`. O sistema atual não tem isso.

3. **Sugestão só aparece enquanto digita a palavra**: No celular, a sugestão aparece para a palavra completa. No sistema atual, se o usuário digitar "sao " (com espaço), a barra some porque o cursor já passou da palavra.

4. **Sem auto-substituição no espaço**: No teclado do celular, ao pressionar espaço a sugestão principal é aplicada automaticamente. Isso acelera muito a digitação.

5. **Sem tecla Escape para dispensar**: O usuário não tem como ignorar a sugestão sem clicar no botão da palavra original.

---

### Plano de Melhorias

#### 1. Limpar dicionário — remover entradas sem correção útil

Remover todas as entradas onde a sugestão é idêntica à chave (ex: `'obrigado': ['obrigado']`). Essas entradas nunca disparam sugestão porque o hook já filtra quando `sugestoes.some(s => s === palavra)`.

**Entradas a remover**: `pra`, `entretanto`, `todavia`, `aqui`, `obrigado`, `obrigada`, `metodologia`, `tecnologia`, `garantia`, `comercial`, `proposta`, `contrato`.

**Arquivo**: `src/modules/conversas/utils/dicionario-correcoes.ts`

---

#### 2. Adicionar abreviaturas comuns do dia a dia

Novo bloco no dicionário com abreviaturas frequentes em mensagens de WhatsApp/chat:

| Abreviatura | Expansão |
|-------------|----------|
| vc | você |
| vcs | vocês |
| tb | também |
| tbm | também |
| pq | porque, por que |
| q | que |
| cmg | comigo |
| ctg | contigo |
| msg | mensagem |
| msgs | mensagens |
| qdo | quando |
| qto | quanto |
| qts | quantos |
| hj | hoje |
| dps | depois |
| blz | beleza |
| obg | obrigado |
| vlw | valeu |
| pfv | por favor |
| td | tudo |
| tds | todos |
| ngm | ninguém |
| agr | agora |
| msm | mesmo |
| qse | quase |
| mto | muito |
| mta | muita |
| tmj | tamo junto |
| flw | falou |
| abs | abraços |
| bjs | beijos |
| pls | por favor |
| add | adicionar |
| info | informação |
| ref | referência |

**Arquivo**: `src/modules/conversas/utils/dicionario-correcoes.ts`

---

#### 3. Melhorar detecção — considerar palavra recém-completada

Alterar o hook `useAutoCorrect` para detectar a **última palavra completada** (antes do espaço), não apenas a palavra parcial no cursor. Isso permite que a barra apareça após o usuário terminar de digitar a palavra e apertar espaço.

Lógica: se o caractere imediatamente antes do cursor é espaço, olhar a palavra anterior ao espaço.

**Arquivo**: `src/modules/conversas/hooks/useAutoCorrect.ts`

---

#### 4. Auto-substituição ao pressionar Espaço

Quando a barra de sugestão está visível e o usuário pressiona **Espaço**, aplicar automaticamente a primeira sugestão (comportamento do teclado do celular). O usuário pode:
- **Espaço**: aceita a primeira sugestão automaticamente
- **Clicar no chip**: escolhe uma sugestão específica
- **Escape**: dispensa a sugestão e mantém a palavra original
- **Continuar digitando**: a barra atualiza ou some

**Arquivo**: `src/modules/conversas/components/ChatInput.tsx` (handleKeyDown)

---

#### 5. Dispensar com Escape

Adicionar estado `dismissed` no ChatInput que é setado ao pressionar Escape. Resetar quando a palavra muda.

**Arquivo**: `src/modules/conversas/components/ChatInput.tsx`

---

### Resumo de Arquivos Impactados

| Arquivo | Tipo | Ação |
|---------|------|------|
| `src/modules/conversas/utils/dicionario-correcoes.ts` | Existente | Limpar entradas inúteis + adicionar abreviaturas |
| `src/modules/conversas/hooks/useAutoCorrect.ts` | Existente | Detectar palavra completada (após espaço) |
| `src/modules/conversas/components/ChatInput.tsx` | Existente | Auto-substituição no Espaço + Escape para dispensar |

---

### Detalhes Técnicos

**Hook `useAutoCorrect` — nova lógica de detecção:**

```typescript
// Se cursor está após espaço, olhar palavra anterior
if (cursorPos > 0 && texto[cursorPos - 1] === ' ') {
  let end = cursorPos - 1
  let start = end
  while (start > 0 && /\S/.test(texto[start - 1])) start--
  palavra = texto.slice(start, end)
  // range = { start, end }
}
```

**ChatInput — auto-substituição no Espaço:**

```typescript
const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Escape' && autoCorrect) {
    setDismissedWord(autoCorrect.palavraOriginal)
    return
  }
  if (e.key === ' ' && autoCorrect && !dismissed) {
    // Aplicar primeira sugestão antes de inserir o espaço
    handleAutoCorrectSelect(autoCorrect.sugestoes[0])
    return // o espaço será inserido normalmente após a substituição
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
```

**Estado de dismiss:**

```typescript
const [dismissedWord, setDismissedWord] = useState<string | null>(null)
// Mostrar barra apenas se não foi dispensada para esta palavra
const showAutoCorrect = autoCorrect && dismissedWord !== autoCorrect.palavraOriginal
```

---

### Garantias

- Nenhuma mudança visual nos componentes existentes
- Comportamento idêntico ao teclado do celular (imagem de referência)
- Performance mantida: O(1) lookup no dicionário
- Sem chamadas de rede
- Abreviaturas são aditivas (não quebram correções existentes)
- Auto-substituição no espaço pode ser desfeita com Ctrl+Z (undo nativo do textarea)

