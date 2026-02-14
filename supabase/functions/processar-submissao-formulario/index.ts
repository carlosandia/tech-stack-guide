/**
 * AIDEV-NOTE: Edge Function para processar submissões de formulários
 * Cria contato e oportunidade no CRM com base nos mapeamentos de campos
 * Envia notificações por Email (SMTP) e WhatsApp (WAHA) conforme config_botoes
 * Chamada fire-and-forget após inserção da submissão
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// =====================================================
// SMTP Helper Functions
// =====================================================

function extractHostnameFromGreeting(greeting: string, fallback: string): string {
  const parts = greeting.trim().split(/\s+/)
  return parts.length > 1 ? parts[1] : fallback
}

async function writeAll(conn: Deno.TcpConn | Deno.TlsConn, data: Uint8Array): Promise<void> {
  let offset = 0
  while (offset < data.length) {
    const n = await conn.write(data.subarray(offset))
    if (n === null || n === 0) throw new Error('Falha ao escrever no socket SMTP')
    offset += n
  }
}

async function enviarEmailSmtp(config: {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName?: string
  to: string
  subject: string
  bodyHtml: string
}): Promise<{ sucesso: boolean; mensagem: string }> {
  let dataResponseOk = false
  try {
    const useTLS = config.port === 465
    let conn: Deno.TcpConn | Deno.TlsConn

    if (useTLS) {
      conn = await Deno.connectTls({ hostname: config.host, port: config.port })
    } else {
      conn = await Deno.connect({ hostname: config.host, port: config.port })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readResponse = async (timeoutMs = 15000): Promise<string> => {
      let fullResponse = ''
      while (true) {
        const buf = new Uint8Array(4096)
        const readPromise = conn.read(buf)
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
        const n = await Promise.race([readPromise, timeoutPromise])
        if (n === null) throw new Error('Timeout lendo resposta SMTP')
        if (n === 0) throw new Error('Conexão fechada pelo servidor')
        fullResponse += decoder.decode(buf.subarray(0, n as number))
        const lines = fullResponse.split('\r\n').filter(l => l.length > 0)
        if (lines.length === 0) continue
        const lastLine = lines[lines.length - 1]
        if (/^\d{3}[\s]/.test(lastLine) || /^\d{3}$/.test(lastLine)) break
      }
      return fullResponse
    }

    const sendCommand = async (cmd: string, timeoutMs = 15000): Promise<string> => {
      await writeAll(conn, encoder.encode(cmd + '\r\n'))
      return await readResponse(timeoutMs)
    }

    const greeting = await readResponse()
    if (!greeting.startsWith('220')) {
      conn.close()
      return { sucesso: false, mensagem: 'Servidor SMTP rejeitou conexão' }
    }

    const realHostname = extractHostnameFromGreeting(greeting, config.host)
    await sendCommand('EHLO crmrenove.local')

    if (config.port === 587) {
      const starttlsResp = await sendCommand('STARTTLS')
      if (starttlsResp.startsWith('220')) {
        conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: realHostname })
        await sendCommand('EHLO crmrenove.local')
      }
    }

    const authResp = await sendCommand('AUTH LOGIN')
    if (!authResp.startsWith('334')) { conn.close(); return { sucesso: false, mensagem: 'AUTH LOGIN não suportado' } }

    const userResp = await sendCommand(btoa(config.user))
    if (!userResp.startsWith('334')) { conn.close(); return { sucesso: false, mensagem: 'Falha auth (usuário)' } }

    const passResp = await sendCommand(btoa(config.pass))
    if (!passResp.startsWith('235')) { conn.close(); return { sucesso: false, mensagem: 'Falha auth (senha)' } }

    const mailFromResp = await sendCommand(`MAIL FROM:<${config.from}>`)
    if (!mailFromResp.startsWith('250')) { conn.close(); return { sucesso: false, mensagem: 'Remetente rejeitado' } }

    const rcptResp = await sendCommand(`RCPT TO:<${config.to}>`)
    if (!rcptResp.startsWith('250')) { conn.close(); return { sucesso: false, mensagem: 'Destinatário rejeitado' } }

    const dataResp = await sendCommand('DATA')
    if (!dataResp.startsWith('354')) { conn.close(); return { sucesso: false, mensagem: 'DATA rejeitado' } }

    const messageId = `${crypto.randomUUID()}@crmrenove.local`
    const fromDisplay = config.fromName ? `"${config.fromName}" <${config.from}>` : config.from
    const message = [
      `From: ${fromDisplay}`,
      `To: ${config.to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(config.subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      ``,
      config.bodyHtml,
      `.`,
    ].join('\r\n')

    await writeAll(conn, encoder.encode(message + '\r\n'))
    const msgResp = await readResponse(30000)

    if (!msgResp.startsWith('250')) {
      conn.close()
      return { sucesso: false, mensagem: `Mensagem rejeitada: ${msgResp.substring(0, 100)}` }
    }
    dataResponseOk = true

    try { await sendCommand('QUIT', 5000) } catch (_) { /* ok */ }
    try { conn.close() } catch (_) { /* ok */ }

    return { sucesso: true, mensagem: 'Email enviado' }
  } catch (err) {
    const msg = (err as Error).message
    if (dataResponseOk && (msg.includes('close_notify') || msg.includes('peer closed'))) {
      return { sucesso: true, mensagem: 'Email enviado (close_notify)' }
    }
    return { sucesso: false, mensagem: `Erro SMTP: ${msg}` }
  }
}

