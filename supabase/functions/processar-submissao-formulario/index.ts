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
    .filter(([k]) => !k.startsWith('custom.'))
    .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:600;text-transform:capitalize">${k}</td><td style="padding:6px 12px;border:1px solid #ddd">${v}</td></tr>`)
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

  const nomeContato = dadosContato.nome || 'Lead'
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
    .filter(([k]) => !k.startsWith('custom.'))
    .map(([k, v]) => `*${k.charAt(0).toUpperCase() + k.slice(1)}:* ${v}`)
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
    const { submissao_id, formulario_id } = await req.json()

    if (!submissao_id || !formulario_id) {
      return new Response(JSON.stringify({ error: 'submissao_id e formulario_id são obrigatórios' }), {
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

    // Buscar submissão
    const { data: submissao, error: subErr } = await supabase
      .from('submissoes_formularios')
      .select('id, dados, utm_source, utm_medium, utm_campaign')
      .eq('id', submissao_id)
      .single()

    if (subErr || !submissao) {
      console.error('Submissão não encontrada:', subErr)
      return new Response(JSON.stringify({ error: 'Submissão não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    // Buscar mapeamento dos campos
    const { data: camposForm } = await supabase
      .from('campos_formularios')
      .select('nome, mapeamento_campo')
      .eq('formulario_id', formulario_id)
      .not('mapeamento_campo', 'is', null)

    if (!camposForm || camposForm.length === 0) {
      await supabase.from('submissoes_formularios').update({ status: 'processada' }).eq('id', submissao_id)
      return new Response(JSON.stringify({ ok: true, mensagem: 'Sem campos mapeados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extrair dados mapeados
    const dados = submissao.dados as Record<string, any>
    const dadosContato: Record<string, any> = {}
    const dadosEmpresa: Record<string, any> = {}
    const dadosOportunidade: Record<string, any> = {}

    for (const campo of camposForm) {
      const valor = dados[campo.nome]
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

        // =====================================================
        // RODÍZIO: Aplicar distribuição automática (RF-06)
        // =====================================================
        let responsavelId: string | null = null
        try {
          const { data: configDist } = await supabase
            .from('configuracoes_distribuicao')
            .select('*')
            .eq('funil_id', funilId)
            .single()

          if (configDist && configDist.modo === 'rodizio') {
            // Verificar horário específico
            let dentroDoHorario = true
            if (configDist.horario_especifico) {
              const agora = new Date()
              const diaSemana = agora.getDay() // 0=domingo
              const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`

              if (configDist.dias_semana && !configDist.dias_semana.includes(diaSemana)) {
                dentroDoHorario = false
              }
              if (configDist.horario_inicio && configDist.horario_fim) {
                if (horaAtual < configDist.horario_inicio || horaAtual > configDist.horario_fim) {
                  dentroDoHorario = false
                }
              }
            }

            if (dentroDoHorario) {
              // Buscar membros ativos do funil
              let membrosQuery = supabase
                .from('funis_membros')
                .select('usuario_id')
                .eq('funil_id', funilId)
                .eq('ativo', true)

              const { data: membros } = await membrosQuery

              if (membros && membros.length > 0) {
                let membrosFiltrados = membros

                // Filtrar inativos se configurado
                if (configDist.pular_inativos) {
                  const uIds = membros.map(m => m.usuario_id)
                  const { data: usuariosAtivos } = await supabase
                    .from('usuarios')
                    .select('id')
                    .in('id', uIds)
                    .eq('status', 'ativo')

                  if (usuariosAtivos) {
                    const ativosSet = new Set(usuariosAtivos.map(u => u.id))
                    membrosFiltrados = membros.filter(m => ativosSet.has(m.usuario_id))
                  }
                }

                if (membrosFiltrados.length > 0) {
                  const posicao = (configDist.posicao_rodizio || 0) % membrosFiltrados.length
                  responsavelId = membrosFiltrados[posicao].usuario_id

                  // Atualizar oportunidade com responsável
                  await supabase
                    .from('oportunidades')
                    .update({ usuario_responsavel_id: responsavelId })
                    .eq('id', oportunidade.id)

                  // Incrementar posição do rodízio
                  await supabase
                    .from('configuracoes_distribuicao')
                    .update({
                      posicao_rodizio: (configDist.posicao_rodizio || 0) + 1,
                      ultimo_usuario_id: responsavelId,
                    })
                    .eq('id', configDist.id)

                  console.log(`[rodizio] Responsável atribuído: ${responsavelId} (posição ${posicao})`)
                } else if (configDist.fallback_manual) {
                  console.log('[rodizio] Nenhum membro ativo, fallback manual')
                }
              } else if (configDist.fallback_manual) {
                console.log('[rodizio] Nenhum membro no funil, fallback manual')
              }
            } else if (configDist.fallback_manual) {
              console.log('[rodizio] Fora do horário, fallback manual')
            }
          }
        } catch (err) {
          console.error('[rodizio] Erro ao aplicar distribuição:', err)
        }

        // =====================================================
        // TAREFAS AUTOMÁTICAS: Criar baseado nos templates (RF-07)
        // =====================================================
        if (etapaId) {
          try {
            const { data: vinculos } = await supabase
              .from('funis_etapas_tarefas')
              .select(`
                id, tarefa_template_id, ativo,
                tarefa:tarefas_templates(id, titulo, tipo, descricao, canal, prioridade, dias_prazo)
              `)
              .eq('etapa_funil_id', etapaId)
              .neq('ativo', false)

            if (vinculos && vinculos.length > 0) {
              const tarefasInsert = vinculos
                .filter((v: any) => v.tarefa)
                .map((v: any) => {
                  const template = v.tarefa
                  const dataVencimento = template.dias_prazo
                    ? new Date(Date.now() + template.dias_prazo * 24 * 60 * 60 * 1000).toISOString()
                    : null

                  return {
                    organizacao_id: formulario.organizacao_id,
                    oportunidade_id: oportunidade.id,
                    contato_id: contatoId,
                    titulo: template.titulo,
                    descricao: template.descricao || null,
                    tipo: template.tipo || 'tarefa',
                    canal: template.canal || null,
                    prioridade: template.prioridade || 'media',
                    owner_id: responsavelId,
                    status: 'pendente',
                    data_vencimento: dataVencimento,
                    tarefa_template_id: template.id,
                    etapa_origem_id: etapaId,
                  }
                })

              if (tarefasInsert.length > 0) {
                const { error: tarefasErr } = await supabase
                  .from('tarefas')
                  .insert(tarefasInsert)

                if (tarefasErr) {
                  console.error('[tarefas-auto] Erro ao criar tarefas:', tarefasErr)
                } else {
                  console.log(`[tarefas-auto] ${tarefasInsert.length} tarefa(s) criada(s)`)
                }
              }
            }
          } catch (err) {
            console.error('[tarefas-auto] Erro:', err)
          }
        }
      }
    } else {
      await supabase
        .from('submissoes_formularios')
        .update({ status: 'processada' })
        .eq('id', submissao_id)
    }

    // =====================================================
    // NOTIFICAÇÕES (fire-and-forget, erros não bloqueiam)
    // =====================================================
    const notificacoes: Promise<void>[] = []

    // Notificação por Email
    if (configBotoes?.enviar_notifica_email && configBotoes?.enviar_email_destino) {
      console.log('[processar] Disparando notificação por email para:', configBotoes.enviar_email_destino)
      notificacoes.push(
        notificarEmail(
          supabase,
          formulario.organizacao_id,
          configBotoes.enviar_email_destino,
          dadosContato,
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
          dadosContato,
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
