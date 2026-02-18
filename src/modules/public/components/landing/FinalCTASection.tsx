import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield } from 'lucide-react'

/**
 * AIDEV-NOTE: CTA final com urgência e ação definitiva
 */
export function FinalCTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary relative overflow-hidden">
      {/* Pattern de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      <div className="max-w-[800px] mx-auto px-4 md:px-6 text-center relative">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4">
          Pare de perder vendas.{' '}
          <br className="hidden md:block" />
          Comece a controlar seus resultados.
        </h2>
        <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
          Junte-se a centenas de empresas B2B que já transformaram seu processo comercial
          com o CRM Renove.
        </p>

        <Link to="/trial">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-10 h-14 font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Comece agora — 14 dias grátis
            <ArrowRight size={20} className="ml-2" />
          </Button>
        </Link>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-primary-foreground/70">
          <span className="flex items-center gap-1.5">
            <Shield size={14} />
            Sem cartão de crédito
          </span>
          <span>•</span>
          <span>Cancele quando quiser</span>
          <span>•</span>
          <span>Suporte incluso</span>
        </div>
      </div>
    </section>
  )
}
