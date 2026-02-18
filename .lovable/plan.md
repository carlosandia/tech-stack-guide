

## Alteracoes: E-mail + Aceite de Termos no Modal de Checkout

### 1. Corrigir e-mail de contato

Trocar `contato@renovedigital.com.br` por `crm@renovedigital.com.br` em:

- `src/modules/public/pages/PoliticaPrivacidadePage.tsx` (linhas 240-241)
- `src/modules/public/pages/TermosServicoPage.tsx` (linhas 268-269)

---

### 2. Adicionar aceite de Termos e Politica de Privacidade no modal de pre-cadastro

Seguindo a pratica de grandes SaaS (Pipedrive, HubSpot, RD Station), o modal `PreCadastroModal` recebera:

- Um **checkbox obrigatorio** antes do botao de submit com o texto:
  > "Li e aceito os [Termos de Servico] e a [Politica de Privacidade]"
- Os links "Termos de Servico" e "Politica de Privacidade" abrirao um **dialog interno com scroll** (modal sobre modal), exibindo o conteudo completo sem sair da pagina — para nao interromper o fluxo de contratacao
- O checkbox sera validado via Zod (`aceite_termos: z.literal(true)`) — o botao so fica habilitado com o aceite
- O campo `aceite_termos` sera salvo como `true` no insert do `pre_cadastros_saas` junto com `aceite_termos_em` (timestamp) para registro juridico

### Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/modules/public/pages/PoliticaPrivacidadePage.tsx` | Trocar email para `crm@renovedigital.com.br` |
| `src/modules/public/pages/TermosServicoPage.tsx` | Trocar email para `crm@renovedigital.com.br` |
| `src/modules/public/components/PreCadastroModal.tsx` | Adicionar checkbox de aceite + modal inline de termos/privacidade |

### Detalhes tecnicos do checkbox + modal inline

O `PreCadastroModal` tera:

- Novo campo no schema Zod: `aceite_termos: z.literal(true, { errorMap: () => ({ message: 'Voce precisa aceitar os termos' }) })`
- Componente de checkbox nativo estilizado com Tailwind
- Dois componentes `Dialog` internos (um para Termos, outro para Privacidade) com `max-h-[60vh] overflow-y-auto` para scroll do conteudo
- O conteudo dos termos/privacidade sera extraido para constantes reutilizaveis ou renderizado inline de forma resumida com link para a pagina completa
- Abordagem recomendada: exibir resumo dos pontos principais no modal inline + link "Ver versao completa" apontando para `/termos` e `/privacidade`

Essa abordagem e a mesma usada por Pipedrive e HubSpot — garante conformidade juridica sem prejudicar a conversao do checkout.

