
# Correcao: Formulario de demonstracao nao carrega no modal

## Problema raiz

As edge functions `widget-formulario-loader` e `widget-formulario-config` **nao estao deployadas** (retornam 404). Alem disso, o `fetch` no PricingSection usa `import.meta.env.VITE_SUPABASE_URL` que retorna `undefined` em certos contextos, fazendo a URL ser `undefined/functions/v1/...` que retorna o HTML do SPA ao inves de JavaScript.

A abordagem de injetar scripts dinamicamente no DOM do React e inerentemente fragil e causa delays visiveis.

## Solucao proposta: Formulario React nativo

Ao inves de depender de edge functions para renderizar o formulario via script injection, construir um **componente React nativo** (`DemoFormModal`) que renderiza os campos diretamente. Isso garante:

- Carregamento **instantaneo** junto com o modal (zero delay)
- Sem dependencia de edge functions para renderizacao
- UX consistente com o resto da aplicacao
- Submissao via Supabase direto na tabela `submissoes_formularios`

Os campos do formulario "Demonstracao Gratuita" (slug: `demonstracao-crm-mlrb6yoz`, id: `2fa1f6a1-...`) sao:

1. **Nome e sobrenome** (texto)
2. **Telefone** (telefone_br com mascara)
3. **Email** (email)
4. **Nome da empresa** (texto)
5. **Tamanho do time comercial** (numero)

## Alteracoes

### 1. Criar componente `DemoFormModal.tsx`
**Arquivo:** `src/modules/public/components/landing/DemoFormModal.tsx`

- Dialog com titulo "Demonstracao Gratuita"
- 5 campos nativos React com validacao basica
- Mascara de telefone BR `(00) 00000-0000`
- Prefixo fixo com bandeira BR +55
- Botao "Solicitar uma demonstracao"
- Ao submeter: insere na tabela `submissoes_formularios` com o `formulario_id` correto
- Toast de sucesso e fecha o modal
- Sem necessidade de edge function para renderizar

### 2. Atualizar `PricingSection.tsx`
- Remover toda a logica de script injection (useEffect com fetch/script)
- Remover `demoContainerRef`
- Substituir o Dialog manual pelo novo `DemoFormModal`
- Passar `open` e `onOpenChange` como props

### Detalhes tecnicos

**Submissao do formulario:**
```text
INSERT INTO submissoes_formularios (
  formulario_id,    -- '2fa1f6a1-f4d0-4b8e-8d9a-de9da4034b48'
  dados,            -- { nome_e_sobrenome, telefone_br_mlrbc6o7, email_mlrbc399, texto_mlrbhq3a, numero_mlrbi1ys }
  ip,
  user_agent,
  utm_params,
  organizacao_id    -- (do formulario)
)
```

A submissao usa os nomes dos campos conforme cadastrados: `nome_e_sobrenome`, `telefone_br_mlrbc6o7`, `email_mlrbc399`, `texto_mlrbhq3a`, `numero_mlrbi1ys`.

O `organizacao_id` sera buscado do formulario para garantir que a submissao seja corretamente vinculada.

**Mascara de telefone:**
Reutilizar a mesma logica de mascara `(00) 00000-0000` ja existente no widget loader, porem implementada como React state handler.
