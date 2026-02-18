
## Adicionar botao "Solicite uma demonstracao" nos cards de planos

### Objetivo
Inserir um botao secundario "Solicite uma demonstracao" abaixo de cada botao principal (Teste gratis agora / Comprar agora) nos cards da pagina publica de planos. Ao clicar, abre um modal com o formulario embed de demonstracao.

---

### Alteracoes

**Arquivo:** `src/modules/public/pages/PlanosPage.tsx`

#### 1. Novo estado para controlar o modal de demonstracao
- Adicionar `const [demoModalOpen, setDemoModalOpen] = useState(false)`

#### 2. Botao "Solicite uma demonstracao" no card Trial (apos linha 363)
- Inserir um botao com estilo `ghost` / texto com cor `text-muted-foreground` e hover sutil
- Ao clicar: `setDemoModalOpen(true)`

#### 3. Botao "Solicite uma demonstracao" nos cards pagos (apos linha 446)
- Mesmo botao com mesmo estilo, abaixo do "Comprar agora"

#### 4. Modal de demonstracao (novo componente inline ou Dialog)
- Usar o componente `Dialog` do projeto
- Dentro do `DialogContent`, renderizar o script embed via `useEffect` + DOM injection:
  - Criar um `div` ref container
  - No `useEffect` (quando modal abrir), criar um `<script>` com `src="https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline"` e `data-form-slug="demonstracao-crm-mlrb6yoz"`
  - Appendar o script no container
  - Cleanup ao fechar

#### 5. Estilo do botao
- Cor secundaria/outline sutil para nao competir com o CTA principal
- Exemplo: `text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2`
- Centralizado, sem borda, estilo link discreto

---

### Secao Tecnica

**Unico arquivo modificado:** `src/modules/public/pages/PlanosPage.tsx`

Para injetar o script embed dentro do modal React, sera usado um `useRef` + `useEffect`:

```text
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!demoModalOpen || !containerRef.current) return
  const script = document.createElement('script')
  script.src = '...widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline'
  script.dataset.formSlug = 'demonstracao-crm-mlrb6yoz'
  script.async = true
  containerRef.current.appendChild(script)
  return () => { containerRef.current?.replaceChildren() }
}, [demoModalOpen])
```

O Dialog tera `max-w-2xl` para acomodar o formulario e titulo "Solicite uma demonstracao".
