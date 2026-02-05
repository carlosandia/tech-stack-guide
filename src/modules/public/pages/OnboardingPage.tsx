 import { useState, useEffect } from 'react'
 import { useNavigate, useSearchParams, Link } from 'react-router-dom'
 import { useForm } from 'react-hook-form'
 import { zodResolver } from '@hookform/resolvers/zod'
 import { Loader2, Zap, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
 import { supabase } from '@/lib/supabase'
 import { OnboardingSchema, SEGMENTOS_ONBOARDING } from '../schemas/onboarding.schema'
 import type { OnboardingData } from '../schemas/onboarding.schema'
 
 /**
  * AIDEV-NOTE: Página de onboarding pós-checkout
  * Conforme PRD - Fluxo de Onboarding Pós-Checkout
  * 
  * Coleta dados da empresa e admin após pagamento no Stripe
  * Cria org + usuário + faz login automático
  */
 
 interface SessionData {
   customer_email: string
   plano_id: string
   plano_nome: string
   is_trial: boolean
   periodo: string
 }
 
 export function OnboardingPage() {
   const navigate = useNavigate()
   const [searchParams] = useSearchParams()
   const sessionId = searchParams.get('session_id')
 
   const [sessionData, setSessionData] = useState<SessionData | null>(null)
   const [loading, setLoading] = useState(true)
   const [submitting, setSubmitting] = useState(false)
   const [showPassword, setShowPassword] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const [success, setSuccess] = useState(false)
 
   const form = useForm<OnboardingData>({
     resolver: zodResolver(OnboardingSchema),
     defaultValues: {
       nome_empresa: '',
       segmento: '',
       admin_nome: '',
       admin_sobrenome: '',
       admin_email: '',
       admin_telefone: '',
       senha: '',
     },
   })
 
   const { register, handleSubmit, setValue, formState: { errors } } = form
 
   useEffect(() => {
     async function fetchSession() {
       if (!sessionId) {
         navigate('/planos')
         return
       }
 
       try {
         const { data, error } = await supabase.functions.invoke('get-checkout-session', {
           body: { session_id: sessionId },
         })
 
         if (error) throw error
 
         if (data?.error) {
           setError(data.error)
           setLoading(false)
           return
         }
 
         setSessionData(data)
         if (data?.customer_email) {
           setValue('admin_email', data.customer_email)
         }
       } catch (err) {
         console.error('Error fetching session:', err)
         setError('Erro ao carregar dados do checkout. Por favor, tente novamente.')
       } finally {
         setLoading(false)
       }
     }
 
     fetchSession()
   }, [sessionId, navigate, setValue])
 
   async function onSubmit(formData: OnboardingData) {
     setSubmitting(true)
     setError(null)
 
     try {
       const { data, error } = await supabase.functions.invoke('complete-onboarding', {
         body: {
           session_id: sessionId,
           ...formData,
         },
       })
 
       if (error) throw error
 
       if (data?.error) {
         setError(data.error)
         setSubmitting(false)
         return
       }
 
       if (data?.success) {
         setSuccess(true)
 
         // Se tem tokens, faz login automático
         if (data.access_token && data.refresh_token) {
           await supabase.auth.setSession({
             access_token: data.access_token,
             refresh_token: data.refresh_token,
           })
 
           // Aguarda um pouco para a sessão ser estabelecida
           setTimeout(() => {
             navigate('/app')
           }, 1000)
         } else if (data.requires_login) {
           // Redireciona para login
           setTimeout(() => {
             navigate('/login')
           }, 2000)
         }
       }
     } catch (err) {
       console.error('Error completing onboarding:', err)
       setError('Erro ao criar conta. Por favor, tente novamente.')
     } finally {
       setSubmitting(false)
     }
   }
 
   // Formatar telefone
   function formatPhone(value: string) {
     const numbers = value.replace(/\D/g, '')
     if (numbers.length <= 2) return numbers
     if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
     if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
     return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
   }
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <p className="text-muted-foreground">Carregando dados do checkout...</p>
         </div>
       </div>
     )
   }
 
   if (success) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
         <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
           <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-foreground mb-2">Conta criada com sucesso!</h2>
           <p className="text-muted-foreground mb-4">
             Você será redirecionado em instantes...
           </p>
           <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
         </div>
       </div>
     )
   }
 
   if (error && !sessionData) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
         <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
           <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
           <h2 className="text-lg font-semibold text-foreground mb-2">Erro no checkout</h2>
           <p className="text-sm text-muted-foreground mb-4">{error}</p>
           <Link
             to="/planos"
             className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
           >
             Voltar para planos
           </Link>
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
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <Zap className="w-5 h-5 text-primary-foreground" />
               </div>
               <span className="font-bold text-lg text-foreground">CRM Renove</span>
             </div>
             <div className="flex items-center gap-2">
               {sessionData?.is_trial && (
                 <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                   Trial de 14 dias
                 </span>
               )}
               {sessionData?.plano_nome && (
                 <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                   Plano {sessionData.plano_nome}
                 </span>
               )}
             </div>
           </div>
         </div>
       </header>
 
       {/* Content */}
       <main className="py-12 px-4">
         <div className="max-w-lg mx-auto">
           <div className="text-center mb-8">
             <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
               Complete seu cadastro
             </h1>
             <p className="text-muted-foreground">
               Preencha os dados abaixo para criar sua conta e começar a usar o CRM.
             </p>
           </div>
 
           <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               {/* Empresa */}
               <div className="space-y-4">
                 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                   Dados da Empresa
                 </h3>
 
                 <div>
                   <label htmlFor="nome_empresa" className="block text-sm font-medium text-foreground mb-1.5">
                     Nome da Empresa <span className="text-destructive">*</span>
                   </label>
                   <input
                     id="nome_empresa"
                     type="text"
                     {...register('nome_empresa')}
                     className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                     placeholder="Ex: Minha Empresa Ltda"
                   />
                   {errors.nome_empresa && (
                     <p className="text-xs text-destructive mt-1">{errors.nome_empresa.message}</p>
                   )}
                 </div>
 
                 <div>
                   <label htmlFor="segmento" className="block text-sm font-medium text-foreground mb-1.5">
                     Segmento
                   </label>
                   <select
                     id="segmento"
                     {...register('segmento')}
                     className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                   >
                     <option value="">Selecione um segmento (opcional)</option>
                     {SEGMENTOS_ONBOARDING.map((seg) => (
                       <option key={seg.value} value={seg.value}>
                         {seg.label}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
 
               {/* Admin */}
               <div className="space-y-4 pt-4 border-t border-border">
                 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                   Dados do Administrador
                 </h3>
 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label htmlFor="admin_nome" className="block text-sm font-medium text-foreground mb-1.5">
                       Nome <span className="text-destructive">*</span>
                     </label>
                     <input
                       id="admin_nome"
                       type="text"
                       {...register('admin_nome')}
                       className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                       placeholder="Nome"
                     />
                     {errors.admin_nome && (
                       <p className="text-xs text-destructive mt-1">{errors.admin_nome.message}</p>
                     )}
                   </div>
 
                   <div>
                     <label htmlFor="admin_sobrenome" className="block text-sm font-medium text-foreground mb-1.5">
                       Sobrenome <span className="text-destructive">*</span>
                     </label>
                     <input
                       id="admin_sobrenome"
                       type="text"
                       {...register('admin_sobrenome')}
                       className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                       placeholder="Sobrenome"
                     />
                     {errors.admin_sobrenome && (
                       <p className="text-xs text-destructive mt-1">{errors.admin_sobrenome.message}</p>
                     )}
                   </div>
                 </div>
 
                 <div>
                   <label htmlFor="admin_email" className="block text-sm font-medium text-foreground mb-1.5">
                     Email <span className="text-destructive">*</span>
                   </label>
                   <input
                     id="admin_email"
                     type="email"
                     {...register('admin_email')}
                     readOnly
                     className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Email do checkout (não pode ser alterado)
                   </p>
                 </div>
 
                 <div>
                   <label htmlFor="admin_telefone" className="block text-sm font-medium text-foreground mb-1.5">
                     Telefone <span className="text-destructive">*</span>
                   </label>
                   <input
                     id="admin_telefone"
                     type="tel"
                     {...register('admin_telefone')}
                     onChange={(e) => {
                       const formatted = formatPhone(e.target.value)
                       setValue('admin_telefone', formatted)
                     }}
                     className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                     placeholder="(11) 99999-9999"
                   />
                   {errors.admin_telefone && (
                     <p className="text-xs text-destructive mt-1">{errors.admin_telefone.message}</p>
                   )}
                 </div>
 
                 <div>
                   <label htmlFor="senha" className="block text-sm font-medium text-foreground mb-1.5">
                     Senha <span className="text-destructive">*</span>
                   </label>
                   <div className="relative">
                     <input
                       id="senha"
                       type={showPassword ? 'text' : 'password'}
                       {...register('senha')}
                       className="w-full px-3 py-2 pr-10 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                       placeholder="Mínimo 8 caracteres"
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                     >
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                   {errors.senha && (
                     <p className="text-xs text-destructive mt-1">{errors.senha.message}</p>
                   )}
                 </div>
               </div>
 
               {/* Error */}
               {error && (
                 <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                   <p className="text-sm text-destructive">{error}</p>
                 </div>
               )}
 
               {/* Submit */}
               <button
                 type="submit"
                 disabled={submitting}
                 className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {submitting ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Criando sua conta...
                   </>
                 ) : (
                   'Criar minha conta'
                 )}
               </button>
             </form>
           </div>
 
           <p className="text-center text-xs text-muted-foreground mt-6">
             Ao criar sua conta, você concorda com nossos{' '}
             <a href="#" className="text-primary hover:underline">Termos de Uso</a>
             {' '}e{' '}
             <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
           </p>
         </div>
       </main>
     </div>
   )
 }
 
 export default OnboardingPage