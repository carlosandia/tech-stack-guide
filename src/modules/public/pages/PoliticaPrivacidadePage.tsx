import { Link } from 'react-router-dom'
import renoveLogo from '@/assets/logotipo-renove.svg'

/**
 * AIDEV-NOTE: Página pública de Política de Privacidade
 * Conforme LGPD e requisitos Meta/Google Ads
 * URL: /privacidade
 */

export function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/planos" className="flex items-center gap-2">
              <img src={renoveLogo} alt="CRM Renove" className="h-8" />
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 18 de fevereiro de 2026</p>
        </div>

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
          <section className="pb-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Contato do Encarregado de Proteção de Dados (DPO)</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>Para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais, entre em contato com nosso Encarregado:</p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-1">
                <p><strong className="text-foreground">Controlador:</strong> Renove Digital</p>
                <p><strong className="text-foreground">CNPJ:</strong> 26.334.241/0001-60</p>
                <p><strong className="text-foreground">E-mail do DPO:</strong>{' '}
                  <a href="mailto:contato@renovedigital.com.br" className="text-primary hover:underline">
                    contato@renovedigital.com.br
                  </a>
                </p>
              </div>
              <p>
                Caso entenda que o tratamento de dados pessoais realizado por nós viola a LGPD, você também tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={renoveLogo} alt="CRM Renove" className="h-6" />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/termos" className="hover:text-foreground transition-colors">
                Termos de Serviço
              </Link>
              <span>|</span>
              <span className="text-foreground font-medium">Política de Privacidade</span>
              <span>|</span>
              <Link to="/planos" className="hover:text-foreground transition-colors">
                Planos
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Renove Digital. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
