/**
 * AIDEV-NOTE: Edge Function para listar páginas e formulários Lead Ads do Meta
 * Conforme PRD-08 - Conexões com Plataformas Externas
 * 
 * GET ?action=pages → lista páginas do Facebook
 * GET ?action=forms&page_id=XXX → lista formulários Lead Ads de uma página
 */

import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Autenticar usuário
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação ausente" }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: jsonHeaders }
      );
    }

    // Buscar organizacao_id do usuário
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("organizacao_id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!usuario?.organizacao_id) {
      return new Response(
        JSON.stringify({ error: "Organização não encontrada" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Buscar token Meta da organização
    const { data: conexao } = await supabaseAdmin
      .from("conexoes_meta")
      .select("access_token_encrypted")
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("status", "conectado")
      .is("deletado_em", null)
      .maybeSingle();

    if (!conexao?.access_token_encrypted) {
      return new Response(
        JSON.stringify({ error: "Meta Ads não conectado" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const accessToken = conexao.access_token_encrypted;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "pages") {
      // Listar páginas do Facebook do usuário
      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${accessToken}`
      );
      const fbData = await fbRes.json();

      if (fbData.error) {
        console.error("[meta-pages] Erro Graph API (pages):", fbData.error);
        return new Response(
          JSON.stringify({ error: fbData.error.message }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const paginas = (fbData.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
      }));

      return new Response(
        JSON.stringify({ paginas }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (action === "forms") {
      const pageId = url.searchParams.get("page_id");
      if (!pageId) {
        return new Response(
          JSON.stringify({ error: "page_id é obrigatório" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Primeiro buscar o page access token
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${accessToken}`
      );
      const pageData = await pageRes.json();

      if (pageData.error) {
        console.error("[meta-pages] Erro Graph API (page token):", pageData.error);
        return new Response(
          JSON.stringify({ error: pageData.error.message }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const pageToken = pageData.access_token || accessToken;

      // Buscar formulários Lead Ads da página
      const formsRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time&limit=100&access_token=${pageToken}`
      );
      const formsData = await formsRes.json();

      if (formsData.error) {
        console.error("[meta-pages] Erro Graph API (forms):", formsData.error);
        return new Response(
          JSON.stringify({ error: formsData.error.message }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Para cada formulário, buscar os campos (questions)
      const formularios = await Promise.all(
        (formsData.data || []).map(async (f: any) => {
          let fields: Array<{ key: string; label: string; type: string }> = [];
          try {
            const fieldsRes = await fetch(
              `https://graph.facebook.com/v21.0/${f.id}?fields=questions&access_token=${pageToken}`
            );
            const fieldsData = await fieldsRes.json();
            fields = (fieldsData.questions || []).map((q: any) => ({
              key: q.key || q.id,
              label: q.label || q.key,
              type: q.type || "CUSTOM",
            }));
          } catch (e) {
            console.warn(`[meta-pages] Erro ao buscar campos do form ${f.id}:`, e);
          }

          return {
            id: f.id,
            name: f.name,
            status: f.status,
            leads_count: f.leads_count,
            created_time: f.created_time,
            fields,
          };
        })
      );

      return new Response(
        JSON.stringify({ formularios }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use action=pages ou action=forms&page_id=XXX" }),
      { status: 400, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[meta-pages] Erro interno:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
