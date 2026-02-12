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

    // AIDEV-NOTE: GAP 5 — Validação com branching (match/nenhuma)
    if (acao.tipo === "validacao") {
      const ultimaResposta = String(evento.dados.ultima_resposta || "");
      const validacaoCondicoes = (acao.config.condicoes || []) as Array<{ operador: string; tipo_conteudo?: string; valor?: string; valor_min?: number; valor_max?: number }>;
      const isMatch = avaliarValidacao(validacaoCondicoes, ultimaResposta);

      const branchAcoes = isMatch
        ? (acao.config.match_acoes || []) as Array<{ tipo: string; config: Record<string, unknown> }>
        : (acao.config.nenhuma_acoes || []) as Array<{ tipo: string; config: Record<string, unknown> }>;

      acoesExecutadas.push({ tipo: "validacao", status: isMatch ? "match" : "nenhuma" });

      // Executar ações do branch selecionado
      for (const branchAcao of branchAcoes) {
        if (branchAcao.tipo === "aguardar") {
          // Delay dentro de branch: criar execução pendente com ações restantes do branch
          const branchIdx = branchAcoes.indexOf(branchAcao);
          const restantes = branchAcoes.slice(branchIdx + 1);
          let executarEm: string;
          const cfg = branchAcao.config || {};
          if (cfg.modo_delay === "agendado") {
            if (cfg.dia_semana !== undefined && cfg.dia_semana !== null && cfg.dia_semana !== '') {
              const diaSemana = Number(cfg.dia_semana);
              const horario = String(cfg.horario || "09:00");
              const [h, m] = horario.split(":").map(Number);
              const now = new Date();
              const diff = (diaSemana - now.getDay() + 7) % 7 || 7;
              const alvo = new Date(now);
              alvo.setDate(now.getDate() + diff);
              alvo.setHours(h || 9, m || 0, 0, 0);
              if (alvo <= now) alvo.setDate(alvo.getDate() + 7);
              executarEm = alvo.toISOString();
            } else {
              const dataStr = String(cfg.data_agendada || "");
              const horaStr = String(cfg.hora_agendada || "09:00");
              executarEm = dataStr ? new Date(`${dataStr}T${horaStr}:00`).toISOString() : new Date(Date.now() + 5 * 60000).toISOString();
            }
          } else {
            const minutos = Number(cfg.minutos) || 5;
            executarEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();
          }
          const logId = await registrarLog(supabase, automacao, evento, "aguardando", acoesExecutadas, null, startMs);
          // Armazenar ações restantes no contexto para o processar-delays retomar
          await supabase.from("execucoes_pendentes_automacao").insert({
            organizacao_id: automacao.organizacao_id,
            automacao_id: automacao.id,
            log_id: logId,
            acao_index: 0,
            dados_contexto: {
              evento_dados: evento.dados,
              entidade_tipo: evento.entidade_tipo,
              entidade_id: evento.entidade_id,
              branch_acoes_restantes: restantes,
            },
            executar_em: executarEm,
          });
          await atualizarContadores(supabase, automacao.id, false);
          return "executado";
        }

        if (branchAcao.tipo === "validacao") {
          // Validação aninhada — recursão limitada (não suportada nesta versão)
          console.warn("[automacao] Validação aninhada não suportada");
          continue;
        }

        try {
          await executarAcao(supabase, branchAcao, evento, automacao.organizacao_id);
          acoesExecutadas.push({ tipo: branchAcao.tipo, status: "sucesso" });
        } catch (err) {
          const erroMsg = err instanceof Error ? err.message : String(err);
          acoesExecutadas.push({ tipo: branchAcao.tipo, status: "erro", erro: erroMsg });
          temErro = true;
        }
      }
      // Após executar branch, não continuar o array principal (branches divergem)
      break;
    }

    // Ação de delay: criar execução pendente e parar
    if (acao.tipo === "aguardar") {
      // AIDEV-NOTE: Suportar modo agendado (fix GAP 2) e dia da semana (GAP 3)
      let executarEm: string;
      if (acao.config.modo_delay === "agendado") {
        if (acao.config.dia_semana !== undefined && acao.config.dia_semana !== null && acao.config.dia_semana !== '') {
          // Calcular próximo dia da semana
          const diaSemana = Number(acao.config.dia_semana); // 0=dom, 1=seg, ..., 6=sab
          const horario = String(acao.config.horario || "09:00");
          const [h, m] = horario.split(":").map(Number);
          const agora = new Date();
          const diff = (diaSemana - agora.getDay() + 7) % 7 || 7; // próximo ocorrência
          const alvo = new Date(agora);
          alvo.setDate(agora.getDate() + diff);
          alvo.setHours(h || 9, m || 0, 0, 0);
          if (alvo <= agora) alvo.setDate(alvo.getDate() + 7);
          executarEm = alvo.toISOString();
        } else {
          // Data fixa
          const dataStr = String(acao.config.data_agendada || "");
          const horaStr = String(acao.config.hora_agendada || "09:00");
          executarEm = dataStr ? new Date(`${dataStr}T${horaStr}:00`).toISOString() : new Date(Date.now() + 5 * 60000).toISOString();
        }
      } else {
        const minutos = Number(acao.config.minutos) || 5;
        executarEm = new Date(Date.now() + minutos * 60 * 1000).toISOString();
      }

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
        data_vencimento: config.dias_prazo || config.prazo_dias
          ? new Date(Date.now() + Number(config.dias_prazo || config.prazo_dias) * 86400000).toISOString()
          : null,
      });
      console.log(`[automacao] Tarefa criada para ${evento.entidade_id}`);
      break;
    }

    case "mover_etapa": {
      const etapaId = config.etapa_destino_id || config.etapa_id;
      if (evento.entidade_tipo === "oportunidade" && etapaId) {
        await supabase
          .from("oportunidades")
          .update({ etapa_id: etapaId })
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Oportunidade ${evento.entidade_id} movida para etapa ${etapaId}`);
      }
      break;
    }

    case "alterar_responsavel": {
      const novoResp = config.novo_responsavel_id || config.usuario_id;
      if (evento.entidade_tipo === "oportunidade" && novoResp) {
        await supabase
          .from("oportunidades")
          .update({ usuario_responsavel_id: novoResp })
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Responsável alterado para ${novoResp}`);
      }
      break;
    }

    case "atualizar_campo_oportunidade": {
      if (evento.entidade_tipo === "oportunidade" && config.campo && config.valor !== undefined) {
        const updateData: Record<string, unknown> = {};
        updateData[String(config.campo)] = config.valor;
        await supabase.from("oportunidades").update(updateData).eq("id", evento.entidade_id);
        console.log(`[automacao] Campo ${config.campo} atualizado na oportunidade ${evento.entidade_id}`);
      }
      break;
    }

    case "atualizar_campo_contato": {
      const contatoId = evento.entidade_tipo === "contato" ? evento.entidade_id : (evento.dados.contato_id as string);
      if (contatoId && config.campo && config.valor !== undefined) {
        const updateData: Record<string, unknown> = {};
        updateData[String(config.campo)] = config.valor;
        await supabase.from("contatos").update(updateData).eq("id", contatoId);
        console.log(`[automacao] Campo ${config.campo} atualizado no contato ${contatoId}`);
      }
      break;
    }

    case "adicionar_segmento": {
      if (config.segmento_id || config.segmento) {
        const contatoId = evento.entidade_tipo === "contato"
          ? evento.entidade_id
          : (evento.dados.contato_id as string);
        if (contatoId) {
          // Se recebeu nome do segmento em vez de ID, buscar o ID
          let segId = config.segmento_id as string;
          if (!segId && config.segmento) {
            const { data: seg } = await supabase
              .from("segmentos")
              .select("id")
              .eq("organizacao_id", organizacaoId)
              .eq("nome", config.segmento)
              .limit(1)
              .single();
            segId = seg?.id;
          }
          if (segId) {
            await supabase.from("contatos_segmentos").insert({
              organizacao_id: organizacaoId,
              contato_id: contatoId,
              segmento_id: segId,
            });
            console.log(`[automacao] Segmento adicionado ao contato ${contatoId}`);
          }
        }
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — remover segmento do contato
    case "remover_segmento": {
      const contatoId = evento.entidade_tipo === "contato"
        ? evento.entidade_id
        : (evento.dados.contato_id as string);
      if (contatoId && (config.segmento_id || config.segmento)) {
        let segId = config.segmento_id as string;
        if (!segId && config.segmento) {
          const { data: seg } = await supabase
            .from("segmentos")
            .select("id")
            .eq("organizacao_id", organizacaoId)
            .eq("nome", config.segmento)
            .limit(1)
            .single();
          segId = seg?.id;
        }
        if (segId) {
          await supabase.from("contatos_segmentos")
            .delete()
            .eq("contato_id", contatoId)
            .eq("segmento_id", segId)
            .eq("organizacao_id", organizacaoId);
          console.log(`[automacao] Segmento removido do contato ${contatoId}`);
        }
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — alterar status do contato
    case "alterar_status_contato": {
      const contatoId = evento.entidade_tipo === "contato"
        ? evento.entidade_id
        : (evento.dados.contato_id as string);
      if (contatoId && config.status) {
        await supabase.from("contatos")
          .update({ status: config.status })
          .eq("id", contatoId);
        console.log(`[automacao] Status do contato ${contatoId} alterado para ${config.status}`);
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — criar oportunidade
    case "criar_oportunidade": {
      const contatoId = evento.entidade_tipo === "contato"
        ? evento.entidade_id
        : (evento.dados.contato_id as string);

      // Resolver funil e etapa de entrada
      let funilId = config.funil_id as string;
      let etapaId: string | null = null;

      if (funilId) {
        const { data: etapaEntrada } = await supabase
          .from("etapas_funil")
          .select("id")
          .eq("funil_id", funilId)
          .eq("tipo", "entrada")
          .limit(1)
          .single();
        etapaId = etapaEntrada?.id || null;
      }

      const titulo = config.titulo
        ? substituirVariaveis(String(config.titulo), evento.dados)
        : `Oportunidade automática`;

      await supabase.from("oportunidades").insert({
        organizacao_id: organizacaoId,
        titulo,
        contato_id: contatoId || null,
        funil_id: funilId || null,
        etapa_id: etapaId,
        valor: config.valor ? Number(config.valor) : 0,
      });
      console.log(`[automacao] Oportunidade criada: ${titulo}`);
      break;
    }

    // AIDEV-NOTE: Nova ação — marcar resultado (ganho/perda)
    case "marcar_resultado_oportunidade": {
      if (evento.entidade_tipo === "oportunidade" && config.resultado) {
        const isGanho = config.resultado === "ganho";
        const updateData: Record<string, unknown> = {
          fechado_em: new Date().toISOString(),
        };

        // Buscar etapa do tipo correspondente
        const { data: opp } = await supabase
          .from("oportunidades")
          .select("funil_id")
          .eq("id", evento.entidade_id)
          .single();

        if (opp?.funil_id) {
          const { data: etapaFinal } = await supabase
            .from("etapas_funil")
            .select("id")
            .eq("funil_id", opp.funil_id)
            .eq("tipo", isGanho ? "ganho" : "perda")
            .limit(1)
            .single();
          if (etapaFinal) updateData.etapa_id = etapaFinal.id;
        }

        await supabase.from("oportunidades")
          .update(updateData)
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Oportunidade ${evento.entidade_id} marcada como ${config.resultado}`);
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — adicionar nota na oportunidade
    case "adicionar_nota": {
      if (evento.entidade_tipo === "oportunidade") {
        const conteudo = config.conteudo
          ? substituirVariaveis(String(config.conteudo), evento.dados)
          : "Nota automática";

        await supabase.from("anotacoes_oportunidades").insert({
          organizacao_id: organizacaoId,
          oportunidade_id: evento.entidade_id,
          conteudo,
          tipo: "texto",
          usuario_id: evento.dados.usuario_responsavel_id || evento.dados.criado_por || null,
        });
        console.log(`[automacao] Nota adicionada à oportunidade ${evento.entidade_id}`);
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — distribuir responsável (Round Robin)
    case "distribuir_responsavel": {
      if (evento.entidade_tipo === "oportunidade") {
        const pularInativos = config.pular_inativos !== "false";

        // Buscar membros ativos da organização
        const query = supabase
          .from("usuarios")
          .select("id")
          .eq("organizacao_id", organizacaoId)
          .is("deletado_em", null);

        if (pularInativos) {
          query.eq("ativo", true);
        }

        const { data: membros } = await query.order("id");
        if (membros && membros.length > 0) {
          // Buscar posição do rodízio da configuração de distribuição
          const { data: distConfig } = await supabase
            .from("configuracoes_distribuicao")
            .select("posicao_rodizio")
            .eq("organizacao_id", organizacaoId)
            .limit(1)
            .single();

          const pos = (distConfig?.posicao_rodizio || 0) % membros.length;
          const membroSelecionado = membros[pos];

          await supabase.from("oportunidades")
            .update({ usuario_responsavel_id: membroSelecionado.id })
            .eq("id", evento.entidade_id);

          // Atualizar posição do rodízio
          if (distConfig) {
            await supabase.from("configuracoes_distribuicao")
              .update({ posicao_rodizio: pos + 1 })
              .eq("organizacao_id", organizacaoId);
          }

          console.log(`[automacao] Round Robin: ${membroSelecionado.id} atribuído à oportunidade ${evento.entidade_id}`);
        }
      }
      break;
    }

    // AIDEV-NOTE: Nova ação — enviar webhook
    case "enviar_webhook": {
      const url = config.url as string;
      if (!url) throw new Error("URL do webhook não configurada");

      const metodo = (config.metodo as string) || "POST";
      let payload: string;

      if (config.payload) {
        payload = substituirVariaveis(String(config.payload), evento.dados);
      } else {
        payload = JSON.stringify({
          evento: evento.tipo,
          entidade_tipo: evento.entidade_tipo,
          entidade_id: evento.entidade_id,
          dados: evento.dados,
          organizacao_id: organizacaoId,
          timestamp: new Date().toISOString(),
        });
      }

      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Webhook falhou (${resp.status}): ${errText}`);
      }
      console.log(`[automacao] Webhook enviado para ${url}`);
      break;
    }

    // AIDEV-NOTE: Nova ação — alterar status da conversa
    case "alterar_status_conversa": {
      if (evento.entidade_tipo === "conversa" && config.status) {
        await supabase.from("conversas")
          .update({ status: config.status, status_alterado_em: new Date().toISOString() })
          .eq("id", evento.entidade_id);
        console.log(`[automacao] Status da conversa ${evento.entidade_id} alterado para ${config.status}`);
      }
      break;
    }

    case "criar_notificacao": {
      console.log(`[automacao] Notificação: ${substituirVariaveis(String(config.mensagem || config.titulo || ""), evento.dados)}`);
      break;
    }

    case "enviar_email": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const destinatario = (config.destinatario || config.para)
        ? substituirVariaveis(String(config.destinatario || config.para), evento.dados)
        : (evento.dados.email as string);

      if (!destinatario) throw new Error("Destinatário de email não encontrado");

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
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

    // AIDEV-NOTE: GAP 1 — WhatsApp com suporte a mídia
    case "enviar_whatsapp": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const telefone = (config.telefone || config.destino)
        ? substituirVariaveis(String(config.telefone || config.destino), evento.dados)
        : (evento.dados.telefone as string);

      if (!telefone) throw new Error("Telefone não encontrado para envio de WhatsApp");

      const mensagem = substituirVariaveis(String(config.mensagem || ""), evento.dados);
      const midiaTipo = config.midia_tipo as string;
      const midiaUrl = config.midia_url ? substituirVariaveis(String(config.midia_url), evento.dados) : null;

      const { data: sessao } = await supabase
        .from("sessoes_whatsapp")
        .select("session_name")
        .eq("organizacao_id", organizacaoId)
        .eq("status", "conectado")
        .limit(1)
        .single();

      if (!sessao) throw new Error("Nenhuma sessão WhatsApp ativa encontrada");

      const chatId = `${telefone.replace(/\D/g, "")}@c.us`;
      let wahaPayload: Record<string, unknown>;

      if (midiaTipo && midiaTipo !== "texto" && midiaUrl) {
        // Enviar mídia
        const action = midiaTipo === "imagem" ? "send-image" : "send-file";
        wahaPayload = {
          action,
          sessionName: sessao.session_name,
          chatId,
          file: { url: midiaUrl },
          caption: mensagem || undefined,
        };
      } else {
        // Enviar texto simples
        wahaPayload = {
          action: "send-text",
          sessionName: sessao.session_name,
          chatId,
          text: mensagem,
        };
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/waha-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify(wahaPayload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Erro ao enviar WhatsApp: ${errText}`);
      }
      console.log(`[automacao] WhatsApp (${midiaTipo || 'texto'}) enviado para ${telefone}`);
      break;
    }

    default:
      console.warn(`[automacao] Tipo de ação desconhecido: ${acao.tipo}`);
  }
}

// =====================================================
// Avaliar condições de Validação (GAP 5)
// =====================================================

function avaliarValidacao(
  condicoes: Array<{ operador: string; tipo_conteudo?: string; valor?: string; valor_min?: number; valor_max?: number }>,
  texto: string
): boolean {
  if (!condicoes || condicoes.length === 0) return false;

  return condicoes.some((cond) => {
    switch (cond.operador) {
      case "iguais":
        return texto === (cond.valor || "");
      case "desiguais":
        return texto !== (cond.valor || "");
      case "contem":
        return texto.includes(cond.valor || "");
      case "nao_contem":
        return !texto.includes(cond.valor || "");
      case "comprimento":
        return texto.length === Number(cond.valor || 0);
      case "expressao_regular":
        try {
          return new RegExp(cond.valor || "").test(texto);
        } catch {
          return false;
        }
      default:
        break;
    }

    // Tipo de conteúdo
    if (cond.tipo_conteudo) {
      switch (cond.tipo_conteudo) {
        case "numeros":
          return /^\d+$/.test(texto);
        case "letras":
          return /^[a-zA-ZÀ-ÿ\s]+$/.test(texto);
        case "telefone":
          return /^[\d\s\-\(\)\+]{8,}$/.test(texto);
        case "email":
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
        case "faixa_numeros": {
          const num = Number(texto);
          if (isNaN(num)) return false;
          const min = cond.valor_min ?? -Infinity;
          const max = cond.valor_max ?? Infinity;
          return num >= min && num <= max;
        }
        default:
          return false;
      }
    }

    return false;
  });
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
