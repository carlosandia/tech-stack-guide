/**
 * AIDEV-NOTE: Edge Function callback do OAuth Meta Ads
 * Recebe code+state via POST (chamado pelo frontend) e troca pelo access_token
 * Salva na tabela conexoes_meta
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const { code, state, redirect_uri } = body as {
      code: string;
      state: string;
      redirect_uri: string;
    };

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: "Código ou state ausente" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Decodificar state
    let stateData: { organizacao_id: string; user_id: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        JSON.stringify({ error: "State inválido" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Buscar config global (app_id e app_secret)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "meta")
      .maybeSingle();

    if (!config) {
      return new Response(
        JSON.stringify({ error: "Configuração Meta não encontrada" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const configuracoes = config.configuracoes as Record<string, unknown>;
    const appId = (configuracoes.app_id as string) || "";
    const appSecret =
      (configuracoes.app_secret_encrypted as string) ||
      (configuracoes.app_secret as string) ||
      "";

    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ error: "App ID ou Secret não configurados" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Trocar code por access_token
    const tokenUrl =
      `https://graph.facebook.com/v24.0/oauth/access_token?` +
      `client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[meta-callback] Erro ao trocar code:", tokenData.error);
      return new Response(
        JSON.stringify({
          error: tokenData.error.message || "Erro ao obter token",
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // Buscar dados do usuario Meta
    let metaUser = { id: "", name: "", email: "" };
    let businessName = "";
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v24.0/me?fields=id,name,email&access_token=${accessToken}`
      );
      metaUser = await meRes.json();
    } catch (e) {
      console.warn("[meta-callback] Erro ao buscar dados do usuário Meta:", e);
    }

    // Buscar Business Portfolio (Portfólio Empresarial) vinculado
    try {
      const bizRes = await fetch(
        `https://graph.facebook.com/v24.0/me/businesses?fields=id,name&access_token=${accessToken}`
      );
      const bizData = await bizRes.json();
      if (bizData.data && bizData.data.length > 0) {
        businessName = bizData.data[0].name || "";
      }
    } catch (e) {
      console.warn("[meta-callback] Erro ao buscar Business Portfolio:", e);
    }

    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Upsert na tabela conexoes_meta
    const { error: upsertError } = await supabaseAdmin
      .from("conexoes_meta")
      .upsert(
        {
          organizacao_id: stateData.organizacao_id,
          access_token_encrypted: accessToken,
          meta_user_id: metaUser.id || null,
          meta_user_name: metaUser.name || null,
          meta_user_email: metaUser.email || null,
          meta_business_name: businessName || null,
          status: "conectado",
          token_expires_at: tokenExpiresAt,
          ultimo_erro: null,
          deletado_em: null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "organizacao_id" }
      );

    if (upsertError) {
      console.error("[meta-callback] Erro ao salvar conexão:", upsertError);
      return new Response(
        JSON.stringify({
          error: "Erro ao salvar conexão: " + upsertError.message,
        }),
        { status: 500, headers: jsonHeaders }
      );
    }

    console.log(
      `[meta-callback] Conexão Meta salva para org: ${stateData.organizacao_id}`
    );
    return new Response(
      JSON.stringify({ sucesso: true, mensagem: "Meta Ads conectado com sucesso!" }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[meta-callback] Erro interno:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
