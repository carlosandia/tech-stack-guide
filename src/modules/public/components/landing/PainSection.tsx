import { AlertTriangle, UserX, Unplug } from 'lucide-react'

/**
 * AIDEV-NOTE: Seção de dores - faz o ICP se identificar com os problemas
 */
const pains = [
  {
    icon: AlertTriangle,
    title: 'Leads caindo no esquecimento',
    description:
      'Formulários, WhatsApp, Instagram… os leads chegam de todo lado e ninguém sabe quem respondeu o quê. Resultado: oportunidades perdidas todos os dias.',
  },
  {
    icon: UserX,
    title: 'Vendedores sem processo definido',
    description:
      'Cada vendedor trabalha do seu jeito. Sem funil padronizado, sem follow-up consistente. Você não sabe onde o dinheiro está sendo perdido.',
  },
  {
    icon: Unplug,
    title: 'Marketing e vendas desconectados',
    description:
      'Marketing gera leads, mas vendas reclama da qualidade. Vendas fecha, mas marketing não sabe o que funcionou. Os dois times operam no escuro.',
  },
]

export function PainSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Isso soa familiar?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Sua empresa está perdendo vendas e você nem percebe
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Se você tem mais de 2 vendedores e recebe leads de múltiplos canais,
            provavelmente enfrenta pelo menos um desses problemas:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="group p-6 md:p-8 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-5">
                <pain.icon size={24} className="text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{pain.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{pain.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
