import { Link } from 'react-router-dom'

/**
 * AIDEV-NOTE: Conteúdo completo dos Termos de Serviço
 * Componente compartilhado entre a página /termos e o dialog inline do checkout.
 * Qualquer alteração aqui reflete automaticamente em ambos os locais.
 */

export function TermosConteudo() {
  return (
    <div className="space-y-0">
      {/* 1. Aceitação */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            Ao criar uma conta, acessar ou utilizar a plataforma <strong className="text-foreground">CRM Renove</strong>, você declara que leu, compreendeu e concorda integralmente com estes Termos de Serviço.
          </p>
          <p>
            Se você está utilizando a plataforma em nome de uma empresa ou organização, declara que possui autoridade para vincular tal entidade a estes termos.
          </p>
          <p>
            Caso não concorde com qualquer disposição destes termos, não utilize a plataforma.
          </p>
        </div>
      </section>

      {/* 2. Definições */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">2. Definições</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground">Plataforma:</strong> o sistema CRM Renove, incluindo todas as funcionalidades, APIs e interfaces disponibilizadas via internet</li>
            <li><strong className="text-foreground">Contratante:</strong> a pessoa jurídica ou física que contrata o acesso à plataforma mediante assinatura</li>
            <li><strong className="text-foreground">Usuário:</strong> qualquer pessoa que acessa a plataforma com credenciais válidas, incluindo administradores e membros da equipe do contratante</li>
            <li><strong className="text-foreground">Dados do Cliente:</strong> todos os dados inseridos, importados ou gerados pelo contratante e seus usuários dentro da plataforma (contatos, negócios, tarefas, conversas, etc.)</li>
            <li><strong className="text-foreground">Renove Digital:</strong> a empresa desenvolvedora e mantenedora da plataforma CRM Renove</li>
          </ul>
        </div>
      </section>

      {/* 3. Descrição do Serviço */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">3. Descrição do Serviço</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            O CRM Renove é uma <strong className="text-foreground">plataforma de gestão de relacionamento com clientes (CRM) disponibilizada como serviço (SaaS)</strong>, acessada exclusivamente via internet mediante assinatura.
          </p>
          <p className="bg-muted/50 rounded-lg p-4 border border-border font-medium text-foreground">
            O presente contrato configura uma <strong>licença de uso</strong> da plataforma durante a vigência da assinatura. Não se trata de venda, cessão ou transferência de software. O contratante adquire o direito de acesso à plataforma e suas funcionalidades, não a propriedade do sistema.
          </p>
          <p>As funcionalidades incluem, conforme o plano contratado:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestão de contatos (pessoas e empresas)</li>
            <li>Pipeline de vendas (funis e negócios)</li>
            <li>Gestão de tarefas e atividades</li>
            <li>Comunicação multicanal (WhatsApp, Instagram, e-mail)</li>
            <li>Formulários de captura de leads</li>
            <li>Automações de processos comerciais</li>
            <li>Relatórios e métricas de desempenho</li>
          </ul>
        </div>
      </section>

      {/* 4. Planos e Pagamento */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">4. Planos e Pagamento</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p className="font-medium text-foreground">4.1. Assinaturas</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A plataforma é oferecida mediante planos de assinatura com periodicidade mensal ou anual</li>
            <li>Os planos, preços e funcionalidades vigentes estão disponíveis na página <Link to="/planos" className="text-primary hover:underline">crm.renovedigital.com.br/planos</Link></li>
            <li>A renovação da assinatura é automática ao final de cada período, salvo cancelamento prévio</li>
          </ul>
          <p className="font-medium text-foreground">4.2. Período de teste (Trial)</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Quando disponível, o período de teste permite acesso gratuito à plataforma por prazo determinado</li>
            <li>Ao final do período de teste, será necessário contratar um plano pago para continuar utilizando o serviço</li>
            <li>Não há cobrança automática ao final do período de teste</li>
          </ul>
          <p className="font-medium text-foreground">4.3. Pagamento</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Os pagamentos são processados pela <strong className="text-foreground">Stripe</strong>, plataforma certificada PCI-DSS</li>
            <li>Aceitamos cartão de crédito e outros métodos disponibilizados pela Stripe</li>
            <li>Os preços são expressos em Reais (BRL) e podem ser reajustados mediante aviso prévio de 30 dias</li>
          </ul>
        </div>
      </section>

      {/* 5. Conta e Responsabilidades */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">5. Conta e Responsabilidades do Usuário</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <ul className="list-disc pl-6 space-y-1">
            <li>O contratante é responsável por manter a confidencialidade de suas credenciais de acesso (e-mail e senha)</li>
            <li>Cada conta de usuário é pessoal e intransferível</li>
            <li>O contratante deve notificar imediatamente a Renove Digital em caso de uso não autorizado de sua conta</li>
            <li>O contratante é responsável por todas as atividades realizadas por seus usuários dentro da plataforma</li>
            <li>As informações fornecidas no cadastro devem ser verdadeiras, completas e atualizadas</li>
          </ul>
        </div>
      </section>

      {/* 6. Propriedade Intelectual */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">6. Propriedade Intelectual</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            <strong className="text-foreground">A plataforma CRM Renove</strong>, incluindo seu código-fonte, design, marca, logotipos, textos, gráficos e demais elementos, é de propriedade exclusiva da Renove Digital, protegida pelas leis brasileiras de propriedade intelectual.
          </p>
          <p>
            <strong className="text-foreground">Os Dados do Cliente</strong> inseridos na plataforma permanecem de propriedade exclusiva do contratante. A Renove Digital não adquire qualquer direito sobre esses dados além do estritamente necessário para a prestação do serviço.
          </p>
          <p>
            A licença de uso concedida não implica transferência de propriedade intelectual sobre a plataforma.
          </p>
        </div>
      </section>

      {/* 7. Dados e Privacidade */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">7. Dados e Privacidade</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            O tratamento de dados pessoais pela Renove Digital é regido pela nossa{' '}
            <Link to="/privacidade" className="text-primary hover:underline font-medium">
              Política de Privacidade
            </Link>
            , que é parte integrante destes Termos de Serviço.
          </p>
          <p>
            O contratante é responsável pela legalidade dos dados pessoais que insere na plataforma, devendo garantir que possui base legal adequada para o tratamento desses dados conforme a LGPD.
          </p>
          <p>
            A Renove Digital atua como <strong className="text-foreground">operadora</strong> dos Dados do Cliente, processando-os exclusivamente conforme as instruções do contratante e para fins de prestação do serviço.
          </p>
        </div>
      </section>

      {/* 8. Disponibilidade e SLA */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">8. Disponibilidade e SLA</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            A Renove Digital emprega esforços comercialmente razoáveis para manter a plataforma disponível e acessível. No entanto, <strong className="text-foreground">não garantimos disponibilidade de 100%</strong>.
          </p>
          <p>A plataforma pode ficar temporariamente indisponível devido a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Manutenções programadas (comunicadas com antecedência, preferencialmente fora do horário comercial)</li>
            <li>Atualizações e melhorias da plataforma</li>
            <li>Falhas em provedores de infraestrutura terceirizados</li>
            <li>Eventos de força maior</li>
          </ul>
        </div>
      </section>

      {/* 9. Limitação de Responsabilidade */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">9. Limitação de Responsabilidade</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Na máxima extensão permitida pela legislação aplicável:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A Renove Digital não será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos</li>
            <li>A responsabilidade total da Renove Digital será limitada ao valor pago pelo contratante nos 12 (doze) meses anteriores ao evento que deu origem à reclamação</li>
            <li>A Renove Digital não se responsabiliza por decisões comerciais tomadas pelo contratante com base nas informações ou funcionalidades da plataforma</li>
            <li>Eventos de força maior (incluindo, mas não limitados a, desastres naturais, pandemias, falhas de telecomunicações, atos governamentais) isentam a Renove Digital de responsabilidade por atrasos ou falhas no serviço</li>
          </ul>
        </div>
      </section>

      {/* 10. Cancelamento */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">10. Cancelamento e Rescisão</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p className="font-medium text-foreground">10.1. Pelo contratante</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>O contratante pode cancelar sua assinatura a qualquer momento</li>
            <li>O acesso à plataforma será mantido até o final do período já pago</li>
            <li>Não há reembolso proporcional para períodos parciais</li>
          </ul>
          <p className="font-medium text-foreground">10.2. Pela Renove Digital</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A Renove Digital pode suspender ou cancelar o acesso em caso de violação destes termos</li>
            <li>Inadimplência por período superior a 30 (trinta) dias pode resultar em suspensão do serviço</li>
            <li>Em caso de cancelamento por violação, o contratante será notificado com pelo menos 5 (cinco) dias de antecedência</li>
          </ul>
          <p className="font-medium text-foreground">10.3. Exportação de dados</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Após o cancelamento, o contratante terá prazo de 30 (trinta) dias para solicitar a exportação dos seus dados</li>
            <li>Após esse prazo, os Dados do Cliente serão eliminados conforme descrito na Política de Privacidade</li>
          </ul>
        </div>
      </section>

      {/* 11. Uso Aceitável */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">11. Uso Aceitável</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Ao utilizar a plataforma, o contratante e seus usuários comprometem-se a <strong className="text-foreground">NÃO</strong>:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enviar spam, mensagens não solicitadas em massa ou comunicações que violem a LGPD</li>
            <li>Utilizar a plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros</li>
            <li>Realizar engenharia reversa, descompilar, desmontar ou tentar extrair o código-fonte da plataforma</li>
            <li>Sublicenciar, revender ou redistribuir o acesso à plataforma sem autorização expressa</li>
            <li>Sobrecarregar intencionalmente os servidores ou interferir no funcionamento da plataforma</li>
            <li>Acessar dados de outras organizações ou contornar mecanismos de segurança</li>
            <li>Utilizar robôs, scrapers ou ferramentas automatizadas para acessar a plataforma sem autorização</li>
          </ul>
          <p>
            A violação desta política de uso aceitável pode resultar na suspensão ou cancelamento imediato da conta, sem direito a reembolso.
          </p>
        </div>
      </section>

      {/* 12. Alterações nos Termos */}
      <section className="border-b border-border pb-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">12. Alterações nos Termos</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            A Renove Digital reserva-se o direito de modificar estes Termos de Serviço a qualquer momento. Alterações substanciais serão comunicadas com antecedência mínima de <strong className="text-foreground">30 (trinta) dias</strong>, por e-mail e/ou notificação na plataforma.
          </p>
          <p>
            O uso continuado da plataforma após a data de vigência das alterações constitui aceitação dos novos termos. Caso não concorde com as alterações, o contratante poderá cancelar sua assinatura antes da data de vigência.
          </p>
        </div>
      </section>

      {/* 13. Foro e Legislação */}
      <section className="pb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">13. Foro e Legislação Aplicável</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.
          </p>
          <p>
            Para dirimir quaisquer controvérsias oriundas deste instrumento, as partes elegem o foro da comarca da sede da Renove Digital, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-1">
            <p><strong className="text-foreground">Renove Digital</strong></p>
            <p><strong className="text-foreground">CNPJ:</strong> 26.334.241/0001-60</p>
            <p><strong className="text-foreground">E-mail:</strong>{' '}
              <a href="mailto:crm@renovedigital.com.br" className="text-primary hover:underline">
                crm@renovedigital.com.br
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
