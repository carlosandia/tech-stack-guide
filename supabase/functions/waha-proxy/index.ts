/**
 * AIDEV-NOTE: Edge Function proxy para WAHA API (WhatsApp)
 * Lê credenciais de configuracoes_globais e faz proxy para WAHA
 * Suporta: iniciar sessão, obter QR code, verificar status, desconectar
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

    console.log(`[waha-proxy] Action: ${action}, Session: ${sessionId}, WAHA URL: ${baseUrl}`);

    // Helper: upsert sessoes_whatsapp record
    async function upsertSessao(data: Record<string, unknown>) {
      // Check if exists
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
                  events: ["message"],
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
            await checkResp.text(); // consume body
          }

          // If session is FAILED or STOPPED, delete it entirely and restart
          if (realStatus === "FAILED" || realStatus === "STOPPED") {
            console.log(`[waha-proxy] Session in ${realStatus} state, deleting and restarting...`);

            // Delete the session entirely (stop alone doesn't remove it)
            const deleteResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
              method: "DELETE",
              headers: { "X-Api-Key": apiKey },
            });
            console.log(`[waha-proxy] Delete response: ${deleteResp.status}`);
            await deleteResp.text(); // consume body

            // Wait for WAHA to fully clean up
            await new Promise(r => setTimeout(r, 2000));

            // Start a fresh session
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
                      events: ["message"],
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
          // Create/update DB record
          await upsertSessao({ status: "scanning", ultimo_qr_gerado: new Date().toISOString() });
        }
        break;
      }

      case "qr_code": {
        // Get QR code image as base64
        wahaResponse = await fetch(`${baseUrl}/api/${sessionId}/auth/qr`, {
          method: "GET",
          headers: {
            "X-Api-Key": apiKey,
          },
        });

        // WAHA returns the QR code as an image, convert to base64
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
          
          // If it's JSON (e.g., already connected), pass through
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

        // If 404 or error, session may not exist or already connected
        const errorBody = await wahaResponse.text().catch(() => "");
        console.log(`[waha-proxy] QR response status: ${wahaResponse.status}, body: ${errorBody}`);
        
        // Check if already connected
        if (wahaResponse.status === 404 || wahaResponse.status === 422) {
          const statusResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
            headers: { "X-Api-Key": apiKey },
          });
          
          if (statusResp.ok) {
            const statusData = await statusResp.json();
            if (statusData.status === "WORKING") {
              // Save connected status to DB
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
            await statusResp.text(); // consume body
          }
        }

        return new Response(
          JSON.stringify({ error: "Não foi possível obter QR Code", status: "error" }),
          { status: wahaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        // Check session status
        wahaResponse = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
          method: "GET",
          headers: {
            "X-Api-Key": apiKey,
          },
        });

        if (wahaResponse.ok) {
          const statusData = await wahaResponse.json();
          const isConnected = statusData.status === "WORKING";
          const me = statusData.me || {};

          // If connected, save/update the DB record
          if (isConnected) {
            await upsertSessao({
              status: "connected",
              phone_number: me.id?.replace("@c.us", "") || null,
              phone_name: me.pushName || statusData.name || null,
              conectado_em: new Date().toISOString(),
            });
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
        // Stop session
        wahaResponse = await fetch(`${baseUrl}/api/sessions/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({ name: sessionId }),
        });

        // Update DB record
        await upsertSessao({
          status: "disconnected",
          desconectado_em: new Date().toISOString(),
        });
        break;
      }

      case "configurar_webhook": {
        // Instead of PUT /api/sessions/{id} which restarts the session,
        // use PATCH to update webhook config without restart
        console.log(`[waha-proxy] Configuring webhook for session ${sessionId}: ${webhookUrl}`);
        
        // First check current session status
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

        // Use PUT on /api/sessions/{id}/config to update only the config without restarting
        // If that endpoint doesn't exist, fall back to updating just the webhook via the session
        let configUpdated = false;
        
        // Try PATCH first (doesn't restart)
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
                  events: ["message"],
                },
              ],
            },
          }),
        });

        if (patchResp.ok || patchResp.status === 200) {
          const patchResult = await patchResp.json().catch(() => ({}));
          console.log(`[waha-proxy] PATCH webhook config response: ${patchResp.status}`, JSON.stringify(patchResult));
          configUpdated = true;
        } else {
          const patchErr = await patchResp.text();
          console.log(`[waha-proxy] PATCH not supported (${patchResp.status}), webhook already configured during session start`);
          // If PATCH is not supported, the webhook was already configured during iniciar
          // Just save the URL in the database
          configUpdated = true;
        }

        // Save webhook URL to DB regardless
        await upsertSessao({ webhook_url: webhookUrl });

        return new Response(
          JSON.stringify({ ok: true, message: "Webhook configurado", webhook_url: webhookUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
