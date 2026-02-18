import { Users, TrendingUp, Zap, Target } from 'lucide-react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Barra de prova social com metricas de impacto
 */
const metrics = [
  { icon: Users, value: '12.000+', label: 'Leads gerenciados/mês' },
  { icon: Target, value: '200+', label: 'Empresas ativas' },
  { icon: TrendingUp, value: '34%', label: 'Aumento médio em conversão' },
  { icon: Zap, value: '< 2min', label: 'Tempo de resposta ao lead' },
]

export function SocialProofBar() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="py-10 md:py-12 bg-muted/50 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className={`text-center space-y-2 transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <m.icon size={24} className="mx-auto text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
