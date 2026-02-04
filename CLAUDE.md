# CLAUDE.md - CRM Renove (CRMBeta)

Este arquivo orienta qualquer LLM ao trabalhar no projeto CRMBeta. Deve ser lido antes de sugerir mudancas de codigo, logica ou arquitetura.

---

## 1. Idioma e Conduta

- **Responder sempre em PT-BR.**
- **Regra de Ouro:** se houver duvida, pergunte ao desenvolvedor antes de agir.
- **Meta-Missao:** arquiteto senior focado em consistencia, seguranca multi-tenant e evolucao controlada.

---

## 2. Contexto do Sistema

### Produto
O **CRM Renove** e uma plataforma SaaS multi-tenant B2B que centraliza a gestao de relacionamento com clientes, integrando multiplos canais de marketing e vendas (WhatsApp, Instagram, Meta Ads, formularios) em uma interface unificada.

### Stack Oficial (Imutavel)

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| **Formularios** | React Hook Form + Zod |
| **Estado/Cache** | TanStack React Query |
| **Roteamento** | React Router |
| **Datas** | date-fns |
| **Backend** | Node.js + Express |
| **Banco** | PostgreSQL (Supabase) |
| **Autenticacao** | Supabase Auth + JWT |

### Portas Padrao
- Frontend: `8080`
- Backend: `3001`
- Alterar somente via `.env`

---

## 3. Arquitetura Multi-Tenant (Imutavel)

### Hierarquia de Roles

| Role | Escopo | Responsabilidades |
|------|--------|-------------------|
| **Super Admin** | Global (plataforma) | Cria tenants, Admins, integracoes globais, relatorios multi-tenant |
| **Admin** | Tenant (organizacao) | Gerencia membros, funis, contatos, negocios, configuracoes do tenant |
| **Member** | Tenant (limitado) | Opera leads e tarefas atribuidos a ele |

### Regras Fundamentais

1. **Isolamento de Tenant**
   - Toda tabela do CRM deve conter `organizacao_id`
   - Row Level Security (RLS) obrigatorio em todas tabelas
   - Queries sem filtro de tenant devem falhar por design

2. **Separacao de Conceitos**
   - Cliente do SaaS (tenant) ≠ Cliente do CRM (contato)
   - Nunca misture esses conceitos na mesma tabela

3. **Bootstrap do Sistema**
   - Usuario Super Admin pre-criado: `superadmin@renovedigital.com.br` / `carlos455460`
   - Super Admin cria tenants → Admin → Members
   - Sem Super Admin, nao existe forma de iniciar o sistema

---

## 4. Nomenclatura Padronizada

### PT-BR Obrigatorio

| Contexto | Padrao | Exemplo |
|----------|--------|---------|
| Interface | PT-BR com acentos | "Organizacao", "Negocios" |
| Banco de dados | PT-BR snake_case sem acento | `organizacoes_saas`, `contatos`, `oportunidades` |
| Codigo | camelCase internacional | `tenantId`, `userId`, `createdAt` |

### Nomes Proibidos no Banco
- `contacts`, `deals`, `accounts`, `users` (usar equivalentes em PT-BR)

### Tabelas do Mundo SaaS (Super Admin)
```
organizacoes_saas, assinaturas_saas, pagamentos_saas,
pre_cadastros_saas, usuarios, papeis, permissoes
```

### Tabelas do Mundo CRM (Admin/Member)
```
funis, etapas_funil, oportunidades, motivos_perda,
contatos, contatos_pessoas, contatos_empresas,
atividades, tarefas, integracoes, logs_integracoes, audit_log
```

---

## 5. Ordem de Implementacao dos PRDs

A implementacao segue fases definidas no PRD-00:

### Fase 0: Fundacao + Bootstrap (CRITICA)
```
PRD-01 → PRD-02 → PRD-03 → PRD-04 → PRD-14 (Super Admin)
```

### Fase 1: Configuracoes do Tenant
```
PRD-05 (Configuracoes)
```

### Fase 2: Core CRM
```
PRD-06 (Contatos) → PRD-07 (Negocios) → PRD-08 (Conexoes)
```

### Fase 3: Comunicacao e Produtividade
```
PRD-09 (Conversas) → PRD-10 (Tarefas)
```

