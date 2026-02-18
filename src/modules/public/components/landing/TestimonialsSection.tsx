import { Star } from 'lucide-react'

/**
 * AIDEV-NOTE: Depoimentos / prova social - resultados reais
 */
const testimonials = [
  {
    name: 'Ricardo Almeida',
    role: 'Diretor Comercial',
    company: 'TechSolutions BR',
    avatar: 'RA',
    stars: 5,
    text: 'Antes do Renove, perdíamos pelo menos 30% dos leads por falta de follow-up. Hoje temos visibilidade total do funil e nossa taxa de conversão subiu 40% em 3 meses.',
  },
  {
    name: 'Camila Santos',
    role: 'CEO',
    company: 'Grupo Innova',
    avatar: 'CS',
    stars: 5,
    text: 'Finalmente marketing e vendas falam a mesma língua. Consigo ver exatamente quais campanhas geram receita real e onde investir mais. O ROI se pagou no primeiro mês.',
  },
  {
    name: 'Fernando Costa',
    role: 'Gerente de Vendas',
    company: 'Construtora Horizonte',
    avatar: 'FC',
    stars: 5,
    text: 'Minha equipe de 8 vendedores agora trabalha com processo. As automações eliminaram tarefas repetitivas e cada um ganhou pelo menos 2 horas por dia de produtividade.',
  },
]

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Quem já usa, aprova
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Resultados reais de empresas como a sua
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm"
            >
              {/* Estrelas */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-warning text-warning" />
                ))}
              </div>

              <p className="text-foreground leading-relaxed mb-6 italic">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role}, {t.company}
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
