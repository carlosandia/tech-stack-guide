

## Criar Páginas Públicas de Política de Privacidade e Termos de Serviço

### Contexto

As URLs `https://crm.renovedigital.com.br/privacidade` e `https://crm.renovedigital.com.br/termos` precisam existir como páginas públicas para aprovação em plataformas como Meta Ads e Google Ads. O conteúdo deve refletir que o CRM Renove é um SaaS (venda de acesso/licença, não venda de software), seguir LGPD e boas práticas de mercado (Pipedrive, HubSpot, RD Station).

### Rotas

| URL | Componente |
|-----|-----------|
| `/privacidade` | `PoliticaPrivacidadePage` |
| `/termos` | `TermosServicoPage` |

Ambas públicas, sem autenticação, seguindo o mesmo padrão visual das páginas `/planos` e `/trial` (header com logo CRM Renove + footer).

---

### Conteúdo da Política de Privacidade

Seções obrigatórias para aprovação Meta/Google Ads e conformidade LGPD:

1. **Informações Gerais** - Identificação do controlador (Renove Digital), natureza do serviço (plataforma SaaS CRM acessada via assinatura)
2. **Dados que Coletamos** - Dados de cadastro (nome, email, telefone, empresa), dados de uso da plataforma, dados técnicos (IP, navegador, cookies), dados de pagamento (processados via Stripe)
3. **Como Utilizamos seus Dados** - Prestação do serviço, comunicação, melhoria da plataforma, obrigações legais
4. **Base Legal (LGPD Art. 7)** - Execução de contrato, consentimento, legítimo interesse, obrigação legal
5. **Compartilhamento de Dados** - Processadores de pagamento (Stripe), provedores de infraestrutura (Supabase), serviços de email - sem venda de dados a terceiros
6. **Cookies e Tecnologias de Rastreamento** - Essenciais, analíticos, marketing (Meta Pixel, Google Analytics)
7. **Seus Direitos (LGPD Art. 18)** - Acesso, correção, exclusão, portabilidade, revogação de consentimento
8. **Retenção de Dados** - Período de retenção, exclusão após cancelamento
9. **Segurança dos Dados** - Criptografia, controle de acesso, backups
10. **Alterações na Política** - Notificação prévia
11. **Contato do Encarregado (DPO)** - Email de contato

### Conteúdo dos Termos de Serviço

Seções obrigatórias:

1. **Aceitação dos Termos** - Ao criar conta ou usar o serviço
2. **Definições** - Plataforma, Usuário, Contratante, Dados do Cliente
3. **Descrição do Serviço** - SaaS CRM acessado via internet mediante assinatura (não é venda de software, é licença de uso)
4. **Planos e Pagamento** - Assinaturas mensais/anuais, período de teste, renovação automática, cobrança via Stripe
5. **Conta e Responsabilidades** - Cadastro, segurança de credenciais, uso aceitável
6. **Propriedade Intelectual** - A plataforma pertence à Renove Digital, dados inseridos pertencem ao contratante
7. **Dados e Privacidade** - Referência à Política de Privacidade, responsabilidade do contratante sobre dados inseridos
8. **Disponibilidade e SLA** - Esforço razoável de disponibilidade, sem garantia de 100%
9. **Limitação de Responsabilidade** - Limites de indenização, força maior
10. **Cancelamento e Rescisão** - Pelo contratante a qualquer momento, pela plataforma por violação, exportação de dados
11. **Uso Aceitável** - Proibições (spam, uso ilegal, engenharia reversa)
12. **Alterações nos Termos** - Notificação com 30 dias de antecedência
13. **Foro e Legislação** - Legislação brasileira, foro da comarca da sede

---

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/public/pages/PoliticaPrivacidadePage.tsx` | Página completa de Política de Privacidade |
| `src/modules/public/pages/TermosServicoPage.tsx` | Página completa de Termos de Serviço |

### Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/public/index.ts` | Adicionar exports das 2 novas páginas |
| `src/App.tsx` | Adicionar rotas `/privacidade` e `/termos` como públicas |

### Estilização (Design System)

- Header idêntico ao da `PlanosPage` (logo CRM Renove + link "Já tem conta? Entrar")
- Container de conteúdo: `max-w-4xl mx-auto px-4 py-16`
- Títulos de seção: `text-lg font-semibold text-foreground` (h2)
- Corpo do texto: `text-sm text-muted-foreground leading-relaxed`
- Listas: `list-disc pl-6 space-y-1`
- Separadores entre seções: `border-b border-border pb-6 mb-6`
- Footer idêntico ao da `PlanosPage` com links cruzados (Termos | Privacidade)
- Data de última atualização visível no topo
- Background: `bg-gradient-to-b from-background to-muted/30` (mesmo da PlanosPage)

### Pontos de atenção

- Nenhuma menção a funcionalidades que o CRM não possui
- Texto claro: "licença de uso" e "acesso à plataforma", nunca "venda de software"
- Sem dados fictícios de CNPJ ou endereço — usar "Renove Digital" como razão social e email `contato@renovedigital.com.br` como DPO
- Links cruzados entre as duas páginas
- Texto estático (sem fetch de API), carregamento instantâneo