// =====================================================
// Notification Helpers
// =====================================================

async function notificarEmail(
  supabase: ReturnType<typeof createClient>,
  organizacaoId: string,
  emailDestino: string,
  dadosContato: Record<string, any>,
  nomeFormulario: string,
  funilNome: string,
) {
  console.log('[notif-email] Buscando conexão SMTP para org:', organizacaoId)

  const { data: conexao } = await supabase
    .from('conexoes_email')
    .select('email, nome_remetente, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted')
    .eq('organizacao_id', organizacaoId)
    .in('status', ['ativo', 'conectado'])
    .is('deletado_em', null)
    .limit(1)
    .single()

  if (!conexao?.smtp_host || !conexao?.smtp_user || !conexao?.smtp_pass_encrypted) {
    console.error('[notif-email] Nenhuma conexão SMTP válida encontrada')
    return
  }

  const camposHtml = Object.entries(dadosContato)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:600">${k}</td><td style="padding:6px 12px;border:1px solid #ddd">${v}</td></tr>`)
    .join('')

  const bodyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a1a2e">🎯 Nova Oportunidade Criada</h2>
      <p><strong>Formulário:</strong> ${nomeFormulario}</p>
      <p><strong>Pipeline:</strong> ${funilNome}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr><th style="padding:8px 12px;border:1px solid #ddd;background:#f5f5f5;text-align:left">Campo</th><th style="padding:8px 12px;border:1px solid #ddd;background:#f5f5f5;text-align:left">Valor</th></tr></thead>
        <tbody>${camposHtml}</tbody>
      </table>
      <p style="color:#666;font-size:12px">Enviado automaticamente pelo CRM Renove</p>
    </div>`

  // Buscar nome do contato: tentar chaves comuns (label pode variar)
  const nomeContato = dadosContato['Nome'] || dadosContato['nome'] || dadosContato['Seu nome'] || dadosContato['Seu Nome'] || dadosContato['name'] || Object.values(dadosContato)[0] || 'Lead'
  const result = await enviarEmailSmtp({
    host: conexao.smtp_host,
    port: conexao.smtp_port || 587,
    user: conexao.smtp_user,
    pass: conexao.smtp_pass_encrypted,
    from: conexao.email,
    fromName: conexao.nome_remetente || 'CRM Renove',
    to: emailDestino,
    subject: `Nova oportunidade: ${nomeContato}`,
    bodyHtml,
  })

  console.log('[notif-email] Resultado:', result)
}

async function notificarWhatsApp(
  supabase: ReturnType<typeof createClient>,
  organizacaoId: string,
  numeroDestino: string,
  dadosContato: Record<string, any>,
  nomeFormulario: string,
  funilNome: string,
) {
  console.log('[notif-waha] Buscando config WAHA e sessão para org:', organizacaoId)

  // Buscar config global WAHA
  const { data: configGlobal } = await supabase
    .from('configuracoes_globais')
    .select('configuracoes')
    .eq('plataforma', 'waha')
    .single()

  if (!configGlobal?.configuracoes) {
    console.error('[notif-waha] Configuração WAHA global não encontrada')
    return
  }

  const wahaConfig = configGlobal.configuracoes as Record<string, any>
  const apiUrl = wahaConfig.api_url || wahaConfig.url
  const apiKey = wahaConfig.api_key || wahaConfig.key

  if (!apiUrl) {
    console.error('[notif-waha] api_url WAHA não configurada')
    return
  }

  // Buscar sessão conectada
  const { data: sessao } = await supabase
    .from('sessoes_whatsapp')
    .select('session_name')
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'connected')
    .is('deletado_em', null)
    .limit(1)
    .single()

  if (!sessao) {
    console.error('[notif-waha] Nenhuma sessão WhatsApp conectada')
    return
  }

  // Formatar numero: remover tudo que não é dígito, adicionar @c.us
  const numeroLimpo = numeroDestino.replace(/\D/g, '')
  const chatId = `${numeroLimpo}@c.us`

  // Montar mensagem
  const campos = Object.entries(dadosContato)
    .map(([k, v]) => `*${k}:* ${v}`)
    .join('\n')

  const mensagem = `🎯 *Nova Oportunidade Criada*\n\n` +
    `📝 *Formulário:* ${nomeFormulario}\n` +
    `📊 *Pipeline:* ${funilNome}\n\n` +
    `${campos}\n\n` +
    `_Enviado automaticamente pelo CRM Renove_`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) headers['X-Api-Key'] = apiKey

  const resp = await fetch(`${apiUrl}/api/sendText`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chatId,
      text: mensagem,
      session: sessao.session_name,
    }),
  })

  const respText = await resp.text()
  console.log(`[notif-waha] Status: ${resp.status}, Resp: ${respText.substring(0, 200)}`)
}

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // AIDEV-NOTE: Suporta dois modos de chamada:
    // 1. Legado: { submissao_id, formulario_id } — busca submissão existente
    // 2. Novo (público): { formulario_id, dados, utm_source, utm_medium, utm_campaign, user_agent } — cria submissão
    const { submissao_id: existingSubmissaoId, formulario_id, dados, utm_source, utm_medium, utm_campaign, user_agent } = body

    if (!formulario_id) {
      return new Response(JSON.stringify({ error: 'formulario_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Buscar formulário com config_botoes
    const { data: formulario, error: formErr } = await supabase
      .from('formularios')
      .select('id, organizacao_id, nome, config_botoes, funil_id, total_submissoes')
      .eq('id', formulario_id)
      .single()

    if (formErr || !formulario) {
      console.error('Formulário não encontrado:', formErr)
      return new Response(JSON.stringify({ error: 'Formulário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let submissao_id = existingSubmissaoId
    let submissaoDados: Record<string, any> = {}
    let submissaoUtm = { utm_source: null as string | null, utm_medium: null as string | null, utm_campaign: null as string | null }

    if (dados && !existingSubmissaoId) {
      // Modo novo: criar submissão via service_role (sem RLS)
      const { data: novaSubmissao, error: insErr } = await supabase
        .from('submissoes_formularios')
        .insert({
          formulario_id: formulario.id,
          organizacao_id: formulario.organizacao_id,
          dados,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          ip_address: null,
          user_agent: user_agent || null,
        })
        .select('id, dados, utm_source, utm_medium, utm_campaign')
        .single()

      if (insErr || !novaSubmissao) {
        console.error('Erro ao criar submissão:', insErr)
        return new Response(JSON.stringify({ error: 'Erro ao salvar submissão' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      submissao_id = novaSubmissao.id
      submissaoDados = novaSubmissao.dados as Record<string, any>
      submissaoUtm = { utm_source: novaSubmissao.utm_source, utm_medium: novaSubmissao.utm_medium, utm_campaign: novaSubmissao.utm_campaign }
      console.log('[processar] Submissão criada via edge function:', submissao_id)

      // Registrar evento analytics (fire-and-forget)
      supabase.from('eventos_analytics_formularios').insert({
        formulario_id: formulario.id,
        tipo_evento: 'submissao',
        navegador: user_agent || null,
      }).then(() => {})
    } else if (existingSubmissaoId) {
      // Modo legado: buscar submissão existente
      const { data: submissao, error: subErr } = await supabase
        .from('submissoes_formularios')
        .select('id, dados, utm_source, utm_medium, utm_campaign')
        .eq('id', existingSubmissaoId)
        .single()

      if (subErr || !submissao) {
        console.error('Submissão não encontrada:', subErr)
        return new Response(JSON.stringify({ error: 'Submissão não encontrada' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      submissaoDados = submissao.dados as Record<string, any>
      submissaoUtm = { utm_source: submissao.utm_source, utm_medium: submissao.utm_medium, utm_campaign: submissao.utm_campaign }
    } else {
      return new Response(JSON.stringify({ error: 'Informe submissao_id ou dados' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Alias para manter compatibilidade com o resto do código
    const submissao = { id: submissao_id, dados: submissaoDados, ...submissaoUtm }

    // AIDEV-NOTE: Incrementar contador de submissões do formulário
    const novoTotal = (formulario.total_submissoes || 0) + 1
    await supabase
      .from('formularios')
      .update({ total_submissoes: novoTotal })
      .eq('id', formulario_id)
    console.log('[processar] total_submissoes atualizado para', novoTotal)

    const configBotoes = (formulario.config_botoes && typeof formulario.config_botoes === 'object')
      ? formulario.config_botoes as Record<string, any>
      : null

    const deveCriarOportunidade =
      (formulario.funil_id) ||
      (configBotoes?.enviar_cria_oportunidade && configBotoes?.enviar_funil_id) ||
      (configBotoes?.whatsapp_cria_oportunidade && configBotoes?.whatsapp_funil_id)

    if (!deveCriarOportunidade) {
      await supabase.from('submissoes_formularios').update({ status: 'processada' }).eq('id', submissao_id)
      return new Response(JSON.stringify({ ok: true, mensagem: 'Sem integração configurada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const funilId = configBotoes?.enviar_funil_id || configBotoes?.whatsapp_funil_id || formulario.funil_id

    // Buscar nome do funil para notificações
    let funilNome = 'N/A'
    if (funilId) {
      const { data: funil } = await supabase.from('funis').select('nome').eq('id', funilId).single()
      if (funil) funilNome = funil.nome
    }

    // Buscar TODOS os campos do formulário (para notificações completas)
    const { data: todosOsCamposForm } = await supabase
      .from('campos_formularios')
      .select('nome, label, mapeamento_campo, ordem, tipo')
      .eq('formulario_id', formulario_id)
      .order('ordem', { ascending: true })

    // Filtrar apenas os que têm mapeamento para criar contato/oportunidade
    const camposForm = (todosOsCamposForm || []).filter((c: any) => c.mapeamento_campo && c.mapeamento_campo !== 'nenhum')

    if (!camposForm || camposForm.length === 0) {
      await supabase.from('submissoes_formularios').update({ status: 'processada' }).eq('id', submissao_id)
      return new Response(JSON.stringify({ ok: true, mensagem: 'Sem campos mapeados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extrair dados mapeados
    const dadosMapeados = submissao.dados as Record<string, any>
    const dadosContato: Record<string, any> = {}
    const dadosEmpresa: Record<string, any> = {}
    const dadosOportunidade: Record<string, any> = {}

    for (const campo of camposForm) {
      const valor = dadosMapeados[campo.nome]
      if (valor === undefined || !campo.mapeamento_campo || campo.mapeamento_campo === 'nenhum') continue

      const mapeamento = campo.mapeamento_campo as string

      if (mapeamento.startsWith('contato.') || mapeamento.startsWith('pessoa.')) {
        const key = mapeamento.replace(/^(contato|pessoa)\./, '')
        dadosContato[key] = valor
      } else if (mapeamento.startsWith('empresa.')) {
        const key = mapeamento.replace('empresa.', '')
        dadosEmpresa[key] = valor
      } else if (mapeamento.startsWith('oportunidade.')) {
        const key = mapeamento.replace('oportunidade.', '')
        dadosOportunidade[key] = valor
      } else if (mapeamento.startsWith('custom.pessoa.')) {
        dadosContato[mapeamento] = valor
      } else if (mapeamento.startsWith('custom.empresa.')) {
        dadosEmpresa[mapeamento] = valor
      }
    }

    // Criar ou buscar contato
    let contatoId: string | null = null

    if (dadosContato.email || dadosContato.nome || dadosContato.telefone) {
      if (dadosContato.email) {
        const { data: contatoExistente } = await supabase
          .from('contatos')
          .select('id')
          .eq('organizacao_id', formulario.organizacao_id)
          .eq('email', dadosContato.email)
          .is('deletado_em', null)
          .single()

        if (contatoExistente) {
          contatoId = contatoExistente.id
          const dadosUpdate: Record<string, any> = {}
          for (const [k, v] of Object.entries(dadosContato)) {
            if (!k.startsWith('custom.')) dadosUpdate[k] = v
          }
          if (Object.keys(dadosUpdate).length > 0) {
            await supabase.from('contatos').update(dadosUpdate).eq('id', contatoId)
          }
        }
      }

      if (!contatoId) {
        const dadosInsert: Record<string, any> = {
          organizacao_id: formulario.organizacao_id,
          tipo: 'pessoa',
          origem: 'formulario',
        }
        for (const [k, v] of Object.entries(dadosContato)) {
          if (!k.startsWith('custom.')) dadosInsert[k] = v
        }

        const { data: novoContato } = await supabase
          .from('contatos')
          .insert(dadosInsert)
          .select('id')
          .single()

        contatoId = novoContato?.id || null
      }
    }

    // AIDEV-NOTE: Salvar campos customizados de pessoa em valores_campos_customizados
    if (contatoId) {
      const customPessoaEntries = Object.entries(dadosContato).filter(([k]) => k.startsWith('custom.pessoa.'))
      if (customPessoaEntries.length > 0) {
        // Buscar IDs dos campos customizados pelo slug
        const slugs = customPessoaEntries.map(([k]) => k.replace('custom.pessoa.', ''))
        const { data: camposDefs } = await supabase
          .from('campos_customizados')
          .select('id, slug, tipo')
          .eq('organizacao_id', formulario.organizacao_id)
          .eq('entidade', 'pessoa')
          .in('slug', slugs)
          .is('deletado_em', null)

        if (camposDefs && camposDefs.length > 0) {
          const inserts = []
          for (const [key, valor] of customPessoaEntries) {
            const slug = key.replace('custom.pessoa.', '')
            const campoDef = camposDefs.find((c: any) => c.slug === slug)
            if (!campoDef || !valor) continue

            const row: Record<string, any> = {
              organizacao_id: formulario.organizacao_id,
              campo_id: campoDef.id,
              entidade_tipo: 'pessoa',
              entidade_id: contatoId,
            }

            // Determinar coluna de valor baseado no tipo
            if (campoDef.tipo === 'numero' || campoDef.tipo === 'decimal') {
              row.valor_numero = parseFloat(String(valor)) || null
            } else if (campoDef.tipo === 'booleano') {
              row.valor_booleano = valor === 'true' || valor === true
            } else if (campoDef.tipo === 'data' || campoDef.tipo === 'data_hora') {
              row.valor_data = valor
            } else if (campoDef.tipo === 'multi_select' || campoDef.tipo === 'selecao_multipla') {
              // Multi-select pode vir como string delimitada por | ou array
              const arr = typeof valor === 'string' ? valor.split('|').map((v: string) => v.trim()).filter(Boolean) : valor
              row.valor_json = arr
              row.valor_texto = typeof valor === 'string' ? valor : (valor as string[]).join(' | ')
            } else {
              row.valor_texto = String(valor)
            }

            inserts.push(row)
          }

          if (inserts.length > 0) {
            // Upsert: delete existing + insert
            for (const ins of inserts) {
              const { data: existing } = await supabase
                .from('valores_campos_customizados')
                .select('id')
                .eq('campo_id', ins.campo_id)
                .eq('entidade_id', ins.entidade_id)
                .maybeSingle()

              if (existing) {
                await supabase.from('valores_campos_customizados').update(ins).eq('id', existing.id)
              } else {
                await supabase.from('valores_campos_customizados').insert(ins)
              }
            }
            console.log(`Salvos ${inserts.length} campos customizados para contato ${contatoId}`)
          }
        }
      }
    }

    // Criar oportunidade
    if (contatoId && funilId) {
      const { data: etapaEntrada } = await supabase
        .from('etapas_funil')
        .select('id')
        .eq('funil_id', funilId)
        .eq('tipo', 'entrada')
        .is('deletado_em', null)
        .single()

      const etapaId = etapaEntrada?.id

      const nomeContato = dadosContato.nome || 'Lead'
      const { count: countOportunidades } = await supabase
        .from('oportunidades')
        .select('id', { count: 'exact', head: true })
        .eq('contato_id', contatoId)
        .is('deletado_em', null)

      const sequencia = (countOportunidades || 0) + 1
      const tituloAuto = `${nomeContato} - #${sequencia}`

      const { data: oportunidade, error: opErr } = await supabase
        .from('oportunidades')
        .insert({
          organizacao_id: formulario.organizacao_id,
          funil_id: funilId,
          etapa_id: etapaId,
          contato_id: contatoId,
          titulo: tituloAuto,
          valor: dadosOportunidade.valor || 0,
          utm_source: submissao.utm_source,
          utm_medium: submissao.utm_medium,
          utm_campaign: submissao.utm_campaign,
        })
        .select('id')
        .single()

      if (opErr) {
        console.error('Erro ao criar oportunidade:', opErr)
      }

      if (oportunidade) {
        await supabase
          .from('submissoes_formularios')
          .update({
            contato_id: contatoId,
            oportunidade_id: oportunidade.id,
            status: 'processada',
          })
          .eq('id', submissao_id)

        // AIDEV-NOTE: Distribuição (rodízio) e tarefas automáticas agora são
        // gerenciados pelo trigger trg_aplicar_config_pipeline no banco de dados.
        // Isso garante que QUALQUER oportunidade criada (formulário, widget, API)
        // receba automaticamente as configurações da pipeline.
        console.log('[pipeline-config] Trigger do banco aplicará distribuição e tarefas automaticamente')
      }
    } else {
      await supabase
        .from('submissoes_formularios')
        .update({ status: 'processada' })
        .eq('id', submissao_id)
    }

    // =====================================================
    // NOTIFICAÇÕES (fire-and-forget, erros não bloqueiam)
    // Monta dict com TODOS os campos preenchidos para notificação completa
    // =====================================================
    const todosOsCamposNotificacao: Record<string, any> = {}
    if (todosOsCamposForm && todosOsCamposForm.length > 0) {
      for (const campo of todosOsCamposForm) {
        // Pular campos de tipo "titulo" ou sem valor
        if (campo.tipo === 'titulo' || campo.tipo === 'secao') continue
        const valor = submissaoDados[campo.nome]
        if (valor === undefined || valor === null || valor === '') continue
        // Usar label como chave amigável
        const label = campo.label || campo.nome
        todosOsCamposNotificacao[label] = Array.isArray(valor) ? valor.join(', ') : valor
      }
    }
    // Fallback: se não tiver campos, usar dadosContato (compatibilidade)
    const dadosNotificacao = Object.keys(todosOsCamposNotificacao).length > 0
      ? todosOsCamposNotificacao
      : dadosContato

    const notificacoes: Promise<void>[] = []

    // Notificação por Email
    if (configBotoes?.enviar_notifica_email && configBotoes?.enviar_email_destino) {
      console.log('[processar] Disparando notificação por email para:', configBotoes.enviar_email_destino)
      notificacoes.push(
        notificarEmail(
          supabase,
          formulario.organizacao_id,
          configBotoes.enviar_email_destino,
          dadosNotificacao,
          formulario.nome || 'Formulário',
          funilNome,
        ).catch(err => console.error('[notif-email] Erro:', err))
      )
    }

    // Notificação por WhatsApp
    if (configBotoes?.enviar_notifica_whatsapp && configBotoes?.enviar_whatsapp_destino) {
      console.log('[processar] Disparando notificação WhatsApp para:', configBotoes.enviar_whatsapp_destino)
      notificacoes.push(
        notificarWhatsApp(
          supabase,
          formulario.organizacao_id,
          configBotoes.enviar_whatsapp_destino,
          dadosNotificacao,
          formulario.nome || 'Formulário',
          funilNome,
        ).catch(err => console.error('[notif-waha] Erro:', err))
      )
    }

    // Aguardar notificações (mas não falhar se derem erro)
    if (notificacoes.length > 0) {
      await Promise.allSettled(notificacoes)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro ao processar submissão:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
