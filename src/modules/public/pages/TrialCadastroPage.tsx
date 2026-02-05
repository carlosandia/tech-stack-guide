 import { useState } from 'react'
 import { useNavigate, useLocation, Link } from 'react-router-dom'
 import { Loader2, Zap, ArrowLeft, Check } from 'lucide-react'
 import { supabase } from '@/integrations/supabase/client'
 
 /**
  * AIDEV-NOTE: Pagina de cadastro de Trial
  * Conforme PRD - Cadastro de Trial gratuito
  */
 
 interface FormData {
   nome: string
   email: string
   nome_empresa: string
   telefone: string
 }
 
 export function TrialCadastroPage() {
   const navigate = useNavigate()
   const location = useLocation()
   const utms = (location.state as { utms?: Record<string, string> })?.utms || {}
 
   const [formData, setFormData] = useState<FormData>({
     nome: '',
     email: '',
     nome_empresa: '',
     telefone: '',
   })
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     setError(null)
     setLoading(true)
 
     try {
       const { data, error: fnError } = await supabase.functions.invoke('iniciar-trial', {
         body: {
           ...formData,
           utms,
         },
       })
 
       if (fnError) throw fnError
 
       if (data?.success) {
         navigate('/sucesso', {
           state: {
             tipo: 'trial',
             message: data.message,
             trial_expira_em: data.trial_expira_em,
           },
         })
       } else {
         throw new Error(data?.error || 'Erro ao iniciar trial')
       }
     } catch (err) {
       console.error('Trial error:', err)
       setError(err instanceof Error ? err.message : 'Erro ao iniciar trial. Tente novamente.')
     } finally {
       setLoading(false)
     }
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
       {/* Header */}
       <header className="border-b border-border bg-background/95 backdrop-blur">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <Zap className="w-5 h-5 text-primary-foreground" />
               </div>
               <span className="font-bold text-lg text-foreground">CRM Renove</span>
             </div>
             <Link
               to="/planos"
               className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               Voltar aos planos
             </Link>
           </div>
         </div>
       </header>
 
       {/* Form */}
       <main className="flex-1 flex items-center justify-center p-4">
         <div className="w-full max-w-md">
           <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
             <div className="text-center mb-8">
               <h1 className="text-2xl font-bold text-foreground">Comece seu Trial Gratis</h1>
               <p className="text-muted-foreground mt-2">
                 Acesse todos os recursos por 14 dias
               </p>
             </div>
 
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-foreground mb-1.5">
                   Nome completo *
                 </label>
                 <input
                   type="text"
                   required
                   value={formData.nome}
                   onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                   className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="Seu nome"
                 />
               </div>
 
               <div>
                 <label className="block text-sm font-medium text-foreground mb-1.5">
                   Email *
                 </label>
                 <input
                   type="email"
                   required
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="voce@empresa.com"
                 />
               </div>
 
               <div>
                 <label className="block text-sm font-medium text-foreground mb-1.5">
                   Nome da empresa *
                 </label>
                 <input
                   type="text"
                   required
                   value={formData.nome_empresa}
                   onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                   className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="Sua empresa"
                 />
               </div>
 
               <div>
                 <label className="block text-sm font-medium text-foreground mb-1.5">
                   Telefone
                 </label>
                 <input
                   type="tel"
                   value={formData.telefone}
                   onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                   className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                   placeholder="(11) 99999-9999"
                 />
               </div>
 
               {error && (
                 <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                   <p className="text-sm text-destructive">{error}</p>
                 </div>
               )}
 
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loading ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <>
                     <Check className="w-4 h-4" />
                     Iniciar Trial Gratis
                   </>
                 )}
               </button>
             </form>
 
             <p className="text-xs text-muted-foreground text-center mt-6">
               Ao criar sua conta, voce concorda com nossos{' '}
               <a href="#" className="text-primary hover:underline">Termos de Servico</a>{' '}
               e{' '}
               <a href="#" className="text-primary hover:underline">Politica de Privacidade</a>.
             </p>
           </div>
         </div>
       </main>
     </div>
   )
 }
 
 export default TrialCadastroPage