import { CheckCircle2, BarChart3, MessageSquare, GitBranch } from 'lucide-react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Seção de solução/transformação - transição dor → solução
 */
const pillars = [
  {
    icon: GitBranch,
    title: 'Centralize todos os canais',
    description:
      'WhatsApp, Instagram, formulários, Meta Ads — todos os leads chegam em um único lugar. Acabou a bagunça de planilhas e grupos.',
  },
  {
    icon: BarChart3,
    title: 'Organize seu funil de vendas',
    description:
      'Pipeline visual no estilo Kanban, etapas personalizáveis e visão clara de onde cada negócio está. Seus vendedores nunca mais vão esquecer um follow-up.',
  },
  {
    icon: MessageSquare,
    title: 'Sincronize marketing e vendas',
    description:
      'Saiba exatamente de onde vem cada lead, qual campanha converteu e qual vendedor fechou. Dados reais para decisões inteligentes.',
  },
]

export function SolutionSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal()

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-12 md:mb-16 transition-all duration-600 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            A transformação
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Chega de perder vendas por desorganização
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            O CRM Renove foi construído para empresas B2B que precisam de controle real
            sobre seu processo comercial — sem complexidade desnecessária.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className={`relative p-6 md:p-8 rounded-xl bg-background border border-border shadow-sm hover:shadow-md transition-all duration-500 ${
                cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${idx * 120}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <pillar.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                <CheckCircle2 size={16} />
                Incluso em todos os planos
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
