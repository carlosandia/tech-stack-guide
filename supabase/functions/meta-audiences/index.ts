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

    const body = await req.json();
    const { action, ad_account_id } = body;

    if (action !== "list" || !ad_account_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos. Envie { action: 'list', ad_account_id: 'act_xxx' }" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Buscar organizacao_id do usuario
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("organizacao_id")
      .eq("auth_id", user.id)
      .single();

    if (usuarioError || !usuario?.organizacao_id) {
      return new Response(
        JSON.stringify({ error: "Usuário sem organização vinculada" }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const organizacaoId = usuario.organizacao_id;

    // Buscar access_token da conexao Meta do tenant
    const { data: conexao, error: conexaoError } = await supabaseAdmin
      .from("conexoes_meta")
      .select("access_token_encrypted")
      .eq("organizacao_id", organizacaoId)
      .in("status", ["ativo", "conectado"])
      .is("deletado_em", null)
      .maybeSingle();

    if (conexaoError || !conexao?.access_token_encrypted) {
      return new Response(
        JSON.stringify({ error: "Conexão Meta não encontrada ou inativa. Conecte sua conta Meta primeiro." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const accessToken = conexao.access_token_encrypted;

    // Normalizar ad_account_id (remover prefixo act_ se presente para a URL)
    const accountId = ad_account_id.replace(/^act_/, "");

    // Chamar Graph API do Meta
    const metaUrl = `https://graph.facebook.com/v21.0/act_${accountId}/customaudiences?fields=id,name,approximate_count_lower_bound,approximate_count_upper_bound&limit=100&access_token=${encodeURIComponent(accessToken)}`;

    console.log(`[meta-audiences] Buscando audiences para conta act_${accountId}, org ${organizacaoId}`);

    const metaResponse = await fetch(metaUrl);
    const metaData = await metaResponse.json();

    if (!metaResponse.ok || metaData.error) {
      const errorMsg = metaData.error?.message || "Erro ao buscar públicos do Meta";
      console.error(`[meta-audiences] Erro Meta API: ${errorMsg}`);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const audiences = (metaData.data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      approximate_count: a.approximate_count_lower_bound || 0,
    }));

    console.log(`[meta-audiences] Retornando ${audiences.length} audiences`);

    return new Response(
      JSON.stringify({ audiences }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[meta-audiences] Erro:", error);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${(error as Error).message}` }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
