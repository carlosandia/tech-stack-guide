/**
 * AIDEV-NOTE: Edge Function para gerar OAuth URL do Meta Ads
 * Lê app_id de configuracoes_globais e gera a URL de autorização
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
    // Autenticar usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: jsonHeaders }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { action, redirect_uri } = body as { action?: string; redirect_uri?: string };

    if (action !== "auth-url") {
      return new Response(
        JSON.stringify({ error: "Ação inválida. Use action: 'auth-url'" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Buscar config global do Meta usando service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "meta")
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Configuração Meta não encontrada. Super Admin deve configurar primeiro." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const configuracoes = config.configuracoes as Record<string, unknown>;
    const appId = (configuracoes.app_id as string) || "";

    if (!appId) {
      return new Response(
        JSON.stringify({ error: "App ID do Meta não configurado. Super Admin deve configurar primeiro." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Buscar organizacao_id do usuario na tabela usuarios
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("organizacao_id")
      .eq("auth_id", user.id)
      .maybeSingle();

    const organizacaoId = usuario?.organizacao_id || "";
    if (!organizacaoId) {
      return new Response(
        JSON.stringify({ error: "Usuário não vinculado a nenhuma organização" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const state = btoa(JSON.stringify({
      organizacao_id: organizacaoId,
      user_id: user.id,
      timestamp: Date.now(),
    }));

    // Permissões necessárias para Lead Ads, CAPI e Audiences
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "leads_retrieval",
      "pages_manage_ads",
      "ads_management",
      "ads_read",
      "business_management",
    ].join(",");

    // AIDEV-NOTE: Sempre usa a edge function meta-callback como redirect_uri
    const finalRedirectUri = (redirect_uri && redirect_uri.length > 0)
      ? redirect_uri
      : `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-callback`;

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code`;

    console.log(`[meta-auth] URL gerada para org: ${organizacaoId}`);

    return new Response(
      JSON.stringify({ url: authUrl, state }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[meta-auth] Erro:", error);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(error as Error).message}` }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