### Fase 4: Avancado (Pos-MVP)
```
PRD-11 → PRD-12 → PRD-13 → PRD-15
```

**IMPORTANTE:** PRD-14 (Super Admin) vem ANTES de todos os modulos CRM porque e ele quem cria os tenants e Admins.

---

## 6. Autenticacao e Redirecionamento

### Padrao de Autenticacao (Supabase)
```typescript
import { supabase } from '@/lib/supabase';

// Obter usuario autenticado
const { data: { user }, error } = await supabase.auth.getUser();
const tenantId = user?.user_metadata?.tenant_id;
const role = user?.user_metadata?.role;
```

### Redirecionamento por Role
```typescript
function handleLoginSuccess(user) {
  switch (user.role) {
    case 'super_admin':
      navigate('/admin');  // Painel Super Admin
      break;
    case 'admin':
    case 'member':
      navigate('/app');    // Painel CRM do Tenant
      break;
    default:
      navigate('/login?error=invalid_role');
  }
}
```

### Regras de Autenticacao
- Nunca processe JWT manualmente
- Nunca passe `userId` por props (use contexto)
- Sempre valide `tenant_id` em operacoes de servico
- RLS e a ultima linha de defesa, nao a unica

---

## 7. Tipagem com Zod

### Padrao Obrigatorio
```typescript
// Schema em src/shared/schemas/
import { z } from 'zod';

export const ContatoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  tipo: z.enum(['pessoa', 'empresa']),
  criado_em: z.string().datetime(),
});

// Tipo derivado (NUNCA criar tipo manual)
export type Contato = z.infer<typeof ContatoSchema>;
```

### Regras de Tipagem
- Schemas residem em `src/shared/schemas/`
- Tipos derivam SEMPRE de `z.infer<typeof Schema>`
- Ajuste o schema antes de tocar nos tipos
- Proibido usar `any` sem justificativa tecnica forte

---

## 8. Padrao de Banco de Dados

### Campos Obrigatorios em Tabelas Core
```sql
CREATE TABLE exemplo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  -- campos da entidade
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz  -- soft delete
);
```

### Indices Compostos (Obrigatorios)
```sql
-- CORRETO (escala)
CREATE INDEX idx_exemplo_tenant_campo
  ON exemplo(organizacao_id, campo_filtro);

-- INCORRETO (nao escala)
CREATE INDEX idx_exemplo_tenant ON exemplo(organizacao_id);
```

### RLS Obrigatorio
```sql
CREATE POLICY "tenant_isolation" ON exemplo
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Soft Delete
- Nunca use DELETE fisico em dados de negocio
- Queries filtram `WHERE deletado_em IS NULL` por padrao

---

## 9. Organizacao de Codigo

### Estrutura de Modulos
```
src/
  modules/
    contatos/
      components/
      hooks/
      services/
      schemas/
    negocios/
    configuracoes/
  shared/
    schemas/
    types/
    components/
    hooks/
```

### Nomenclatura
- Arquivos: `kebab-case` (ex: `contato-form.tsx`)
- Funcoes: `camelCase` (ex: `getContatos`)
- Tipos/Classes: `PascalCase` (ex: `ContatoSchema`)

### Complexidade
- Funcoes < 50 linhas
- Complexidade ciclomatica < 10
- Quando passar, extraia hooks ou servicos

---

## 10. Frontend - Regras de UI

### Design System (OBRIGATORIO)

**Toda implementacao de UI, UX, estrutura visual ou estilizacao DEVE seguir o documento `docs/designsystem.md`.**

Este documento define:
- Paleta de cores (Primary, Semantic, Neutrals)
- Tipografia (Inter para UI, Manrope para headings)
- Espacamento (escala de 4px)
- Componentes padronizados (shadcn/ui)
- Breakpoints responsivos
- Padroes de acessibilidade (WCAG 2.1 AA)

```typescript
// CORRETO - Usar classes do Design System
<Button variant="primary" size="md">Salvar</Button>
<Card className="p-6 rounded-lg border border-border">

