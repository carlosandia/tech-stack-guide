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

  try {
    // Autenticar usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é super_admin
    const role = claimsData.claims.user_metadata?.role;
    if (role !== "super_admin") {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Acesso restrito a Super Admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar configuracoes do Meta usando service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "meta")
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Configuração Meta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const configuracoes = config.configuracoes as Record<string, unknown>;
    const appId = configuracoes.app_id as string;
    const appSecret = configuracoes.app_secret_encrypted as string;

    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "App ID ou App Secret não configurados" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chamada real à API do Meta para gerar App Access Token
    const metaUrl = `https://graph.facebook.com/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=client_credentials`;

    const metaResponse = await fetch(metaUrl);
    const metaData = await metaResponse.json();

    if (metaResponse.ok && metaData.access_token) {
      // Atualizar status do teste no banco
      await supabaseAdmin
        .from("configuracoes_globais")
        .update({
          ultimo_teste: new Date().toISOString(),
          ultimo_erro: null,
        })
        .eq("plataforma", "meta");

      return new Response(
        JSON.stringify({
          sucesso: true,
          mensagem: "Conexão com Meta validada com sucesso. App Access Token gerado.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorMsg = metaData.error?.message || "Credenciais inválidas";

      await supabaseAdmin
        .from("configuracoes_globais")
        .update({
          ultimo_teste: new Date().toISOString(),
          ultimo_erro: errorMsg,
        })
        .eq("plataforma", "meta");

      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem: `Falha na validação: ${errorMsg}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro no test-meta:", error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        mensagem: `Erro interno: ${(error as Error).message}`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
