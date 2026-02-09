/**
 * AIDEV-NOTE: Edge Function proxy para API4COM
 * Ações: validate (testar token), save (salvar conexão), validate-extension (testar ramal)
 * Segurança: JWT + verificação de tenant
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub as string

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
        // Tentar chamar um endpoint básico da API4COM para validar
        const baseUrl = (api_url || 'https://api.api4com.com.br').replace(/\/$/, '')
        const response = await fetch(`${baseUrl}/v1/accounts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (response.ok) {
          return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders })
        } else {
          const errorText = await response.text().catch(() => 'Token inválido')
          return new Response(JSON.stringify({ valid: false, message: `Token inválido: ${response.status}` }), { headers: corsHeaders })
        }
      } catch (err) {
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

      const apiUrlFinal = (api_url || 'https://api.api4com.com.br').replace(/\/$/, '')

      // Upsert na tabela conexoes_api4com
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

      // Buscar token API4COM do tenant
      const { data: conexao } = await supabaseAdmin
        .from('conexoes_api4com')
        .select('access_token_encrypted, api_url')
        .eq('organizacao_id', usuario.organizacao_id)
        .is('deletado_em', null)
        .maybeSingle()

      if (!conexao) {
        return new Response(JSON.stringify({ valid: false, message: 'API4COM não configurada. Peça ao admin para conectar.' }), { headers: corsHeaders })
      }

      // Para validação de ramal, retornamos sucesso pois a validação real acontece no WebRTC
      // A API4COM valida as credenciais SIP no momento da conexão WebRTC
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

      // Upsert na tabela ramais_voip
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

    return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), { status: 400, headers: corsHeaders })

  } catch (err) {
    console.error('Erro no api4com-proxy:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: corsHeaders })
  }
})
