

## Configuracao do Teclado: Blocklist + Seletor de Idioma + Dica UX

Implementacao completa do painel de configuracoes do teclado com tres funcionalidades: blocklist persistente de palavras, seletor de idioma e dica visual "Esc ignora" na barra de sugestao.

---

### Arquivos a criar

#### 1. `src/modules/conversas/hooks/useBlockedWords.ts`

Hook para gerenciar palavras bloqueadas via localStorage (`crm:autocorrect:blocked`):

- `blocked: string[]` — lista reativa
- `blockWord(word)` — adiciona e persiste
- `unblockWord(word)` — remove e persiste
- `isBlocked(word)` — verifica

---

#### 2. `src/modules/conversas/hooks/useKeyboardLanguage.ts`

Hook para gerenciar idioma do teclado via localStorage (`crm:autocorrect:lang`):

- `language: string` — idioma ativo (default: `'pt-br'`)
- `setLanguage(lang)` — altera e persiste
- Idiomas disponiveis inicialmente: `pt-br` (Portugues BR) e `off` (Desativado — sem sugestoes)
- Estrutura preparada para adicionar `en`, `es` futuramente com novos dicionarios

---

#### 3. `src/modules/conversas/components/ConfiguracaoTeclado.tsx`

Painel renderizado quando a tab "Teclado" esta ativa. Conteudo:

**Secao 1 — Idioma do teclado:**
- Select (shadcn) com opcoes: "Portugues (BR)" (padrao), "Desativado"
- Label: "Idioma das sugestoes"

**Secao 2 — Palavras ignoradas:**
- Titulo: "Palavras ignoradas"
- Subtitulo: "Palavras que voce marcou para nao receber sugestao. Clique no X para voltar a sugerir."
- Tags/chips com botao X para cada palavra bloqueada
- Estado vazio: "Nenhuma palavra ignorada. Pressione Esc na barra de sugestao para adicionar."

---

### Arquivos a modificar

#### 4. `src/modules/conversas/components/ChatInput.tsx`

Alteracoes:

- **Novo tipo de tab**: `type InputTab = 'responder' | 'nota' | 'teclado'`
- **Nova tab na barra**: icone `Settings2` (lucide), label "Teclado"
- **Renderizacao condicional**: quando `tab === 'teclado'`, renderizar `<ConfiguracaoTeclado>` no lugar do textarea
- **Integrar `useBlockedWords`**: no Escape, chamar `blockWord()` + toast informativo
- **Integrar `useKeyboardLanguage`**: quando `language === 'off'`, `showAutoCorrect = false`
- **showAutoCorrect atualizado**: `autoCorrect && !dismissed && !isBlocked(palavra) && language !== 'off'`

---

#### 5. `src/modules/conversas/components/SugestaoCorrecao.tsx`

Adicionar hint discreto a direita da barra:

```
<span className="text-[10px] text-muted-foreground/50 ml-auto whitespace-nowrap">
  Esc ignora
</span>
```

---

#### 6. `src/modules/conversas/hooks/useAutoCorrect.ts`

Receber parametro `enabled: boolean` para desativar quando idioma = `off`. Quando `!enabled`, retorna `null` imediatamente.

---

### Resumo de arquivos

| Arquivo | Tipo | Acao |
|---------|------|------|
| `src/modules/conversas/hooks/useBlockedWords.ts` | Novo | Hook localStorage blocklist |
| `src/modules/conversas/hooks/useKeyboardLanguage.ts` | Novo | Hook localStorage idioma |
| `src/modules/conversas/components/ConfiguracaoTeclado.tsx` | Novo | Painel config teclado |
| `src/modules/conversas/components/ChatInput.tsx` | Editar | Nova tab + integrar hooks |
| `src/modules/conversas/components/SugestaoCorrecao.tsx` | Editar | Hint "Esc ignora" |
| `src/modules/conversas/hooks/useAutoCorrect.ts` | Editar | Param `enabled` |

---

### Detalhes tecnicos

**useKeyboardLanguage.ts:**

```typescript
const STORAGE_KEY = 'crm:autocorrect:lang'
const LANGUAGES = [
  { value: 'pt-br', label: 'Portugues (BR)' },
  { value: 'off', label: 'Desativado' },
] as const

export function useKeyboardLanguage() {
  const [language, setLang] = useState(() =>
    localStorage.getItem(STORAGE_KEY) || 'pt-br'
  )
  const setLanguage = (lang: string) => {
    setLang(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }
  return { language, setLanguage, LANGUAGES }
}
```

**ChatInput — logica Escape com blocklist:**

```typescript
if (e.key === 'Escape' && showAutoCorrect) {
  blockWord(autoCorrect!.palavraOriginal)
  setDismissedWord(autoCorrect!.palavraOriginal)
  toast.info(`"${autoCorrect!.palavraOriginal}" nao sera mais sugerida`)
  return
}
```

**useAutoCorrect — parametro enabled:**

```typescript
export function useAutoCorrect(texto: string, cursorPos: number, enabled = true) {
  return useMemo(() => {
    if (!enabled || !texto || cursorPos <= 0) return null
    // ... resto da logica
  }, [texto, cursorPos, enabled])
}
```

---

### Garantias

- Persistencia via localStorage — sobrevive refresh
- Nenhuma chamada de rede adicional
- Idioma padrao sempre pt-br
- Estrutura preparada para novos idiomas (basta adicionar dicionario + entrada no array LANGUAGES)
- UX clara: toast ao bloquear, hint visual, painel de gestao
- Reversivel: usuario pode desbloquear palavras e reativar idioma a qualquer momento