// INCORRETO - Cores e estilos arbitrarios
<button style={{ backgroundColor: '#123456' }}>
<div className="p-7 rounded-xl">
```

**Regras:**
- Nunca inventar cores, espacamentos ou tipografias
- Usar componentes shadcn/ui como base
- Seguir tokens de design definidos no Tailwind config
- Validar responsividade nos breakpoints definidos (sm, md, lg, xl)

### Mutacoes e Cache
```typescript
// Toda mutacao deve atualizar a UI sem refresh
const mutation = useMutation({
  mutationFn: createContato,
  onSuccess: () => {
    queryClient.invalidateQueries(['contatos', tenantId]);
  },
});
```

### Hooks do React
- Somente no topo do componente
- Nunca dentro de loops, condicionais ou apos returns
- Listar TODAS as dependencias em `useEffect`, `useCallback`, `useMemo`

### Validacao
- Formularios validados no front (Zod) E no back
- Componentes reutilizaveis e previsiveis

---

## 11. Integracoes

Toda integracao deve ter:
- Idempotencia
- Logs estruturados
- Retry com backoff
- Deduplicacao
- Rate limit handling
- Reprocessamento
- Reconciliacao

### Regra de Ouro
Integracoes devem ser desacopladas do dominio. Nunca misture regra de negocio com codigo especifico de fornecedor.

---

## 12. Observabilidade

Todo fluxo deve ter:
- Comeco, meio, fim identificaveis
- Tratamento de excecoes
- Logs com `correlation_id`
- Audit trail em operacoes criticas

Sem isso, o fluxo e considerado incompleto.

---

## 13. Comentarios AIDEV

Use prefixos para documentar pontos sensiveis:

```typescript
// AIDEV-NOTE: Logica critica de RLS - nao alterar sem revisao
// AIDEV-TODO: Implementar paginacao (ticket: CRM-123)
// AIDEV-QUESTION: Por que filtrar aqui e nao no backend?
// AIDEV-ANSWER: RLS pode mudar entre refreshes de cache
```

Nunca remova `AIDEV-*` sem aprovacao explicita.

---

## 14. Proibicoes Absolutas

### NUNCA faca:
- Remover `organizacao_id` de operacoes
- Quebrar separacao de roles (Super Admin/Admin/Member)
- Alterar testes sem permissao explicita
- Remover comentarios `AIDEV-*`
- Introduzir tecnologias fora do stack (Prisma, GraphQL, tRPC)
- Inventar business logic sem confirmar com o time
- Hardcodar segredos fora de `.env`
- Usar nomes em ingles no banco de dados

### SEMPRE faca:
- Incluir `organizacao_id` em todas operacoes de dados
- Validar permissoes por role antes de operacoes
- Documentar alteracoes de schema com migrations
- Usar Zod para validar inputs externos
- Manter RLS ativo em todas tabelas

---

## 15. Documentos de Referencia

| Documento | Proposito | Obrigatorio |
|-----------|-----------|-------------|
| `docs/arquitetodeproduto.md` | Regras de arquitetura | Sim |
| `docs/prdpadrao.md` | Template de PRD | Sim |
| `docs/prds/PRD-00-INDICE-GERAL.md` | Indice e ordem de implementacao | Sim |
| `docs/prds/PRD-14-SUPER-ADMIN.md` | Bootstrap do sistema | Sim |
| **`docs/designsystem.md`** | **UI, UX, cores, tipografia, componentes** | **Sim - TODO frontend** |

---

## 16. Glossario

| Termo | Definicao |
|-------|-----------|
| **Tenant** | Organizacao cliente do SaaS |
| **Contato** | Pessoa ou empresa cadastrada no CRM do tenant |
| **Oportunidade/Negocio** | Negociacao de venda vinculada a um contato |
| **Funil** | Pipeline de vendas com etapas |
| **Etapa** | Fase do funil (Lead, Qualificado, Proposta, etc.) |
| **Cadencia** | Sequencia de follow-ups programados |
| **Role** | Nivel de permissao (Super Admin, Admin, Member) |
| **RLS** | Row Level Security - isolamento de dados no banco |

---

## 17. Modo de Operacao

Ao receber uma solicitacao, siga esta ordem:

1. Entendimento do contexto
2. Perguntas de esclarecimento (se necessario)
3. Desenho do fluxo ponta a ponta
4. Modelagem de dados
5. Impactos em UI
6. Integracoes envolvidas
7. Automacao possivel
8. Riscos e alertas
9. Proximos passos

---

**Voce existe para evitar Frankenstein, proteger o produto e garantir que cada decisao faca sentido hoje e daqui a dois anos.**
