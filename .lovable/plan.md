
# Adequacao da Politica de Privacidade para Verificacao Google OAuth

## Analise: O que o Google exige vs. o que temos

O Google verifica **7 pontos obrigatorios** na politica de privacidade. Segue a analise:

| Requisito Google | Status Atual | Acao |
|---|---|---|
| Declarar quais dados do Google sao coletados | Parcial - mencao generica na secao 5 | Adicionar secao dedicada |
| Declarar como os dados do Google sao usados | Ausente | Adicionar |
| Declarar com quem compartilha dados do Google | Parcial | Detalhar especificamente |
| Mecanismos de protecao de dados sensiveis | OK - secao 9 cobre | Nenhuma |
| Retencao e exclusao de dados | Parcial - nao especifico para Google | Adicionar para dados Google |
| NAO usar dados Google para publicidade/venda/IA | Ausente - pode ser interpretado negativamente | Adicionar declaracao explicita |
| NAO transferir dados Google para terceiros para fins proibidos | Ausente | Adicionar declaracao explicita |

### Problema critico identificado

A secao 6.3 (Cookies de marketing) menciona "Google Ads: mensuracao de conversoes e remarketing". Embora isso se refira a cookies do site e NAO a dados obtidos via Google APIs, o Google pode interpretar como uso de dados do usuario para publicidade. Precisamos deixar claro que dados obtidos via APIs do Google (Calendar, Gmail) NAO sao usados para marketing.

---

## Plano de Correcao

### Alteracao unica no arquivo `src/modules/public/components/PrivacidadeConteudo.tsx`

Adicionar uma nova **secao 5.1** (dentro da secao 5 - Compartilhamento) especifica para **"Dados obtidos via APIs do Google"** que cobre todos os 7 requisitos de uma vez.

O conteudo da nova secao incluira:

**5.1. Uso de Dados do Google (Google API Services)**

- **Dados coletados:** eventos de calendario (Google Calendar), mensagens de e-mail (Gmail) - apenas quando o usuario autoriza explicitamente via OAuth
- **Finalidade:** exclusivamente para fornecer funcionalidades da plataforma (sincronizacao de agenda, envio/leitura de e-mails dentro do CRM)
- **Compartilhamento:** dados do Google NAO sao compartilhados com terceiros, exceto conforme necessario para operar o servico (ex: Supabase como infraestrutura)
- **Restricoes explicitas:** dados do Google NAO sao usados para publicidade direcionada, venda a corretores de dados, treinamento de IA, determinacao de credito ou qualquer finalidade alem de fornecer/melhorar funcionalidades do CRM
- **Retencao:** dados do Google sao mantidos enquanto a integracao estiver ativa; ao desconectar, tokens sao revogados e dados removidos
- **Exclusao:** o usuario pode desconectar a integracao Google a qualquer momento nas configuracoes, o que revoga o acesso e elimina os tokens armazenados
- **Conformidade:** o uso de dados do Google segue a Google API Services User Data Policy, incluindo os requisitos de Limited Use

### Arquivo modificado

1. `src/modules/public/components/PrivacidadeConteudo.tsx` - adicionar subsecao 5.1 apos a secao 5 atual

Nenhuma outra pagina precisa ser alterada pois o componente `PrivacidadeConteudo` e compartilhado entre a pagina `/privacidade` e o dialog inline do checkout.
