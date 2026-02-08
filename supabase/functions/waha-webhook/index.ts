/**
 * AIDEV-NOTE: Edge Function receptor de webhooks do WAHA (WhatsApp)
 * Recebe eventos de mensagens do WAHA e cria pré-oportunidades automaticamente
 * Público (verify_jwt = false) - validação via API key do WAHA
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

    // Check if auto-create is enabled
    if (!sessao.auto_criar_pre_oportunidade || !sessao.funil_destino_id) {
      console.log(`[waha-webhook] Auto-create disabled for session ${sessionName}`);
      return new Response(
        JSON.stringify({ ok: true, message: "Auto-create disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract phone number and message
    const rawFrom = payload.from || "";
    const phoneNumber = rawFrom.replace("@c.us", "").replace("@s.whatsapp.net", "");
    const phoneName = payload._data?.notifyName || payload.notifyName || null;
    const messageBody = payload.body || payload.text || "";
    const now = new Date().toISOString();

    if (!phoneNumber) {
      console.log("[waha-webhook] No phone number in message");
      return new Response(
        JSON.stringify({ ok: true, message: "No phone" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[waha-webhook] Processing message from ${phoneNumber} (${phoneName || "unknown"})`);

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

    // Update session stats
    await supabaseAdmin
      .from("sessoes_whatsapp")
      .update({
        total_mensagens_recebidas: (await supabaseAdmin
          .from("sessoes_whatsapp")
          .select("total_mensagens_recebidas")
          .eq("id", sessao.id)
          .single()
          .then(r => (r.data?.total_mensagens_recebidas || 0) + 1)),
        ultima_mensagem_em: now,
        atualizado_em: now,
      })
      .eq("id", sessao.id);

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
