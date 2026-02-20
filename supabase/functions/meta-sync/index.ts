/**
 * AIDEV-NOTE: Edge Function para sincronização real com a Graph API do Meta
 * Valida token, re-busca páginas e atualiza paginas_meta + conexoes_meta
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticar usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Admin client para operações de escrita
    const supabase = createClient(supabaseUrl, serviceKey);

    // 2. Buscar organizacao_id do usuario
    const { data: usuario, error: userErr } = await supabase
      .from("usuarios")
      .select("organizacao_id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (userErr || !usuario?.organizacao_id) {
      return new Response(
        JSON.stringify({ error: "Organização não encontrada" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orgId = usuario.organizacao_id;

    // 3. Buscar conexão Meta ativa
    const { data: conexao, error: conErr } = await supabase
      .from("conexoes_meta")
      .select("id, access_token_encrypted, status")
      .eq("organizacao_id", orgId)
      .is("deletado_em", null)
      .maybeSingle();

    if (conErr || !conexao) {
      return new Response(
        JSON.stringify({ error: "Conexão Meta não encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = conexao.access_token_encrypted;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Token de acesso não configurado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Validar token com Graph API
    console.log("[meta-sync] Validando token com Graph API...");
    const meRes = await fetch(
      `${GRAPH_API}/me?fields=id,name,email&access_token=${accessToken}`
    );
    const meData = await meRes.json();

    if (meData.error) {
      console.error("[meta-sync] Token inválido:", meData.error.message);

      // Atualizar status para erro
      await supabase
        .from("conexoes_meta")
        .update({
          status: "erro",
          ultimo_erro: meData.error.message,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", conexao.id);

      return new Response(
        JSON.stringify({
          error: "token_invalido",
          message: meData.error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[meta-sync] Token válido para: ${meData.name}`);

    // 5. Buscar páginas vinculadas
    const pagesRes = await fetch(
      `${GRAPH_API}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      console.error("[meta-sync] Erro ao buscar páginas:", pagesData.error.message);
      return new Response(
        JSON.stringify({
          error: "graph_api_error",
          message: pagesData.error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pages = pagesData.data || [];
    console.log(`[meta-sync] ${pages.length} página(s) encontrada(s)`);

    // 6. Upsert páginas em paginas_meta
    let paginasAtualizadas = 0;
    for (const page of pages) {
      const { error: upsertErr } = await supabase
        .from("paginas_meta")
        .upsert(
          {
            conexao_id: conexao.id,
            organizacao_id: orgId,
            page_id: page.id,
            page_name: page.name,
            page_access_token_encrypted: page.access_token,
            ativo: true,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "organizacao_id,page_id" }
        );

      if (upsertErr) {
        console.error(
          `[meta-sync] Erro ao upsert página ${page.id}:`,
          upsertErr.message
        );
      } else {
        paginasAtualizadas++;

        // AIDEV-NOTE: Inscrever app nos eventos leadgen da página
        try {
          const subscribeRes = await fetch(
            `${GRAPH_API}/${page.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${page.access_token}`,
            { method: "POST" }
          );
          const subscribeData = await subscribeRes.json();

          if (subscribeData.success) {
            console.log(`[meta-sync] App inscrito em leadgen para página ${page.name}`);
            await supabase
              .from("paginas_meta")
              .update({ leads_retrieval: true, atualizado_em: new Date().toISOString() })
              .eq("organizacao_id", orgId)
              .eq("page_id", page.id);
          } else {
            console.warn(`[meta-sync] Falha ao inscrever app em leadgen para ${page.name}:`, JSON.stringify(subscribeData));
          }
        } catch (subErr) {
          console.error(`[meta-sync] Erro ao inscrever app para ${page.name}:`, subErr);
        }
      }
    }

    // 7. Atualizar conexão Meta
    await supabase
      .from("conexoes_meta")
      .update({
        status: "conectado",
        ultimo_sync: new Date().toISOString(),
        ultimo_erro: null,
        meta_user_name: meData.name,
        meta_user_email: meData.email || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", conexao.id);

    console.log(
      `[meta-sync] Sincronização concluída: ${paginasAtualizadas} página(s)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        paginas_atualizadas: paginasAtualizadas,
        usuario_meta: meData.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[meta-sync] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao sincronizar" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
