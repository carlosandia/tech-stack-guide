

## Corretor Ortografico Inline — Modulo /conversas

Sistema de sugestoes de correcao ortografica em tempo real no ChatInput, similar ao teclado do celular (conforme imagem de referencia).

---

### Abordagem

Combinacao de duas camadas:

1. **Nativa do browser**: Ativar `spellcheck="true"` e `lang="pt-BR"` no textarea para sublinhado vermelho nativo em palavras incorretas (funciona com right-click para corrigir).

2. **Barra de sugestoes customizada**: Componente visual acima do textarea que detecta a palavra sendo digitada e mostra sugestoes de correcao em chips clicaveis (identico ao teclado do celular na imagem).

---

### UX da Barra de Sugestoes

- Aparece **acima do textarea**, dentro do container do input
- Mostra ate **3 sugestoes** lado a lado: a palavra original entre aspas + ate 2 correcoes
- Ao clicar numa sugestao, substitui a palavra atual no texto
- Desaparece quando a palavra esta correta ou o usuario continua digitando
- Animacao suave de entrada (fade + slide-up)
- Segue design system: `bg-muted`, `rounded-md`, `text-sm`, bordas `border-border`

Layout visual:

```text
+-----------------------------------------------+
|  "Sao"  |  Sao  |  [ Sao ]                    |  <-- barra de sugestoes
+-----------------------------------------------+
| [emoji] [+]  Digite uma mensagem...  [mic]    |  <-- textarea
+-----------------------------------------------+
```

---

### Dicionario de Correcoes PT-BR

Um mapa estatico com as correcoes mais comuns de acentuacao em portugues:

- `sao` -> `Sao`, `sao` (original entre aspas)
- `nao` -> `nao`
- `voce` -> `voce`
- `tambem` -> `tambem`
- `ja` -> `ja`
- `so` -> `so`
- `ate` -> `ate`
- `obrigacao` -> `obrigacao`
- `informacao` -> `informacao`
- `entao` -> `entao`
- ~200 palavras mais comuns sem acento

O dicionario sera um arquivo separado (`src/modules/conversas/utils/dicionario-correcoes.ts`) para facil manutencao e expansao.

---

### Logica de Deteccao

1. A cada mudanca no texto, extrair a **ultima palavra** sendo digitada (antes do cursor)
2. Converter para lowercase e buscar no dicionario
3. Se houver match, mostrar a barra com sugestoes
4. Ao clicar na sugestao, substituir a palavra no texto preservando a posicao do cursor
5. A barra some apos 1 segundo sem match ou ao pressionar espaco apos aceitar

---

### Plano de Acao

| # | Acao | Arquivo |
|---|------|---------|
| 1 | Criar dicionario PT-BR de correcoes | `src/modules/conversas/utils/dicionario-correcoes.ts` |
| 2 | Criar hook `useAutoCorrect` | `src/modules/conversas/hooks/useAutoCorrect.ts` |
| 3 | Criar componente `SugestaoCorrecao` | `src/modules/conversas/components/SugestaoCorrecao.tsx` |
| 4 | Integrar no ChatInput + ativar spellcheck nativo | `src/modules/conversas/components/ChatInput.tsx` |

---

### Detalhes Tecnicos

**1. Dicionario (`dicionario-correcoes.ts`)**

Mapa `Record<string, string[]>` onde a chave e a palavra sem acento (lowercase) e o valor sao as sugestoes ordenadas por relevancia:

```typescript
export const CORRECOES_PT_BR: Record<string, string[]> = {
  'sao': ['Sao'],
  'nao': ['Nao'],
  'voce': ['Voce'],
  'tambem': ['Tambem'],
  'entao': ['Entao'],
  'ja': ['Ja'],
  'ate': ['Ate'],
  'so': ['So'],
  // ... ~200 palavras comuns
}
```

**2. Hook `useAutoCorrect`**

```typescript
function useAutoCorrect(texto: string, cursorPos: number) {
  // Extrai palavra atual antes do cursor
  // Busca no dicionario
  // Retorna { palavraOriginal, sugestoes, range }
}
```

**3. Componente `SugestaoCorrecao`**

- Recebe: `palavraOriginal`, `sugestoes[]`, `onSelect(correcao)`
- Renderiza chips clicaveis seguindo o design system
- Chip da palavra original com aspas (manter como esta)
- Chips de sugestao com destaque (`bg-accent`, `font-medium`)

**4. Integracao no ChatInput**

- Adicionar `spellcheck={true}` e `lang="pt-BR"` no textarea
- Renderizar `<SugestaoCorrecao>` entre os icones e o textarea
- Ao selecionar sugestao, substituir a palavra no texto e reposicionar cursor

---

### Arquivos impactados

| Arquivo | Tipo |
|---------|------|
| `src/modules/conversas/utils/dicionario-correcoes.ts` | Novo |
| `src/modules/conversas/hooks/useAutoCorrect.ts` | Novo |
| `src/modules/conversas/components/SugestaoCorrecao.tsx` | Novo |
| `src/modules/conversas/components/ChatInput.tsx` | Editado |

### Garantias

- Nenhum componente existente alterado visualmente
- ChatInput mantem todas as props e funcionalidades atuais
- Barra de sugestoes e aditiva (nao interfere no fluxo existente)
- Spellcheck nativo nao conflita com o sistema customizado
- Performance: busca no dicionario e O(1) (hashmap), sem debounce necessario
- Dicionario estatico, sem chamadas de rede

