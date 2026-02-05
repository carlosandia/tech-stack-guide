 import { useEffect, useState } from 'react'
 import { useSearchParams, useLocation, Link } from 'react-router-dom'
 import { CheckCircle, Loader2, Zap, Mail, ArrowRight } from 'lucide-react'
 
 /**
  * AIDEV-NOTE: Pagina de sucesso apos checkout/trial
  * Conforme PRD - Pagina pos-checkout
  */
 
 export function CheckoutSucessoPage() {
   const [searchParams] = useSearchParams()
   const location = useLocation()
   const [loading, setLoading] = useState(true)
 
   const sessionId = searchParams.get('session_id')
   const stateData = location.state as {
     tipo?: 'trial' | 'checkout'
     message?: string
     trial_expira_em?: string
   } | null
 
   const isTrial = stateData?.tipo === 'trial'
 
   useEffect(() => {
     // Simular carregamento
     const timer = setTimeout(() => setLoading(false), 1000)
     return () => clearTimeout(timer)
   }, [])
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     )
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
       {/* Header */}
       <header className="border-b border-border bg-background/95 backdrop-blur">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center h-16">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <Zap className="w-5 h-5 text-primary-foreground" />
               </div>
               <span className="font-bold text-lg text-foreground">CRM Renove</span>
             </div>
           </div>
         </div>
       </header>
 
       {/* Content */}
       <main className="flex-1 flex items-center justify-center p-4">
         <div className="w-full max-w-md text-center">
           <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle className="w-8 h-8 text-primary" />
             </div>
 
             <h1 className="text-2xl font-bold text-foreground mb-2">
               {isTrial ? 'Trial Iniciado!' : 'Pagamento Confirmado!'}
             </h1>
 
             <p className="text-muted-foreground mb-6">
               {isTrial
                 ? stateData?.message || 'Seu trial foi iniciado com sucesso!'
                 : 'Sua assinatura foi ativada com sucesso!'}
             </p>
 
             <div className="bg-muted/50 rounded-lg p-4 mb-6">
               <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                 <Mail className="w-4 h-4" />
                 <span>Verifique seu email</span>
               </div>
               <p className="text-sm text-foreground">
                 Enviamos suas credenciais de acesso para o email cadastrado.
               </p>
             </div>
 
             {stateData?.trial_expira_em && (
               <p className="text-sm text-muted-foreground mb-6">
                 Seu trial expira em:{' '}
                 <span className="font-medium text-foreground">
                   {new Date(stateData.trial_expira_em).toLocaleDateString('pt-BR')}
                 </span>
               </p>
             )}
 
             {sessionId && (
               <p className="text-xs text-muted-foreground mb-6">
                 ID da sessao: {sessionId.substring(0, 20)}...
               </p>
             )}
 
             <Link
               to="/login"
               className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
             >
               Acessar o CRM
               <ArrowRight className="w-4 h-4" />
             </Link>
           </div>
         </div>
       </main>
     </div>
   )
 }
 
 export default CheckoutSucessoPage