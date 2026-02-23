import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Como funciona - 3 passos simples para começar
 */
const steps = [
  {
    number: '01',
    title: 'Crie sua conta em 2 minutos',
    description: 'Cadastro rápido, sem burocracia. Basta seu e-mail e o nome da empresa.',
  },
  {
    number: '02',
    title: 'Configure seu funil de vendas',
    description: 'Personalize as etapas do pipeline, importe contatos e conecte seus canais.',
  },
  {
    number: '03',
    title: 'Comece a fechar mais negócios',
    description: 'Sua equipe organizada, seus leads controlados e seus resultados crescendo.',
  },
]

export function HowItWorksSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollReveal()

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-12 md:mb-16 transition-all duration-600 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            3 passos para transformar suas vendas
          </h2>
        </div>

        <div ref={stepsRef} className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`relative text-center md:text-left transition-all duration-500 ${
                stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Linha conectora (desktop) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-md">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link to="/trial">
            <Button size="lg" className="text-base px-8 h-12">
              Começar agora, é grátis
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <button
            onClick={() => document.querySelector('#planos')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Ver planos
          </button>
        </div>
      </div>
    </section>
  )
}
