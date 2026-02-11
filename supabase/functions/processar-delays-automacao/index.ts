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
          const minutos = Number(acao.config?.minutos) || 5;
          const novoExecutarEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();
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
        data_vencimento: config.dias_prazo
          ? new Date(Date.now() + Number(config.dias_prazo) * 86400000).toISOString()
          : null,
      });
      break;
    }

    case "mover_etapa": {
      if (entidadeTipo === "oportunidade" && config.etapa_destino_id) {
        await supabase.from("oportunidades").update({ etapa_id: config.etapa_destino_id }).eq("id", entidadeId);
      }
      break;
    }

    case "alterar_responsavel": {
      if (entidadeTipo === "oportunidade" && config.novo_responsavel_id) {
        await supabase.from("oportunidades").update({ usuario_responsavel_id: config.novo_responsavel_id }).eq("id", entidadeId);
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
      if (entidadeTipo === "contato" && config.campo) {
        const u: Record<string, unknown> = {};
        u[String(config.campo)] = config.valor;
        await supabase.from("contatos").update(u).eq("id", entidadeId);
      }
      break;
    }

    case "adicionar_segmento": {
      if (config.segmento_id) {
        const contatoId = entidadeTipo === "contato" ? entidadeId : (dados.contato_id as string);
        if (contatoId) {
          await supabase.from("contatos_segmentos").insert({
            organizacao_id: organizacaoId,
            contato_id: contatoId,
            segmento_id: config.segmento_id,
          });
        }
      }
      break;
    }

    case "criar_notificacao": {
      console.log(`[delay] Notificação: ${substituirVariaveis(String(config.mensagem || ""), dados)}`);
      break;
    }

    case "enviar_email": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const dest = config.destinatario
        ? substituirVariaveis(String(config.destinatario), dados)
        : (dados.email as string);
      if (!dest) throw new Error("Destinatário não encontrado");

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          organizacao_id: organizacaoId,
          destinatario: dest,
          assunto: substituirVariaveis(String(config.assunto || "Notificação"), dados),
          corpo: substituirVariaveis(String(config.corpo || ""), dados),
          tipo: "automacao",
        }),
      });
      if (!resp.ok) throw new Error(`Email falhou: ${await resp.text()}`);
      break;
    }

    case "enviar_whatsapp": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const tel = config.telefone ? substituirVariaveis(String(config.telefone), dados) : (dados.telefone as string);
      if (!tel) throw new Error("Telefone não encontrado");

      const { data: sessao } = await supabase
        .from("sessoes_whatsapp")
        .select("session_name")
        .eq("organizacao_id", organizacaoId)
        .eq("status", "conectado")
        .limit(1)
        .single();
      if (!sessao) throw new Error("Sem sessão WhatsApp ativa");

      const resp = await fetch(`${supabaseUrl}/functions/v1/waha-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          action: "send-text",
          sessionName: sessao.session_name,
          chatId: `${tel.replace(/\D/g, "")}@c.us`,
          text: substituirVariaveis(String(config.mensagem || ""), dados),
        }),
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
