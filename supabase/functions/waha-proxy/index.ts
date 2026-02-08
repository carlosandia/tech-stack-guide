/**
 * AIDEV-NOTE: Edge Function proxy para WAHA API (WhatsApp)
 * Lê credenciais de configuracoes_globais e faz proxy para WAHA
 * Suporta: iniciar sessão, obter QR code, verificar status, desconectar
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const userId = claims.claims.sub as string;
    console.log(`[waha-proxy] User: ${userId}`);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { action, session_name } = body as { action?: string; session_name?: string };

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Campo 'action' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WAHA config from configuracoes_globais using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
    const sessionId = session_name || `crm_${userId.substring(0, 8)}`;

    console.log(`[waha-proxy] Action: ${action}, Session: ${sessionId}, WAHA URL: ${baseUrl}`);

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
              webhooks: [],
            },
          }),
        });
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
          // Try checking status instead
          const statusResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
            headers: { "X-Api-Key": apiKey },
          });
          
          if (statusResp.ok) {
            const statusData = await statusResp.json();
            if (statusData.status === "WORKING") {
              return new Response(
                JSON.stringify({ qr_code: null, status: "connected" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
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
          
          return new Response(
            JSON.stringify({
              status: isConnected ? "connected" : "disconnected",
              raw_status: statusData.status,
              name: statusData.name,
              me: statusData.me || null,
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
        break;
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
