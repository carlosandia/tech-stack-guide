 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
 import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
 
 /**
  * AIDEV-NOTE: Edge Function para finalizar o cadastro pós-checkout
  * Conforme PRD - Fluxo de Onboarding Pós-Checkout
  * 
  * Cria: organização, usuário auth, usuário na tabela, assinatura
  * Retorna tokens para login automático
  */
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 interface OnboardingInput {
   session_id: string
   nome_empresa: string
   segmento?: string
   admin_nome: string
   admin_sobrenome: string
   admin_email: string
   admin_telefone: string
   senha: string
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
     if (!STRIPE_SECRET_KEY) {
       throw new Error('STRIPE_SECRET_KEY not configured')
     }
 
     const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 
     const stripe = new Stripe(STRIPE_SECRET_KEY, {
       apiVersion: '2023-10-16',
       httpClient: Stripe.createFetchHttpClient(),
     })
 
     // deno-lint-ignore no-explicit-any
     const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 
     const body: OnboardingInput = await req.json()
     const {
       session_id,
       nome_empresa,
       segmento,
       admin_nome,
       admin_sobrenome,
       admin_email,
       admin_telefone,
       senha,
     } = body
 
     // Validar campos obrigatórios
     if (!session_id || !nome_empresa || !admin_nome || !admin_sobrenome || !admin_email || !admin_telefone || !senha) {
       throw new Error('Todos os campos obrigatórios devem ser preenchidos')
     }
 
     console.log('Starting onboarding for session:', session_id)
 
     // 1. Buscar sessão do Stripe
     const session = await stripe.checkout.sessions.retrieve(session_id)
 
     if (!session) {
       throw new Error('Sessão não encontrada')
     }
 
     // Verificar pagamento
     if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
       throw new Error('Pagamento não confirmado')
     }
 
     // 2. Verificar se sessão já foi usada
     const { data: pendingSession, error: pendingError } = await supabase
       .from('checkout_sessions_pendentes')
       .select('*')
       .eq('stripe_session_id', session_id)
       .maybeSingle()
 
     if (pendingError) {
       console.error('Error checking pending session:', pendingError)
     }
 
     if (pendingSession?.status === 'concluido') {
       throw new Error('Esta sessão já foi utilizada para criar uma conta')
     }
 
     // 3. Buscar dados do plano
     const planoId = session.metadata?.plano_id
     const isTrial = session.metadata?.is_trial === 'true'
     const periodo = session.metadata?.periodo || 'mensal'
 
     let plano = null
     if (planoId) {
       const { data: planoData, error: planoError } = await supabase
         .from('planos')
         .select('*')
         .eq('id', planoId)
         .single()
 
       if (planoError) {
         console.error('Error fetching plan:', planoError)
         throw new Error('Plano não encontrado')
       }
       plano = planoData
     }
 
     console.log('Plan:', plano?.nome, 'Is trial:', isTrial)
 
     // 4. Verificar se email já existe
     const { data: existingUsers } = await supabase.auth.admin.listUsers()
     const emailExists = existingUsers?.users?.some(
       (u: { email?: string }) => u.email?.toLowerCase() === admin_email.toLowerCase()
     )
 
     if (emailExists) {
       throw new Error('Este email já está cadastrado. Por favor, faça login.')
     }
 
     // 5. Criar organização
     const trialExpiraEm = isTrial
       ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
       : null
 
     const { data: org, error: orgError } = await supabase
       .from('organizacoes_saas')
       .insert({
         nome: nome_empresa,
         segmento: segmento || null,
         email: admin_email,
         telefone: admin_telefone,
         plano: plano?.nome?.toLowerCase() || 'starter',
         status: isTrial ? 'trial' : 'ativa',
         limite_usuarios: plano?.limite_usuarios || 5,
         limite_oportunidades: plano?.limite_oportunidades || 1000,
         limite_storage_mb: plano?.limite_storage_mb || 1024,
         trial_expira_em: trialExpiraEm,
         stripe_customer_id: session.customer as string || null,
       })
       .select()
       .single()
 
     if (orgError) {
       console.error('Error creating organization:', orgError)
       throw new Error('Erro ao criar organização: ' + orgError.message)
     }
 
     console.log('Organization created:', org.id)
 
     // 6. Criar usuário no Auth
     const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
       email: admin_email,
       password: senha,
       email_confirm: true, // Confirma email automaticamente
       user_metadata: {
         nome: admin_nome,
         sobrenome: admin_sobrenome,
         telefone: admin_telefone,
       },
     })
 
     if (authError) {
       console.error('Error creating auth user:', authError)
       // Rollback: deletar organização
       await supabase.from('organizacoes_saas').delete().eq('id', org.id)
       throw new Error('Erro ao criar usuário: ' + authError.message)
     }
 
     console.log('Auth user created:', authUser.user.id)
 
     // 7. Criar registro na tabela usuarios
     const { error: userError } = await supabase.from('usuarios').insert({
       auth_id: authUser.user.id,
       organizacao_id: org.id,
       nome: admin_nome,
       sobrenome: admin_sobrenome,
       email: admin_email,
       telefone: admin_telefone,
       role: 'admin',
       status: 'ativo',
     })
 
     if (userError) {
       console.error('Error creating user record:', userError)
       // Rollback
       await supabase.auth.admin.deleteUser(authUser.user.id)
       await supabase.from('organizacoes_saas').delete().eq('id', org.id)
       throw new Error('Erro ao criar registro do usuário: ' + userError.message)
     }
 
     console.log('User record created')
 
     // 8. Criar assinatura
     const { error: assinaturaError } = await supabase.from('assinaturas').insert({
       organizacao_id: org.id,
       plano_id: planoId,
       status: isTrial ? 'trial' : 'ativa',
       periodo: periodo,
       inicio_em: new Date().toISOString(),
       trial_inicio: isTrial ? new Date().toISOString() : null,
       trial_fim: trialExpiraEm,
       stripe_customer_id: session.customer as string || null,
       stripe_subscription_id: session.subscription as string || null,
     })
 
     if (assinaturaError) {
       console.error('Error creating subscription:', assinaturaError)
       // Continua mesmo com erro - não é crítico
     }
 
     // 9. Marcar sessão como concluída
     if (pendingSession) {
       await supabase
         .from('checkout_sessions_pendentes')
         .update({
           status: 'concluido',
           concluido_em: new Date().toISOString(),
         })
         .eq('stripe_session_id', session_id)
     } else {
       await supabase.from('checkout_sessions_pendentes').insert({
         stripe_session_id: session_id,
         customer_email: admin_email,
         plano_id: planoId,
         is_trial: isTrial,
         status: 'concluido',
         metadata: session.metadata,
         concluido_em: new Date().toISOString(),
       })
     }
 
     // 10. Gerar tokens para login automático
     const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
       type: 'magiclink',
       email: admin_email,
     })
 
     // Fazer login com senha para obter tokens
     const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
       email: admin_email,
       password: senha,
     })
 
     if (sessionError) {
       console.error('Error signing in:', sessionError)
       // Retorna sucesso mesmo sem tokens - usuário pode fazer login manual
       return new Response(
         JSON.stringify({
           success: true,
           organizacao_id: org.id,
           message: 'Conta criada com sucesso! Por favor, faça login.',
           requires_login: true,
         }),
         {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 200,
         }
       )
     }
 
     console.log('Onboarding completed successfully')
 
     return new Response(
       JSON.stringify({
         success: true,
         organizacao_id: org.id,
         access_token: sessionData.session?.access_token,
         refresh_token: sessionData.session?.refresh_token,
       }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     )
   } catch (error: unknown) {
     console.error('Error completing onboarding:', error)
     const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
     return new Response(
       JSON.stringify({ error: errorMessage }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 400,
       }
     )
   }
 })