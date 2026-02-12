/**
 * AIDEV-NOTE: Edge Function - Processar execuções pendentes (delays) de automações (PRD-12)
 * Consome a fila execucoes_pendentes_automacao quando executar_em <= agora.
 * Chamada via pg_cron a cada minuto.
 * 
 * Fluxo:
 * 1. Busca execuções pendentes com executar_em <= now()
 * 2. Para cada, retoma as ações a partir do acao_index
 * 3. Atualiza o log original
 * 4. Marca como executado
 * Retry: até 3 tentativas com backoff
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Buscar execuções pendentes prontas para executar
    const agora = new Date().toISOString();
    const { data: pendentes, error: pendError } = await supabase
      .from("execucoes_pendentes_automacao")
      .select("*, automacoes!inner(id, nome, organizacao_id, acoes, ativo, deletado_em)")
      .eq("status", "pendente")
      .lte("executar_em", agora)
      .order("executar_em", { ascending: true })
      .limit(30);

    if (pendError) {
      console.error("[delay] Erro ao buscar pendentes:", pendError.message);
      return jsonResponse({ error: pendError.message }, 500);
    }

    if (!pendentes || pendentes.length === 0) {
      return jsonResponse({ message: "Nenhuma execução pendente", processados: 0 });
    }

    console.log(`[delay] ${pendentes.length} execução(ões) pendente(s)`);

    let executados = 0;
    let erros = 0;

    for (const pendente of pendentes) {
      const automacao = pendente.automacoes;

      // Verificar se automação ainda está ativa
      if (!automacao || !automacao.ativo || automacao.deletado_em) {
        await supabase
          .from("execucoes_pendentes_automacao")
          .update({ status: "cancelado", executado_em: agora })
          .eq("id", pendente.id);
        continue;
      }

      const acoes = Array.isArray(automacao.acoes) ? automacao.acoes : [];
      const acoesRestantes = acoes.slice(pendente.acao_index);
      const ctx = pendente.dados_contexto || {};

      if (acoesRestantes.length === 0) {
        await supabase
          .from("execucoes_pendentes_automacao")
          .update({ status: "executado", executado_em: agora })
          .eq("id", pendente.id);
        executados++;
        continue;
      }

      // Executar ações restantes
      const acoesLog: Array<{ tipo: string; status: string; erro?: string }> = [];
      let temErro = false;

      for (const acao of acoesRestantes) {
        // Se encontrar outro delay, criar nova execução pendente
        if (acao.tipo === "aguardar") {
          // AIDEV-NOTE: Suportar modo agendado (fix GAP 2) e dia da semana (GAP 3)
          let novoExecutarEm: string;
          const cfg = acao.config || {};
          if (cfg.modo_delay === "agendado") {
            if (cfg.dia_semana !== undefined && cfg.dia_semana !== null && cfg.dia_semana !== '') {
              const diaSemana = Number(cfg.dia_semana);
              const horario = String(cfg.horario || "09:00");
              const [h, m] = horario.split(":").map(Number);
              const agora = new Date();
              const diff = (diaSemana - agora.getDay() + 7) % 7 || 7;
              const alvo = new Date(agora);
              alvo.setDate(agora.getDate() + diff);
              alvo.setHours(h || 9, m || 0, 0, 0);
              if (alvo <= agora) alvo.setDate(alvo.getDate() + 7);
              novoExecutarEm = alvo.toISOString();
            } else {
              const dataStr = String(cfg.data_agendada || "");
              const horaStr = String(cfg.hora_agendada || "09:00");
              novoExecutarEm = dataStr ? new Date(`${dataStr}T${horaStr}:00`).toISOString() : new Date(Date.now() + 5 * 60000).toISOString();
            }
          } else {
            const minutos = Number(cfg.minutos) || 5;
            novoExecutarEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();
          }
          const novoIndex = pendente.acao_index + acoesLog.length + 1;

          await supabase.from("execucoes_pendentes_automacao").insert({
            organizacao_id: automacao.organizacao_id,
            automacao_id: automacao.id,
            log_id: pendente.log_id,
            acao_index: novoIndex,
            dados_contexto: ctx,
            executar_em: novoExecutarEm,
          });

          acoesLog.push({ tipo: "aguardar", status: "pendente" });
          break;
        }

        try {
          await executarAcao(supabase, acao, ctx, automacao.organizacao_id);
          acoesLog.push({ tipo: acao.tipo, status: "sucesso" });
        } catch (err) {
          const erroMsg = err instanceof Error ? err.message : String(err);
          console.error(`[delay] Erro ação ${acao.tipo}:`, erroMsg);
          acoesLog.push({ tipo: acao.tipo, status: "erro", erro: erroMsg });
          temErro = true;
        }
      }

      // Atualizar status
      if (temErro && (pendente.tentativas || 0) + 1 < (pendente.max_tentativas || 3)) {
        // Retry com backoff: 2^tentativa minutos
        const backoffMs = Math.pow(2, (pendente.tentativas || 0) + 1) * 60 * 1000;
        await supabase
          .from("execucoes_pendentes_automacao")
          .update({
            tentativas: (pendente.tentativas || 0) + 1,
            ultimo_erro: acoesLog.find(a => a.erro)?.erro || null,
            executar_em: new Date(Date.now() + backoffMs).toISOString(),
          })
          .eq("id", pendente.id);
        erros++;
      } else {
        await supabase
          .from("execucoes_pendentes_automacao")
          .update({
            status: temErro ? "erro" : "executado",
            executado_em: agora,
            tentativas: (pendente.tentativas || 0) + 1,
            ultimo_erro: temErro ? acoesLog.find(a => a.erro)?.erro || null : null,
          })
          .eq("id", pendente.id);
        if (!temErro) executados++;
        else erros++;
      }

      // Atualizar log original se existir
      if (pendente.log_id) {
        await supabase
          .from("log_automacoes")
          .update({
            status: temErro ? "erro" : "sucesso",
            acoes_executadas: acoesLog,
          })
          .eq("id", pendente.log_id);
      }
    }

    console.log(`[delay] Concluído: ${executados} executados, ${erros} erros`);
    return jsonResponse({ processados: pendentes.length, executados, erros });
  } catch (err) {
    console.error("[delay] Erro geral:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

// =====================================================
// Executar ação (reutiliza lógica do motor principal)
// =====================================================

async function executarAcao(
  supabase: ReturnType<typeof createClient>,
  acao: { tipo: string; config: Record<string, unknown> },
  ctx: Record<string, unknown>,
  organizacaoId: string
): Promise<void> {
  const config = acao.config || {};
  const dados = (ctx.evento_dados || {}) as Record<string, unknown>;
  const entidadeTipo = ctx.entidade_tipo as string;
  const entidadeId = ctx.entidade_id as string;

  switch (acao.tipo) {
    case "criar_tarefa": {
      await supabase.from("tarefas").insert({
        organizacao_id: organizacaoId,
        titulo: substituirVariaveis(String(config.titulo || "Tarefa automática"), dados),
        descricao: config.descricao ? substituirVariaveis(String(config.descricao), dados) : null,
        tipo: config.tipo_tarefa || "tarefa",
        prioridade: config.prioridade || "media",
        oportunidade_id: entidadeTipo === "oportunidade" ? entidadeId : null,
        owner_id: config.responsavel_id || null,
        status: "pendente",
        data_vencimento: config.dias_prazo || config.prazo_dias
          ? new Date(Date.now() + Number(config.dias_prazo || config.prazo_dias) * 86400000).toISOString()
          : null,
      });
      break;
    }

    case "mover_etapa": {
      const etapaId = config.etapa_destino_id || config.etapa_id;
      if (entidadeTipo === "oportunidade" && etapaId) {
        await supabase.from("oportunidades").update({ etapa_id: etapaId }).eq("id", entidadeId);
      }
      break;
    }

    case "alterar_responsavel": {
      const novoResp = config.novo_responsavel_id || config.usuario_id;
      if (entidadeTipo === "oportunidade" && novoResp) {
        await supabase.from("oportunidades").update({ usuario_responsavel_id: novoResp }).eq("id", entidadeId);
      }
      break;
    }

    case "atualizar_campo_oportunidade": {
      if (entidadeTipo === "oportunidade" && config.campo) {
        const u: Record<string, unknown> = {};
        u[String(config.campo)] = config.valor;
        await supabase.from("oportunidades").update(u).eq("id", entidadeId);
      }
      break;
    }

    case "atualizar_campo_contato": {
      const cId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
      if (cId && config.campo) {
        const u: Record<string, unknown> = {};
        u[String(config.campo)] = config.valor;
        await supabase.from("contatos").update(u).eq("id", cId);
      }
      break;
    }

    case "adicionar_segmento": {
      const cId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
      if (cId && (config.segmento_id || config.segmento)) {
        let segId = config.segmento_id as string;
        if (!segId && config.segmento) {
          const { data: seg } = await supabase.from("segmentos").select("id")
            .eq("organizacao_id", organizacaoId).eq("nome", config.segmento).limit(1).single();
          segId = seg?.id;
        }
        if (segId) {
          await supabase.from("contatos_segmentos").insert({
            organizacao_id: organizacaoId, contato_id: cId, segmento_id: segId,
          });
        }
      }
      break;
    }

    case "remover_segmento": {
      const cId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
      if (cId && (config.segmento_id || config.segmento)) {
        let segId = config.segmento_id as string;
        if (!segId && config.segmento) {
          const { data: seg } = await supabase.from("segmentos").select("id")
            .eq("organizacao_id", organizacaoId).eq("nome", config.segmento).limit(1).single();
          segId = seg?.id;
        }
        if (segId) {
          await supabase.from("contatos_segmentos").delete()
            .eq("contato_id", cId).eq("segmento_id", segId).eq("organizacao_id", organizacaoId);
        }
      }
      break;
    }

    case "alterar_status_contato": {
      const cId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
      if (cId && config.status) {
        await supabase.from("contatos").update({ status: config.status }).eq("id", cId);
      }
      break;
    }

    case "criar_oportunidade": {
      const cId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
      let etapaId: string | null = null;
      if (config.funil_id) {
        const { data: etapa } = await supabase.from("etapas_funil").select("id")
          .eq("funil_id", config.funil_id).eq("tipo", "entrada").limit(1).single();
        etapaId = etapa?.id || null;
      }
      await supabase.from("oportunidades").insert({
        organizacao_id: organizacaoId,
        titulo: config.titulo ? substituirVariaveis(String(config.titulo), dados) : "Oportunidade automática",
        contato_id: cId || null,
        funil_id: (config.funil_id as string) || null,
        etapa_id: etapaId,
        valor: config.valor ? Number(config.valor) : 0,
      });
      break;
    }

    case "marcar_resultado_oportunidade": {
      if (entidadeTipo === "oportunidade" && config.resultado) {
        const isGanho = config.resultado === "ganho";
        const updateData: Record<string, unknown> = { fechado_em: new Date().toISOString() };
        const { data: opp } = await supabase.from("oportunidades").select("funil_id").eq("id", entidadeId).single();
        if (opp?.funil_id) {
          const { data: etapa } = await supabase.from("etapas_funil").select("id")
            .eq("funil_id", opp.funil_id).eq("tipo", isGanho ? "ganho" : "perda").limit(1).single();
          if (etapa) updateData.etapa_id = etapa.id;
        }
        await supabase.from("oportunidades").update(updateData).eq("id", entidadeId);
      }
      break;
    }

    case "adicionar_nota": {
      if (entidadeTipo === "oportunidade") {
        await supabase.from("anotacoes_oportunidades").insert({
          organizacao_id: organizacaoId,
          oportunidade_id: entidadeId,
          conteudo: config.conteudo ? substituirVariaveis(String(config.conteudo), dados) : "Nota automática",
          tipo: "texto",
          usuario_id: (dados.usuario_responsavel_id || dados.criado_por || null) as string,
        });
      }
      break;
    }

    case "distribuir_responsavel": {
      if (entidadeTipo === "oportunidade") {
        const query = supabase.from("usuarios").select("id")
          .eq("organizacao_id", organizacaoId).is("deletado_em", null);
        if (config.pular_inativos !== "false") query.eq("ativo", true);
        const { data: membros } = await query.order("id");
        if (membros && membros.length > 0) {
          const { data: dc } = await supabase.from("configuracoes_distribuicao").select("posicao_rodizio")
            .eq("organizacao_id", organizacaoId).limit(1).single();
          const pos = (dc?.posicao_rodizio || 0) % membros.length;
          await supabase.from("oportunidades").update({ usuario_responsavel_id: membros[pos].id }).eq("id", entidadeId);
          if (dc) await supabase.from("configuracoes_distribuicao").update({ posicao_rodizio: pos + 1 }).eq("organizacao_id", organizacaoId);
        }
      }
      break;
    }

    case "enviar_webhook": {
      const url = config.url as string;
      if (!url) throw new Error("URL do webhook não configurada");
      const metodo = (config.metodo as string) || "POST";
      const payload = config.payload
        ? substituirVariaveis(String(config.payload), dados)
        : JSON.stringify({ evento_tipo: entidadeTipo, entidade_id: entidadeId, dados, organizacao_id: organizacaoId, timestamp: new Date().toISOString() });
      const resp = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: payload });
      if (!resp.ok) throw new Error(`Webhook falhou (${resp.status}): ${await resp.text()}`);
      break;
    }

    case "alterar_status_conversa": {
      if (entidadeTipo === "conversa" && config.status) {
        await supabase.from("conversas").update({ status: config.status, status_alterado_em: new Date().toISOString() }).eq("id", entidadeId);
      }
      break;
    }

    case "criar_notificacao": {
      console.log(`[delay] Notificação: ${substituirVariaveis(String(config.mensagem || config.titulo || ""), dados)}`);
      break;
    }

    case "enviar_email": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const dest = (config.destinatario || config.para)
        ? substituirVariaveis(String(config.destinatario || config.para), dados)
        : (dados.email as string);
      if (!dest) throw new Error("Destinatário não encontrado");
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          organizacao_id: organizacaoId, destinatario: dest,
          assunto: substituirVariaveis(String(config.assunto || "Notificação"), dados),
          corpo: substituirVariaveis(String(config.corpo || ""), dados), tipo: "automacao",
        }),
      });
      if (!resp.ok) throw new Error(`Email falhou: ${await resp.text()}`);
      break;
    }

    // AIDEV-NOTE: GAP 1 — WhatsApp com suporte a mídia
    case "enviar_whatsapp": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const tel = (config.telefone || config.destino)
        ? substituirVariaveis(String(config.telefone || config.destino), dados)
        : (dados.telefone as string);
      if (!tel) throw new Error("Telefone não encontrado");
      const { data: sessao } = await supabase.from("sessoes_whatsapp").select("session_name")
        .eq("organizacao_id", organizacaoId).eq("status", "conectado").limit(1).single();
      if (!sessao) throw new Error("Sem sessão WhatsApp ativa");

      const chatId = `${tel.replace(/\D/g, "")}@c.us`;
      const mensagem = substituirVariaveis(String(config.mensagem || ""), dados);
      const midiaTipo = config.midia_tipo as string;
      const midiaUrl = config.midia_url ? substituirVariaveis(String(config.midia_url), dados) : null;

      let wahaPayload: Record<string, unknown>;
      if (midiaTipo && midiaTipo !== "texto" && midiaUrl) {
        const action = midiaTipo === "imagem" ? "send-image" : "send-file";
        wahaPayload = { action, sessionName: sessao.session_name, chatId, file: { url: midiaUrl }, caption: mensagem || undefined };
      } else {
        wahaPayload = { action: "send-text", sessionName: sessao.session_name, chatId, text: mensagem };
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/waha-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify(wahaPayload),
      });
      if (!resp.ok) throw new Error(`WhatsApp falhou: ${await resp.text()}`);
      break;
    }

    default:
      console.warn(`[delay] Ação desconhecida: ${acao.tipo}`);
  }
}

function substituirVariaveis(template: string, dados: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_m, _cat, campo) => {
    const val = dados[campo];
    return val !== null && val !== undefined ? String(val) : "";
  });
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
