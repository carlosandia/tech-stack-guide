

## Captura de Leads Pre-Checkout na Pagina de Planos

### Problema
Quando o usuario clica em "Assinar", ele vai direto para o checkout do Stripe. Se desistir, nenhum dado foi capturado, e o time comercial perde a oportunidade de follow-up.

### Solucao

Criar um fluxo de **pre-cadastro** com modal antes do checkout, e exibir esses leads pendentes na area administrativa.

---

### 1. Nova tabela `pre_cadastros_saas`

Conforme o arquiteto de produto recomenda (separacao do Mundo SaaS), criar tabela dedicada para nao poluir `organizacoes_saas` com dados incompletos.

Campos:
- `id` (uuid, PK)
- `nome_contato` (varchar, NOT NULL)
- `email` (varchar, NOT NULL)
- `telefone` (varchar)
- `nome_empresa` (varchar, NOT NULL)
- `segmento` (varchar, NOT NULL)
- `plano_id` (uuid, FK planos)
- `periodo` (varchar) -- mensal/anual
- `is_trial` (boolean, default false)
- `status` (varchar, default 'pendente') -- pendente, checkout_iniciado, convertido, expirado
- `stripe_session_id` (varchar, nullable)
- `organizacao_id` (uuid, nullable, FK) -- preenchido quando convertido
- `utms` (jsonb)
- `criado_em`, `atualizado_em`

Constraint de status: `pendente`, `checkout_iniciado`, `convertido`, `expirado`

---

### 2. Modal estilo Pipedrive na PlanosPage

Ao clicar em "Comprar agora" ou "Teste gratis agora", abre um modal (Dialog do shadcn/ui) com:

- **Nome completo** (input texto, obrigatorio)
- **Email** (input email, obrigatorio)
- **Telefone** (input com mascara BR)
- **Nome da Empresa** (input texto, obrigatorio)
- **Segmento** (select com mesmas opcoes do cadastro de organizacao: Software, Servicos, Varejo, etc.)

Botao do modal: "Continuar para o pagamento" (planos pagos) ou "Iniciar teste gratis" (trial).

---

### 3. Fluxo de dados

```text
1. Usuario clica "Comprar agora" ou "Teste gratis agora"
2. Modal abre e coleta dados
3. Dados salvos na tabela pre_cadastros_saas (status: pendente)
4. Edge Function create-checkout-session recebe o pre_cadastro_id
5. Atualiza status para checkout_iniciado + salva stripe_session_id
6. Redireciona para Stripe Checkout
7. Webhook de sucesso atualiza para convertido + vincula organizacao_id
```

O dado fica salvo **antes** do redirect para o Stripe, garantindo que mesmo sem concluir o checkout, o time comercial tem as informacoes.

---

### 4. Botoes atualizados na PlanosPage

- Planos pagos: "Comprar agora" (em vez de "Assinar")
- Plano Trial: "Teste gratis agora" (em vez de "Comecar Trial")

---

### 5. Exibicao no Admin - OrganizacoesPage

Adicionar na coluna STATUS da tabela de organizacoes um novo filtro/aba para "Pendentes" que lista os pre-cadastros que nao converteram.

Opcoes:
- Adicionar status `pendente` no filtro do dropdown existente
- Ao selecionar "Pendentes", buscar da tabela `pre_cadastros_saas` onde `status != 'convertido'`
- Exibir com badge laranja "Pendente" mostrando: empresa, contato (nome + email + telefone), segmento, plano desejado, data

O time comercial pode assim ver quem preencheu o formulario mas nao finalizou a compra.

---

### Secao Tecnica

**Migracao SQL:**
```text
CREATE TABLE pre_cadastros_saas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_contato varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  telefone varchar(50),
  nome_empresa varchar(255) NOT NULL,
  segmento varchar(100) NOT NULL,
  plano_id uuid REFERENCES planos(id),
  periodo varchar(10) DEFAULT 'mensal',
  is_trial boolean DEFAULT false,
  status varchar(20) DEFAULT 'pendente',
  stripe_session_id varchar(255),
  organizacao_id uuid REFERENCES organizacoes_saas(id),
  utms jsonb DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pre_cadastro_status CHECK (status IN ('pendente', 'checkout_iniciado', 'convertido', 'expirado'))
);

-- RLS: anon pode INSERT, super_admin pode SELECT/UPDATE
ALTER TABLE pre_cadastros_saas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON pre_cadastros_saas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "super_admin_all" ON pre_cadastros_saas FOR ALL USING (is_super_admin_v2());
```

**Arquivos a criar/editar:**

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx_pre_cadastros_saas.sql` | Criar tabela |
| `src/modules/public/components/PreCadastroModal.tsx` | Novo modal com formulario |
| `src/modules/public/pages/PlanosPage.tsx` | Integrar modal, renomear botoes |
| `supabase/functions/create-checkout-session/index.ts` | Aceitar pre_cadastro_id, atualizar status |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Adicionar filtro/listagem de pendentes |
| `src/modules/admin/services/admin.api.ts` | Funcoes para listar pre-cadastros |

**Componente PreCadastroModal:**
- Usa Dialog do radix-ui (ja instalado)
- React Hook Form + Zod para validacao
- Reutiliza constante SEGMENTOS de `organizacao.schema.ts`
- Salva direto no Supabase via client (anon INSERT)
- Apos salvar, chama create-checkout-session passando `pre_cadastro_id`

