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
    const { action, ad_account_id, audience_name, audience_id } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'action' é obrigatório" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (!["list", "create", "delete"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Action inválida. Use 'list', 'create' ou 'delete'" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (["list", "create"].includes(action) && !ad_account_id) {
      return new Response(
        JSON.stringify({ error: "ad_account_id é obrigatório para list/create" }),
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
    const accountId = ad_account_id.replace(/^act_/, "");

    // === ACTION: CREATE ===
    if (action === "create") {
      if (!audience_name) {
        return new Response(
          JSON.stringify({ error: "audience_name é obrigatório para criar um público" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Verificar permissões do token antes de criar
      const permUrl = `https://graph.facebook.com/v24.0/me/permissions?access_token=${encodeURIComponent(accessToken)}`;
      const permRes = await fetch(permUrl);
      const permData = await permRes.json();
      const perms = (permData.data || []) as Array<{ permission: string; status: string }>;
      const granted = perms.filter((p) => p.status === "granted").map((p) => p.permission);
      const adsManagement = perms.find((p) => p.permission === "ads_management");

      console.log(`[meta-audiences] Permissões do token: ${granted.join(", ")}`);

      if (!adsManagement || adsManagement.status !== "granted") {
        console.error(`[meta-audiences] Token NÃO tem ads_management. Concedidas: ${granted.join(", ")}`);
        return new Response(
          JSON.stringify({
            error: "Seu token Meta não possui a permissão 'ads_management'. Verifique se a permissão está habilitada no Meta Developer Portal (App > Permissões e Recursos) e reconecte a conta em Configurações > Conexões.",
            permissions_granted: granted,
          }),
          { status: 400, headers: jsonHeaders }
        );
      }

      console.log(`[meta-audiences] Criando audience "${audience_name}" na conta act_${accountId}, org ${organizacaoId}`);

      const createUrl = `https://graph.facebook.com/v24.0/act_${accountId}/customaudiences`;
      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: audience_name,
          subtype: "CUSTOM",
          customer_file_source: "USER_PROVIDED_ONLY",
          access_token: accessToken,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || createData.error) {
        const metaError = createData.error || {};
        console.error(`[meta-audiences] Erro ao criar:`, JSON.stringify(metaError));
        // AIDEV-NOTE: Priorizar error_user_msg (mensagem amigável do Meta) sobre message (técnica)
        const errorMsg = metaError.error_user_msg || metaError.message || "Erro ao criar público no Meta";
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 400, headers: jsonHeaders }
        );
      }

      console.log(`[meta-audiences] Audience criada com ID: ${createData.id}`);

      return new Response(
        JSON.stringify({ audience_id: createData.id, name: audience_name }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // === ACTION: DELETE ===
    if (action === "delete") {
      if (!audience_id) {
        return new Response(
          JSON.stringify({ error: "audience_id é obrigatório para deletar um público" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      console.log(`[meta-audiences] Deletando audience ${audience_id}, org ${organizacaoId}`);

      const deleteUrl = `https://graph.facebook.com/v24.0/${audience_id}?access_token=${encodeURIComponent(accessToken)}`;
      const deleteResponse = await fetch(deleteUrl, { method: "DELETE" });
      const deleteData = await deleteResponse.json();

      if (!deleteResponse.ok || deleteData.error) {
        const errorMsg = deleteData.error?.message || "Erro ao deletar público no Meta";
        const isPermError = errorMsg.toLowerCase().includes("permission");
        const hint = isPermError
          ? " Tente reconectar sua conta Meta em Configurações > Conexões para renovar as permissões."
          : "";
        console.error(`[meta-audiences] Erro ao deletar: ${errorMsg}`);
        return new Response(
          JSON.stringify({ error: errorMsg + hint }),
          { status: 400, headers: jsonHeaders }
        );
      }

      console.log(`[meta-audiences] Audience ${audience_id} deletada com sucesso`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // === ACTION: LIST ===
    const metaUrl = `https://graph.facebook.com/v24.0/act_${accountId}/customaudiences?fields=id,name,approximate_count_lower_bound,approximate_count_upper_bound&limit=100&access_token=${encodeURIComponent(accessToken)}`;

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
