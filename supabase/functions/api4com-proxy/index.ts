/**
 * AIDEV-NOTE: Edge Function proxy para API4COM
 * Ações: validate, save, validate-extension, save-extension, get-extension, get-status, test-saved, make-call, get-balance
 * Segurança: JWT + verificação de tenant
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = user.id

    // Get user's tenant
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, organizacao_id, role')
      .eq('auth_id', userId)
      .maybeSingle()

    if (!usuario?.organizacao_id) {
      return new Response(JSON.stringify({ error: 'Usuário sem organização' }), { status: 403, headers: corsHeaders })
    }

    const body = await req.json()
    const { action } = body

    // Service role client for writing encrypted tokens
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // =====================================================
    // ACTION: validate - testar token da API4COM
    // =====================================================
    if (action === 'validate') {
      const { token, api_url } = body
      if (!token) {
        return new Response(JSON.stringify({ valid: false, message: 'Token não informado' }), { headers: corsHeaders })
      }

      try {
        const baseUrl = (api_url || 'https://api.api4com.com').replace(/\/$/, '')
        const validateUrl = `${baseUrl}/api/v1/users/me`
        console.log('[API4COM validate] URL:', validateUrl)
        
        const response = await fetch(validateUrl, {
          headers: { 'Authorization': token },
        })

        const responseText = await response.text()
        console.log('[API4COM validate] Status:', response.status, 'Response:', responseText.substring(0, 500))

        if (response.ok) {
          return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders })
        } else {
          return new Response(JSON.stringify({ valid: false, message: `Token inválido: ${response.status} - ${responseText.substring(0, 200)}` }), { headers: corsHeaders })
        }
      } catch (err) {
        console.error('[API4COM validate] Fetch error:', err)
        return new Response(JSON.stringify({ valid: false, message: 'Erro ao conectar com API4COM. Verifique a URL.' }), { headers: corsHeaders })
      }
    }

    // =====================================================
    // ACTION: save - salvar conexão API4COM
    // =====================================================
    if (action === 'save') {
      if (usuario.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, message: 'Apenas administradores podem configurar a API4COM' }), { status: 403, headers: corsHeaders })
      }

      const { token, api_url } = body
      if (!token) {
        return new Response(JSON.stringify({ success: false, message: 'Token não informado' }), { headers: corsHeaders })
      }

      const apiUrlFinal = (api_url || 'https://api.api4com.com').replace(/\/$/, '')

      const { error: upsertError } = await supabaseAdmin
        .from('conexoes_api4com')
        .upsert({
          organizacao_id: usuario.organizacao_id,
          access_token_encrypted: token,
          api_url: apiUrlFinal,
          status: 'conectado',
          conectado_em: new Date().toISOString(),
          ultimo_erro: null,
          deletado_em: null,
        }, { onConflict: 'organizacao_id' })

      if (upsertError) {
        console.error('Erro ao salvar conexão API4COM:', upsertError)
        return new Response(JSON.stringify({ success: false, message: 'Erro ao salvar conexão' }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
    }

    // =====================================================
    // ACTION: validate-extension - testar ramal SIP
    // =====================================================
    if (action === 'validate-extension') {
      const { extension, password, sip_server } = body

      if (!extension || !password) {
        return new Response(JSON.stringify({ valid: false, message: 'Ramal e senha são obrigatórios' }), { headers: corsHeaders })
      }

      const { data: conexao } = await supabaseAdmin
        .from('conexoes_api4com')
        .select('access_token_encrypted, api_url')
        .eq('organizacao_id', usuario.organizacao_id)
        .is('deletado_em', null)
        .maybeSingle()

      if (!conexao) {
        return new Response(JSON.stringify({ valid: false, message: 'API4COM não configurada. Peça ao admin para conectar.' }), { headers: corsHeaders })
      }

      return new Response(JSON.stringify({ valid: true, sip_server: sip_server || 'sip.api4com.com.br' }), { headers: corsHeaders })
    }

    // =====================================================
    // ACTION: save-extension - salvar ramal do usuário
    // =====================================================
    if (action === 'save-extension') {
      const { extension, password, sip_server, nome_exibicao } = body

      if (!extension || !password) {
        return new Response(JSON.stringify({ success: false, message: 'Ramal e senha são obrigatórios' }), { headers: corsHeaders })
      }

      const { error: upsertError } = await supabaseAdmin
        .from('ramais_voip')
        .upsert({
          organizacao_id: usuario.organizacao_id,
          usuario_id: usuario.id,
          extension,
          password_encrypted: password,
          sip_server: sip_server || 'sip.api4com.com.br',
          nome_exibicao: nome_exibicao || null,
          status: 'ativo',
        }, { onConflict: 'organizacao_id,usuario_id' })

      if (upsertError) {
        console.error('Erro ao salvar ramal:', upsertError)
        return new Response(JSON.stringify({ success: false, message: 'Erro ao salvar ramal' }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
    }

    // =====================================================
    // ACTION: get-extension - buscar ramal do usuário
    // =====================================================
    if (action === 'get-extension') {
      const { data: ramal } = await supabase
        .from('ramais_voip')
        .select('id, extension, sip_server, nome_exibicao, status')
        .eq('usuario_id', usuario.id)
        .maybeSingle()

      return new Response(JSON.stringify({ ramal }), { headers: corsHeaders })
    }

    // =====================================================
    // ACTION: get-status - verificar se API4COM está configurada
    // =====================================================
    if (action === 'get-status') {
      const { data: conexao } = await supabase
        .from('conexoes_api4com')
        .select('id, status, conectado_em, api_url')
        .is('deletado_em', null)
        .maybeSingle()

      return new Response(JSON.stringify({ conexao }), { headers: corsHeaders })
    }

    // =====================================================
    // ACTION: test-saved - testar token já salvo no banco
    // =====================================================
    if (action === 'test-saved') {
      const { data: conexao } = await supabaseAdmin
        .from('conexoes_api4com')
        .select('access_token_encrypted, api_url')
        .eq('organizacao_id', usuario.organizacao_id)
        .is('deletado_em', null)
        .maybeSingle()

      if (!conexao) {
        return new Response(JSON.stringify({ valid: false, message: 'Nenhuma conexão API4COM encontrada' }), { headers: corsHeaders })
      }

      try {
        const baseUrl = (conexao.api_url || 'https://api.api4com.com').replace(/\/$/, '')
        const response = await fetch(`${baseUrl}/api/v1/users/me`, {
          headers: { 'Authorization': conexao.access_token_encrypted },
        })

        if (response.ok) {
          return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders })
        } else {
          return new Response(JSON.stringify({ valid: false, message: `Token inválido: ${response.status}` }), { headers: corsHeaders })
        }
      } catch {
        return new Response(JSON.stringify({ valid: false, message: 'Erro ao conectar com API4COM' }), { headers: corsHeaders })
      }
    }

    // =====================================================
    // ACTION: make-call - iniciar ligação via click-to-call
    // AIDEV-NOTE: Endpoint provável POST /api/v1/calls
    // Se retornar 404, verificar logs para ajustar endpoint
    // =====================================================
    if (action === 'make-call') {
      const { numero_destino } = body

      if (!numero_destino) {
        return new Response(JSON.stringify({ success: false, message: 'Número de destino não informado' }), { headers: corsHeaders })
      }

      // Buscar token API4COM do tenant
      const { data: conexao } = await supabaseAdmin
        .from('conexoes_api4com')
        .select('access_token_encrypted, api_url')
        .eq('organizacao_id', usuario.organizacao_id)
        .is('deletado_em', null)
        .maybeSingle()

      if (!conexao) {
        return new Response(JSON.stringify({ success: false, message: 'API4COM não configurada. Peça ao administrador para conectar.' }), { headers: corsHeaders })
      }

      // Buscar ramal do usuário
      const { data: ramal } = await supabaseAdmin
        .from('ramais_voip')
        .select('extension, sip_server')
        .eq('usuario_id', usuario.id)
        .eq('organizacao_id', usuario.organizacao_id)
        .maybeSingle()

      if (!ramal) {
        return new Response(JSON.stringify({ success: false, message: 'Ramal não configurado. Configure seu ramal VoIP em Configurações → Conexões.' }), { headers: corsHeaders })
      }

      const baseUrl = (conexao.api_url || 'https://api.api4com.com').replace(/\/$/, '')

      try {
        // AIDEV-NOTE: Tentativa com endpoint mais provável da API4COM
        // Formato: POST /api/v1/calls com extension (ramal) e destination (número destino)
        const callUrl = `${baseUrl}/api/v1/calls`
        console.log('[API4COM make-call] URL:', callUrl)
        console.log('[API4COM make-call] Extension:', ramal.extension, 'Destino:', numero_destino)

        const callResponse = await fetch(callUrl, {
          method: 'POST',
          headers: {
            'Authorization': conexao.access_token_encrypted,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            extension: ramal.extension,
            destination: numero_destino,
            // Campos alternativos caso a API use nomes diferentes
            from: ramal.extension,
            to: numero_destino,
            src: ramal.extension,
            dst: numero_destino,
          }),
        })

        const responseText = await callResponse.text()
        console.log('[API4COM make-call] Status:', callResponse.status, 'Response:', responseText.substring(0, 1000))

        if (callResponse.ok) {
          let callData = {}
          try { callData = JSON.parse(responseText) } catch { /* resposta não-JSON */ }
          return new Response(JSON.stringify({
            success: true,
            call_id: (callData as Record<string, unknown>).id || (callData as Record<string, unknown>).call_id || null,
            status: (callData as Record<string, unknown>).status || 'iniciada',
            data: callData,
            message: 'Chamada iniciada com sucesso',
          }), { headers: corsHeaders })
        } else {
          // Tentar interpretar erro
          let errorMsg = `Erro ao iniciar chamada (${callResponse.status})`
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.message) errorMsg = errorData.message
            if (errorData.error) errorMsg = errorData.error
            // Verificar se é erro de créditos
            if (responseText.toLowerCase().includes('credit') || responseText.toLowerCase().includes('balance') || responseText.toLowerCase().includes('saldo')) {
              errorMsg = 'Créditos insuficientes na API4COM. Recarregue seu saldo.'
            }
          } catch { /* resposta não-JSON */ }

          console.error('[API4COM make-call] Error:', errorMsg)
          return new Response(JSON.stringify({
            success: false,
            message: errorMsg,
            status_code: callResponse.status,
          }), { headers: corsHeaders })
        }
      } catch (err) {
        console.error('[API4COM make-call] Fetch error:', err)
        return new Response(JSON.stringify({ success: false, message: 'Erro ao conectar com API4COM. Verifique a conexão.' }), { headers: corsHeaders })
      }
    }

    // =====================================================
    // ACTION: get-balance - consultar saldo/créditos da conta
    // AIDEV-NOTE: Endpoint provável GET /api/v1/account/balance
    // Se retornar 404, verificar logs para ajustar
    // =====================================================
    if (action === 'get-balance') {
      const { data: conexao } = await supabaseAdmin
        .from('conexoes_api4com')
        .select('access_token_encrypted, api_url')
        .eq('organizacao_id', usuario.organizacao_id)
        .is('deletado_em', null)
        .maybeSingle()

      if (!conexao) {
        return new Response(JSON.stringify({ success: false, message: 'API4COM não configurada' }), { headers: corsHeaders })
      }

      const baseUrl = (conexao.api_url || 'https://api.api4com.com').replace(/\/$/, '')

      // AIDEV-NOTE: Tentar múltiplos endpoints possíveis para saldo
      const balanceEndpoints = [
        '/api/v1/account/balance',
        '/api/v1/balance',
        '/api/v1/account',
        '/api/v1/users/me', // Pode conter saldo nos dados do usuário
      ]

      for (const endpoint of balanceEndpoints) {
        try {
          const balanceUrl = `${baseUrl}${endpoint}`
          console.log('[API4COM get-balance] Trying:', balanceUrl)

          const response = await fetch(balanceUrl, {
            headers: { 'Authorization': conexao.access_token_encrypted },
          })

          if (response.ok) {
            const data = await response.json()
            console.log('[API4COM get-balance] Success from:', endpoint, 'Data:', JSON.stringify(data).substring(0, 500))

            // Tentar extrair saldo de diferentes formatos de resposta
            const balance = data.balance ?? data.saldo ?? data.credits ?? data.creditos ?? data.credit ?? data.account?.balance ?? null
            const currency = data.currency ?? data.moeda ?? 'BRL'

            return new Response(JSON.stringify({
              success: true,
              balance,
              currency,
              has_credits: balance === null ? null : balance > 0,
              raw_data: data,
              endpoint_used: endpoint,
            }), { headers: corsHeaders })
          }

          console.log('[API4COM get-balance] Endpoint', endpoint, 'returned:', response.status)
        } catch (err) {
          console.log('[API4COM get-balance] Error on', endpoint, ':', err)
        }
      }

      // Nenhum endpoint de saldo encontrado
      return new Response(JSON.stringify({
        success: true,
        balance: null,
        has_credits: null,
        message: 'Não foi possível consultar o saldo. A chamada será tentada mesmo assim.',
      }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), { status: 400, headers: corsHeaders })

  } catch (err) {
    console.error('Erro no api4com-proxy:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: corsHeaders })
  }
})
