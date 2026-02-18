import { X, Check } from 'lucide-react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Comparativo Antes vs Depois - visual side by side
 */
const comparisons = [
  { without: 'Leads espalhados em planilhas e WhatsApp', with: 'Todos os leads centralizados em um único pipeline' },
  { without: 'Vendedores sem follow-up consistente', with: 'Tarefas automáticas e lembretes inteligentes' },
  { without: 'Marketing sem saber o que converte', with: 'Relatórios de origem e conversão em tempo real' },
  { without: 'Sem visibilidade do funil de vendas', with: 'Pipeline visual com previsão de receita' },
  { without: 'Processos manuais e repetitivos', with: 'Automações que economizam horas por dia' },
  { without: 'Dados isolados em ferramentas diferentes', with: 'WhatsApp, Instagram e e-mail integrados' },
]

export function ComparisonSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal()

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6">
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-12 md:mb-16 transition-all duration-600 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            A diferença que o Renove faz na sua operação
          </h2>
        </div>

        <div
          ref={tableRef}
          className={`grid md:grid-cols-2 gap-6 md:gap-0 transition-all duration-600 ${
            tableVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {/* Coluna SEM */}
          <div className="rounded-xl md:rounded-r-none border border-border bg-card p-6 md:p-8">
            <h3 className="text-lg font-semibold text-destructive mb-6 flex items-center gap-2">
              <X size={20} /> Sem CRM
            </h3>
            <ul className="space-y-4">
              {comparisons.map((c) => (
                <li key={c.without} className="flex items-start gap-3">
                  <X size={16} className="text-destructive mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{c.without}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna COM */}
          <div className="rounded-xl md:rounded-l-none border border-primary/30 bg-primary/[0.02] p-6 md:p-8 md:border-l-0">
            <h3 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
              <Check size={20} /> Com CRM Renove
            </h3>
            <ul className="space-y-4">
              {comparisons.map((c) => (
                <li key={c.with} className="flex items-start gap-3">
                  <Check size={16} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground font-medium">{c.with}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
