import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
 
 /**
  * AIDEV-NOTE: Edge Function para iniciar trial
  * Conforme PRD - Cadastro de Trial gratuito
  */
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 
     // deno-lint-ignore no-explicit-any
     const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 
     const body = await req.json()
     const { nome, email, nome_empresa, telefone, utms, codigo_parceiro } = body
 
      console.log('Starting trial for:', email)

      // Validar campos obrigatorios
      if (!email || !nome || !nome_empresa) {
        return new Response(
          JSON.stringify({ success: false, error: 'Campos obrigatórios: nome, email, nome_empresa' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Formato de email inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Verificar se email ja existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        console.warn('Email already registered:', email)
        return new Response(
          JSON.stringify({ success: false, error: 'Não foi possível completar o cadastro' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
 
     // Buscar configuracao de trial
     const { data: configStripe } = await supabase
       .from('configuracoes_globais')
       .select('configuracoes')
       .eq('plataforma', 'stripe')
       .single()
 
     const stripeConfig = (configStripe?.configuracoes || {}) as Record<string, unknown>
     const trialEnabled = stripeConfig.trial_habilitado !== false
     const trialDias = (stripeConfig.trial_dias as number) || 14
 
      if (!trialEnabled) {
        console.warn('Trial disabled in config')
        return new Response(
          JSON.stringify({ success: false, error: 'Serviço indisponível no momento' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
 
     // Buscar plano Trial
     const { data: planoTrial } = await supabase
       .from('planos')
       .select('id')
       .eq('nome', 'Trial')
       .single()
 
     // Calcular data de expiracao
     const trialExpiraEm = new Date()
     trialExpiraEm.setDate(trialExpiraEm.getDate() + trialDias)
 
     // Gerar slug
     const slug = generateSlug(nome_empresa)
 
     // Criar organizacao
     const { data: novaOrg, error: orgError } = await supabase
       .from('organizacoes_saas')
       .insert({
         nome: nome_empresa,
         slug,
         email_contato: email,
         telefone_contato: telefone || null,
         status: 'trial',
         plano_id: planoTrial?.id || null,
         trial_expira_em: trialExpiraEm.toISOString(),
         origem_cadastro: 'trial',
         utm_source: utms?.utm_source || null,
         utm_medium: utms?.utm_medium || null,
         utm_campaign: utms?.utm_campaign || null,
       })
       .select()
       .single()
 
      if (orgError || !novaOrg) {
        console.error('Error creating organization:', orgError)
        return new Response(
          JSON.stringify({ success: false, error: 'Não foi possível completar o cadastro' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
 
     console.log('Organization created:', novaOrg.id)
 
     // Criar usuario no Auth
     const tempPassword = generateTempPassword()
 
     const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
       email,
       password: tempPassword,
       email_confirm: true,
       user_metadata: { nome, organizacao_id: novaOrg.id },
     })
 
      if (authError) {
        console.error('Error creating auth user:', authError)
        await supabase.from('organizacoes_saas').delete().eq('id', novaOrg.id)
        return new Response(
          JSON.stringify({ success: false, error: 'Não foi possível completar o cadastro' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
 
     // Criar registro na tabela usuarios
     const { error: userError } = await supabase
       .from('usuarios')
       .insert({
         auth_id: authUser.user.id,
         email,
         nome: nome.split(' ')[0],
         sobrenome: nome.split(' ').slice(1).join(' ') || null,
         role: 'admin',
         organizacao_id: novaOrg.id,
         ativo: true,
       })
 
     if (userError) {
       console.error('Error creating user record:', userError)
     }
 
     // Criar configuracoes do tenant
     await supabase.from('configuracoes_tenant').insert({
       organizacao_id: novaOrg.id,
       timezone: 'America/Sao_Paulo',
       moeda_padrao: 'BRL',
       formato_data: 'DD/MM/YYYY',
     })

     // Vincular parceiro automaticamente (se código fornecido)
     if (codigo_parceiro) {
       const { data: parceiro } = await supabase
         .from('parceiros')
         .select('id, percentual_comissao')
         .eq('codigo_indicacao', codigo_parceiro)
         .eq('status', 'ativo')
         .maybeSingle()

       if (parceiro) {
         const { error: indicacaoError } = await supabase.from('indicacoes_parceiro').insert({
           parceiro_id: parceiro.id,
           organizacao_id: novaOrg.id,
           status: 'ativa',
           percentual_comissao_snapshot: parceiro.percentual_comissao,
         })
         if (indicacaoError) {
           console.error('Error creating partner indication:', indicacaoError)
         } else {
           console.log('Parceiro vinculado via trial:', codigo_parceiro)
         }
       } else {
         console.warn('Código de parceiro inválido ou inativo:', codigo_parceiro)
       }
     }

     console.log('Trial started successfully for:', email)
 
     return new Response(
       JSON.stringify({
         success: true,
         organizacao_id: novaOrg.id,
         message: `Trial de ${trialDias} dias iniciado com sucesso!`,
         trial_expira_em: trialExpiraEm.toISOString(),
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
     )
    } catch (error: unknown) {
      console.error('Error starting trial:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro interno ao processar a requisição' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
 })
 
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