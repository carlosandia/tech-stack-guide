

## Correção do Email: Logo PNG e Padding Compatível com Email Clients

### Problemas Identificados

1. **Logo SVG nao renderiza** -- Gmail, Outlook e Yahoo nao suportam SVG em emails. O logo precisa ser servido como PNG.
2. **Padding interno nao aparece** -- O componente `Section` do React Email gera uma `<table>`, e Gmail ignora `padding` em elementos `<table>`. O padding precisa ser aplicado via cellPadding ou com elementos intermediarios que forcem o espacamento.

### O que suportam Gmail, Outlook e Yahoo

| Propriedade | Gmail | Outlook | Yahoo |
|---|---|---|---|
| inline styles | Sim | Sim | Sim |
| padding em `<td>` | Sim | Sim | Sim |
| padding em `<table>` | Nao | Parcial | Nao |
| border-radius | Sim | Nao | Sim |
| SVG (`<img src=".svg">`) | Nao | Nao | Nao |
| PNG/JPG (`<img>`) | Sim | Sim | Sim |
| box-shadow | Sim | Nao | Sim |

**Conclusao**: Nao é problema do Resend nem necessidade de SMTP. O problema é compatibilidade de CSS com clientes de email. A solucao é usar tecnicas compativeis com todos.

### Alteracoes

**Arquivo**: `supabase/functions/invite-admin/index.ts`

#### 1. Copiar logo PNG para o projeto

- Copiar `user-uploads://logo_renove.png` para `public/logo-email.png`
- Este arquivo sera servido em `https://crm.renovedigital.com.br/logo-email.png`

#### 2. Trocar referencia do logo

- De: `src: "https://crm.renovedigital.com.br/logo.svg"`
- Para: `src: "https://crm.renovedigital.com.br/logo-email.png"`

#### 3. Corrigir padding do content card

O `Section` do React Email renderiza como `<table>`. Para forcar padding visivel em todos os clients:

- Envolver o conteudo do `contentCard` em um elemento `Row` + `Column` do React Email (que geram `<tr><td>`)
- Aplicar o padding no `<td>` (Column), onde Gmail e Outlook respeitam
- Importar `Row` e `Column` dos componentes do React Email

Estrutura resultante:
```text
Section (contentCard - background branco, border, border-radius)
  └── Row
       └── Column (padding: 48px 40px) <-- padding aqui, no <td>
            ├── Heading
            ├── Text (intro)
            ├── Section (login info box)
            ├── Text (instrucao)
            ├── Button (CTA)
            ├── Hr
            ├── Text (link fallback)
            └── Text (link)
```

#### 4. Ajustes adicionais de compatibilidade

- Remover `boxShadow` do botao (Outlook ignora)
- Manter todos os estilos inline (ja esta assim)
- Garantir que `borderRadius` tenha fallback visual (cor de borda solida)

### Resultado esperado

- Logo aparecera corretamente em Gmail, Outlook e Yahoo como imagem PNG
- O conteudo tera espacamento interno visivel (padding) em todos os clientes de email
- Layout profissional e consistente entre plataformas

### Nota

Apos publicar o projeto, o arquivo `logo-email.png` estara disponivel no dominio de producao. Para testar, basta reenviar o convite.

