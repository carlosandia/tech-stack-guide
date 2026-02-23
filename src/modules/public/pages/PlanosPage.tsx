import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Check, Loader2, Star, RefreshCw, AlertTriangle } from 'lucide-react'
import renoveLogo from '@/assets/logotipo-renove.svg'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import { PreCadastroModal } from '../components/PreCadastroModal'
import { Dialog, DialogContent } from '@/components/ui/dialog'
 
 /**
  * AIDEV-NOTE: Pagina publica de planos
  * Conforme PRD - Pagina de Planos com Stripe Checkout
  * 
  * URL: /planos
  * Acessivel sem autenticacao
  */
 
interface PlanoDb {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number | null
  preco_anual: number | null
  limite_usuarios: number | null
  limite_oportunidades: number | null
  limite_storage_mb: number | null
  stripe_price_id_mensal: string | null
  stripe_price_id_anual: string | null
  ativo: boolean | null
  ordem: number | null
  popular: boolean | null
}
 
 interface TrialConfig {
   trial_habilitado: boolean
   trial_dias: number
 }
 
  interface TrialPlan {
    id: string
    limite_usuarios: number | null
    limite_oportunidades: number | null
    limite_storage_mb: number | null
    limite_contatos: number | null
  }
 
 export function PlanosPage() {
   const [searchParams] = useSearchParams()
   const [planos, setPlanos] = useState<PlanoDb[]>([])
   const [trialConfig, setTrialConfig] = useState<TrialConfig>({ trial_habilitado: true, trial_dias: 14 })
  const [trialPlan, setTrialPlan] = useState<TrialPlan | null>(null)
   const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
   const [loading, setLoading] = useState(true)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlano, setModalPlano] = useState<{ id: string; nome: string; isTrial: boolean } | null>(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const demoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!demoModalOpen) return
    // Delay to ensure Dialog DOM is fully mounted before injecting script
    const timer = setTimeout(() => {
      if (!demoContainerRef.current) return
      demoContainerRef.current.replaceChildren()
      const script = document.createElement('script')
      script.src = `${env.SUPABASE_URL}/functions/v1/widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline&nocache=1`
      script.dataset.formSlug = 'demonstracao-crm-mlrb6yoz'
      script.async = true
      demoContainerRef.current.appendChild(script)
    }, 100)
    return () => {
      clearTimeout(timer)
      demoContainerRef.current?.replaceChildren()
    }
  }, [demoModalOpen])
 
   // Capturar UTMs e código de parceiro
   const utms = {
     utm_source: searchParams.get('utm_source') || '',
     utm_medium: searchParams.get('utm_medium') || '',
     utm_campaign: searchParams.get('utm_campaign') || '',
     utm_term: searchParams.get('utm_term') || '',
     utm_content: searchParams.get('utm_content') || '',
   }
    const codigoParceiro = searchParams.get('ref') || ''

    useEffect(() => {
      fetchPlanos()
      fetchTrialConfig()
    }, [])

   const fetchPlanos = async () => {
     try {
       setLoadError(null)
       const { data, error } = await supabase
         .from('planos')
         .select('*')
         .eq('ativo', true)
         .eq('visivel', true)
         .order('ordem', { ascending: true })
 
       if (error) throw error
      
      // Separar plano Trial dos pagos
      const allPlanos = data || []
      const trial = allPlanos.find(p => 
        p.nome.toLowerCase() === 'trial' || (!p.preco_mensal || p.preco_mensal === 0)
      )
      const paidPlans = allPlanos.filter(p => 
        p.preco_mensal && p.preco_mensal > 0
      )
      
      if (trial) {
        setTrialPlan({
           id: trial.id,
          limite_usuarios: trial.limite_usuarios,
          limite_oportunidades: trial.limite_oportunidades,
          limite_storage_mb: trial.limite_storage_mb,
          limite_contatos: null, // Campo pode não existir na interface
        })
      }
      
      setPlanos(paidPlans)
     } catch (err) {
       console.error('Error fetching planos:', err)
       setLoadError(err instanceof Error ? err.message : 'Erro ao carregar planos')
     } finally {
       setLoading(false)
     }
   }
 
   const fetchTrialConfig = async () => {
     try {
       const { data } = await supabase
         .from('configuracoes_globais')
         .select('configuracoes')
         .eq('plataforma', 'stripe')
         .single()
 
       if (data?.configuracoes) {
         const config = data.configuracoes as Record<string, unknown>
         setTrialConfig({
           trial_habilitado: config.trial_habilitado !== false,
           trial_dias: (config.trial_dias as number) || 14,
         })
       }
     } catch (err) {
       console.error('Error fetching trial config:', err)
     }
   }
 
   const handleSelectPlan = (plano: PlanoDb) => {
     setModalPlano({ id: plano.id, nome: plano.nome, isTrial: false })
     setModalOpen(true)
   }

   const handleStartTrial = () => {
     if (!trialPlan) return
     setModalPlano({ id: trialPlan.id, nome: 'Trial', isTrial: true })
     setModalOpen(true)
   }

   // Após pré-cadastro salvo, iniciar checkout
   const handleCheckout = async (preCadastroId: string) => {
     setModalOpen(false)
     if (!modalPlano) return

     const loadingKey = modalPlano.isTrial ? 'trial' : modalPlano.id
     setCheckoutLoading(loadingKey)

     try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            plano_id: modalPlano.id,
            periodo: modalPlano.isTrial ? 'mensal' : periodo,
            is_trial: modalPlano.isTrial,
            pre_cadastro_id: preCadastroId,
            utms,
            codigo_parceiro: codigoParceiro || undefined,
          },
        })

       if (error) throw error

       if (data?.url) {
         window.location.href = data.url
       }
     } catch (err) {
       console.error('Error creating checkout:', err)
       alert('Erro ao iniciar checkout. Tente novamente.')
     } finally {
       setCheckoutLoading(null)
     }
   }
 
   const formatPrice = (price: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL',
       minimumFractionDigits: 0,
     }).format(price)
   }
 
   const formatStorage = (mb: number | null) => {
     if (!mb) return 'Ilimitado'
     if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`
     return `${mb}MB`
   }
 
   const formatLimit = (limit: number | null) => {
     if (!limit || limit >= 999999) return 'Ilimitado'
     return limit.toLocaleString('pt-BR')
   }
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     )
   }
 
   if (loadError) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
           <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
           <h2 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar planos</h2>
           <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
           <button
             onClick={() => {
               setLoading(true)
               fetchPlanos()
             }}
             className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
           >
             <RefreshCw className="w-4 h-4" />
             Tentar novamente
           </button>
         </div>
       </div>
     )
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
       {/* Header */}
       <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <img src={renoveLogo} alt="CRM Renove" className="h-8" />
              </div>
             <Link
               to="/login"
               className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
             >
               Ja tem conta? Entrar
             </Link>
           </div>
         </div>
       </header>
 
        {/* Hero */}
       <section className="py-16 sm:py-24 px-4">
         <div className="max-w-4xl mx-auto text-center">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
             Escolha o plano ideal para seu negócio
           </h1>
           <p className="text-lg text-muted-foreground mb-8">
             {trialConfig.trial_habilitado
               ? `Comece grátis por ${trialConfig.trial_dias} dias. Cancele quando quiser.`
               : 'Escolha o plano que melhor se adapta às suas necessidades.'}
           </p>

          {/* Toggle Periodo */}
          {(() => {
            const planosComAnual = planos.filter(p =>
              p.preco_mensal && p.preco_mensal > 0 &&
              p.preco_anual && p.preco_anual > 0
            )
            const descontoMedio = planosComAnual.length > 0
              ? Math.round(
                  planosComAnual.reduce((acc, p) => {
                    const mensalAnualizado = (p.preco_mensal ?? 0) * 12
                    const anual = p.preco_anual ?? 0
                    return acc + ((mensalAnualizado - anual) / mensalAnualizado) * 100
                  }, 0) / planosComAnual.length
                )
              : null

            return (
              <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setPeriodo('mensal')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    periodo === 'mensal'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setPeriodo('anual')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    periodo === 'anual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anual
                  {descontoMedio && descontoMedio > 0 && (
                    <span className="ml-1.5 text-xs font-semibold text-primary">-{descontoMedio}%</span>
                  )}
                </button>
              </div>
            )
          })()}
         </div>
       </section>
 
       {/* Planos Grid */}
       <section className="pb-24 px-4">
         <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {/* Card Trial (se habilitado) */}
            {trialConfig.trial_habilitado && trialPlan && (
               <div className="relative bg-card rounded-xl border border-border p-6 flex flex-col">
                 <div className="mb-4">
                   <h3 className="text-lg font-semibold text-foreground">Trial</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Teste gratis por {trialConfig.trial_dias} dias
                   </p>
                 </div>
 
                 <div className="mb-6">
                   <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-bold text-foreground">Gratis</span>
                   </div>
                   <p className="text-sm text-muted-foreground mt-1">
                     {trialConfig.trial_dias} dias
                   </p>
                 </div>
 
                 <ul className="space-y-3 mb-8 flex-1">
                   <li className="flex items-start gap-2 text-sm">
                     <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">
                      {trialPlan.limite_usuarios === -1 
                        ? 'Usuários ilimitados' 
                        : `${trialPlan.limite_usuarios || 2} usuários`}
                    </span>
                   </li>
                   <li className="flex items-start gap-2 text-sm">
                     <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">
                      {formatLimit(trialPlan.limite_oportunidades)} oportunidades
                    </span>
                   </li>
                   <li className="flex items-start gap-2 text-sm">
                     <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">
                      {formatStorage(trialPlan.limite_storage_mb)} armazenamento
                    </span>
                   </li>
                   <li className="flex items-start gap-2 text-sm">
                     <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                     <span className="text-foreground">Suporte por email</span>
                   </li>
                 </ul>
 
                  <button
                    onClick={handleStartTrial}
                    disabled={checkoutLoading === 'trial'}
                    className="w-full py-2.5 px-4 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading === 'trial' ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Teste grátis agora'
                    )}
                  </button>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
                  >
                    Solicite uma demonstração
                  </button>
                </div>
             )}
 
             {/* Cards dos Planos */}
            {planos.map((plano) => {
              const isPopular = plano.popular === true
               const price = periodo === 'anual' ? (plano.preco_anual || 0) : (plano.preco_mensal || 0)
 
               return (
                 <div
                   key={plano.id}
                   className={`relative bg-card rounded-xl border p-6 flex flex-col ${
                     isPopular
                       ? 'border-primary ring-2 ring-primary/20'
                       : 'border-border'
                   }`}
                 >
                   {isPopular && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                         <Star className="w-3 h-3" />
                         Popular
                       </span>
                     </div>
                   )}
 
                   <div className="mb-4">
                     <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
                     {plano.descricao && (
                       <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                     )}
                   </div>
 
                   <div className="mb-6">
                     <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-bold text-foreground">
                         {formatPrice(price)}
                       </span>
                       <span className="text-sm text-muted-foreground">/{periodo === 'anual' ? 'ano' : 'mes'}</span>
                     </div>
                     {periodo === 'anual' && plano.preco_mensal && plano.preco_anual && plano.preco_mensal > plano.preco_anual && (
                       <p className="text-sm text-primary mt-1">
                         Economia de {formatPrice((plano.preco_mensal - plano.preco_anual) * 12)}/ano
                       </p>
                     )}
                   </div>
 
                   <ul className="space-y-3 mb-8 flex-1">
                     <li className="flex items-start gap-2 text-sm">
                       <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                       <span className="text-foreground">
                         {formatLimit(plano.limite_usuarios)} usuarios
                       </span>
                     </li>
                     <li className="flex items-start gap-2 text-sm">
                       <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                       <span className="text-foreground">
                         {formatLimit(plano.limite_oportunidades)} oportunidades
                       </span>
                     </li>
                     <li className="flex items-start gap-2 text-sm">
                       <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                       <span className="text-foreground">
                         {formatStorage(plano.limite_storage_mb)} armazenamento
                       </span>
                     </li>
                   </ul>
 
                    <button
                      onClick={() => handleSelectPlan(plano)}
                      disabled={checkoutLoading === plano.id}
                      className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        isPopular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border border-border hover:bg-accent'
                      }`}
                    >
                      {checkoutLoading === plano.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Comprar agora'
                      )}
                    </button>
                    <button
                      onClick={() => setDemoModalOpen(true)}
                      className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
                    >
                      Solicite uma demonstração
                    </button>
                  </div>
               )
             })}
           </div>
         </div>
       </section>

       {/* Modal Pré-Cadastro */}
       {modalPlano && (
         <PreCadastroModal
           open={modalOpen}
           onOpenChange={setModalOpen}
           planoId={modalPlano.id}
           planoNome={modalPlano.nome}
           periodo={periodo}
           isTrial={modalPlano.isTrial}
           utms={utms}
           codigoParceiro={codigoParceiro}
           onCheckout={handleCheckout}
         />
       )}

        {/* Modal Demonstração */}
        <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <div ref={demoContainerRef} className="min-h-[300px]" />
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} CRM Renove. Todos os direitos reservados.</p>
          </div>
        </footer>
     </div>
   )
 }
 
 export default PlanosPage