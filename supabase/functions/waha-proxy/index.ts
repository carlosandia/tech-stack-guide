/**
 * AIDEV-NOTE: Edge Function proxy para WAHA API (WhatsApp)
 * Lê credenciais de configuracoes_globais e faz proxy para WAHA
 * Suporta: iniciar sessão, obter QR code, verificar status, desconectar,
 *          enviar mensagem de texto, enviar mídia
 * Salva/atualiza sessoes_whatsapp no banco ao detectar conexão
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = claims.claims.sub as string;
    console.log(`[waha-proxy] Auth user: ${authUserId}`);

    // Service role client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's organizacao_id and usuario_id from usuarios table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, organizacao_id")
      .eq("auth_id", authUserId)
      .maybeSingle();

    if (userError || !userData) {
      console.error("[waha-proxy] User not found:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usuarioId = userData.id;
    const organizacaoId = userData.organizacao_id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { action, session_name } = body as { action?: string; session_name?: string };

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Campo 'action' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WAHA config from configuracoes_globais
    const { data: wahaConfig, error: configError } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes, configurado")
      .eq("plataforma", "waha")
      .maybeSingle();

    if (configError || !wahaConfig) {
      console.error("[waha-proxy] Config not found:", configError?.message);
      return new Response(
        JSON.stringify({ error: "Configuração WAHA não encontrada. Configure nas Configurações Globais." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = wahaConfig.configuracoes as Record<string, string>;
    const apiUrl = config?.api_url;
    const apiKey = config?.api_key;

    if (!apiUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: "WAHA API URL e API Key são obrigatórios. Configure nas Configurações Globais." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize base URL (remove trailing slash)
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const sessionId = session_name || `crm_${authUserId.substring(0, 8)}`;

    // Build webhook URL for waha-webhook Edge Function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/waha-webhook`;

    // Webhook events to subscribe
    // message.any = both incoming and outgoing (sent from phone) messages
    const webhookEvents = ["message.any", "message.ack", "poll.vote", "poll.vote.failed"];

    console.log(`[waha-proxy] Action: ${action}, Session: ${sessionId}, WAHA URL: ${baseUrl}`);

    // Helper: upsert sessoes_whatsapp record
    async function upsertSessao(data: Record<string, unknown>) {
      const { data: existing } = await supabaseAdmin
        .from("sessoes_whatsapp")
        .select("id")
        .eq("session_name", sessionId)
        .eq("organizacao_id", organizacaoId)
        .is("deletado_em", null)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("sessoes_whatsapp")
          .update({ ...data, atualizado_em: new Date().toISOString() })
          .eq("id", existing.id);
        console.log(`[waha-proxy] Updated sessao ${existing.id}`);
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("sessoes_whatsapp")
          .insert({
            organizacao_id: organizacaoId,
            usuario_id: usuarioId,
            session_name: sessionId,
            ...data,
          });
        if (insertError) {
          console.error(`[waha-proxy] Error inserting sessao:`, insertError.message);
        } else {
          console.log(`[waha-proxy] Created new sessao for ${sessionId}`);
        }
      }
    }

    // Route actions to WAHA API
    let wahaResponse: Response;

    switch (action) {
      case "iniciar": {
        // Start session via WAHA API
        wahaResponse = await fetch(`${baseUrl}/api/sessions/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            name: sessionId,
            config: {
              proxy: null,
              webhooks: [
                {
                  url: webhookUrl,
                  events: webhookEvents,
                },
              ],
            },
          }),
        });

        // 422 = session already started — check actual status
        if (wahaResponse.status === 422) {
          const errBody = await wahaResponse.json().catch(() => ({}));
          console.log(`[waha-proxy] Session already exists:`, errBody.message);

          // Check the real status of the session
          const checkResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
            headers: { "X-Api-Key": apiKey },
          });

          let realStatus = "unknown";
          if (checkResp.ok) {
            const checkData = await checkResp.json();
            realStatus = checkData.status;
            console.log(`[waha-proxy] Real session status: ${realStatus}`);
          } else {
            await checkResp.text();
          }

          // If session is FAILED or STOPPED, delete it entirely and restart
          if (realStatus === "FAILED" || realStatus === "STOPPED") {
            console.log(`[waha-proxy] Session in ${realStatus} state, deleting and restarting...`);

            const deleteResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
              method: "DELETE",
              headers: { "X-Api-Key": apiKey },
            });
            console.log(`[waha-proxy] Delete response: ${deleteResp.status}`);
            await deleteResp.text();

            await new Promise(r => setTimeout(r, 2000));

            const restartResp = await fetch(`${baseUrl}/api/sessions/start`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
              body: JSON.stringify({
                name: sessionId,
                config: {
                  proxy: null,
                  webhooks: [
                    {
                      url: webhookUrl,
                      events: webhookEvents,
                    },
                  ],
                },
              }),
            });
            const restartData = await restartResp.json().catch(() => ({}));
            console.log(`[waha-proxy] Restart response: ${restartResp.status}`, JSON.stringify(restartData));

            if (!restartResp.ok && restartResp.status !== 422) {
              return new Response(
                JSON.stringify({ error: "Falha ao reiniciar sessão WAHA", details: restartData }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            await upsertSessao({ status: "scanning", ultimo_qr_gerado: new Date().toISOString() });

            return new Response(
              JSON.stringify({ name: sessionId, status: "SCAN_QR_CODE", restarted: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // If WORKING, already connected
          if (realStatus === "WORKING") {
            await upsertSessao({ status: "connected" });
            return new Response(
              JSON.stringify({ name: sessionId, status: "WORKING", already_connected: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Otherwise (SCAN_QR_CODE, STARTING, etc.) treat as ready for QR
          await upsertSessao({ status: "scanning" });

          return new Response(
            JSON.stringify({ name: sessionId, status: "SCAN_QR_CODE", already_started: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (wahaResponse.ok) {
          await upsertSessao({ status: "scanning", ultimo_qr_gerado: new Date().toISOString() });
        }
        break;
      }

      case "qr_code": {
        wahaResponse = await fetch(`${baseUrl}/api/${sessionId}/auth/qr`, {
          method: "GET",
          headers: { "X-Api-Key": apiKey },
        });

        if (wahaResponse.ok) {
          const contentType = wahaResponse.headers.get("content-type") || "";
          
          if (contentType.includes("image")) {
            const imageBuffer = await wahaResponse.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
            const dataUri = `data:${contentType};base64,${base64}`;
            
            return new Response(
              JSON.stringify({ qr_code: dataUri, status: "waiting_qr" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const jsonData = await wahaResponse.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ 
              qr_code: null, 
              status: jsonData.status || "unknown",
              ...jsonData 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const errorBody = await wahaResponse.text().catch(() => "");
        console.log(`[waha-proxy] QR response status: ${wahaResponse.status}, body: ${errorBody}`);
        
        if (wahaResponse.status === 404 || wahaResponse.status === 422) {
          const statusResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
            headers: { "X-Api-Key": apiKey },
          });
          
          if (statusResp.ok) {
            const statusData = await statusResp.json();
            if (statusData.status === "WORKING") {
              const me = statusData.me || {};
              await upsertSessao({
                status: "connected",
                phone_number: me.id?.replace("@c.us", "") || null,
                phone_name: me.pushName || statusData.name || null,
                conectado_em: new Date().toISOString(),
              });

              return new Response(
                JSON.stringify({ qr_code: null, status: "connected" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } else {
            await statusResp.text();
          }
        }

        return new Response(
          JSON.stringify({ error: "Não foi possível obter QR Code", status: "error" }),
          { status: wahaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        wahaResponse = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
          method: "GET",
          headers: { "X-Api-Key": apiKey },
        });

        if (wahaResponse.ok) {
          const statusData = await wahaResponse.json();
          const isConnected = statusData.status === "WORKING";
          const me = statusData.me || {};

          if (isConnected) {
            await upsertSessao({
              status: "connected",
              phone_number: me.id?.replace("@c.us", "") || null,
              phone_name: me.pushName || statusData.name || null,
              conectado_em: new Date().toISOString(),
            });

            // Re-configure webhook to ensure latest events (e.g. message.any, poll.vote)
            try {
              let reconfigOk = false;
              // WAHA requires full body with "name" + trailing slash on PUT
              const configBody = JSON.stringify({
                name: sessionId,
                config: {
                  webhooks: [{ url: webhookUrl, events: webhookEvents }]
                }
              });

              // Try PUT with trailing slash (WAHA Plus standard endpoint)
              const putResp = await fetch(`${baseUrl}/api/sessions/${sessionId}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
                body: configBody,
              });
              const putData = await putResp.json().catch(() => null);
              console.log(`[waha-proxy] Webhook reconfig PUT result: ${putResp.status}`, JSON.stringify(putData));
              reconfigOk = putResp.ok;

              if (!reconfigOk) {
                // Fallback: stop + start to apply new webhook config
                console.log(`[waha-proxy] PUT failed, using stop+start fallback to reconfig webhooks`);
                const stopResp = await fetch(`${baseUrl}/api/sessions/stop`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
                  body: JSON.stringify({ name: sessionId, logout: false }),
                });
                console.log(`[waha-proxy] Stop for reconfig: ${stopResp.status}`);
                await stopResp.text();

                // Wait briefly for session to stop
                await new Promise(r => setTimeout(r, 1500));

                const startResp = await fetch(`${baseUrl}/api/sessions/start`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
                  body: JSON.stringify({
                    name: sessionId,
                    config: {
                      webhooks: [{ url: webhookUrl, events: webhookEvents }]
                    }
                  }),
                });
                const startData = await startResp.json().catch(() => null);
                console.log(`[waha-proxy] Start for reconfig: ${startResp.status}`, JSON.stringify(startData));
              }
            } catch (e) {
              console.log(`[waha-proxy] Webhook reconfig failed:`, e);
            }
          }
          
          return new Response(
            JSON.stringify({
              status: isConnected ? "connected" : "disconnected",
              raw_status: statusData.status,
              name: statusData.name,
              me: me || null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ status: "disconnected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "desconectar": {
        // 1. LOGOUT - desemparelha o número do WhatsApp
        try {
          const logoutResp = await fetch(`${baseUrl}/api/sessions/${sessionId}/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
          });
          console.log(`[waha-proxy] Logout response: ${logoutResp.status}`);
          await logoutResp.text(); // consume body
        } catch (e) {
          console.log(`[waha-proxy] Logout failed (may already be stopped): ${e}`);
        }

        // 2. STOP - para a sessão com logout
        try {
          const stopResp = await fetch(`${baseUrl}/api/sessions/stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
            body: JSON.stringify({ name: sessionId, logout: true }),
          });
          console.log(`[waha-proxy] Stop response: ${stopResp.status}`);
          await stopResp.text();
        } catch (e) {
          console.log(`[waha-proxy] Stop failed: ${e}`);
        }

        // 3. DELETE - remove a sessão completamente do WAHA
        try {
          const deleteResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
            method: "DELETE",
            headers: { "X-Api-Key": apiKey },
          });
          console.log(`[waha-proxy] Delete response: ${deleteResp.status}`);
          await deleteResp.text();
        } catch (e) {
          console.log(`[waha-proxy] Delete failed: ${e}`);
        }

        // 4. Atualizar banco - limpar phone para forçar novo QR
        await upsertSessao({
          status: "disconnected",
          desconectado_em: new Date().toISOString(),
          phone_number: null,
          phone_name: null,
        });

        return new Response(
          JSON.stringify({ ok: true, status: "disconnected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "configurar_webhook": {
        console.log(`[waha-proxy] Configuring webhook for session ${sessionId}: ${webhookUrl}`);
        
        const checkResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
          headers: { "X-Api-Key": apiKey },
        });
        
        if (!checkResp.ok) {
          const errText = await checkResp.text();
          console.log(`[waha-proxy] Session not found for webhook config: ${errText}`);
          return new Response(
            JSON.stringify({ error: "Sessão não encontrada. Inicie a sessão primeiro." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const currentSession = await checkResp.json();
        console.log(`[waha-proxy] Current session status: ${currentSession.status}`);

        const patchResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            config: {
              webhooks: [
                {
                  url: webhookUrl,
                  events: webhookEvents,
                },
              ],
            },
          }),
        });

        if (patchResp.ok || patchResp.status === 200) {
          const patchResult = await patchResp.json().catch(() => ({}));
          console.log(`[waha-proxy] PATCH webhook config response: ${patchResp.status}`, JSON.stringify(patchResult));
        } else {
          const patchErr = await patchResp.text();
          console.log(`[waha-proxy] PATCH not supported (${patchResp.status}), webhook already configured during session start`);
        }

        await upsertSessao({ webhook_url: webhookUrl });

        return new Response(
          JSON.stringify({ ok: true, message: "Webhook configurado", webhook_url: webhookUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // ENVIAR MENSAGEM DE TEXTO VIA WAHA
      // =====================================================
      case "enviar_mensagem": {
        const { chat_id, text, reply_to } = body as {
          chat_id?: string;
          text?: string;
          reply_to?: string;
        };

        if (!chat_id || !text) {
          return new Response(
            JSON.stringify({ error: "chat_id e text são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Sending text to ${chat_id}, session: ${sessionId}`);

        const sendBody: Record<string, unknown> = {
          chatId: chat_id,
          text: text,
          session: sessionId,
        };

        if (reply_to) {
          sendBody.reply_to = reply_to;
        }

        const sendResp = await fetch(`${baseUrl}/api/sendText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify(sendBody),
        });

        const sendData = await sendResp.json().catch(() => ({}));
        console.log(`[waha-proxy] sendText response: ${sendResp.status}`, JSON.stringify(sendData).substring(0, 500));

        if (!sendResp.ok) {
          return new Response(
            JSON.stringify({ error: "Falha ao enviar mensagem", details: sendData }),
            { status: sendResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build serialized message_id for ACK matching
        const key = sendData.key || {};
        const rawId = sendData.id;
        let messageId: string | null;
        if (typeof rawId === 'object' && rawId?._serialized) {
          messageId = rawId._serialized;
        } else if (key.id && key.remoteJid) {
          const jid = (key.remoteJid || '').replace('@s.whatsapp.net', '@c.us');
          messageId = `${key.fromMe !== false ? 'true' : 'false'}_${jid}_${key.id}`;
        } else {
          messageId = (typeof rawId === 'string' ? rawId : rawId?.id) || key.id || null;
        }
        console.log(`[waha-proxy] Built messageId: ${messageId}`);

        return new Response(
          JSON.stringify({ ok: true, message_id: messageId, data: sendData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // ENVIAR MÍDIA VIA WAHA
      // =====================================================
      case "enviar_media": {
        const { chat_id: mediaChatId, media_url, caption: mediaCaption, filename, media_type } = body as {
          chat_id?: string;
          media_url?: string;
          caption?: string;
          filename?: string;
          media_type?: string;
        };

        if (!mediaChatId || !media_url) {
          return new Response(
            JSON.stringify({ error: "chat_id e media_url são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Sending media to ${mediaChatId}, type: ${media_type}, session: ${sessionId}`);

        // Determine WAHA endpoint based on media type
        let endpoint = "sendImage";
        if (media_type === "video") endpoint = "sendVideo";
        else if (media_type === "audio") endpoint = "sendVoice";
        else if (media_type === "document") endpoint = "sendFile";

        const mediaBody: Record<string, unknown> = {
          chatId: mediaChatId,
          session: sessionId,
        };

        if (endpoint === "sendFile") {
          mediaBody.file = { url: media_url };
          if (filename) mediaBody.file = { url: media_url, filename };
          if (mediaCaption) mediaBody.caption = mediaCaption;
        } else {
          mediaBody.file = { url: media_url };
          if (mediaCaption) mediaBody.caption = mediaCaption;
        }

        const mediaResp = await fetch(`${baseUrl}/api/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify(mediaBody),
        });

        const mediaData = await mediaResp.json().catch(() => ({}));
        console.log(`[waha-proxy] ${endpoint} response: ${mediaResp.status}`, JSON.stringify(mediaData).substring(0, 500));

        if (!mediaResp.ok) {
          return new Response(
            JSON.stringify({ error: "Falha ao enviar mídia", details: mediaData }),
            { status: mediaResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build serialized message_id for ACK matching
        const mediaKey = mediaData.key || {};
        const mediaRawId = mediaData.id;
        let mediaMessageId: string | null;
        if (typeof mediaRawId === 'object' && mediaRawId?._serialized) {
          mediaMessageId = mediaRawId._serialized;
        } else if (mediaKey.id && mediaKey.remoteJid) {
          const mjid = (mediaKey.remoteJid || '').replace('@s.whatsapp.net', '@c.us');
          mediaMessageId = `${mediaKey.fromMe !== false ? 'true' : 'false'}_${mjid}_${mediaKey.id}`;
        } else {
          mediaMessageId = (typeof mediaRawId === 'string' ? mediaRawId : mediaRawId?.id) || mediaKey.id || null;
        }
        console.log(`[waha-proxy] Built mediaMessageId: ${mediaMessageId}`);

        return new Response(
          JSON.stringify({ ok: true, message_id: mediaMessageId, data: mediaData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // ENVIAR CONTATO (vCard) VIA WAHA
      // =====================================================
      case "enviar_contato": {
        const { chat_id: contactChatId, vcard, contact_name } = body as {
          chat_id?: string;
          vcard?: string;
          contact_name?: string;
        };

        if (!contactChatId || !vcard || !contact_name) {
          return new Response(
            JSON.stringify({ error: "chat_id, vcard e contact_name são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Sending contact vCard to ${contactChatId}, session: ${sessionId}`);

        const contactResp = await fetch(`${baseUrl}/api/sendContactVcard`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            chatId: contactChatId,
            session: sessionId,
            contacts: [{ fullName: contact_name, vcard }],
          }),
        });

        const contactData = await contactResp.json().catch(() => ({}));
        console.log(`[waha-proxy] sendContactVcard response: ${contactResp.status}`, JSON.stringify(contactData).substring(0, 500));

        if (!contactResp.ok) {
          return new Response(
            JSON.stringify({ error: "Falha ao enviar contato", details: contactData }),
            { status: contactResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build serialized message_id for ACK matching
        const contactKey = contactData.key || {};
        const contactRawId = contactData.id;
        let contactMsgId: string | null;
        if (typeof contactRawId === 'object' && contactRawId?._serialized) {
          contactMsgId = contactRawId._serialized;
        } else if (contactKey.id && contactKey.remoteJid) {
          const cjid = (contactKey.remoteJid || '').replace('@s.whatsapp.net', '@c.us');
          contactMsgId = `${contactKey.fromMe !== false ? 'true' : 'false'}_${cjid}_${contactKey.id}`;
        } else {
          contactMsgId = (typeof contactRawId === 'string' ? contactRawId : contactRawId?.id) || contactKey.id || null;
        }
        console.log(`[waha-proxy] Built contactMsgId: ${contactMsgId}`);

        return new Response(
          JSON.stringify({ ok: true, message_id: contactMsgId, data: contactData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // ENVIAR ENQUETE (Poll) VIA WAHA
      // =====================================================
      case "enviar_enquete": {
        const { chat_id: pollChatId, poll_name, poll_options, poll_allow_multiple } = body as {
          chat_id?: string;
          poll_name?: string;
          poll_options?: string[];
          poll_allow_multiple?: boolean;
        };

        if (!pollChatId || !poll_name || !poll_options || poll_options.length < 2) {
          return new Response(
            JSON.stringify({ error: "chat_id, poll_name e poll_options (min 2) são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Sending poll to ${pollChatId}, session: ${sessionId}, options: ${poll_options.length}`);

        const pollResp = await fetch(`${baseUrl}/api/sendPoll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            chatId: pollChatId,
            session: sessionId,
            poll: {
              name: poll_name,
              options: poll_options,
              multipleAnswers: poll_allow_multiple || false,
            },
          }),
        });

        const pollData = await pollResp.json().catch(() => ({}));
        console.log(`[waha-proxy] sendPoll response: ${pollResp.status}`, JSON.stringify(pollData).substring(0, 500));

        if (!pollResp.ok) {
          return new Response(
            JSON.stringify({ error: "Falha ao enviar enquete", details: pollData }),
            { status: pollResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pollMsgId = pollData.id?._serialized || pollData.id?.id || pollData.id || pollData.key?.id || null;

        return new Response(
          JSON.stringify({ ok: true, message_id: pollMsgId, data: pollData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // CONSULTAR VOTOS DE ENQUETE VIA WAHA API
      // =====================================================
      case "consultar_votos_enquete": {
        const { message_id: pollMsgId, conversa_id: pollConversaId } = body as {
          message_id?: string;
          conversa_id?: string;
        };

        if (!pollMsgId) {
          return new Response(
            JSON.stringify({ error: "message_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Fetching poll votes for ${pollMsgId}, session: ${sessionId}`);

        // Try WAHA poll votes endpoint
        try {
          const pollVotesResp = await fetch(`${baseUrl}/api/${sessionId}/polls/${encodeURIComponent(pollMsgId)}/votes`, {
            method: "GET",
            headers: { "X-Api-Key": apiKey },
          });

          const pollVotesData = await pollVotesResp.json().catch(() => null);
          console.log(`[waha-proxy] Poll votes response: ${pollVotesResp.status}`, JSON.stringify(pollVotesData).substring(0, 500));

          if (pollVotesResp.ok && pollVotesData) {
            // Check if WAHA returned empty/encrypted votes (NOWEB engine limitation)
            const votes = pollVotesData.votes || pollVotesData || [];
            const hasActualVotes = Array.isArray(votes) && votes.length > 0 && votes.some((v: Record<string, unknown>) => {
              const voters = v.voters || v.chatIds || [];
              return (Array.isArray(voters) && voters.length > 0) || (v.count && (v.count as number) > 0);
            });

            if (!hasActualVotes) {
              // NOWEB engine limitation - votes are encrypted and can't be decrypted
              console.log(`[waha-proxy] Poll votes empty/encrypted - NOWEB engine limitation`);
              return new Response(
                JSON.stringify({ 
                  ok: false, 
                  engine_limitation: true,
                  error: "Votos de enquete não disponíveis com engine NOWEB. Verifique diretamente no WhatsApp." 
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            // Update poll_options in the database
            if (pollConversaId) {
              // Find the poll message in DB
              const { data: pollMsg } = await supabaseAdmin
                .from("mensagens")
                .select("id, poll_options")
                .eq("message_id", pollMsgId)
                .eq("organizacao_id", organizacaoId)
                .maybeSingle();

              // Also try ilike for short IDs
              let targetMsg = pollMsg;
              if (!targetMsg && pollMsgId.includes('_')) {
                const shortId = pollMsgId.split('_').pop();
                const { data: ilikeMsg } = await supabaseAdmin
                  .from("mensagens")
                  .select("id, poll_options")
                  .ilike("message_id", `%_${shortId}`)
                  .eq("organizacao_id", organizacaoId)
                  .maybeSingle();
                targetMsg = ilikeMsg;
              }

              if (targetMsg && targetMsg.poll_options) {
                // Parse WAHA response to update vote counts
                const currentOptions = targetMsg.poll_options as Array<{ text: string; votes: number }>;

                // Build vote count map from WAHA response
                const voteCounts: Record<string, number> = {};
                if (Array.isArray(votes)) {
                  for (const v of votes) {
                    const optName = v.optionName || v.name || v.option || '';
                    const voters = v.voters || v.chatIds || [];
                    voteCounts[optName] = Array.isArray(voters) ? voters.length : (v.count || 0);
                  }
                }

                const updatedOptions = currentOptions.map(opt => ({
                  ...opt,
                  votes: voteCounts[opt.text] ?? opt.votes,
                }));

                await supabaseAdmin
                  .from("mensagens")
                  .update({ poll_options: updatedOptions, atualizado_em: new Date().toISOString() })
                  .eq("id", targetMsg.id);

                console.log(`[waha-proxy] ✅ Poll votes updated in DB for ${targetMsg.id}`);

                return new Response(
                  JSON.stringify({ ok: true, poll_options: updatedOptions, raw: pollVotesData }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }

            return new Response(
              JSON.stringify({ ok: true, data: pollVotesData }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // If endpoint returned error, it's likely a NOWEB limitation
          return new Response(
            JSON.stringify({ 
              ok: false, 
              engine_limitation: true,
              error: "Votos de enquete não disponíveis com engine NOWEB. Verifique diretamente no WhatsApp.",
              status: pollVotesResp.status 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error(`[waha-proxy] Error fetching poll votes:`, e);
          return new Response(
            JSON.stringify({ 
              ok: false, 
              engine_limitation: true,
              error: "Votos de enquete não disponíveis. Verifique diretamente no WhatsApp." 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // =====================================================
      // APAGAR MENSAGEM INDIVIDUAL VIA WAHA
      // =====================================================
      case "apagar_mensagem": {
        const { chat_id: delMsgChatId, message_id: delMsgId } = body as {
          chat_id?: string;
          message_id?: string;
        };

        if (!delMsgChatId || !delMsgId) {
          return new Response(
            JSON.stringify({ error: "chat_id e message_id são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Deleting message ${delMsgId} from ${delMsgChatId}, session: ${sessionId}`);

        const delMsgResp = await fetch(`${baseUrl}/api/sendSeen`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
          body: JSON.stringify({ chatId: delMsgChatId, session: sessionId }),
        });
        await delMsgResp.text();

        // Delete message for everyone
        const deleteResp = await fetch(`${baseUrl}/api/${sessionId}/chats/${encodeURIComponent(delMsgChatId)}/messages/${encodeURIComponent(delMsgId)}`, {
          method: "DELETE",
          headers: { "X-Api-Key": apiKey },
        });

        const deleteData = await deleteResp.json().catch(() => ({}));
        console.log(`[waha-proxy] Delete message response: ${deleteResp.status}`, JSON.stringify(deleteData).substring(0, 300));

        return new Response(
          JSON.stringify({ ok: deleteResp.ok, data: deleteData }),
          { status: deleteResp.ok ? 200 : deleteResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // LIMPAR CONVERSA (APAGAR TODAS MENSAGENS) VIA WAHA
      // =====================================================
      case "limpar_conversa": {
        const { chat_id: clearChatId } = body as { chat_id?: string };

        if (!clearChatId) {
          return new Response(
            JSON.stringify({ error: "chat_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Clearing chat ${clearChatId}, session: ${sessionId}`);

        const clearResp = await fetch(`${baseUrl}/api/${sessionId}/chats/${encodeURIComponent(clearChatId)}/messages`, {
          method: "DELETE",
          headers: { "X-Api-Key": apiKey },
        });

        const clearData = await clearResp.json().catch(() => ({}));
        console.log(`[waha-proxy] Clear chat response: ${clearResp.status}`, JSON.stringify(clearData).substring(0, 300));

        return new Response(
          JSON.stringify({ ok: clearResp.ok, data: clearData }),
          { status: clearResp.ok ? 200 : clearResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // APAGAR CONVERSA VIA WAHA
      // =====================================================
      case "apagar_conversa": {
        const { chat_id: delConvChatId } = body as { chat_id?: string };

        if (!delConvChatId) {
          return new Response(
            JSON.stringify({ error: "chat_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Deleting chat ${delConvChatId}, session: ${sessionId}`);

        const delConvResp = await fetch(`${baseUrl}/api/${sessionId}/chats/${encodeURIComponent(delConvChatId)}`, {
          method: "DELETE",
          headers: { "X-Api-Key": apiKey },
        });

        const delConvData = await delConvResp.json().catch(() => ({}));
        console.log(`[waha-proxy] Delete chat response: ${delConvResp.status}`, JSON.stringify(delConvData).substring(0, 300));

        return new Response(
          JSON.stringify({ ok: delConvResp.ok, data: delConvData }),
          { status: delConvResp.ok ? 200 : delConvResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // ARQUIVAR CONVERSA VIA WAHA
      // =====================================================
      case "arquivar_conversa": {
        const { chat_id: archChatId } = body as { chat_id?: string };

        if (!archChatId) {
          return new Response(
            JSON.stringify({ error: "chat_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Archiving chat ${archChatId}, session: ${sessionId}`);

        const archResp = await fetch(`${baseUrl}/api/${sessionId}/chats/${encodeURIComponent(archChatId)}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        });

        const archData = await archResp.json().catch(() => ({}));
        console.log(`[waha-proxy] Archive chat response: ${archResp.status}`, JSON.stringify(archData).substring(0, 300));

        return new Response(
          JSON.stringify({ ok: archResp.ok, data: archData }),
          { status: archResp.ok ? 200 : archResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =====================================================
      // MARCAR COMO NÃO LIDA VIA WAHA
      // =====================================================
      case "marcar_nao_lida": {
        const { chat_id: unreadChatId } = body as { chat_id?: string };

        if (!unreadChatId) {
          return new Response(
            JSON.stringify({ error: "chat_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[waha-proxy] Marking chat ${unreadChatId} as unread, session: ${sessionId}`);

        const unreadResp = await fetch(`${baseUrl}/api/${sessionId}/chats/${encodeURIComponent(unreadChatId)}/unread`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        });

        const unreadData = await unreadResp.json().catch(() => ({}));
        console.log(`[waha-proxy] Unread chat response: ${unreadResp.status}`, JSON.stringify(unreadData).substring(0, 300));

        return new Response(
          JSON.stringify({ ok: unreadResp.ok, data: unreadData }),
          { status: unreadResp.ok ? 200 : unreadResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Action '${action}' não reconhecida` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Generic response handler for iniciar and desconectar
    const responseData = await wahaResponse.json().catch(() => ({}));
    console.log(`[waha-proxy] Response status: ${wahaResponse.status}`);

    return new Response(
      JSON.stringify(responseData),
      {
        status: wahaResponse.ok ? 200 : wahaResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[waha-proxy] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar requisição WAHA" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
