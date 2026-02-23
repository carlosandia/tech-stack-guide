import { useEffect, useRef } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Seção de planos na landing page - posição estratégica entre
 * ComparisonSection e FAQSection. Carrega o widget via edge function.
 */
export function PricingSection() {
  const { ref, isVisible } = useScrollReveal()
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    if (!supabaseUrl || !widgetRef.current) return

    const container = widgetRef.current
    container.innerHTML = '<div id="renove-pricing-widget"></div>'

    const script = document.createElement('script')
    script.src = `${supabaseUrl}/functions/v1/pricing-widget-loader?periodo=mensal`
    script.async = true
    container.appendChild(script)

    return () => {
      script.remove()
      // Limpar funções globais do widget
      delete (window as any)._rnvSetPeriodo
      delete (window as any)._rnvCheckout
    }
  }, [])

  return (
    <section id="planos" className="py-16 md:py-24 bg-muted/50">
      <div
        ref={ref}
        className={`max-w-[1200px] mx-auto px-4 md:px-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Planos e Preços
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            Escolha o plano ideal para sua operação
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do time enxuto à equipe comercial completa — escale sem trocar de ferramenta.
          </p>
        </div>

        <div ref={widgetRef} />
      </div>
    </section>
  )
}
