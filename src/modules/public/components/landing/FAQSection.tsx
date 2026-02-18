import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: FAQ - eliminação de objeções com accordion customizado
 */
const faqs = [
  {
    q: 'Quanto tempo leva para configurar o CRM?',
    a: 'Menos de 10 minutos. Você cria a conta, configura seu funil de vendas e já pode começar a adicionar negócios. Temos templates prontos para os setores mais comuns.',
  },
  {
    q: 'Preciso de cartão de crédito para o trial?',
    a: 'Não. O período de teste de 14 dias é 100% gratuito e não exige cartão de crédito. Você só paga se decidir continuar após o trial.',
  },
  {
    q: 'Consigo importar meus contatos de planilhas?',
    a: 'Sim. Você pode importar contatos via arquivo CSV ou Excel. Também oferecemos integrações com formulários web, WhatsApp e Instagram para captura automática de leads.',
  },
  {
    q: 'O CRM funciona com WhatsApp?',
    a: 'Sim! Temos integração nativa com WhatsApp via API oficial. Você conversa com seus clientes direto pelo CRM, mantendo todo o histórico centralizado.',
  },
  {
    q: 'Quantos usuários posso ter?',
    a: 'Depende do plano escolhido. Nossos planos são escaláveis e suportam desde equipes pequenas de 2 pessoas até times comerciais com dezenas de vendedores.',
  },
  {
    q: 'Como funciona o suporte?',
    a: 'Oferecemos suporte via chat e e-mail em horário comercial. Clientes dos planos Business e Enterprise contam com suporte prioritário e gerente de conta dedicado.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Absolutamente. Utilizamos criptografia de ponta a ponta, infraestrutura em nuvem de alta disponibilidade e seguimos as melhores práticas da LGPD para proteção de dados.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não há fidelidade ou multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente no painel, e seus dados ficam disponíveis por 30 dias após o cancelamento.',
  },
]

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: listRef, isVisible: listVisible } = useScrollReveal()

  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="max-w-[800px] mx-auto px-4 md:px-6">
        <div
          ref={headerRef}
          className={`text-center mb-12 md:mb-16 transition-all duration-600 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Dúvidas frequentes
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Perguntas que você pode ter
          </h2>
        </div>

        <div
          ref={listRef}
          className={`space-y-3 transition-all duration-600 ${
            listVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm md:text-base font-medium text-foreground pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform duration-200',
                    openIdx === idx && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  openIdx === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="px-4 md:px-5 pb-4 md:pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
