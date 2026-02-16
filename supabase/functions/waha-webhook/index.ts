/**
 * AIDEV-NOTE: Edge Function receptor de webhooks do WAHA (WhatsApp)
 * Recebe eventos de mensagens e ACK do WAHA e:
 * 1. Busca/cria contato pelo telefone
 * 2. Busca/cria conversa vinculada à sessão WhatsApp
 * 3. Insere mensagem na conversa (individual ou grupo)
 * 4. Atualiza contadores da conversa
 * 5. Cria pré-oportunidade se auto_criar_pre_oportunidade estiver habilitado
 * 6. Processa message.ack para atualizar status de entrega/leitura
 * 7. Suporta mensagens de grupo (@g.us) com participant
 * Público (verify_jwt = false) - validação via session_name
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// AIDEV-NOTE: Helper para criar oportunidade via automação de etiqueta WhatsApp
async function criarOportunidadeViaEtiqueta(
  supabaseAdmin: ReturnType<typeof createClient>,
  organizacaoId: string,
  contatoId: string,
  funilId: string,
  etapaId: string,
  etapaNome: string,
  labelNome: string,
) {
  try {
    // Buscar nome do contato
    const { data: contato } = await supabaseAdmin
      .from("contatos")
      .select("nome, sobrenome, nome_fantasia")
      .eq("id", contatoId)
      .maybeSingle();

    const nomeContato = contato?.nome || contato?.nome_fantasia || "Contato";

    // Contar oportunidades existentes para sequência
    const { count } = await supabaseAdmin
      .from("oportunidades")
      .select("id", { count: "exact", head: true })
      .eq("contato_id", contatoId)
      .eq("organizacao_id", organizacaoId);

    const sequencia = (count || 0) + 1;
    const titulo = `${nomeContato} - #${sequencia}`;

    const { data: novaOp, error: createError } = await supabaseAdmin
      .from("oportunidades")
      .insert({
        organizacao_id: organizacaoId,
        funil_id: funilId,
        etapa_id: etapaId,
        contato_id: contatoId,
        titulo,
        origem: "whatsapp",
        valor: 0,
      })
      .select("id")
      .single();

    if (createError) {
      console.error(`[waha-webhook] Error creating oportunidade via etiqueta:`, createError.message);
    } else {
      console.log(`[waha-webhook] ✅ Oportunidade created: "${titulo}" (${novaOp.id}) in etapa "${etapaNome}"`);
      // Audit log
      await supabaseAdmin.from("audit_log").insert({
        organizacao_id: organizacaoId,
        acao: "criacao_etiqueta",
        entidade: "oportunidades",
        entidade_id: novaOp.id,
        detalhes: { etiqueta: labelNome, etapa_nome: etapaNome, etapa_id: etapaId, titulo, origem: "whatsapp_label" },
      });
    }
  } catch (err) {
    console.error(`[waha-webhook] Error in criarOportunidadeViaEtiqueta:`, err);
  }
}

// AIDEV-NOTE: Helper GOWS-aware para extrair PushName de qualquer motor (GOWS ou WEBJS)
function extractPushName(payload: Record<string, unknown>): string | null {
  const _data = payload._data as Record<string, unknown> | undefined;
  const info = _data?.Info as Record<string, unknown> | undefined;

  // GOWS: _data.Info.PushName (capital P)
  if (info?.PushName && typeof info.PushName === "string" && info.PushName.trim()) {
    return info.PushName;
  }
  // GOWS: VerifiedName for business accounts
  const verifiedName = (info?.VerifiedName as Record<string, unknown>)?.Details as Record<string, unknown>;
  if (verifiedName?.verifiedName && typeof verifiedName.verifiedName === "string") {
    return verifiedName.verifiedName as string;
  }
  // WEBJS fallbacks
  return (_data?.pushName as string) || (_data?.notifyName as string)
    || (payload.notifyName as string) || (payload.pushName as string) || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      console.log("[waha-webhook] Empty body received");
      return new Response(
        JSON.stringify({ ok: true, message: "No body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[waha-webhook] Event received:", JSON.stringify({
      event: body.event,
      session: body.session,
      from: body.payload?.from,
      fromMe: body.payload?.fromMe,
      participant: body.payload?.participant,
    }));

    const sessionName = body.session;
    if (!sessionName) {
      console.log("[waha-webhook] No session name in event");
      return new Response(
        JSON.stringify({ ok: true, message: "No session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // =====================================================
    // HANDLE message.ack EVENT (delivery/read status)
    // =====================================================
    if (body.event === "message.ack") {
      const payload = body.payload;
      if (!payload) {
        return new Response(
          JSON.stringify({ ok: true, message: "No payload for ack" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const ack = payload.ack ?? payload._data?.ack;
      const ackName = payload.ackName || payload._data?.ackName || null;
      const messageId = payload.id?._serialized || payload.id?.id || payload.id || null;

      console.log(`[waha-webhook] ACK event: messageId=${messageId}, ack=${ack}, ackName=${ackName}`);

      if (messageId && ack !== undefined && ack !== null) {
        // Find the session to get organizacao_id
        const { data: sessao } = await supabaseAdmin
          .from("sessoes_whatsapp")
          .select("id, organizacao_id")
          .eq("session_name", sessionName)
          .is("deletado_em", null)
          .maybeSingle();

        if (sessao) {
          const ackUpdate = {
            ack: ack,
            ack_name: ackName,
            atualizado_em: new Date().toISOString(),
          };

          // Try exact match first (only update if new ack > current ack to prevent downgrade)
          const { data: exactMatch } = await supabaseAdmin
            .from("mensagens")
            .select("id, ack")
            .eq("message_id", messageId)
            .eq("organizacao_id", sessao.organizacao_id);

          let matched = false;
          if (exactMatch && exactMatch.length > 0) {
            // Only update if new ack is higher than current
            const currentAck = exactMatch[0].ack ?? 0;
            if (ack > currentAck) {
              const { error: updateError } = await supabaseAdmin
                .from("mensagens")
                .update(ackUpdate)
                .eq("id", exactMatch[0].id);
              if (updateError) {
                console.error(`[waha-webhook] Error updating ACK:`, updateError.message);
              } else {
                console.log(`[waha-webhook] ✅ ACK updated: messageId=${messageId}, ack=${currentAck}->${ack} (${ackName})`);
              }
            } else {
              console.log(`[waha-webhook] ACK skip downgrade: messageId=${messageId}, current=${currentAck}, new=${ack}`);
            }
            matched = true;
          }

          // Fallback: try ILIKE with short ID suffix (handles @lid vs @c.us mismatch)
          if (!matched && messageId.includes('_')) {
            const shortId = messageId.split('_').pop();
            console.log(`[waha-webhook] ACK fallback: trying ilike %_${shortId}`);
            const { data: ilikeMatch } = await supabaseAdmin
              .from("mensagens")
              .select("id, ack")
              .ilike("message_id", `%_${shortId}`)
              .eq("organizacao_id", sessao.organizacao_id);

            if (ilikeMatch && ilikeMatch.length > 0) {
              const currentAck = ilikeMatch[0].ack ?? 0;
              if (ack > currentAck) {
                const { error: fallbackError } = await supabaseAdmin
                  .from("mensagens")
                  .update(ackUpdate)
                  .eq("id", ilikeMatch[0].id);
                if (fallbackError) {
                  console.error(`[waha-webhook] ACK fallback error:`, fallbackError.message);
                } else {
                  console.log(`[waha-webhook] ✅ ACK fallback updated: shortId=${shortId}, ack=${currentAck}->${ack} (${ackName})`);
                }
              } else {
                console.log(`[waha-webhook] ACK fallback skip downgrade: shortId=${shortId}, current=${currentAck}, new=${ack}`);
              }
            } else {
              console.log(`[waha-webhook] ACK fallback: no match for ilike %_${shortId}`);
            }
          } else if (!matched) {
            console.log(`[waha-webhook] ACK: no match for messageId=${messageId}`);
          }
        } else {
          console.log(`[waha-webhook] Session not found for ACK: ${sessionName}`);
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "ACK processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // HANDLE poll.vote EVENT (poll vote updates)
    // =====================================================
    // =====================================================
    // HANDLE poll.vote.failed EVENT (NOWEB limitation)
    // =====================================================
    if (body.event === "poll.vote.failed") {
      const payload = body.payload;
      console.log(`[waha-webhook] poll.vote.failed (NOWEB limitation):`, JSON.stringify(payload).substring(0, 500));
      // AIDEV-NOTE: NOWEB nao consegue decriptar votos (E2E encryption).
      // Apenas logar e retornar sem tentar atualizar votos no banco.
      return new Response(
        JSON.stringify({ ok: true, message: "Poll vote failed (NOWEB engine limitation - votes are encrypted)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // HANDLE poll.vote EVENT (GOWS/WEBJS - votos reais)
    // AIDEV-NOTE: O payload do poll.vote tem formatos diferentes por engine:
    // - NOWEB/WEBJS: poll.id = "true_chatId_HASH"
    // - GOWS: poll.id pode ser apenas "HASH" ou formato diferente
    // A busca precisa ser flexível para encontrar a mensagem no banco.
    // Votos são SUBSTITUIDOS (não incrementados) conforme docs WAHA.
    // =====================================================
    if (body.event === "poll.vote") {
      const payload = body.payload;
      console.log(`[waha-webhook] poll.vote event received:`, JSON.stringify(payload).substring(0, 800));

      if (payload) {
        const vote = payload.vote || {};
        const poll = payload.poll || {};
        // AIDEV-NOTE: poll.id é o ID da mensagem da enquete original
        const pollMessageId = poll?.id?._serialized || poll?.id || null;
        // selectedOptions pode ser array de strings OU array de objetos {name/text}
        const selectedOptions: string[] = (vote?.selectedOptions || vote?.options || []).map(
          (so: string | { name?: string; text?: string }) => typeof so === 'string' ? so : (so.name || so.text || '')
        );
        const voteTimestamp = vote?.timestamp || null;

        console.log(`[waha-webhook] Poll vote: pollId=${pollMessageId}, selectedOptions=${JSON.stringify(selectedOptions)}, timestamp=${voteTimestamp}`);

        if (pollMessageId) {
          const { data: sessao } = await supabaseAdmin
            .from("sessoes_whatsapp")
            .select("id, organizacao_id")
            .eq("session_name", sessionName)
            .is("deletado_em", null)
            .maybeSingle();

          if (sessao) {
            // Busca flexível: tenta match exato primeiro, depois busca pelo hash do ID
            let pollMsg = null;
            
            // Tentativa 1: match exato
            const { data: exactMatch } = await supabaseAdmin
              .from("mensagens")
              .select("id, poll_options, message_id, raw_data")
              .eq("message_id", pollMessageId)
              .eq("organizacao_id", sessao.organizacao_id)
              .eq("tipo", "poll")
              .maybeSingle();
            
            pollMsg = exactMatch;

            // Tentativa 2: extrair o hash final e buscar por LIKE
            if (!pollMsg) {
              const parts = pollMessageId.split("_");
              const hash = parts[parts.length - 1]; // Último segmento é o hash único
              if (hash && hash.length >= 10) {
                console.log(`[waha-webhook] Exact match failed, trying hash search: %${hash}`);
                const { data: hashMatch } = await supabaseAdmin
                  .from("mensagens")
              .select("id, poll_options, message_id, raw_data")
              .eq("organizacao_id", sessao.organizacao_id)
              .eq("tipo", "poll")
              .like("message_id", `%${hash}`)
              .maybeSingle();
                pollMsg = hashMatch;
              }
            }

            // Tentativa 3: para GOWS, o pollMessageId pode ser só o hash.
            // Buscar onde message_id termina com esse hash
            if (!pollMsg && !pollMessageId.includes("_")) {
              console.log(`[waha-webhook] GOWS format detected (no underscore), searching by hash: %${pollMessageId}`);
              const { data: gowsMatch } = await supabaseAdmin
                .from("mensagens")
              .select("id, poll_options, message_id, raw_data")
              .eq("organizacao_id", sessao.organizacao_id)
              .eq("tipo", "poll")
              .like("message_id", `%${pollMessageId}`)
              .maybeSingle();
              pollMsg = gowsMatch;
            }

            if (pollMsg && pollMsg.poll_options) {
              console.log(`[waha-webhook] Found poll message: ${pollMsg.id} (message_id: ${pollMsg.message_id})`);
              const currentOptions = pollMsg.poll_options as Array<{ text: string; votes: number }>;
              
              // AIDEV-NOTE: Armazenar seleções por votante e recalcular totais.
              // Cada poll.vote do WAHA contém TODAS as opções selecionadas por aquele votante.
              // Substituímos (não incrementamos) para evitar contagem duplicada.
              const voterId = vote?.from || vote?.id?.split('_')[1] || 'unknown';
              const existingRawData = (pollMsg.raw_data || {}) as Record<string, unknown>;
              const pollVoters = ((existingRawData.poll_voters || {}) as Record<string, string[]>);
              
              // SUBSTITUIR seleção deste votante (não incrementar)
              pollVoters[voterId] = selectedOptions;
              
              // Recalcular totais a partir de todos os votantes
              const updatedOptions = currentOptions.map(opt => {
                const voteCount = Object.values(pollVoters).filter(
                  (selections: string[]) => selections.includes(opt.text)
                ).length;
                return { ...opt, votes: voteCount };
              });

              console.log(`[waha-webhook] Voter ${voterId} selected: ${JSON.stringify(selectedOptions)}. All voters: ${JSON.stringify(pollVoters)}`);

              const { error: updateError } = await supabaseAdmin
                .from("mensagens")
                .update({
                  poll_options: updatedOptions,
                  raw_data: { ...existingRawData, poll_voters: pollVoters },
                  atualizado_em: new Date().toISOString(),
                })
                .eq("id", pollMsg.id);

              if (updateError) {
                console.error(`[waha-webhook] Error updating poll votes:`, updateError.message);
              } else {
                console.log(`[waha-webhook] ✅ Poll votes updated for message ${pollMsg.id}: ${JSON.stringify(updatedOptions)}`);
              }
            } else {
              console.log(`[waha-webhook] Poll message NOT found for any search strategy. pollId=${pollMessageId}`);
            }
          } else {
            console.log(`[waha-webhook] Session not found for poll.vote: ${sessionName}`);
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Poll vote processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // HANDLE label.* EVENTS (WhatsApp Labels sync)
    // AIDEV-NOTE: Processa eventos de etiquetas ANTES do filtro de mensagens
    // =====================================================
    if (body.event === "label.upsert") {
      const labelPayload = body.payload;
      console.log(`[waha-webhook] label.upsert:`, JSON.stringify(labelPayload));

      if (labelPayload) {
        const { data: sessao } = await supabaseAdmin
          .from("sessoes_whatsapp")
          .select("id, organizacao_id")
          .eq("session_name", sessionName)
          .is("deletado_em", null)
          .maybeSingle();

        if (sessao) {
          const { error: upsertError } = await supabaseAdmin
            .from("whatsapp_labels")
            .upsert({
              organizacao_id: sessao.organizacao_id,
              waha_label_id: String(labelPayload.id),
              nome: labelPayload.name || `Label ${labelPayload.id}`,
              cor_hex: labelPayload.colorHex || null,
              cor_codigo: labelPayload.color ?? null,
              atualizado_em: new Date().toISOString(),
            }, { onConflict: "organizacao_id,waha_label_id" });

          if (upsertError) {
            console.error(`[waha-webhook] Error upserting label:`, upsertError.message);
          } else {
            console.log(`[waha-webhook] ✅ Label upserted: ${labelPayload.name} (${labelPayload.id})`);
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Label upsert processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.event === "label.chat.added") {
      const labelPayload = body.payload;
      console.log(`[waha-webhook] label.chat.added:`, JSON.stringify(labelPayload));

      if (labelPayload?.labelId && labelPayload?.chatId) {
        const { data: sessao } = await supabaseAdmin
          .from("sessoes_whatsapp")
          .select("id, organizacao_id")
          .eq("session_name", sessionName)
          .is("deletado_em", null)
          .maybeSingle();

        if (sessao) {
          // AIDEV-NOTE: Find conversa by chat_id with @lid -> @c.us fallback
          // WAHA labels API sends chatId in @lid format but DB stores @c.us format
          let conversa: { id: string } | null = null;

          // Try exact match first
          const { data: exactConversa } = await supabaseAdmin
            .from("conversas")
            .select("id")
            .eq("chat_id", labelPayload.chatId)
            .eq("organizacao_id", sessao.organizacao_id)
            .is("deletado_em", null)
            .maybeSingle();
          conversa = exactConversa;

          // If not found and chatId is @lid format, resolve via WAHA contacts API or mensagens table
          if (!conversa && labelPayload.chatId.endsWith("@lid")) {
            console.log(`[waha-webhook] chatId is @lid format, resolving to @c.us...`);
            
            // Strategy 1: Use resolve_lid_conversa RPC (searches raw_data + filters non-deleted conversas)
            const lidNumber = labelPayload.chatId.replace("@lid", "");
            const { data: rpcResult } = await supabaseAdmin
              .rpc("resolve_lid_conversa", {
                p_org_id: sessao.organizacao_id,
                p_lid_number: lidNumber,
              });

            if (rpcResult && rpcResult.length > 0) {
              conversa = { id: rpcResult[0].conversa_id };
              console.log(`[waha-webhook] Resolved @lid via RPC: conversa_id=${conversa.id}`);
            }

            // Strategy 2: Try WAHA API to get contact info (which may have @c.us)
            if (!conversa) {
              try {
                const { data: wahaConfig } = await supabaseAdmin
                  .from("configuracoes_globais")
                  .select("configuracoes")
                  .eq("plataforma", "waha")
                  .maybeSingle();
                const config = wahaConfig?.configuracoes as Record<string, string> | null;
                const wahaApiUrl = config?.api_url?.replace(/\/+$/, "");
                const wahaApiKey = config?.api_key;

                if (wahaApiUrl && wahaApiKey) {
                  const contactResp = await fetch(
                    `${wahaApiUrl}/api/contacts/check-exists`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "X-Api-Key": wahaApiKey },
                      body: JSON.stringify({ session: sessionName, phone: lidNumber }),
                    }
                  );
                  if (contactResp.ok) {
                    const contactData = await contactResp.json().catch(() => null);
                    const chatId = contactData?.chatId || contactData?.id?.user ? `${contactData.id.user}@c.us` : null;
                    console.log(`[waha-webhook] WAHA check-exists result: ${chatId}`);
                    if (chatId) {
                      const { data: resolvedConversa } = await supabaseAdmin
                        .from("conversas")
                        .select("id")
                        .eq("chat_id", chatId)
                        .eq("organizacao_id", sessao.organizacao_id)
                        .is("deletado_em", null)
                        .maybeSingle();
                      conversa = resolvedConversa;
                    }
                  } else {
                    await contactResp.text();
                  }
                }
              } catch (resolveErr) {
                console.warn(`[waha-webhook] Error resolving @lid:`, resolveErr);
              }
            }

            // Strategy 3: Check if there's a contato with this phone and find their conversa
            if (!conversa) {
              // Try to find by looking at all active conversas and checking contato phone
              const { data: conversasByPhone } = await supabaseAdmin
                .from("conversas")
                .select("id, chat_id")
                .eq("organizacao_id", sessao.organizacao_id)
                .eq("canal", "whatsapp")
                .is("deletado_em", null)
                .like("chat_id", `%${lidNumber.slice(-8)}%`)
                .limit(1)
                .maybeSingle();
              
              if (conversasByPhone) {
                conversa = { id: conversasByPhone.id };
                console.log(`[waha-webhook] Resolved @lid via partial phone match: ${conversasByPhone.chat_id}`);
              }
            }
          }

          // Find label by waha_label_id
          let { data: label } = await supabaseAdmin
            .from("whatsapp_labels")
            .select("id")
            .eq("waha_label_id", String(labelPayload.labelId))
            .eq("organizacao_id", sessao.organizacao_id)
            .maybeSingle();

          // AIDEV-NOTE: Auto-create label if it doesn't exist in DB yet
          // This handles the case where webhook arrives before manual sync
          if (!label) {
            console.log(`[waha-webhook] Label ${labelPayload.labelId} not in DB, auto-creating...`);
            try {
              // Get WAHA config to fetch label details
              const { data: wahaConfig } = await supabaseAdmin
                .from("configuracoes_globais")
                .select("configuracoes")
                .eq("plataforma", "waha")
                .maybeSingle();

              const config = wahaConfig?.configuracoes as Record<string, string> | null;
              const wahaApiUrl = config?.api_url?.replace(/\/+$/, "");
              const wahaApiKey = config?.api_key;

              if (wahaApiUrl && wahaApiKey) {
                const labelResp = await fetch(
                  `${wahaApiUrl}/api/${sessionName}/labels`,
                  { method: "GET", headers: { "X-Api-Key": wahaApiKey } }
                );

                if (labelResp.ok) {
                  const allLabels = await labelResp.json().catch(() => []);
                  const wahaLabel = Array.isArray(allLabels)
                    ? allLabels.find((l: { id?: string | number }) => String(l.id) === String(labelPayload.labelId))
                    : null;

                  if (wahaLabel) {
                    const { data: insertedLabel, error: insertLabelErr } = await supabaseAdmin
                      .from("whatsapp_labels")
                      .upsert({
                        organizacao_id: sessao.organizacao_id,
                        waha_label_id: String(wahaLabel.id),
                        nome: wahaLabel.name || `Label ${wahaLabel.id}`,
                        cor_hex: wahaLabel.colorHex || null,
                        cor_codigo: wahaLabel.color ?? null,
                        atualizado_em: new Date().toISOString(),
                      }, { onConflict: "organizacao_id,waha_label_id" })
                      .select("id")
                      .maybeSingle();

                    if (!insertLabelErr && insertedLabel) {
                      label = insertedLabel;
                      console.log(`[waha-webhook] ✅ Auto-created label: ${wahaLabel.name} (${wahaLabel.id})`);
                    } else {
                      console.error(`[waha-webhook] Failed to auto-create label:`, insertLabelErr?.message);
                    }
                  } else {
                    console.log(`[waha-webhook] Label ${labelPayload.labelId} not found in WAHA API response`);
                  }
                }
              }
            } catch (autoCreateErr) {
              console.error(`[waha-webhook] Error auto-creating label:`, autoCreateErr);
            }
          }

          if (conversa && label) {
            const { error: insertError } = await supabaseAdmin
              .from("conversas_labels")
              .upsert({
                organizacao_id: sessao.organizacao_id,
                conversa_id: conversa.id,
                label_id: label.id,
              }, { onConflict: "conversa_id,label_id" });

            if (insertError) {
              console.error(`[waha-webhook] Error adding label to chat:`, insertError.message);
            } else {
              console.log(`[waha-webhook] ✅ Label ${labelPayload.labelId} added to chat ${labelPayload.chatId}`);
            }

            // =====================================================
            // AIDEV-NOTE: Automação Etiqueta → Etapa (move/cria oportunidade)
            // Conforme plan: após upsert em conversas_labels, verificar se
            // o recurso está habilitado e processar movimentação/criação
            // =====================================================
            try {
              // 1. Buscar config da sessão (com campos de etiqueta)
              const { data: sessaoConfig } = await supabaseAdmin
                .from("sessoes_whatsapp")
                .select("etiqueta_move_oportunidade, etiqueta_comportamento_fechada, funil_destino_id")
                .eq("id", sessao.id)
                .maybeSingle();

              if (sessaoConfig?.etiqueta_move_oportunidade && sessaoConfig.funil_destino_id) {
                console.log(`[waha-webhook] Etiqueta automation enabled, processing...`);

                // 2. Buscar nome da label
                const { data: labelData } = await supabaseAdmin
                  .from("whatsapp_labels")
                  .select("nome")
                  .eq("id", label.id)
                  .maybeSingle();

                if (labelData?.nome) {
                  const labelNome = labelData.nome;
                  console.log(`[waha-webhook] Label name: "${labelNome}"`);

                  // 3. Buscar etapa correspondente (case-insensitive)
                  const { data: etapaCorrespondente } = await supabaseAdmin
                    .from("etapas_funil")
                    .select("id, nome")
                    .eq("funil_id", sessaoConfig.funil_destino_id)
                    .is("deletado_em", null)
                    .ilike("etiqueta_whatsapp", labelNome)
                    .order("ordem", { ascending: true })
                    .limit(1)
                    .maybeSingle();

                  if (etapaCorrespondente) {
                    console.log(`[waha-webhook] Matched etapa: "${etapaCorrespondente.nome}" (${etapaCorrespondente.id})`);

                    // 4. Buscar contato da conversa
                    const { data: conversaData } = await supabaseAdmin
                      .from("conversas")
                      .select("contato_id")
                      .eq("id", conversa.id)
                      .maybeSingle();

                    if (conversaData?.contato_id) {
                      let contatoId = conversaData.contato_id;

                      // AIDEV-NOTE: Resolver contato fantasma @lid → contato real @c.us
                      const { data: contatoCheck } = await supabaseAdmin
                        .from("contatos")
                        .select("id, telefone, nome")
                        .eq("id", contatoId)
                        .maybeSingle();

                      if (contatoCheck?.telefone?.endsWith("@lid")) {
                        console.log(`[waha-webhook] Contato ${contatoId} has @lid phone (${contatoCheck.telefone}), resolving real contact...`);
                        const lidNumber = contatoCheck.telefone.replace("@lid", "");

                        // Estratégia 1: Buscar via resolve_lid_conversa RPC (mensagens com LID no raw_data)
                        const { data: resolvedConversa } = await supabaseAdmin
                          .rpc("resolve_lid_conversa", {
                            p_org_id: sessao.organizacao_id,
                            p_lid_number: lidNumber,
                          });

                        if (resolvedConversa && resolvedConversa.length > 0) {
                          const realConversaId = resolvedConversa[0].conversa_id;
                          // Buscar contato_id da conversa real
                          const { data: realConversaData } = await supabaseAdmin
                            .from("conversas")
                            .select("contato_id, chat_id")
                            .eq("id", realConversaId)
                            .maybeSingle();

                          if (realConversaData?.contato_id && realConversaData.contato_id !== contatoId) {
                            console.log(`[waha-webhook] ✅ Resolved @lid contact → real contact ${realConversaData.contato_id} (conversa ${realConversaId}, chat_id ${realConversaData.chat_id})`);
                            contatoId = realConversaData.contato_id;
                          }
                        }

                        // Estratégia 2: Fallback por nome (se RPC não resolveu)
                        if (contatoId === conversaData.contato_id && contatoCheck.nome) {
                          const { data: contatoByName } = await supabaseAdmin
                            .from("contatos")
                            .select("id, telefone")
                            .eq("organizacao_id", sessao.organizacao_id)
                            .eq("nome", contatoCheck.nome)
                            .not("telefone", "ilike", "%@lid")
                            .is("deletado_em", null)
                            .limit(1)
                            .maybeSingle();

                          if (contatoByName) {
                            console.log(`[waha-webhook] ✅ Resolved @lid contact by name → real contact ${contatoByName.id} (telefone ${contatoByName.telefone})`);
                            contatoId = contatoByName.id;
                          }
                        }

                        if (contatoId === conversaData.contato_id) {
                          console.log(`[waha-webhook] ⚠️ Could not resolve @lid contact to real contact, using original`);
                        }
                      }

                      // 5. Buscar oportunidades existentes do contato no funil
                      const { data: oportunidades } = await supabaseAdmin
                        .from("oportunidades")
                        .select("id, fechado_em, etapa_id")
                        .eq("contato_id", contatoId)
                        .eq("funil_id", sessaoConfig.funil_destino_id)
                        .is("deletado_em", null)
                        .order("criado_em", { ascending: false });

                      const abertas = (oportunidades || []).filter(o => !o.fechado_em);
                      const fechadas = (oportunidades || []).filter(o => o.fechado_em);
                      const comportamento = sessaoConfig.etiqueta_comportamento_fechada || "criar_nova";

                      if (abertas.length > 0) {
                        // Mover a oportunidade aberta mais recente para a etapa
                        const opAberta = abertas[0];
                        if (opAberta.etapa_id !== etapaCorrespondente.id) {
                          const { error: moveError } = await supabaseAdmin
                            .from("oportunidades")
                            .update({
                              etapa_id: etapaCorrespondente.id,
                              atualizado_em: new Date().toISOString(),
                            })
                            .eq("id", opAberta.id);

                          if (moveError) {
                            console.error(`[waha-webhook] Error moving oportunidade:`, moveError.message);
                          } else {
                            console.log(`[waha-webhook] ✅ Oportunidade ${opAberta.id} moved to etapa "${etapaCorrespondente.nome}"`);
                            // Audit log
                            await supabaseAdmin.from("audit_log").insert({
                              organizacao_id: sessao.organizacao_id,
                              acao: "movimentacao_etiqueta",
                              entidade: "oportunidades",
                              entidade_id: opAberta.id,
                              detalhes: { etiqueta: labelNome, etapa_nome: etapaCorrespondente.nome, etapa_id: etapaCorrespondente.id, origem: "whatsapp_label" },
                            });
                          }
                        } else {
                          console.log(`[waha-webhook] Oportunidade already in correct etapa, skipping`);
                        }
                      } else if (fechadas.length > 0) {
                        // Aplicar regra de comportamento_fechada
                        if (comportamento === "ignorar") {
                          console.log(`[waha-webhook] Oportunidade fechada exists, comportamento=ignorar, skipping`);
                        } else if (comportamento === "criar_nova" || comportamento === "criar_se_fechada") {
                          // Criar nova oportunidade
                          await criarOportunidadeViaEtiqueta(supabaseAdmin, sessao.organizacao_id, contatoId, sessaoConfig.funil_destino_id, etapaCorrespondente.id, etapaCorrespondente.nome, labelNome);
                        }
                      } else {
                        // Nenhuma oportunidade existe → criar nova
                        await criarOportunidadeViaEtiqueta(supabaseAdmin, sessao.organizacao_id, contatoId, sessaoConfig.funil_destino_id, etapaCorrespondente.id, etapaCorrespondente.nome, labelNome);
                      }
                    } else {
                      console.log(`[waha-webhook] No contato_id for conversa ${conversa.id}, skipping etiqueta automation`);
                    }
                  } else {
                    console.log(`[waha-webhook] No etapa matches label "${labelNome}" in funil ${sessaoConfig.funil_destino_id}`);
                  }
                }
              }
            } catch (etiquetaErr) {
              console.error(`[waha-webhook] Error in etiqueta automation:`, etiquetaErr);
            }
          } else {
            console.log(`[waha-webhook] label.chat.added: conversa=${!!conversa}, label=${!!label} - skipping`);
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Label chat added processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.event === "label.chat.deleted") {
      const labelPayload = body.payload;
      console.log(`[waha-webhook] label.chat.deleted:`, JSON.stringify(labelPayload));

      if (labelPayload?.labelId && labelPayload?.chatId) {
        const { data: sessao } = await supabaseAdmin
          .from("sessoes_whatsapp")
          .select("id, organizacao_id")
          .eq("session_name", sessionName)
          .is("deletado_em", null)
          .maybeSingle();

        if (sessao) {
          // AIDEV-NOTE: Resolve @lid -> @c.us for label.chat.deleted too
          let conversaDel: { id: string } | null = null;
          const { data: exactConversaDel } = await supabaseAdmin
            .from("conversas")
            .select("id")
            .eq("chat_id", labelPayload.chatId)
            .eq("organizacao_id", sessao.organizacao_id)
            .is("deletado_em", null)
            .maybeSingle();
          conversaDel = exactConversaDel;

          if (!conversaDel && labelPayload.chatId.endsWith("@lid")) {
            const lidNum = labelPayload.chatId.replace("@lid", "");
            const { data: msgLid } = await supabaseAdmin
              .from("mensagens")
              .select("conversa_id")
              .eq("organizacao_id", sessao.organizacao_id)
              .or(`message_id.ilike.%${lidNum}%,remetente_id.eq.${labelPayload.chatId}`)
              .limit(1)
              .maybeSingle();
            if (msgLid?.conversa_id) {
              conversaDel = { id: msgLid.conversa_id };
            }
            if (!conversaDel) {
              const { data: partialMatch } = await supabaseAdmin
                .from("conversas")
                .select("id")
                .eq("organizacao_id", sessao.organizacao_id)
                .eq("canal", "whatsapp")
                .is("deletado_em", null)
                .like("chat_id", `%${lidNum.slice(-8)}%`)
                .limit(1)
                .maybeSingle();
              conversaDel = partialMatch;
            }
          }

          const { data: label } = await supabaseAdmin
            .from("whatsapp_labels")
            .select("id")
            .eq("waha_label_id", String(labelPayload.labelId))
            .eq("organizacao_id", sessao.organizacao_id)
            .maybeSingle();

          if (conversaDel && label) {
            const { error: deleteError } = await supabaseAdmin
              .from("conversas_labels")
              .delete()
              .eq("conversa_id", conversaDel.id)
              .eq("label_id", label.id)
              .eq("organizacao_id", sessao.organizacao_id);

            if (deleteError) {
              console.error(`[waha-webhook] Error removing label from chat:`, deleteError.message);
            } else {
              console.log(`[waha-webhook] ✅ Label ${labelPayload.labelId} removed from chat ${labelPayload.chatId}`);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Label chat deleted processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process message events from here (both "message" and "message.any")
    if (body.event !== "message" && body.event !== "message.any") {
      console.log(`[waha-webhook] Ignoring event: ${body.event}`);
      return new Response(
        JSON.stringify({ ok: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = body.payload;

    if (!payload) {
      console.log("[waha-webhook] No payload in message event");
      return new Response(
        JSON.stringify({ ok: true, message: "No payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow fromMe messages (sent from phone) for CRM sync
    const isFromMe = payload.fromMe === true;

    // Find the WhatsApp session
    const { data: sessao, error: sessaoError } = await supabaseAdmin
      .from("sessoes_whatsapp")
      .select("id, organizacao_id, usuario_id, auto_criar_pre_oportunidade, funil_destino_id, phone_number")
      .eq("session_name", sessionName)
      .is("deletado_em", null)
      .maybeSingle();

    if (sessaoError || !sessao) {
      console.log(`[waha-webhook] Session not found: ${sessionName}`, sessaoError?.message);
      return new Response(
        JSON.stringify({ ok: true, message: "Session not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WAHA config to fetch profile pictures
    const { data: wahaConfig } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "waha")
      .maybeSingle();

    const wahaApiUrl = (wahaConfig?.configuracoes as Record<string, string>)?.api_url?.replace(/\/+$/, "") || null;
    const wahaApiKey = (wahaConfig?.configuracoes as Record<string, string>)?.api_key || null;

    // Extract message data
    const rawFrom = payload.from || "";
    const messageBody = payload.body || payload.text || "";
    const messageType = payload.type || "chat";
    const messageId = payload.id?._serialized || payload.id?.id || payload.id || `waha_${Date.now()}`;
    const timestamp = payload.timestamp || Math.floor(Date.now() / 1000);
    const now = new Date().toISOString();

    // =====================================================
    // IGNORE STATUS/STORIES BROADCAST
    // =====================================================
    if (rawFrom === "status@broadcast") {
      console.log("[waha-webhook] Ignoring status@broadcast (WhatsApp Status/Stories)");
      return new Response(
        JSON.stringify({ ok: true, message: "Status broadcast ignored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // DETECT GROUP vs INDIVIDUAL vs CHANNEL (@newsletter)
    // =====================================================
    const isGroup = rawFrom.includes("@g.us");
    const isChannel = rawFrom.includes("@newsletter");
    const participantRaw = payload.participant || payload._data?.participant || null;

    // AIDEV-NOTE: fromMe em grupos/canais agora é processado normalmente.
    // Mensagens são salvas com from_me=true para exibição correta na UI.
    if (isFromMe && (isGroup || isChannel)) {
      console.log(`[waha-webhook] Processing fromMe in ${isGroup ? "group" : "channel"}: ${rawFrom}`);
    }

    let chatId: string;
    let phoneNumber: string;
    let phoneName: string | null;
    let conversaTipo: string;
    let groupName: string | null = null;
    let groupPhotoUrl: string | null = null;

    if (isChannel) {
      // CHANNEL MESSAGE (@newsletter)
      chatId = rawFrom; // e.g. "29847512@newsletter"
      phoneNumber = participantRaw
        ? participantRaw.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("@lid", "")
        : rawFrom.replace("@newsletter", "");
      phoneName = extractPushName(payload);
      conversaTipo = "canal";

      // Extract channel name from payload
      // AIDEV-NOTE: GOWS pode fornecer nome do canal em vários campos diferentes
      groupName = payload._data?.subject || payload._data?.name || payload._data?.chat?.name
        || (payload._data as any)?.Info?.GroupName || (payload._data as any)?.ChannelName
        || (payload._data as any)?.Info?.Topic || null;

      console.log(`[waha-webhook] CHANNEL message in ${chatId} (${groupName || "unknown channel"})`);

      // Fetch channel metadata from WAHA if available
      if (wahaApiUrl && wahaApiKey) {
        try {
          if (!groupName) {
            // AIDEV-NOTE: Tentar endpoint especifico de newsletters do WAHA Plus
            const newsletterId = rawFrom.replace("@newsletter", "");
            const nlResp = await fetch(
              `${wahaApiUrl}/api/${encodeURIComponent(sessionName)}/newsletters/${encodeURIComponent(rawFrom)}`,
              { headers: { "X-Api-Key": wahaApiKey } }
            );
            if (nlResp.ok) {
              const nlData = await nlResp.json();
              groupName = nlData?.name || nlData?.subject || nlData?.title || null;
              console.log(`[waha-webhook] Newsletter name from /newsletters API: ${groupName}`);
            } else {
              await nlResp.text();
              // Fallback: tentar endpoint de channels
              const chResp = await fetch(
                `${wahaApiUrl}/api/${encodeURIComponent(sessionName)}/channels`,
                { headers: { "X-Api-Key": wahaApiKey } }
              );
              if (chResp.ok) {
                const channels = await chResp.json();
                const thisChannel = Array.isArray(channels)
                  ? channels.find((c: Record<string, unknown>) => c.id === rawFrom || (c.id as Record<string, unknown>)?._serialized === rawFrom || c.newsletterId === newsletterId)
                  : null;
                if (thisChannel) {
                  groupName = (thisChannel as Record<string, unknown>).name as string || (thisChannel as Record<string, unknown>).subject as string || null;
                  console.log(`[waha-webhook] Newsletter name from /channels API: ${groupName}`);
                }
              } else {
                await chResp.text();
              }
            }
          }

          // Fallback final: contacts/about
          if (!groupName) {
            const aboutResp = await fetch(
              `${wahaApiUrl}/api/contacts/about?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
              { headers: { "X-Api-Key": wahaApiKey } }
            );
            if (aboutResp.ok) {
              const aboutData = await aboutResp.json();
              groupName = aboutData?.pushname || aboutData?.name || null;
            } else {
              await aboutResp.text();
            }
          }

          // Fetch channel picture
          const picResp = await fetch(
            `${wahaApiUrl}/api/contacts/profile-picture?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
            { headers: { "X-Api-Key": wahaApiKey } }
          );
          if (picResp.ok) {
            const picData = await picResp.json();
            groupPhotoUrl = picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || null;
          } else {
            await picResp.text();
          }
        } catch (e) {
          console.log(`[waha-webhook] Error fetching channel metadata:`, e);
        }
      }

      if (!phoneNumber) {
        phoneNumber = rawFrom.replace("@newsletter", "");
      }
    } else if (isGroup) {
      // GROUP MESSAGE
      chatId = rawFrom; // e.g. "120363xxx@g.us"
      conversaTipo = "grupo";

      // AIDEV-NOTE: Resolver @lid do participant para numero real
      let resolvedParticipant = participantRaw || "";
      if (participantRaw && participantRaw.includes("@lid")) {
        const originalLidParticipant = participantRaw;

        // GOWS Strategy 0: _data.Info.SenderAlt (numero real do participante no GOWS)
        const senderAlt = (payload._data as any)?.Info?.SenderAlt;
        if (typeof senderAlt === "string" && senderAlt.includes("@s.whatsapp.net")) {
          resolvedParticipant = senderAlt.replace("@s.whatsapp.net", "@c.us");
          console.log(`[waha-webhook] Group participant LID resolved via GOWS SenderAlt: ${originalLidParticipant} -> ${resolvedParticipant}`);
        }

        // Strategy 1: _data.key.participant (numero real em WEBJS)
        if (resolvedParticipant.includes("@lid")) {
        const keyParticipant = payload._data?.key?.participant;
        if (keyParticipant && typeof keyParticipant === "string" && !keyParticipant.includes("@lid")) {
          resolvedParticipant = keyParticipant.replace("@s.whatsapp.net", "@c.us");
          console.log(`[waha-webhook] Group participant LID resolved via key.participant: ${originalLidParticipant} -> ${resolvedParticipant}`);
        }
        }
        // Strategy 2: _data.participant
        if (resolvedParticipant.includes("@lid")) {
          const dataParticipant = payload._data?.participant;
          if (dataParticipant && typeof dataParticipant === "string" && !dataParticipant.includes("@lid")) {
            resolvedParticipant = dataParticipant.replace("@s.whatsapp.net", "@c.us");
            console.log(`[waha-webhook] Group participant LID resolved via _data.participant: ${originalLidParticipant} -> ${resolvedParticipant}`);
          }
        }
        // Strategy 3: WAHA API contact lookup
        if (resolvedParticipant.includes("@lid") && wahaApiUrl && wahaApiKey) {
          try {
            const contactResp = await fetch(
              `${wahaApiUrl}/api/contacts?contactId=${encodeURIComponent(participantRaw)}&session=${encodeURIComponent(sessionName)}`,
              { headers: { "X-Api-Key": wahaApiKey } }
            );
            if (contactResp.ok) {
              const contactData = await contactResp.json();
              const realId = contactData?.id?._serialized || contactData?.id;
              if (realId && typeof realId === "string" && !realId.includes("@lid")) {
                resolvedParticipant = realId;
                console.log(`[waha-webhook] Group participant LID resolved via WAHA contacts API: ${originalLidParticipant} -> ${resolvedParticipant}`);
              }
              // Also get name from contact
              if (!phoneName) {
                phoneName = contactData?.pushname || contactData?.name || contactData?.shortName || null;
              }
            } else {
              await contactResp.text();
            }
          } catch (e) {
            console.log(`[waha-webhook] Error resolving participant LID via API:`, e);
          }
        }
        if (resolvedParticipant.includes("@lid")) {
          console.warn(`[waha-webhook] Could NOT resolve group participant @lid: ${originalLidParticipant}`);
        }
      }

      phoneNumber = resolvedParticipant
        ? resolvedParticipant.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("@lid", "")
        : "";
      phoneName = extractPushName(payload) || phoneName;

      // Extract group name from payload
      groupName = payload._data?.subject || payload._data?.name || payload._data?.chat?.name || payload._data?.chat?.subject || null;

      console.log(`[waha-webhook] GROUP message from ${phoneNumber} (${phoneName || "?"}) in ${chatId} (${groupName || "unknown group"})`);

      // Fetch group metadata from WAHA (name + photo)
      if (wahaApiUrl && wahaApiKey) {
        try {
          if (!groupName) {
            // AIDEV-NOTE: Usar endpoint especifico do grupo ao inves de listar todos
            const groupResp = await fetch(
              `${wahaApiUrl}/api/${encodeURIComponent(sessionName)}/groups/${encodeURIComponent(rawFrom)}`,
              { headers: { "X-Api-Key": wahaApiKey } }
            );
            if (groupResp.ok) {
              const groupData = await groupResp.json();
              groupName = groupData?.subject || groupData?.name || groupData?.desc || null;
              console.log(`[waha-webhook] Group name from API: ${groupName}`);
            } else {
              // Fallback: list all groups
              await groupResp.text();
              const allGroupsResp = await fetch(
                `${wahaApiUrl}/api/${encodeURIComponent(sessionName)}/groups`,
                { headers: { "X-Api-Key": wahaApiKey } }
              );
              if (allGroupsResp.ok) {
                const groups = await allGroupsResp.json();
                const thisGroup = Array.isArray(groups)
                  ? groups.find((g: Record<string, unknown>) => g.id === rawFrom || (g.id as Record<string, unknown>)?._serialized === rawFrom)
                  : null;
                if (thisGroup) {
                  groupName = (thisGroup as Record<string, unknown>).subject as string || (thisGroup as Record<string, unknown>).name as string || null;
                }
              } else {
                await allGroupsResp.text();
              }
            }
          }

          // Fetch participant name via WAHA if still missing
          if (!phoneName && resolvedParticipant && !resolvedParticipant.includes("@lid")) {
            try {
              const pContactResp = await fetch(
                `${wahaApiUrl}/api/contacts?contactId=${encodeURIComponent(resolvedParticipant)}&session=${encodeURIComponent(sessionName)}`,
                { headers: { "X-Api-Key": wahaApiKey } }
              );
              if (pContactResp.ok) {
                const pData = await pContactResp.json();
                phoneName = pData?.pushname || pData?.name || pData?.shortName || null;
                console.log(`[waha-webhook] Participant name from WAHA: ${phoneName}`);
              } else {
                await pContactResp.text();
              }
            } catch (e) {
              console.log(`[waha-webhook] Error fetching participant name:`, e);
            }
          }

          const picResp = await fetch(
            `${wahaApiUrl}/api/contacts/profile-picture?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
            { headers: { "X-Api-Key": wahaApiKey } }
          );
          if (picResp.ok) {
            const picData = await picResp.json();
            groupPhotoUrl = picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || picData?.profilePictureURL || null;
          } else {
            await picResp.text();
          }
        } catch (e) {
          console.log(`[waha-webhook] Error fetching group metadata:`, e);
        }
      }

      if (!phoneNumber) {
        // AIDEV-NOTE: Fallback para mensagens de grupo sem participant
        if (isFromMe && sessao.phone_number) {
          phoneNumber = sessao.phone_number.replace(/\D/g, "");
          console.log(`[waha-webhook] Group no participant (fromMe): using session phone ${phoneNumber}`);
        } else {
          phoneNumber = rawFrom.replace("@g.us", "");
          phoneName = phoneName || groupName || "Participante desconhecido";
          console.log(`[waha-webhook] Group no participant: using group ID as fallback phone=${phoneNumber}`);
        }
      }
    } else {
      // INDIVIDUAL MESSAGE
      // AIDEV-NOTE: For fromMe messages (sent from phone), payload.from = OUR number,
      // payload.to = the chat partner. We need the partner's ID for chatId/phoneNumber.
      if (isFromMe) {
        let toField = payload.to || payload._data?.to || rawFrom;
        
        // AIDEV-NOTE: Resolução @lid robusta com múltiplos fallbacks para GOWS
        // O WAHA GOWS usa Linked IDs (@lid) internos que precisam ser convertidos
        // para números reais (@c.us) para encontrar contatos e conversas existentes.
        if (toField.includes("@lid")) {
          let lidResolved = false;
          const originalLid = toField;

          // GOWS Strategy 0: _data.Info.RecipientAlt (numero real do destinatario no GOWS)
          const recipientAlt = (payload._data as any)?.Info?.RecipientAlt;
          if (typeof recipientAlt === "string" && recipientAlt.includes("@s.whatsapp.net")) {
            toField = recipientAlt.replace("@s.whatsapp.net", "@c.us");
            lidResolved = true;
            console.log(`[waha-webhook] LID resolved via GOWS RecipientAlt: ${originalLid} -> ${toField}`);
          }

          // GOWS Strategy 0b: _data.Info.ChatAlt / _data.Info.SenderAlt (fallback GOWS)
          if (!lidResolved) {
            const chatAlt = (payload._data as any)?.Info?.ChatAlt;
            const senderAlt = (payload._data as any)?.Info?.SenderAlt;
            const gowsAlt = [chatAlt, senderAlt].find(
              (v: unknown) => typeof v === "string" && (v as string).includes("@s.whatsapp.net")
            );
            if (gowsAlt) {
              toField = (gowsAlt as string).replace("@s.whatsapp.net", "@c.us");
              lidResolved = true;
              console.log(`[waha-webhook] LID resolved via GOWS ChatAlt/SenderAlt: ${originalLid} -> ${toField}`);
            }
          }

          // Strategy 1: _data.key.remoteJid (numero real)
          if (!lidResolved) {
            const remoteJid = payload._data?.key?.remoteJid;
            if (remoteJid && typeof remoteJid === "string" && remoteJid.includes("@s.whatsapp.net")) {
              toField = remoteJid.replace("@s.whatsapp.net", "@c.us");
              lidResolved = true;
              console.log(`[waha-webhook] LID resolved via key.remoteJid: ${originalLid} -> ${toField}`);
            }
          }

          // Strategy 1b: _data.key.remoteJidAlt (campo padrão WEBJS)
          const altJid = payload._data?.key?.remoteJidAlt;
          if (!lidResolved && altJid && typeof altJid === "string" && altJid.includes("@s.whatsapp.net")) {
            toField = altJid.replace("@s.whatsapp.net", "@c.us");
            lidResolved = true;
            console.log(`[waha-webhook] LID resolved via remoteJidAlt: ${originalLid} -> ${toField}`);
          }

          // Strategy 2: _data.to field (quando é @s.whatsapp.net)
          if (!lidResolved) {
            const dataTo = payload._data?.to;
            if (dataTo && typeof dataTo === "string" && dataTo.includes("@s.whatsapp.net")) {
              toField = dataTo.replace("@s.whatsapp.net", "@c.us");
              lidResolved = true;
              console.log(`[waha-webhook] LID resolved via _data.to: ${originalLid} -> ${toField}`);
            }
          }

          // Strategy 3: chat.id
          if (!lidResolved) {
            const altTo = payload._data?.chat?.id?._serialized || payload._data?.chat?.id;
            if (altTo && typeof altTo === "string" && !altTo.includes("@lid")) {
              toField = altTo;
              lidResolved = true;
              console.log(`[waha-webhook] LID resolved via chat.id: ${originalLid} -> ${toField}`);
            }
          }

          // Strategy 4: Busca no banco - mensagens anteriores que já mapearam este LID
          if (!lidResolved) {
            const lidNumber = originalLid.replace("@lid", "");
            console.log(`[waha-webhook] LID fallback: searching DB for previous mappings of LID ${lidNumber}`);
            
            // Busca mensagens que contenham o LID no message_id e que tenham raw_data com remoteJidAlt
            const { data: prevMessages } = await supabaseAdmin
              .from("mensagens")
              .select("raw_data")
              .eq("organizacao_id", sessao.organizacao_id)
              .ilike("message_id", `%${lidNumber}%`)
              .not("raw_data", "is", null)
              .order("criado_em", { ascending: false })
              .limit(10);

            if (prevMessages) {
              for (const msg of prevMessages) {
                const rawData = msg.raw_data as Record<string, unknown>;
                const prevAlt = (rawData?._data as Record<string, unknown>)?.key as Record<string, unknown>;
                const prevAltJid = prevAlt?.remoteJidAlt as string;
                if (prevAltJid && typeof prevAltJid === "string" && prevAltJid.includes("@s.whatsapp.net")) {
                  toField = prevAltJid.replace("@s.whatsapp.net", "@c.us");
                  lidResolved = true;
                  console.log(`[waha-webhook] LID resolved via DB lookup: ${originalLid} -> ${toField}`);
                  break;
                }
              }
            }
          }

          // Strategy 5: Busca conversa existente vinculada a esta sessão (contato_id based)
          if (!lidResolved) {
            console.warn(`[waha-webhook] Could NOT resolve @lid: ${originalLid}. Will attempt contato/conversa fallback later.`);
          }
        }
        
        chatId = toField; // e.g. "5513988506995@c.us" (the other person)
        phoneNumber = toField.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("@lid", "");
        // AIDEV-NOTE: Para fromMe, NÃO usar extractPushName pois retorna o nome do REMETENTE (nós),
        // não do destinatário. phoneName fica null para não sobrescrever o nome do contato.
        phoneName = null;
        console.log(`[waha-webhook] fromMe individual: from=${rawFrom}, to=${toField}, chatId=${chatId}, resolved=${!toField.includes("@lid")}`);
      } else {
        let resolvedFrom = rawFrom;
        
        // Resolve @lid to @c.us
        if (rawFrom.includes("@lid")) {
          // GOWS Strategy 0: _data.Info.Sender or _data.Info.Chat
          const infoSender = (payload._data as any)?.Info?.Sender;
          const infoChat = (payload._data as any)?.Info?.Chat;
          const gowsFrom = [infoSender, infoChat].find(
            (v: unknown) => typeof v === "string" && (v as string).includes("@s.whatsapp.net")
          );
          if (gowsFrom) {
            resolvedFrom = (gowsFrom as string).replace("@s.whatsapp.net", "@c.us");
            console.log(`[waha-webhook] Resolved @lid via GOWS Info: ${rawFrom} -> ${resolvedFrom}`);
          } else {
            // WEBJS fallback: remoteJidAlt
            const altJid = payload._data?.key?.remoteJidAlt;
            if (altJid) {
              resolvedFrom = (altJid as string).replace("@s.whatsapp.net", "@c.us");
              console.log(`[waha-webhook] Resolved @lid: ${rawFrom} -> ${resolvedFrom}`);
            } else {
              // Fallback: try chat.id or other fields
              const altFrom = payload._data?.chat?.id?._serialized || payload._data?.chat?.id;
              if (altFrom && !(altFrom as string).includes("@lid")) {
                resolvedFrom = altFrom as string;
                console.log(`[waha-webhook] Resolved @lid (via chat.id): ${rawFrom} -> ${resolvedFrom}`);
              }
            }
          }
        }
        
        chatId = resolvedFrom; // e.g. "5513988506995@c.us"
        phoneNumber = resolvedFrom.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("@lid", "");
        phoneName = extractPushName(payload);
      }
      conversaTipo = "individual";
    }

    if (!phoneNumber) {
      console.log("[waha-webhook] No phone number in message");
      return new Response(
        JSON.stringify({ ok: true, message: "No phone" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[waha-webhook] Processing ${conversaTipo} message from ${phoneNumber} (${phoneName || "unknown"}) - type: ${messageType}`);

    // =====================================================
    // STEP 0: Fetch WhatsApp profile picture (for individual)
    // =====================================================
    let profilePictureUrl: string | null = null;

    if (!isGroup && !isChannel && wahaApiUrl && wahaApiKey) {
      try {
        const picResp = await fetch(
          `${wahaApiUrl}/api/contacts/profile-picture?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
          { headers: { "X-Api-Key": wahaApiKey } }
        );

        if (picResp.ok) {
          const picData = await picResp.json();
          profilePictureUrl = picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || picData?.profilePictureURL || null;
        } else {
          await picResp.text();
        }
      } catch (picError) {
        console.log(`[waha-webhook] Error fetching profile picture:`, picError);
      }
    }

    // =====================================================
    // STEP 1: Find or create contact (by participant phone for groups)
    // =====================================================
    let contatoId: string;

    let existingContato = null;

    // Tentativa 1: busca exata por telefone
    const { data: contatoExato } = await supabaseAdmin
      .from("contatos")
      .select("id, nome")
      .eq("organizacao_id", sessao.organizacao_id)
      .eq("telefone", phoneNumber)
      .is("deletado_em", null)
      .maybeSingle();

    existingContato = contatoExato;

    // AIDEV-NOTE: Tentativa 2 - Busca fuzzy pelos últimos 8-10 dígitos do telefone
    // Resolve casos onde @lid numerico != @c.us numerico mas representam a mesma pessoa
    if (!existingContato && phoneNumber.length >= 8) {
      const lastDigits = phoneNumber.slice(-8);
      console.log(`[waha-webhook] Contact not found by exact phone, trying fuzzy match: %${lastDigits}`);
      const { data: contatoFuzzy } = await supabaseAdmin
        .from("contatos")
        .select("id, nome, telefone")
        .eq("organizacao_id", sessao.organizacao_id)
        .ilike("telefone", `%${lastDigits}`)
        .is("deletado_em", null)
        .limit(1)
        .maybeSingle();

      if (contatoFuzzy) {
        existingContato = contatoFuzzy;
        console.log(`[waha-webhook] ✅ Contact found via fuzzy phone match: ${contatoFuzzy.id} (phone: ${contatoFuzzy.telefone})`);
      }
    }

    if (existingContato) {
      contatoId = existingContato.id;

      // Update contact name if we have a better name from WhatsApp
      // AIDEV-NOTE: Nunca atualizar nome do contato com dados de mensagens fromMe,
      // pois o pushName seria o nome do próprio usuário, não do contato.
      if (phoneName && !isFromMe && existingContato.nome !== phoneName) {
        await supabaseAdmin
          .from("contatos")
          .update({ nome: phoneName, atualizado_em: now })
          .eq("id", contatoId);
      }
    } else {
      const contactName = phoneName || phoneNumber;
      // AIDEV-NOTE: Contatos criados via WhatsApp sempre iniciam como 'pre_lead'
      // para não poluir a listagem de contatos. Só são promovidos a 'novo'
      // quando o usuário aceita a pré-oportunidade ou manualmente.
      let contatoStatus = "pre_lead";
      let newContato;
      let contatoError;
      
      ({ data: newContato, error: contatoError } = await supabaseAdmin
        .from("contatos")
        .insert({
          organizacao_id: sessao.organizacao_id,
          tipo: "pessoa",
          origem: "whatsapp",
          nome: contactName,
          telefone: phoneNumber,
          status: contatoStatus,
        })
        .select("id")
        .single());

      // Correção 3: Fallback para status "novo" se pre_lead falhar (constraint)
      if (contatoError) {
        console.warn(`[waha-webhook] pre_lead failed (${contatoError.message}), retrying with status=novo`);
        ({ data: newContato, error: contatoError } = await supabaseAdmin
          .from("contatos")
          .insert({
            organizacao_id: sessao.organizacao_id,
            tipo: "pessoa",
            origem: "whatsapp",
            nome: contactName,
            telefone: phoneNumber,
            status: "novo",
          })
          .select("id")
          .single());
      }

      if (contatoError || !newContato) {
        console.error(`[waha-webhook] Error creating contato (both statuses failed):`, contatoError?.message);
        return new Response(
          JSON.stringify({ ok: true, message: "Error creating contact" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      contatoId = newContato.id;
      console.log(`[waha-webhook] Created new contato: ${contatoId} (${contactName})`);
    }

    // =====================================================
    // STEP 2: Find or create conversation
    // For groups: chat_id is the group ID, contato_id is the first participant
    // =====================================================
    let conversaId: string;

    // Correção 4: Busca de conversa com fallback por contato_id quando chatId é @lid
    let existingConversa = null;

    // Tentativa 1: busca por chat_id exato
    const { data: conversaByChatId } = await supabaseAdmin
      .from("conversas")
      .select("id, total_mensagens, mensagens_nao_lidas, chat_id")
      .eq("organizacao_id", sessao.organizacao_id)
      .eq("chat_id", chatId)
      .eq("sessao_whatsapp_id", sessao.id)
      .is("deletado_em", null)
      .maybeSingle();

    existingConversa = conversaByChatId;

    // Tentativa 2: se chatId contém @lid e não encontrou, buscar por contato_id + sessao
    if (!existingConversa && chatId.includes("@lid") && contatoId) {
      console.log(`[waha-webhook] Conversa not found by @lid chatId, trying fallback by contato_id=${contatoId}`);
      const { data: conversaByContato } = await supabaseAdmin
        .from("conversas")
        .select("id, total_mensagens, mensagens_nao_lidas, chat_id")
        .eq("organizacao_id", sessao.organizacao_id)
        .eq("contato_id", contatoId)
        .eq("sessao_whatsapp_id", sessao.id)
        .eq("tipo", "individual")
        .is("deletado_em", null)
        .maybeSingle();

      if (conversaByContato) {
        existingConversa = conversaByContato;
        chatId = conversaByContato.chat_id;
        console.log(`[waha-webhook] ✅ Conversa found via contato fallback: ${conversaByContato.id} (chatId=${chatId})`);
      }
    }

    // AIDEV-NOTE: Tentativa 3 - Busca por telefone do contato em conversas existentes
    // Resolve duplicação quando @lid cria contato novo mas já existe conversa com @c.us
    if (!existingConversa && conversaTipo === "individual") {
      const lastDigits = phoneNumber.length >= 8 ? phoneNumber.slice(-8) : phoneNumber;
      console.log(`[waha-webhook] Conversa not found, trying phone-based search: %${lastDigits}`);
      const { data: conversaByPhone } = await supabaseAdmin
        .from("conversas")
        .select("id, total_mensagens, mensagens_nao_lidas, chat_id, contato_id")
        .eq("organizacao_id", sessao.organizacao_id)
        .eq("sessao_whatsapp_id", sessao.id)
        .eq("tipo", "individual")
        .ilike("chat_id", `%${lastDigits}%`)
        .is("deletado_em", null)
        .maybeSingle();

      if (conversaByPhone) {
        existingConversa = conversaByPhone;
        chatId = conversaByPhone.chat_id;
        // Atualizar contato_id se o contato encontrado é diferente
        if (conversaByPhone.contato_id !== contatoId) {
          contatoId = conversaByPhone.contato_id;
        }
        console.log(`[waha-webhook] ✅ Conversa found via phone-based search: ${conversaByPhone.id} (chatId=${chatId})`);
      }
    }

    if (existingConversa) {
      conversaId = existingConversa.id;

      const updateData: Record<string, unknown> = {
        total_mensagens: (existingConversa.total_mensagens || 0) + 1,
        ultima_mensagem_em: now,
        atualizado_em: now,
      };

      // Only increment unread for received messages (not fromMe)
      if (!isFromMe) {
        updateData.mensagens_nao_lidas = (existingConversa.mensagens_nao_lidas || 0) + 1;
      }

      if (isGroup || isChannel) {
        if (groupName) updateData.nome = groupName;
        if (groupPhotoUrl) updateData.foto_url = groupPhotoUrl;
      } else {
        if (phoneName) updateData.nome = phoneName;
        if (profilePictureUrl) updateData.foto_url = profilePictureUrl;
      }

      await supabaseAdmin
        .from("conversas")
        .update(updateData)
        .eq("id", conversaId);

      console.log(`[waha-webhook] Updated conversa ${conversaId}`);
    } else {
      const conversaName = (isGroup || isChannel) ? (groupName || chatId) : (phoneName || phoneNumber);
      const conversaFoto = (isGroup || isChannel) ? groupPhotoUrl : profilePictureUrl;

      const { data: newConversa, error: conversaError } = await supabaseAdmin
        .from("conversas")
        .insert({
          organizacao_id: sessao.organizacao_id,
          contato_id: contatoId,
          usuario_id: sessao.usuario_id,
          sessao_whatsapp_id: sessao.id,
          chat_id: chatId,
          canal: "whatsapp",
          tipo: conversaTipo,
          nome: conversaName,
          foto_url: conversaFoto,
          status: "aberta",
          total_mensagens: 1,
          mensagens_nao_lidas: isFromMe ? 0 : 1,
          primeira_mensagem_em: now,
          ultima_mensagem_em: now,
        })
        .select("id")
        .single();

      if (conversaError || !newConversa) {
        console.error(`[waha-webhook] Error creating conversa:`, conversaError?.message);
        return new Response(
          JSON.stringify({ ok: true, message: "Error creating conversation" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      conversaId = newConversa.id;
      console.log(`[waha-webhook] Created new ${conversaTipo} conversa: ${conversaId}`);
    }

    // =====================================================
    // STEP 3: Insert message
    // =====================================================
    let wahaType = messageType === "chat" ? "text" : (messageType || "text");

    // AIDEV-NOTE: Detect contact/vCard messages even when WAHA reports type as "chat"
    // WAHA sometimes sends contact shares with messageType="chat" but includes vCards array
    // or _data.message.contactMessage in the payload
    if (
      (wahaType === "text" || wahaType === "chat") &&
      (
        (Array.isArray(payload.vCards) && payload.vCards.length > 0) ||
        payload._data?.message?.contactMessage ||
        payload._data?.message?.contactsArrayMessage
      )
    ) {
      wahaType = "contact";
      console.log(`[waha-webhook] Contact/vCard detected from payload structure (was type: ${messageType})`);
    }

    // AIDEV-NOTE: Detect poll messages from device (GOWS engine)
    // GOWS sends polls with type undefined, but _data.Message contains pollCreationMessage/V3
    if (wahaType === "text" || wahaType === "chat") {
      const _msg = payload._data?.Message || payload._data?.message || {};
      if (_msg.pollCreationMessageV3 || _msg.pollCreationMessage) {
        wahaType = "poll";
        const pollMsg = _msg.pollCreationMessageV3 || _msg.pollCreationMessage;
        payload.__detectedPollData = pollMsg;
        console.log(`[waha-webhook] Poll detected from pollCreationMessage (was type: ${messageType})`);
      }
    }
    // Also check _data.Info.Type as fallback for GOWS
    if ((wahaType === "text" || wahaType === "chat") && payload._data?.Info?.Type === "poll") {
      wahaType = "poll";
      console.log(`[waha-webhook] Poll detected from _data.Info.Type fallback`);
    }

    // If type is "text" but has media, infer correct type from mimetype
    if ((wahaType === "text" || wahaType === "chat") && payload.hasMedia && payload.media?.mimetype) {
      const mime = (payload.media.mimetype as string).toLowerCase();
      if (mime.startsWith("image/")) {
        wahaType = "image";
      } else if (mime.startsWith("video/")) {
        wahaType = "video";
      } else if (mime.startsWith("audio/")) {
        // Check if it's a PTT (voice note)
        wahaType = payload.media?.ptt ? "ptt" : "audio";
      } else {
        wahaType = "document";
      }
      console.log(`[waha-webhook] Media type inferred from mimetype (${mime}): ${wahaType}`);
    }

    const messageInsert: Record<string, unknown> = {
      organizacao_id: sessao.organizacao_id,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: isFromMe,
      // For fromMe: from_number = our number (rawFrom), to_number = contact (phoneNumber)
      // For received: from_number = contact (phoneNumber), to_number = null
      from_number: isFromMe ? rawFrom.replace("@c.us", "").replace("@s.whatsapp.net", "") : phoneNumber,
      to_number: isFromMe ? phoneNumber : null,
      tipo: wahaType,
      body: messageBody ? messageBody.substring(0, 10000) : null,
      has_media: payload.hasMedia || false,
      timestamp_externo: timestamp,
      raw_data: payload,
    };

    // =====================================================
    // Extract reply/quote context (stanzaId from contextInfo)
    // WAHA stores contextInfo inside the specific message type object
    // e.g., extendedTextMessage.contextInfo, imageMessage.contextInfo, etc.
    // =====================================================
    let quotedStanzaID: string | null = null;

    // Search for stanzaId in _data.message.*.contextInfo
    const msgData = payload._data?.message;
    if (msgData && typeof msgData === 'object') {
      for (const key of Object.keys(msgData)) {
        const sub = msgData[key];
        if (sub && typeof sub === 'object' && sub.contextInfo?.stanzaId) {
          quotedStanzaID = sub.contextInfo.stanzaId;
          break;
        }
      }
    }

    // Fallback: check top-level _data fields (older WAHA versions)
    if (!quotedStanzaID) {
      quotedStanzaID = payload._data?.quotedStanzaID
        || payload._data?.contextInfo?.stanzaId
        || payload._data?.contextInfo?.quotedStanzaId
        || null;
    }

    if (quotedStanzaID) {
      messageInsert.reply_to_message_id = quotedStanzaID;
      console.log(`[waha-webhook] Reply detected: quotedStanzaID=${quotedStanzaID}`);
    }

    // For groups and channels, store participant info (resolved, not @lid)
    if ((isGroup || isChannel)) {
      // AIDEV-NOTE: Armazenar participant resolvido e nome para display correto
      const resolvedP = (isGroup && typeof resolvedParticipant === "string" && resolvedParticipant)
        ? resolvedParticipant
        : (participantRaw || "");
      if (resolvedP) {
        messageInsert.participant = resolvedP;
      }
      // Inject resolved pushName into raw_data for frontend getParticipantDisplayName
      if (phoneName) {
        const existingRaw = (messageInsert.raw_data || {}) as Record<string, unknown>;
        const existingData = (existingRaw._data || {}) as Record<string, unknown>;
        existingData.pushName = existingData.pushName || phoneName;
        existingRaw._data = existingData;
        messageInsert.raw_data = existingRaw;
      }
    }

    // =====================================================
    // Extract media data from WAHA payload
    // Download from WAHA and re-upload to Supabase Storage
    // =====================================================
    if (payload.hasMedia && payload.media?.url) {
      const wahaMediaUrl = payload.media.url as string;
      const mediaMimetype = (payload.media.mimetype as string) || null;
      const mediaFilename = (payload.media.filename as string) || (payload._data?.filename as string) || null;
      const mediaSize = payload.media.filesize || payload._data?.size || null;
      const mediaDuration = payload._data?.duration || null;

      messageInsert.media_mimetype = mediaMimetype;
      messageInsert.media_filename = mediaFilename;
      messageInsert.media_size = mediaSize;
      messageInsert.media_duration = mediaDuration;

      console.log(`[waha-webhook] Media detected: wahaUrl=${wahaMediaUrl}, mime=${mediaMimetype}, filename=${mediaFilename}`);

      // Try to download from WAHA and upload to Supabase Storage for public access
      let finalMediaUrl = wahaMediaUrl;
      try {
        // Download from WAHA (may require API key)
        const fetchHeaders: Record<string, string> = {};
        if (wahaApiKey && wahaMediaUrl.includes(wahaApiUrl || "__none__")) {
          fetchHeaders["X-Api-Key"] = wahaApiKey;
        }
        
        const mediaResponse = await fetch(wahaMediaUrl, { headers: fetchHeaders });
        
        if (mediaResponse.ok) {
          const mediaBlob = await mediaResponse.arrayBuffer();
          const mediaBytes = new Uint8Array(mediaBlob);
          
          // Determine file extension from mimetype or filename
          const extMap: Record<string, string> = {
            "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
            "video/mp4": "mp4", "video/3gpp": "3gp", "video/quicktime": "mov",
            "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac",
            "application/pdf": "pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
          };
          let ext = mediaMimetype ? (extMap[mediaMimetype.toLowerCase()] || mediaMimetype.split("/")[1] || "bin") : "bin";
          if (mediaFilename) {
            const fileExt = mediaFilename.split(".").pop();
            if (fileExt && fileExt.length <= 5) ext = fileExt;
          }

          // Upload to Supabase Storage
          const storagePath = `conversas/${conversaId}/${messageId.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;
          const contentType = mediaMimetype || "application/octet-stream";

          const { error: uploadError } = await supabaseAdmin.storage
            .from("chat-media")
            .upload(storagePath, mediaBytes, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error(`[waha-webhook] Storage upload error: ${uploadError.message}`);
          } else {
            // Get public URL
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("chat-media")
              .getPublicUrl(storagePath);
            
            if (publicUrlData?.publicUrl) {
              finalMediaUrl = publicUrlData.publicUrl;
              console.log(`[waha-webhook] ✅ Media uploaded to Storage: ${finalMediaUrl}`);
            }
          }
        } else {
          console.warn(`[waha-webhook] Failed to download from WAHA (${mediaResponse.status}), keeping original URL`);
        }
      } catch (dlError) {
        console.error(`[waha-webhook] Media download/upload error:`, dlError);
        // Keep original WAHA URL as fallback
      }

      messageInsert.media_url = finalMediaUrl;
    }

    // Extract caption for media messages
    if (payload.caption) {
      messageInsert.caption = payload.caption;
    }

    // Extract location data
    if (wahaType === "location") {
      messageInsert.location_latitude = payload.location?.latitude || payload._data?.lat || null;
      messageInsert.location_longitude = payload.location?.longitude || payload._data?.lng || null;
      messageInsert.location_name = payload.location?.description || null;
      messageInsert.location_address = payload.location?.address || null;
    }

    // Extract contact (vCard) data
    if (wahaType === "contact" || wahaType === "vcard") {
      messageInsert.tipo = "contact";
      // Try multiple sources for vCard data
      messageInsert.vcard = payload.vCards?.[0]
        || payload._data?.message?.contactMessage?.vcard
        || payload._data?.body
        || null;
      // Extract display name from contactMessage if body is empty
      if (!messageInsert.body) {
        const displayName = payload._data?.message?.contactMessage?.displayName;
        if (displayName) {
          messageInsert.body = `Contato: ${displayName}`;
        }
      }
    }

    // Extract poll data (NOWEB + GOWS engines)
    if (wahaType === "poll" || wahaType === "poll_creation") {
      messageInsert.tipo = "poll";

      // Source 1: __detectedPollData (set during type inference above)
      // Source 2: pollCreationMessageV3/pollCreationMessage from _data.Message
      const detectedPoll = payload.__detectedPollData;
      const gowsPollMsg = payload._data?.Message?.pollCreationMessageV3
        || payload._data?.Message?.pollCreationMessage
        || payload._data?.message?.pollCreationMessageV3
        || payload._data?.message?.pollCreationMessage;
      const pollSource = detectedPoll || gowsPollMsg;

      messageInsert.poll_question = payload._data?.pollName
        || pollSource?.name
        || payload.body
        || null;

      const pollOpts = payload._data?.pollOptions;
      if (Array.isArray(pollOpts)) {
        messageInsert.poll_options = pollOpts.map((opt: { name?: string }) => ({ text: opt.name || "", votes: 0 }));
      } else if (pollSource?.options && Array.isArray(pollSource.options)) {
        messageInsert.poll_options = pollSource.options.map((opt: { optionName?: string; name?: string }) => ({
          text: opt.optionName || opt.name || "", votes: 0
        }));
      }

      // Set body with poll emoji prefix if missing
      if (!messageInsert.body && messageInsert.poll_question) {
        messageInsert.body = `📊 ${messageInsert.poll_question}`;
      }
    }

    // Check for duplicate message (avoid re-inserting messages sent via CRM)
    const { data: existingMsg } = await supabaseAdmin
      .from("mensagens")
      .select("id")
      .eq("message_id", messageId)
      .eq("organizacao_id", sessao.organizacao_id)
      .maybeSingle();

    let isDuplicate = !!existingMsg;

    // Also check short ID form (CRM-sent messages use short key.id format)
    if (!isDuplicate && messageId.includes('_')) {
      const shortId = messageId.split('_').pop();
      const { data: existingShort } = await supabaseAdmin
        .from("mensagens")
        .select("id")
        .eq("message_id", shortId!)
        .eq("organizacao_id", sessao.organizacao_id)
        .maybeSingle();
      isDuplicate = !!existingShort;
    }

    if (isDuplicate) {
      console.log(`[waha-webhook] Duplicate message ${messageId}, skipping insert`);
      return new Response(
        JSON.stringify({ ok: true, message: "Duplicate skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newMsg, error: msgError } = await supabaseAdmin
      .from("mensagens")
      .insert(messageInsert)
      .select("id")
      .single();

    if (msgError) {
      console.error(`[waha-webhook] Error inserting message:`, msgError.message);
    } else {
      console.log(`[waha-webhook] Inserted message ${newMsg?.id} in conversa ${conversaId}`);
    }

    // =====================================================
    // STEP 4: Pre-opportunity (if enabled, only for individual)
    // =====================================================
    if (!isFromMe && !isGroup && !isChannel && sessao.auto_criar_pre_oportunidade && sessao.funil_destino_id) {
      // AIDEV-NOTE: Checar se telefone está bloqueado antes de criar pré-oportunidade
      const { data: bloqueado } = await supabaseAdmin
        .from("contatos_bloqueados_pre_op")
        .select("id")
        .eq("organizacao_id", sessao.organizacao_id)
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (bloqueado) {
        console.log(`[waha-webhook] Phone ${phoneNumber} blocked for pre-op, skipping`);
      } else {

      const { data: existingPreOp } = await supabaseAdmin
        .from("pre_oportunidades")
        .select("id, total_mensagens")
        .eq("organizacao_id", sessao.organizacao_id)
        .eq("phone_number", phoneNumber)
        .eq("status", "pendente")
        .is("deletado_em", null)
        .maybeSingle();

      if (existingPreOp) {
        await supabaseAdmin
          .from("pre_oportunidades")
          .update({
            ultima_mensagem: messageBody.substring(0, 500),
            ultima_mensagem_em: now,
            total_mensagens: (existingPreOp.total_mensagens || 0) + 1,
            phone_name: phoneName || undefined,
            atualizado_em: now,
          })
          .eq("id", existingPreOp.id);
      } else {
        await supabaseAdmin
          .from("pre_oportunidades")
          .insert({
            organizacao_id: sessao.organizacao_id,
            phone_number: phoneNumber,
            phone_name: phoneName,
            funil_destino_id: sessao.funil_destino_id,
            status: "pendente",
            primeira_mensagem: messageBody.substring(0, 500),
            primeira_mensagem_em: now,
            ultima_mensagem: messageBody.substring(0, 500),
            ultima_mensagem_em: now,
            total_mensagens: 1,
          });
      }
      } // end else (not blocked)
    }

    // =====================================================
    // STEP 5: Update session stats
    // =====================================================
    // Update session stats (only for received messages)
    if (!isFromMe) {
      const { data: currentSessao } = await supabaseAdmin
        .from("sessoes_whatsapp")
        .select("total_mensagens_recebidas")
        .eq("id", sessao.id)
        .single();

      await supabaseAdmin
        .from("sessoes_whatsapp")
        .update({
          total_mensagens_recebidas: (currentSessao?.total_mensagens_recebidas || 0) + 1,
          ultima_mensagem_em: now,
          atualizado_em: now,
        })
        .eq("id", sessao.id);
    }

    console.log(`[waha-webhook] ✅ Fully processed ${conversaTipo} message from ${phoneNumber}: contato=${contatoId}, conversa=${conversaId}`);

    return new Response(
      JSON.stringify({ ok: true, message: "Processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[waha-webhook] Error:", error);
    return new Response(
      JSON.stringify({ ok: true, message: "Error handled" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
