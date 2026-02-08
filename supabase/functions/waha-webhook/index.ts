/**
 * AIDEV-NOTE: Edge Function receptor de webhooks do WAHA (WhatsApp)
 * Recebe eventos de mensagens do WAHA e:
 * 1. Busca/cria contato pelo telefone
 * 2. Busca/cria conversa vinculada à sessão WhatsApp
 * 3. Insere mensagem na conversa
 * 4. Atualiza contadores da conversa
 * 5. Cria pré-oportunidade se auto_criar_pre_oportunidade estiver habilitado
 * Público (verify_jwt = false) - validação via session_name
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

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
    }));

    // Only process incoming messages
    if (body.event !== "message") {
      console.log(`[waha-webhook] Ignoring event: ${body.event}`);
      return new Response(
        JSON.stringify({ ok: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = body.payload;

    // Ignore outgoing messages (sent by us)
    if (!payload || payload.fromMe === true) {
      console.log("[waha-webhook] Ignoring outgoing message");
      return new Response(
        JSON.stringify({ ok: true, message: "Outgoing ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Find the WhatsApp session
    const { data: sessao, error: sessaoError } = await supabaseAdmin
      .from("sessoes_whatsapp")
      .select("id, organizacao_id, usuario_id, auto_criar_pre_oportunidade, funil_destino_id")
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
    console.log(`[waha-webhook] WAHA config loaded: url=${wahaApiUrl ? 'yes' : 'no'}, key=${wahaApiKey ? 'yes' : 'no'}`);

    // Extract phone number and message
    const rawFrom = payload.from || "";
    const phoneNumber = rawFrom.replace("@c.us", "").replace("@s.whatsapp.net", "");
    // WAHA sends the name in multiple possible fields depending on version/engine
    const phoneName = payload._data?.pushName || payload._data?.notifyName || payload.notifyName || payload.pushName || null;
    console.log(`[waha-webhook] Name extraction: pushName=${payload._data?.pushName}, notifyName=${payload._data?.notifyName || payload.notifyName}`);
    const messageBody = payload.body || payload.text || "";
    const messageType = payload.type || "chat";
    const messageId = payload.id?._serialized || payload.id?.id || payload.id || `waha_${Date.now()}`;
    const timestamp = payload.timestamp || Math.floor(Date.now() / 1000);
    const now = new Date().toISOString();

    if (!phoneNumber) {
      console.log("[waha-webhook] No phone number in message");
      return new Response(
        JSON.stringify({ ok: true, message: "No phone" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[waha-webhook] Processing message from ${phoneNumber} (${phoneName || "unknown"}) - type: ${messageType}`);

    // =====================================================
    // STEP 0: Fetch WhatsApp profile picture from WAHA API
    // =====================================================
    let profilePictureUrl: string | null = null;

    if (wahaApiUrl && wahaApiKey) {
      try {
        const picResp = await fetch(
          `${wahaApiUrl}/api/contacts/profile-picture?contactId=${encodeURIComponent(rawFrom)}&session=${encodeURIComponent(sessionName)}`,
          { headers: { "X-Api-Key": wahaApiKey } }
        );

        if (picResp.ok) {
          const picData = await picResp.json();
          console.log(`[waha-webhook] Profile picture API response:`, JSON.stringify(picData).substring(0, 300));
          profilePictureUrl = picData?.profilePictureUrl || picData?.url || picData?.profilePicUrl || picData?.profilePictureURL || null;
          console.log(`[waha-webhook] Profile picture URL: ${profilePictureUrl || 'none'}`);
        } else {
          const picErr = await picResp.text();
          console.log(`[waha-webhook] No profile picture available (${picResp.status}): ${picErr.substring(0, 200)}`);
        }
      } catch (picError) {
        console.log(`[waha-webhook] Error fetching profile picture:`, picError);
      }
    }

    // =====================================================
    // STEP 1: Find or create contact
    // =====================================================
    let contatoId: string;

    const { data: existingContato } = await supabaseAdmin
      .from("contatos")
      .select("id, nome")
      .eq("organizacao_id", sessao.organizacao_id)
      .eq("telefone", phoneNumber)
      .is("deletado_em", null)
      .maybeSingle();

    if (existingContato) {
      contatoId = existingContato.id;
      console.log(`[waha-webhook] Found existing contato: ${contatoId}`);

      // Update contact name if we have a better name from WhatsApp
      if (phoneName && existingContato.nome !== phoneName) {
        await supabaseAdmin
          .from("contatos")
          .update({ nome: phoneName, atualizado_em: now })
          .eq("id", contatoId);
        console.log(`[waha-webhook] Updated contato name to: ${phoneName}`);
      }
    } else {
      // Create new contact
      const contactName = phoneName || phoneNumber;
      const { data: newContato, error: contatoError } = await supabaseAdmin
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
        .single();

      if (contatoError || !newContato) {
        console.error(`[waha-webhook] Error creating contato:`, contatoError?.message);
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
    // =====================================================
    const chatId = rawFrom; // e.g. "5513988506995@c.us"
    let conversaId: string;

    const { data: existingConversa } = await supabaseAdmin
      .from("conversas")
      .select("id, total_mensagens, mensagens_nao_lidas")
      .eq("organizacao_id", sessao.organizacao_id)
      .eq("chat_id", chatId)
      .eq("sessao_whatsapp_id", sessao.id)
      .is("deletado_em", null)
      .maybeSingle();

    if (existingConversa) {
      conversaId = existingConversa.id;

      // Update conversation counters + photo + name
      const updateData: Record<string, unknown> = {
        total_mensagens: (existingConversa.total_mensagens || 0) + 1,
        mensagens_nao_lidas: (existingConversa.mensagens_nao_lidas || 0) + 1,
        ultima_mensagem_em: now,
        atualizado_em: now,
      };
      if (phoneName) updateData.nome = phoneName;
      if (profilePictureUrl) updateData.foto_url = profilePictureUrl;

      const { error: updateConvError } = await supabaseAdmin
        .from("conversas")
        .update(updateData)
        .eq("id", conversaId);

      if (updateConvError) {
        console.error(`[waha-webhook] Error updating conversa:`, updateConvError.message);
      } else {
        console.log(`[waha-webhook] Updated conversa ${conversaId}`);
      }
    } else {
      // Create new conversation
      const { data: newConversa, error: conversaError } = await supabaseAdmin
        .from("conversas")
        .insert({
          organizacao_id: sessao.organizacao_id,
          contato_id: contatoId,
          usuario_id: sessao.usuario_id,
          sessao_whatsapp_id: sessao.id,
          chat_id: chatId,
          canal: "whatsapp",
          tipo: "individual",
          nome: phoneName || phoneNumber,
          foto_url: profilePictureUrl,
          status: "aberta",
          total_mensagens: 1,
          mensagens_nao_lidas: 1,
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
      console.log(`[waha-webhook] Created new conversa: ${conversaId}`);
    }

    // =====================================================
    // STEP 3: Insert message
    // =====================================================
    const wahaType = messageType === "chat" ? "text" : messageType;

    const { data: newMsg, error: msgError } = await supabaseAdmin
      .from("mensagens")
      .insert({
        organizacao_id: sessao.organizacao_id,
        conversa_id: conversaId,
        message_id: messageId,
        from_me: false,
        from_number: phoneNumber,
        to_number: null,
        tipo: wahaType,
        body: messageBody ? messageBody.substring(0, 10000) : null,
        has_media: payload.hasMedia || false,
        timestamp_externo: timestamp,
        raw_data: payload,
      })
      .select("id")
      .single();

    if (msgError) {
      console.error(`[waha-webhook] Error inserting message:`, msgError.message);
    } else {
      console.log(`[waha-webhook] Inserted message ${newMsg?.id} in conversa ${conversaId}`);
    }

    // =====================================================
    // STEP 4: Pre-opportunity (if enabled)
    // =====================================================
    if (sessao.auto_criar_pre_oportunidade && sessao.funil_destino_id) {
      // Check if there's already a pending pre-opportunity for this phone
      const { data: existingPreOp } = await supabaseAdmin
        .from("pre_oportunidades")
        .select("id, total_mensagens")
        .eq("organizacao_id", sessao.organizacao_id)
        .eq("phone_number", phoneNumber)
        .eq("status", "pendente")
        .is("deletado_em", null)
        .maybeSingle();

      if (existingPreOp) {
        // Update existing pre-opportunity with new message
        const { error: updateError } = await supabaseAdmin
          .from("pre_oportunidades")
          .update({
            ultima_mensagem: messageBody.substring(0, 500),
            ultima_mensagem_em: now,
            total_mensagens: (existingPreOp.total_mensagens || 0) + 1,
            phone_name: phoneName || undefined,
            atualizado_em: now,
          })
          .eq("id", existingPreOp.id);

        if (updateError) {
          console.error(`[waha-webhook] Error updating pre-op:`, updateError.message);
        } else {
          console.log(`[waha-webhook] Updated pre-op ${existingPreOp.id} (msgs: ${(existingPreOp.total_mensagens || 0) + 1})`);
        }
      } else {
        // Create new pre-opportunity
        const { data: newPreOp, error: insertError } = await supabaseAdmin
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
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`[waha-webhook] Error creating pre-op:`, insertError.message);
        } else {
          console.log(`[waha-webhook] Created new pre-op ${newPreOp?.id} for ${phoneNumber}`);
        }
      }
    }

    // =====================================================
    // STEP 5: Update session stats
    // =====================================================
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

    console.log(`[waha-webhook] ✅ Fully processed message from ${phoneNumber}: contato=${contatoId}, conversa=${conversaId}`);

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
