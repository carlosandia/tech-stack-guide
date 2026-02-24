

## Plano: Toggle de Ativar/Desativar Autocorretor

### O que sera feito

Adicionar um **Switch (toggle)** no painel "Teclado" do ChatInput para ativar/desativar o autocorretor. O estado ja e persistido via `localStorage` pelo hook `useKeyboardLanguage` (valor `'off'`). A mudanca e puramente de UI -- adicionar o switch e vincular ao estado existente.

### Como funciona hoje

O select de idioma ja tem a opcao "Desativado" (`off`), e quando selecionada, o `useAutoCorrect` recebe `enabled = false` e para de sugerir. A logica de negocio ja esta pronta.

### O que muda

Adicionar um Switch visivel no topo do painel de configuracao, **antes** do select de idioma. Quando desligado, o select de idioma fica desabilitado (cinza) e nenhuma sugestao aparece.

---

### Arquivo a modificar

#### `src/modules/conversas/components/ConfiguracaoTeclado.tsx`

1. Importar o componente `Switch` de `@/components/ui/switch`
2. Importar icone `Sparkles` do lucide-react (para representar autocorrecao)
3. Adicionar uma nova secao no topo com:
   - Label "Corretor ortografico" com icone
   - Switch toggle ao lado direito
   - Descricao curta abaixo: "Sugere correcoes enquanto voce digita"
4. O Switch fica `checked` quando `language !== 'off'`
5. Ao desligar: chama `onLanguageChange('off')`
6. Ao ligar: chama `onLanguageChange('pt-br')` (restaura o padrao)
7. Quando desligado, as secoes de idioma e palavras ignoradas ficam com `opacity-50` e `pointer-events-none`

### Layout do toggle

```text
+------------------------------------------+
| [icon] Corretor ortografico    [==ON==]   |
| Sugere correcoes enquanto voce digita     |
+------------------------------------------+
| [icon] Idioma das sugestoes               |
| [ Portugues (BR) v ]                      |
+------------------------------------------+
| [icon] Palavras ignoradas                 |
| ...                                       |
+------------------------------------------+
```

### Nenhuma alteracao de banco necessaria

A persistencia ja e feita via `localStorage` (`crm:autocorrect:lang`). O valor `'off'` desativa tudo. Nao precisa de coluna em tabela.

### Nenhum outro arquivo precisa mudar

O `ChatInput.tsx` ja consome `language !== 'off'` para controlar o `enabled` do `useAutoCorrect`. O toggle apenas altera o mesmo estado.

