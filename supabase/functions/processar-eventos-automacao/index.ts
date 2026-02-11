/**
 * AIDEV-NOTE: Edge Function - Motor de Execução de Automações (PRD-12)
 * Consome a fila eventos_automacao, avalia condições e executa ações.
 * Chamada via pg_cron (a cada 30s) ou manualmente.
 * 
 * Fluxo:
 * 1. Busca eventos não processados (batch de 50)
 * 2. Para cada evento, busca automações ativas com trigger_tipo correspondente
 * 3. Avalia condições AND
 * 4. Executa ações sequencialmente
 * 5. Registra log de execução
 * 6. Marca evento como processado
 * 
 * Proteção anti-loop:
 * - max_execucoes_hora por automação
 * - Dedup: mesma entidade + mesma automação nos últimos 60s = pula
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Evento {
  id: string;
  organizacao_id: string;
  tipo: string;
  entidade_tipo: string;
  entidade_id: string;
  dados: Record<string, unknown>;
  criado_em: string;
}

interface Automacao {
  id: string;
  organizacao_id: string;
  nome: string;
  trigger_tipo: string;
  trigger_config: Record<string, unknown>;
  condicoes: Array<{ campo: string; operador: string; valor?: unknown }>;
  acoes: Array<{ tipo: string; config: Record<string, unknown> }>;
  max_execucoes_hora: number;
  execucoes_ultima_hora: number;
  total_execucoes: number;
  total_erros: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Buscar eventos não processados (batch de 50)
    const { data: eventos, error: evError } = await supabase
      .from("eventos_automacao")
      .select("*")
      .eq("processado", false)
      .order("criado_em", { ascending: true })
      .limit(50);

    if (evError) {
      console.error("[automacao] Erro ao buscar eventos:", evError.message);
      return jsonResponse({ error: evError.message }, 500);
    }

    if (!eventos || eventos.length === 0) {
      return jsonResponse({ message: "Nenhum evento pendente", processados: 0 });
    }

    console.log(`[automacao] ${eventos.length} evento(s) para processar`);

    let totalProcessados = 0;
    let totalExecutados = 0;
    let totalErros = 0;

    for (const evento of eventos as Evento[]) {
      try {
        const resultado = await processarEvento(supabase, evento);
        totalProcessados++;
        totalExecutados += resultado.executados;
        totalErros += resultado.erros;
      } catch (err) {
        console.error(`[automacao] Erro fatal no evento ${evento.id}:`, err);
        totalErros++;
      }

      // Marcar evento como processado independente do resultado
      await supabase
        .from("eventos_automacao")
        .update({ processado: true, processado_em: new Date().toISOString() })
        .eq("id", evento.id);
    }

    const duracao = Date.now() - startTime;
    console.log(`[automacao] Concluído: ${totalProcessados} eventos, ${totalExecutados} execuções, ${totalErros} erros em ${duracao}ms`);

    return jsonResponse({
      processados: totalProcessados,
      executados: totalExecutados,
      erros: totalErros,
      duracao_ms: duracao,
    });
  } catch (err) {
    console.error("[automacao] Erro geral:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

// =====================================================
// Processar um único evento
// =====================================================

async function processarEvento(
  supabase: ReturnType<typeof createClient>,
  evento: Evento
): Promise<{ executados: number; erros: number }> {
  // Buscar automações ativas para este tipo de trigger + org
  const { data: automacoes, error: autoError } = await supabase
    .from("automacoes")
    .select("*")
    .eq("organizacao_id", evento.organizacao_id)
    .eq("trigger_tipo", evento.tipo)
    .eq("ativo", true)
    .is("deletado_em", null);

  if (autoError || !automacoes || automacoes.length === 0) {
    return { executados: 0, erros: 0 };
  }

  let executados = 0;
  let erros = 0;

  for (const automacao of automacoes as Automacao[]) {
    try {
      const resultado = await executarAutomacao(supabase, automacao, evento);
      if (resultado === "executado") executados++;
      else if (resultado === "erro") erros++;
      // "pulado" não conta
    } catch (err) {
      console.error(`[automacao] Erro na automação ${automacao.id}:`, err);
      erros++;
    }
  }

  return { executados, erros };
}

// =====================================================
// Executar uma automação para um evento
// =====================================================

async function executarAutomacao(
  supabase: ReturnType<typeof createClient>,
  automacao: Automacao,
  evento: Evento
): Promise<"executado" | "pulado" | "erro"> {
  const startMs = Date.now();

  // Anti-loop: verificar rate limit
  if (automacao.execucoes_ultima_hora >= automacao.max_execucoes_hora) {
    console.log(`[automacao] Rate limit atingido para ${automacao.id}`);
    await registrarLog(supabase, automacao, evento, "pulado", [], "Rate limit: max execuções/hora atingido", startMs);
    return "pulado";
  }

  // Anti-loop: dedup - mesma entidade + automação nos últimos 60s
  const { data: logRecente } = await supabase
    .from("log_automacoes")
    .select("id")
    .eq("automacao_id", automacao.id)
    .eq("entidade_id", evento.entidade_id)
    .eq("status", "sucesso")
    .gte("criado_em", new Date(Date.now() - 60000).toISOString())
    .limit(1);

  if (logRecente && logRecente.length > 0) {
    console.log(`[automacao] Dedup: ${automacao.id} já executou para ${evento.entidade_id} nos últimos 60s`);
    await registrarLog(supabase, automacao, evento, "pulado", [], "Dedup: execução recente para mesma entidade", startMs);
    return "pulado";
  }

  // Avaliar condições
  if (automacao.condicoes && automacao.condicoes.length > 0) {
    const condicoesOk = avaliarCondicoes(automacao.condicoes, evento.dados);
    if (!condicoesOk) {
      console.log(`[automacao] Condições não atendidas para ${automacao.id}`);
      await registrarLog(supabase, automacao, evento, "pulado", [], "Condições não atendidas", startMs);
      return "pulado";
    }
  }

  // Executar ações sequencialmente
  const acoesExecutadas: Array<{ tipo: string; status: string; erro?: string }> = [];
  let temErro = false;

  for (let i = 0; i < automacao.acoes.length; i++) {
    const acao = automacao.acoes[i];

    // Ação de delay: criar execução pendente e parar
    if (acao.tipo === "aguardar") {
      const minutos = Number(acao.config.minutos) || 5;
      const executarEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();

      // Criar log parcial
      const logId = await registrarLog(supabase, automacao, evento, "aguardando", acoesExecutadas, null, startMs);

      // Criar execução pendente com ações restantes
      await supabase.from("execucoes_pendentes_automacao").insert({
        organizacao_id: automacao.organizacao_id,
        automacao_id: automacao.id,
        log_id: logId,
        acao_index: i + 1,
        dados_contexto: { evento_dados: evento.dados, entidade_tipo: evento.entidade_tipo, entidade_id: evento.entidade_id },
        executar_em: executarEm,
      });

      acoesExecutadas.push({ tipo: "aguardar", status: "pendente" });
      // Atualizar contadores
      await atualizarContadores(supabase, automacao.id, false);
      return "executado";
    }

    try {
      await executarAcao(supabase, acao, evento, automacao.organizacao_id);
      acoesExecutadas.push({ tipo: acao.tipo, status: "sucesso" });
    } catch (err) {
      const erroMsg = err instanceof Error ? err.message : String(err);
      console.error(`[automacao] Erro na ação ${acao.tipo}:`, erroMsg);
      acoesExecutadas.push({ tipo: acao.tipo, status: "erro", erro: erroMsg });
      temErro = true;
      // Continua para próxima ação (não para o fluxo)
    }
  }

  const status = temErro ? "erro" : "sucesso";
  await registrarLog(supabase, automacao, evento, status, acoesExecutadas, null, startMs);
  await atualizarContadores(supabase, automacao.id, temErro);

  return temErro ? "erro" : "executado";
}

// =====================================================
// Avaliar condições AND
// =====================================================

function avaliarCondicoes(
  condicoes: Array<{ campo: string; operador: string; valor?: unknown }>,
  dados: Record<string, unknown>
): boolean {
  return condicoes.every((cond) => {
    const valorCampo = dados[cond.campo];

    switch (cond.operador) {
      case "igual":
        return String(valorCampo) === String(cond.valor);
      case "diferente":
        return String(valorCampo) !== String(cond.valor);
      case "contem":
        return String(valorCampo || "").includes(String(cond.valor));
      case "maior":
        return Number(valorCampo) > Number(cond.valor);
      case "menor":
        return Number(valorCampo) < Number(cond.valor);
      case "vazio":
        return valorCampo === null || valorCampo === undefined || valorCampo === "";
      case "nao_vazio":
        return valorCampo !== null && valorCampo !== undefined && valorCampo !== "";
      default:
        return true;
    }
  });
}

// =====================================================
// Executar uma ação individual
// =====================================================

async function executarAcao(
  supabase: ReturnType<typeof createClient>,
  acao: { tipo: string; config: Record<string, unknown> },
  evento: Evento,
  organizacaoId: string
): Promise<void> {
  const config = acao.config;

  switch (acao.tipo) {
    case "criar_tarefa": {
      await supabase.from("tarefas").insert({
        organizacao_id: organizacaoId,
        titulo: substituirVariaveis(String(config.titulo || "Tarefa automática"), evento.dados),
        descricao: config.descricao ? substituirVariaveis(String(config.descricao), evento.dados) : null,
        tipo: config.tipo_tarefa || "tarefa",
        prioridade: config.prioridade || "media",
        oportunidade_id: evento.entidade_tipo === "oportunidade" ? evento.entidade_id : null,
        owner_id: config.responsavel_id || null,
        status: "pendente",
        data_vencimento: config.dias_prazo
          ? new Date(Date.now() + Number(config.dias_prazo) * 86400000).toISOString()
          : null,
      });
      console.log(`[automacao] Tarefa criada para ${evento.entidade_id}`);
      break;
    }

    case "mover_etapa": {
      if (evento.entidade_tipo === "oportunidade" && config.etapa_destino_id) {
        await supabase
          .from("oportunidades")
          .update({ etapa_id: config.etapa_destino_id })
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Oportunidade ${evento.entidade_id} movida para etapa ${config.etapa_destino_id}`);
      }
      break;
    }

    case "alterar_responsavel": {
      if (evento.entidade_tipo === "oportunidade" && config.novo_responsavel_id) {
        await supabase
          .from("oportunidades")
          .update({ usuario_responsavel_id: config.novo_responsavel_id })
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Responsável alterado para ${config.novo_responsavel_id}`);
      }
      break;
    }

    case "atualizar_campo_oportunidade": {
      if (evento.entidade_tipo === "oportunidade" && config.campo && config.valor !== undefined) {
        const updateData: Record<string, unknown> = {};
        updateData[String(config.campo)] = config.valor;
        await supabase
          .from("oportunidades")
          .update(updateData)
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Campo ${config.campo} atualizado na oportunidade ${evento.entidade_id}`);
      }
      break;
    }

    case "atualizar_campo_contato": {
      if (evento.entidade_tipo === "contato" && config.campo && config.valor !== undefined) {
        const updateData: Record<string, unknown> = {};
        updateData[String(config.campo)] = config.valor;
        await supabase
          .from("contatos")
          .update(updateData)
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Campo ${config.campo} atualizado no contato ${evento.entidade_id}`);
      }
      break;
    }

    case "adicionar_segmento": {
      if (config.segmento_id) {
        const contatoId = evento.entidade_tipo === "contato"
          ? evento.entidade_id
          : (evento.dados.contato_id as string);

        if (contatoId) {
          await supabase.from("contatos_segmentos").insert({
            organizacao_id: organizacaoId,
            contato_id: contatoId,
            segmento_id: config.segmento_id,
          });
          console.log(`[automacao] Segmento ${config.segmento_id} adicionado ao contato ${contatoId}`);
        }
      }
      break;
    }

    case "criar_notificacao": {
      // AIDEV-NOTE: Notificação interna simples via log (tabela de notificações pode ser criada futuramente)
      console.log(`[automacao] Notificação: ${substituirVariaveis(String(config.mensagem || ""), evento.dados)}`);
      break;
    }

    case "enviar_email": {
      // Chama a Edge Function send-email existente
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const destinatario = config.destinatario
        ? substituirVariaveis(String(config.destinatario), evento.dados)
        : (evento.dados.email as string);

      if (!destinatario) {
        throw new Error("Destinatário de email não encontrado");
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          organizacao_id: organizacaoId,
          destinatario,
          assunto: substituirVariaveis(String(config.assunto || "Notificação automática"), evento.dados),
          corpo: substituirVariaveis(String(config.corpo || ""), evento.dados),
          tipo: "automacao",
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Erro ao enviar email: ${errText}`);
      }
      console.log(`[automacao] Email enviado para ${destinatario}`);
      break;
    }

    case "enviar_whatsapp": {
      // Chama waha-proxy para enviar mensagem
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const telefone = config.telefone
        ? substituirVariaveis(String(config.telefone), evento.dados)
        : (evento.dados.telefone as string);

      if (!telefone) {
        throw new Error("Telefone não encontrado para envio de WhatsApp");
      }

      const mensagem = substituirVariaveis(String(config.mensagem || ""), evento.dados);

      // Buscar sessão WhatsApp ativa da organização
      const { data: sessao } = await supabase
        .from("sessoes_whatsapp")
        .select("session_name")
        .eq("organizacao_id", organizacaoId)
        .eq("status", "conectado")
        .limit(1)
        .single();

      if (!sessao) {
        throw new Error("Nenhuma sessão WhatsApp ativa encontrada");
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/waha-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: "send-text",
          sessionName: sessao.session_name,
          chatId: `${telefone.replace(/\D/g, "")}@c.us`,
          text: mensagem,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Erro ao enviar WhatsApp: ${errText}`);
      }
      console.log(`[automacao] WhatsApp enviado para ${telefone}`);
      break;
    }

    default:
      console.warn(`[automacao] Tipo de ação desconhecido: ${acao.tipo}`);
  }
}

// =====================================================
// Substituir variáveis dinâmicas
// =====================================================

function substituirVariaveis(template: string, dados: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, _categoria, campo) => {
    // Mapear variáveis para campos dos dados do evento
    const mapeamento: Record<string, string> = {
      nome: "nome",
      email: "email",
      telefone: "telefone",
      titulo: "titulo",
      valor: "valor",
      etapa: "etapa",
      funil: "funil",
    };
    const campoReal = mapeamento[campo] || campo;
    const valor = dados[campoReal];
    return valor !== null && valor !== undefined ? String(valor) : "";
  });
}

// =====================================================
// Registrar log de execução
// =====================================================

async function registrarLog(
  supabase: ReturnType<typeof createClient>,
  automacao: Automacao,
  evento: Evento,
  status: string,
  acoesExecutadas: Array<{ tipo: string; status: string; erro?: string }>,
  erroMensagem: string | null,
  startMs: number
): Promise<string | null> {
  const duracao = Date.now() - startMs;

  const { data, error } = await supabase
    .from("log_automacoes")
    .insert({
      organizacao_id: automacao.organizacao_id,
      automacao_id: automacao.id,
      trigger_tipo: evento.tipo,
      entidade_tipo: evento.entidade_tipo,
      entidade_id: evento.entidade_id,
      status,
      acoes_executadas: acoesExecutadas,
      erro_mensagem: erroMensagem,
      dados_trigger: evento.dados,
      duracao_ms: duracao,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[automacao] Erro ao registrar log:", error.message);
    return null;
  }

  return data?.id || null;
}

// =====================================================
// Atualizar contadores da automação
// =====================================================

async function atualizarContadores(
  supabase: ReturnType<typeof createClient>,
  automacaoId: string,
  temErro: boolean
): Promise<void> {
  // Incrementar contadores usando RPC seria ideal, mas fazemos update direto
  const { data: auto } = await supabase
    .from("automacoes")
    .select("total_execucoes, total_erros, execucoes_ultima_hora")
    .eq("id", automacaoId)
    .single();

  if (auto) {
    await supabase
      .from("automacoes")
      .update({
        total_execucoes: (auto.total_execucoes || 0) + 1,
        total_erros: temErro ? (auto.total_erros || 0) + 1 : auto.total_erros,
        execucoes_ultima_hora: (auto.execucoes_ultima_hora || 0) + 1,
        ultima_execucao_em: new Date().toISOString(),
      })
      .eq("id", automacaoId);
  }
}

// =====================================================
// Helper
// =====================================================

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
