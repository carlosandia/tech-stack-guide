import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.14.0'
 
 /**
  * AIDEV-NOTE: Webhook do Stripe para processar eventos de pagamento
  * Conforme PRD - Auto-criar organizacao apos checkout
  */
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
 }
 
 // deno-lint-ignore no-explicit-any
 type SupabaseClientAny = SupabaseClient<any>
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
     const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
     const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 
     if (!STRIPE_SECRET_KEY) {
       throw new Error('STRIPE_SECRET_KEY not configured')
     }
 
     const stripe = new Stripe(STRIPE_SECRET_KEY, {
       apiVersion: '2023-10-16',
       httpClient: Stripe.createFetchHttpClient(),
     })
 
     // deno-lint-ignore no-explicit-any
     const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 
     // Verificar assinatura do webhook
     const signature = req.headers.get('stripe-signature')
     const body = await req.text()
 
     let event: Stripe.Event
 
     if (STRIPE_WEBHOOK_SECRET && signature) {
       try {
         event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
       } catch (err: unknown) {
         const errMsg = err instanceof Error ? err.message : 'Unknown error'
         console.error('Webhook signature verification failed:', errMsg)
         return new Response(
           JSON.stringify({ error: 'Invalid signature' }),
           { status: 400, headers: corsHeaders }
         )
       }
     } else {
       event = JSON.parse(body)
       console.warn('Webhook signature verification skipped - no secret configured')
     }
 
     console.log('Processing webhook event:', event.type)
 
     switch (event.type) {
       case 'checkout.session.completed': {
         const session = event.data.object as Stripe.Checkout.Session
         await handleCheckoutCompleted(supabase, session)
         break
       }
       case 'invoice.paid': {
         const invoice = event.data.object as Stripe.Invoice
         await handleInvoicePaid(supabase, invoice)
         break
       }
       case 'invoice.payment_failed': {
         const invoice = event.data.object as Stripe.Invoice
         await handleInvoicePaymentFailed(supabase, invoice)
         break
       }
       case 'customer.subscription.updated': {
         const subscription = event.data.object as Stripe.Subscription
         await handleSubscriptionUpdated(supabase, subscription)
         break
       }
       case 'customer.subscription.deleted': {
         const subscription = event.data.object as Stripe.Subscription
         await handleSubscriptionDeleted(supabase, subscription)
         break
       }
       default:
         console.log('Unhandled event type:', event.type)
     }
 
     return new Response(
       JSON.stringify({ received: true }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
     )
   } catch (error: unknown) {
     console.error('Webhook error:', error)
     const errorMessage = error instanceof Error ? error.message : 'Unknown error'
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
     )
   }
 })
 
 // =====================
 // HANDLERS
 // =====================
 
 async function handleCheckoutCompleted(
   supabase: SupabaseClientAny,
   session: Stripe.Checkout.Session
 ) {
   console.log('Processing checkout.session.completed:', session.id)
 
   const metadata = session.metadata || {}
   const customerEmail = session.customer_email || session.customer_details?.email
 
   if (!customerEmail) {
     console.error('No customer email in session')
     return
   }
 
   // Verificar se ja existe organizacao com esse email
   const { data: existingOrg } = await supabase
     .from('organizacoes_saas')
     .select('id')
     .eq('email_contato', customerEmail)
     .single()
 
   if (existingOrg) {
     console.log('Organization already exists for email:', customerEmail)
     await updateExistingSubscription(supabase, existingOrg.id, session)
     return
   }
 
   // Criar nova organizacao
   const nomeEmpresa = metadata.nome_empresa || `Empresa de ${customerEmail.split('@')[0]}`
   const slug = generateSlug(nomeEmpresa)
 
   const { data: novaOrg, error: orgError } = await supabase
     .from('organizacoes_saas')
     .insert({
       nome: nomeEmpresa,
       slug,
       email_contato: customerEmail,
       status: 'ativa',
       plano_id: metadata.plano_id,
       origem_cadastro: 'checkout',
       utm_source: metadata.utm_source || null,
       utm_medium: metadata.utm_medium || null,
       utm_campaign: metadata.utm_campaign || null,
     })
     .select()
     .single()
 
   if (orgError || !novaOrg) {
     console.error('Error creating organization:', orgError)
     throw new Error('Failed to create organization')
   }
 
   console.log('Organization created:', novaOrg.id)
 
   // Criar usuario admin
   const tempPassword = generateTempPassword()
 
   const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
     email: customerEmail,
     password: tempPassword,
     email_confirm: true,
   })
 
   if (authError) {
     console.error('Error creating auth user:', authError)
   }
 
   // Criar registro na tabela usuarios
   const { error: userError } = await supabase
     .from('usuarios')
     .insert({
       auth_id: authUser?.user?.id || null,
       email: customerEmail,
       nome: customerEmail.split('@')[0],
       role: 'admin',
       organizacao_id: novaOrg.id,
       ativo: true,
     })
 
   if (userError) {
     console.error('Error creating user record:', userError)
   }
 
   // Criar assinatura
   const subscriptionId = session.subscription as string
 
   const { error: assError } = await supabase
     .from('assinaturas')
     .insert({
       organizacao_id: novaOrg.id,
       plano_id: metadata.plano_id,
       status: 'ativa',
       periodo: metadata.periodo || 'mensal',
       stripe_customer_id: session.customer as string,
       stripe_subscription_id: subscriptionId,
       inicio_em: new Date().toISOString(),
     })
 
   if (assError) {
     console.error('Error creating subscription:', assError)
   }
 
   console.log('Checkout completed successfully for:', customerEmail)
 }
 
 async function updateExistingSubscription(
   supabase: SupabaseClientAny,
   orgId: string,
   session: Stripe.Checkout.Session
 ) {
   const metadata = session.metadata || {}
 
   await supabase
     .from('organizacoes_saas')
     .update({ plano_id: metadata.plano_id, status: 'ativa' })
     .eq('id', orgId)
 
   await supabase
     .from('assinaturas')
     .upsert({
       organizacao_id: orgId,
       plano_id: metadata.plano_id,
       status: 'ativa',
       periodo: metadata.periodo || 'mensal',
       stripe_customer_id: session.customer as string,
       stripe_subscription_id: session.subscription as string,
       inicio_em: new Date().toISOString(),
     }, { onConflict: 'organizacao_id' })
 }
 
 async function handleInvoicePaid(supabase: SupabaseClientAny, invoice: Stripe.Invoice) {
   console.log('Invoice paid:', invoice.id)
   if (!invoice.subscription) return
   await supabase
     .from('assinaturas')
     .update({ status: 'ativa' })
     .eq('stripe_subscription_id', invoice.subscription)
 }
 
 async function handleInvoicePaymentFailed(supabase: SupabaseClientAny, invoice: Stripe.Invoice) {
   console.log('Invoice payment failed:', invoice.id)
   if (!invoice.subscription) return
   await supabase
     .from('assinaturas')
     .update({ status: 'inadimplente' })
     .eq('stripe_subscription_id', invoice.subscription)
 }
 
 async function handleSubscriptionUpdated(supabase: SupabaseClientAny, subscription: Stripe.Subscription) {
   console.log('Subscription updated:', subscription.id)
   const status = subscription.status === 'active' ? 'ativa'
     : subscription.status === 'past_due' ? 'inadimplente'
     : subscription.status === 'canceled' ? 'cancelada'
     : 'suspensa'
   await supabase
     .from('assinaturas')
     .update({ status })
     .eq('stripe_subscription_id', subscription.id)
 }
 
 async function handleSubscriptionDeleted(supabase: SupabaseClientAny, subscription: Stripe.Subscription) {
   console.log('Subscription deleted:', subscription.id)
   await supabase
     .from('assinaturas')
     .update({ status: 'cancelada', cancelado_em: new Date().toISOString() })
     .eq('stripe_subscription_id', subscription.id)
 
   const { data: assinatura } = await supabase
     .from('assinaturas')
     .select('organizacao_id')
     .eq('stripe_subscription_id', subscription.id)
     .single()
 
   if (assinatura) {
     await supabase
       .from('organizacoes_saas')
       .update({ status: 'suspensa' })
       .eq('id', assinatura.organizacao_id)
   }
 }
 
 // =====================
 // HELPERS
 // =====================
 
 function generateSlug(nome: string): string {
   return nome
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/^-+|-+$/g, '')
     .substring(0, 50) + '-' + Date.now().toString(36)
 }
 
 function generateTempPassword(): string {
   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
   let password = ''
   for (let i = 0; i < 12; i++) {
     password += chars.charAt(Math.floor(Math.random() * chars.length))
   }
   return password
 }