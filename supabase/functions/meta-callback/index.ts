/**
 * AIDEV-NOTE: Edge Function callback do OAuth Meta Ads
 * Recebe o code do Facebook, troca pelo access_token e salva em conexoes_meta
 * Redireciona o usuario de volta para a pagina de conexoes
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    // URL do frontend para redirect final
    const frontendUrl = "https://crm.renovedigital.com.br/app/configuracoes/conexoes";

    if (errorParam) {
      const errorDesc = url.searchParams.get("error_description") || errorParam;
      console.error("[meta-callback] Erro do Facebook:", errorDesc);
      return Response.redirect(`${frontendUrl}?error=${encodeURIComponent(errorDesc)}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${frontendUrl}?error=${encodeURIComponent("Código ou state ausente")}`, 302);
    }

    // Decodificar state
    let stateData: { organizacao_id: string; user_id: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return Response.redirect(`${frontendUrl}?error=${encodeURIComponent("State inválido")}`, 302);
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
      return Response.redirect(`${frontendUrl}?error=${encodeURIComponent("Configuração Meta não encontrada")}`, 302);
    }

    const configuracoes = config.configuracoes as Record<string, unknown>;
    const appId = (configuracoes.app_id as string) || "";
    const appSecret = (configuracoes.app_secret_encrypted as string) || (configuracoes.app_secret as string) || "";

    if (!appId || !appSecret) {
      return Response.redirect(`${frontendUrl}?error=${encodeURIComponent("App ID ou Secret não configurados")}`, 302);
    }

    // Trocar code por access_token
    const callbackUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-callback`;
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(callbackUri)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[meta-callback] Erro ao trocar code:", tokenData.error);
      return Response.redirect(
        `${frontendUrl}?error=${encodeURIComponent(tokenData.error.message || "Erro ao obter token")}`,
        302
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // segundos

    // Buscar dados do usuario Meta
    let metaUser = { id: "", name: "", email: "" };
    try {
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`);
      metaUser = await meRes.json();
    } catch (e) {
      console.warn("[meta-callback] Não foi possível obter dados do usuário Meta:", e);
    }

    // Calcular expiracao do token
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
          status: "conectado",
          token_expires_at: tokenExpiresAt,
          ultimo_erro: null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "organizacao_id" }
      );

    if (upsertError) {
      console.error("[meta-callback] Erro ao salvar conexão:", upsertError);
      return Response.redirect(
        `${frontendUrl}?error=${encodeURIComponent("Erro ao salvar conexão: " + upsertError.message)}`,
        302
      );
    }

    console.log(`[meta-callback] Conexão Meta salva para org: ${stateData.organizacao_id}`);
    return Response.redirect(`${frontendUrl}?success=meta_ads`, 302);

  } catch (error) {
    console.error("[meta-callback] Erro interno:", error);
    return Response.redirect(
      `https://crm.renovedigital.com.br/app/configuracoes/conexoes?error=${encodeURIComponent((error as Error).message)}`,
      302
    );
  }
});
