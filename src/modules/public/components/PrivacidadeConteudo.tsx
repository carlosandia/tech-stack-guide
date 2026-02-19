/**
 * AIDEV-NOTE: Conteúdo completo da Política de Privacidade
 * Componente compartilhado entre a página /privacidade e o dialog inline do checkout.
 * Qualquer alteração aqui reflete automaticamente em ambos os locais.
 */

export function PrivacidadeConteudo() {
  return (
    <div className="space-y-0">
      {/* 1. Informações Gerais */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Informações Gerais</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            A presente Política de Privacidade descreve como a <strong className="text-foreground">Renove Digital</strong> ("nós", "nosso" ou "Controlador"), na qualidade de controladora de dados pessoais, coleta, utiliza, armazena, compartilha e protege as informações dos usuários da plataforma <strong className="text-foreground">CRM Renove</strong>.
          </p>
          <p>
            O CRM Renove é uma plataforma de gestão de relacionamento com clientes (CRM) disponibilizada como serviço (SaaS — Software as a Service), acessada exclusivamente via internet mediante assinatura. <strong className="text-foreground">Não realizamos venda de software</strong> — oferecemos licença de uso e acesso à plataforma durante a vigência da assinatura contratada.
          </p>
          <p>
            Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis à proteção de dados no Brasil.
          </p>
        </div>
      </section>

      {/* 2. Dados que Coletamos */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Dados que Coletamos</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Coletamos as seguintes categorias de dados pessoais:</p>
          <p className="font-medium text-foreground">2.1. Dados de cadastro</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nome completo, e-mail, telefone, cargo</li>
            <li>Razão social ou nome fantasia da empresa</li>
            <li>CNPJ (quando aplicável)</li>
          </ul>
          <p className="font-medium text-foreground">2.2. Dados de uso da plataforma</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Registros de acesso, funcionalidades utilizadas e interações na plataforma</li>
            <li>Dados inseridos pelo contratante no CRM (contatos, negócios, tarefas, conversas)</li>
          </ul>
          <p className="font-medium text-foreground">2.3. Dados técnicos</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Endereço IP, tipo de navegador, sistema operacional</li>
            <li>Cookies e tecnologias similares de rastreamento</li>
            <li>Dados de geolocalização aproximada (derivados do IP)</li>
          </ul>
          <p className="font-medium text-foreground">2.4. Dados de pagamento</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Informações de pagamento são processadas diretamente pela <strong className="text-foreground">Stripe</strong>, nosso processador de pagamentos certificado PCI-DSS</li>
            <li>Não armazenamos dados completos de cartão de crédito em nossos servidores</li>
          </ul>
        </div>
      </section>

      {/* 3. Como Utilizamos seus Dados */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Como Utilizamos seus Dados</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Prestação do serviço:</strong> criar e gerenciar sua conta, processar pagamentos, fornecer acesso à plataforma e suas funcionalidades</li>
            <li><strong className="text-foreground">Comunicação:</strong> enviar notificações sobre a conta, atualizações do serviço, alertas de segurança e comunicações operacionais</li>
            <li><strong className="text-foreground">Melhoria da plataforma:</strong> analisar dados de uso de forma agregada e anonimizada para aprimorar funcionalidades e experiência do usuário</li>
            <li><strong className="text-foreground">Marketing:</strong> enviar comunicações promocionais quando houver consentimento expresso do titular, com opção de descadastramento (opt-out) em todas as comunicações</li>
            <li><strong className="text-foreground">Obrigações legais:</strong> cumprir obrigações legais, regulatórias, fiscais e resoluções judiciais</li>
            <li><strong className="text-foreground">Segurança:</strong> prevenir fraudes, abusos e garantir a integridade da plataforma</li>
          </ul>
        </div>
      </section>

      {/* 4. Base Legal */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Base Legal para o Tratamento (LGPD Art. 7º)</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>O tratamento dos seus dados pessoais fundamenta-se nas seguintes bases legais previstas na LGPD:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Execução de contrato (Art. 7º, V):</strong> para prestação do serviço contratado, incluindo criação de conta, processamento de pagamentos e acesso à plataforma</li>
            <li><strong className="text-foreground">Consentimento (Art. 7º, I):</strong> para envio de comunicações de marketing, uso de cookies não essenciais e compartilhamento de dados para fins publicitários</li>
            <li><strong className="text-foreground">Legítimo interesse (Art. 7º, IX):</strong> para melhoria da plataforma, prevenção de fraudes e análises agregadas de uso</li>
            <li><strong className="text-foreground">Obrigação legal (Art. 7º, II):</strong> para cumprimento de obrigações fiscais, contábeis e regulatórias</li>
          </ul>
        </div>
      </section>

      {/* 5. Compartilhamento de Dados */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Compartilhamento de Dados</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Podemos compartilhar seus dados pessoais com os seguintes terceiros, exclusivamente para as finalidades descritas nesta política:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Stripe:</strong> processamento de pagamentos e cobranças recorrentes</li>
            <li><strong className="text-foreground">Supabase:</strong> infraestrutura de banco de dados e autenticação</li>
            <li><strong className="text-foreground">Serviços de e-mail:</strong> envio de notificações transacionais e comunicações operacionais</li>
            <li><strong className="text-foreground">Meta (Facebook/Instagram):</strong> integração de canais de comunicação e mensuração de campanhas publicitárias, quando habilitado pelo contratante</li>
            <li><strong className="text-foreground">Google:</strong> integração de calendário e serviços de e-mail, quando habilitado pelo contratante</li>
          </ul>
          <p className="font-medium text-foreground">
            Não vendemos, alugamos ou comercializamos seus dados pessoais a terceiros para fins próprios desses terceiros.
          </p>
          <p>
            Todos os nossos parceiros e fornecedores estão sujeitos a obrigações contratuais de proteção de dados e confidencialidade compatíveis com a LGPD.
          </p>
        </div>
      </section>

      {/* 5.1. Uso de Dados do Google */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">5.1. Uso de Dados do Google (Google API Services)</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            O CRM Renove integra-se com serviços do Google (Google Calendar e Gmail) para oferecer funcionalidades de sincronização de agenda e comunicação por e-mail dentro da plataforma. O acesso a esses serviços ocorre <strong className="text-foreground">exclusivamente mediante autorização explícita do usuário</strong> via protocolo OAuth 2.0.
          </p>

          <p className="font-medium text-foreground">5.1.1. Dados coletados via APIs do Google</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Google Calendar:</strong> eventos de calendário (título, data/hora, participantes, descrição) para sincronização com a agenda do CRM</li>
            <li><strong className="text-foreground">Gmail:</strong> mensagens de e-mail (remetente, destinatário, assunto, corpo, anexos) para envio e leitura de e-mails dentro da plataforma CRM</li>
            <li><strong className="text-foreground">Dados de perfil básico:</strong> nome e endereço de e-mail da conta Google autorizada, para identificação da conexão</li>
          </ul>

          <p className="font-medium text-foreground">5.1.2. Finalidade do uso</p>
          <p>
            Os dados obtidos via APIs do Google são utilizados <strong className="text-foreground">exclusivamente</strong> para fornecer e melhorar as funcionalidades da plataforma CRM Renove relacionadas à integração autorizada pelo usuário:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Sincronização bidirecional de eventos de calendário entre o Google Calendar e o CRM</li>
            <li>Envio e leitura de e-mails diretamente pela interface do CRM, utilizando a conta Gmail autorizada</li>
            <li>Criação automática de reuniões Google Meet vinculadas a eventos do CRM</li>
          </ul>

          <p className="font-medium text-foreground">5.1.3. Restrições de uso (Limited Use)</p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
            <p>
              O uso de dados recebidos das APIs do Google pelo CRM Renove está em conformidade com a{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , incluindo os requisitos de <strong className="text-foreground">Limited Use</strong>. Especificamente:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">NÃO</strong> utilizamos dados do Google para veicular, personalizar ou mensurar publicidade ou campanhas de marketing</li>
              <li><strong className="text-foreground">NÃO</strong> vendemos, licenciamos ou transferimos dados do Google a terceiros para fins de publicidade, corretagem de dados ou revenda</li>
              <li><strong className="text-foreground">NÃO</strong> utilizamos dados do Google para treinamento de modelos de inteligência artificial ou aprendizado de máquina</li>
              <li><strong className="text-foreground">NÃO</strong> utilizamos dados do Google para determinação de crédito, avaliação financeira ou qualquer finalidade não relacionada às funcionalidades do CRM</li>
              <li>Os dados do Google são utilizados <strong className="text-foreground">apenas</strong> para fornecer e melhorar funcionalidades voltadas ao usuário dentro da plataforma CRM Renove</li>
            </ul>
          </div>

          <p className="font-medium text-foreground">5.1.4. Compartilhamento de dados do Google</p>
          <p>
            Dados obtidos via APIs do Google <strong className="text-foreground">não são compartilhados com terceiros</strong>, exceto nas seguintes situações estritamente necessárias:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Infraestrutura:</strong> Supabase (banco de dados e autenticação) — como operador técnico, sob obrigações contratuais de proteção de dados</li>
            <li><strong className="text-foreground">Obrigação legal:</strong> quando exigido por lei, regulamento ou ordem judicial</li>
            <li><strong className="text-foreground">Consentimento:</strong> quando o usuário autorizar expressamente o compartilhamento</li>
          </ul>

          <p className="font-medium text-foreground">5.1.5. Retenção e exclusão de dados do Google</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tokens de acesso e refresh tokens são armazenados de forma criptografada enquanto a integração estiver ativa</li>
            <li>Dados de calendário e e-mail são mantidos apenas durante a vigência da integração</li>
            <li>Ao <strong className="text-foreground">desconectar a integração</strong> nas configurações do CRM, os tokens são revogados junto ao Google e eliminados dos nossos servidores</li>
            <li>O usuário pode solicitar a exclusão completa dos dados do Google a qualquer momento, entrando em contato com nosso DPO (seção 11)</li>
            <li>Ao cancelar a assinatura do CRM Renove, todos os tokens e dados de integrações Google são eliminados conforme os prazos da seção 8</li>
          </ul>

          <p className="font-medium text-foreground">5.1.6. Revogação de acesso</p>
          <p>
            O usuário pode revogar o acesso do CRM Renove aos seus dados do Google a qualquer momento por duas formas:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nas <strong className="text-foreground">configurações do CRM Renove</strong>, desconectando a integração Google</li>
            <li>Na página de{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                permissões da conta Google
              </a>
              , removendo o acesso do CRM Renove
            </li>
          </ul>

          <p className="text-xs text-muted-foreground italic">
            Nota: Os cookies de marketing mencionados na seção 6.3 (Google Ads) referem-se exclusivamente a tecnologias de rastreamento do nosso site institucional e <strong className="text-foreground">não têm relação</strong> com dados obtidos via APIs do Google (Calendar/Gmail). Dados de APIs do Google jamais são utilizados para fins publicitários.
          </p>
        </div>
      </section>

      {/* 6. Cookies */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Cookies e Tecnologias de Rastreamento</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Utilizamos cookies e tecnologias similares para os seguintes fins:</p>
          <p className="font-medium text-foreground">6.1. Cookies essenciais</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Necessários para o funcionamento da plataforma (autenticação, sessão do usuário)</li>
            <li>Não podem ser desativados sem comprometer o uso do serviço</li>
          </ul>
          <p className="font-medium text-foreground">6.2. Cookies analíticos</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Google Analytics: análise de uso e desempenho da plataforma</li>
            <li>Dados coletados de forma agregada e anonimizada</li>
          </ul>
          <p className="font-medium text-foreground">6.3. Cookies de marketing</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Meta Pixel (Facebook/Instagram): mensuração de campanhas publicitárias</li>
            <li>Google Ads: mensuração de conversões e remarketing</li>
            <li>Podem ser desativados a qualquer momento pelo titular</li>
          </ul>
          <p>
            Você pode gerenciar suas preferências de cookies nas configurações do seu navegador. A desativação de cookies não essenciais não afeta o funcionamento da plataforma.
          </p>
        </div>
      </section>

      {/* 7. Direitos do Titular */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Seus Direitos (LGPD Art. 18)</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Como titular de dados pessoais, você tem os seguintes direitos garantidos pela LGPD:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Confirmação e acesso:</strong> confirmar a existência de tratamento e acessar seus dados pessoais</li>
            <li><strong className="text-foreground">Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
            <li><strong className="text-foreground">Anonimização, bloqueio ou eliminação:</strong> solicitar o tratamento adequado de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD</li>
            <li><strong className="text-foreground">Portabilidade:</strong> solicitar a portabilidade dos seus dados a outro fornecedor de serviço</li>
            <li><strong className="text-foreground">Eliminação:</strong> solicitar a eliminação dos dados pessoais tratados com base no consentimento</li>
            <li><strong className="text-foreground">Informação:</strong> ser informado sobre com quem seus dados são compartilhados</li>
            <li><strong className="text-foreground">Revogação do consentimento:</strong> revogar o consentimento a qualquer momento, sem prejuízo do tratamento realizado anteriormente</li>
            <li><strong className="text-foreground">Oposição:</strong> opor-se ao tratamento baseado em legítimo interesse, quando aplicável</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail informado na seção 11 desta política. Responderemos às solicitações em até 15 (quinze) dias úteis, conforme exigido pela LGPD.
          </p>
        </div>
      </section>

      {/* 8. Retenção de Dados */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">8. Retenção de Dados</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Seus dados pessoais são retidos pelo tempo necessário para cumprir as finalidades descritas nesta política:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Dados de conta:</strong> mantidos enquanto a assinatura estiver ativa e por até 6 (seis) meses após o cancelamento, para permitir reativação</li>
            <li><strong className="text-foreground">Dados do CRM:</strong> os dados inseridos pelo contratante são mantidos durante a vigência do contrato. Após o cancelamento, o contratante pode solicitar a exportação antes da eliminação</li>
            <li><strong className="text-foreground">Dados fiscais e contábeis:</strong> mantidos por 5 (cinco) anos, conforme legislação tributária brasileira</li>
            <li><strong className="text-foreground">Logs de acesso:</strong> mantidos por 6 (seis) meses, conforme Marco Civil da Internet (Lei nº 12.965/2014)</li>
          </ul>
          <p>
            Após os períodos acima, os dados são eliminados de forma segura de nossos sistemas e backups.
          </p>
        </div>
      </section>

      {/* 9. Segurança */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">9. Segurança dos Dados</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Empregamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais, incluindo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Criptografia:</strong> dados em trânsito protegidos por TLS/SSL; dados sensíveis criptografados em repouso</li>
            <li><strong className="text-foreground">Controle de acesso:</strong> autenticação segura, controle de permissões baseado em papéis (RBAC) e isolamento de dados por organização (multi-tenant)</li>
            <li><strong className="text-foreground">Row Level Security (RLS):</strong> isolamento rigoroso de dados entre organizações no banco de dados</li>
            <li><strong className="text-foreground">Backups:</strong> cópias de segurança regulares com retenção adequada</li>
            <li><strong className="text-foreground">Monitoramento:</strong> logs de auditoria para detecção de acessos não autorizados</li>
          </ul>
          <p>
            Nenhum sistema de segurança é infalível. Em caso de incidente de segurança que possa acarretar risco ou dano relevante, notificaremos os titulares afetados e a Autoridade Nacional de Proteção de Dados (ANPD), conforme previsto na LGPD.
          </p>
        </div>
      </section>

      {/* 10. Alterações */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">10. Alterações nesta Política</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas, funcionalidades ou exigências legais.
          </p>
          <p>
            Alterações substanciais serão comunicadas com antecedência mínima de 30 (trinta) dias, por e-mail e/ou notificação na plataforma. O uso continuado do serviço após a data de vigência das alterações constitui aceitação da política atualizada.
          </p>
        </div>
      </section>

      {/* 11. Contato DPO */}
      <section className="pb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">11. Contato do Encarregado de Proteção de Dados (DPO)</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais, entre em contato com nosso Encarregado:</p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-1">
            <p><strong className="text-foreground">Controlador:</strong> Renove Digital</p>
            <p><strong className="text-foreground">CNPJ:</strong> 26.334.241/0001-60</p>
            <p><strong className="text-foreground">E-mail do DPO:</strong>{' '}
              <a href="mailto:crm@renovedigital.com.br" className="text-primary hover:underline">
                crm@renovedigital.com.br
              </a>
            </p>
          </div>
          <p>
            Caso entenda que o tratamento de dados pessoais realizado por nós viola a LGPD, você também tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </div>
      </section>
    </div>
  )
}
