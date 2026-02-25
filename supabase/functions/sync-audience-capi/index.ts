/**
 * AIDEV-NOTE: Edge Function - Sincronizar contatos do CRM com Custom Audiences do Meta
 * Conforme PRD-08 Seção 4 - Adiciona contatos hashados ao público personalizado via Meta Graph API
 *
 * Endpoint: POST /sync-audience-capi
 * Body: { audience_id, ad_account_id, organizacao_id, contatos: [{ email, telefone, nome }] }
 *
 * Também aceita chamada interna do processar-eventos-automacao com contato singular:
 * Body: { audience_id, ad_account_id, organizacao_id, contato: { email, telefone, nome } }
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { audience_id, ad_account_id, organizacao_id, contato, contatos } = body;

    if (!audience_id || !organizacao_id) {
      return new Response(
        JSON.stringify({ error: "audience_id e organizacao_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalizar: aceita contato singular ou array de contatos
    const listaContatos: Array<{ email?: string; telefone?: string; nome?: string }> =
      contatos || (contato ? [contato] : []);

    if (listaContatos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum contato fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Buscar access_token da conexão Meta
    const { data: conexao, error: connErr } = await supabase
      .from("conexoes_meta")
      .select("access_token_encrypted")
      .eq("organizacao_id", organizacao_id)
      .in("status", ["ativo", "conectado"])
      .is("deletado_em", null)
      .limit(1)
      .maybeSingle();

    if (connErr || !conexao?.access_token_encrypted) {
      console.error("[sync-audience-capi] Conexão Meta não encontrada:", connErr?.message);
      return new Response(
        JSON.stringify({ error: "Conexão Meta não encontrada ou inativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = conexao.access_token_encrypted;

    // Preparar dados hashados conforme exigência do Meta
    const hashedData: string[][] = [];
    const schema = ["EMAIL", "PHONE", "FN"];

    for (const c of listaContatos) {
      const emailHash = c.email ? await sha256(c.email) : "";
      const phoneHash = c.telefone ? await sha256(c.telefone.replace(/\D/g, "")) : "";
      const nameHash = c.nome ? await sha256(c.nome.split(" ")[0]) : "";

      // Só adiciona se tem pelo menos um dado
      if (emailHash || phoneHash || nameHash) {
        hashedData.push([emailHash, phoneHash, nameHash]);
      }
    }

    if (hashedData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum contato com dados válidos para sincronizar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chamar Meta Graph API para adicionar usuários ao Custom Audience
    const metaPayload = {
      payload: {
        schema,
        data: hashedData,
      },
    };

    const metaUrl = `https://graph.facebook.com/v24.0/${audience_id}/users`;
    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...metaPayload,
        access_token: accessToken,
      }),
    });

    const metaResult = await metaRes.json();

    if (!metaRes.ok) {
      console.error("[sync-audience-capi] Erro Meta API:", JSON.stringify(metaResult));
      return new Response(
        JSON.stringify({ error: metaResult.error?.message || "Erro ao sincronizar com Meta" }),
        { status: metaRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AIDEV-NOTE: Consolidado em um único update - busca contagem real do Meta primeiro
    const accountId = ad_account_id?.replace("act_", "") || "";
    let totalUsuarios: number | undefined;

    if (accountId) {
      try {
        const countUrl = `https://graph.facebook.com/v24.0/${audience_id}?fields=approximate_count_lower_bound&access_token=${encodeURIComponent(accessToken)}`;
        const countRes = await fetch(countUrl);
        if (countRes.ok) {
          const countData = await countRes.json();
          totalUsuarios = countData.approximate_count_lower_bound || 0;
        }
      } catch (e) {
        console.warn("[sync-audience-capi] Erro ao buscar contagem:", e);
      }
    }

    const updateData: Record<string, unknown> = { ultimo_sync: new Date().toISOString() };
    if (totalUsuarios !== undefined) updateData.total_usuarios = totalUsuarios;

    await supabase
      .from("custom_audiences_meta")
      .update(updateData)
      .eq("audience_id", audience_id)
      .eq("organizacao_id", organizacao_id);

    console.log(`[sync-audience-capi] ${hashedData.length} contato(s) sincronizado(s) com audience ${audience_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        num_received: metaResult.num_received || hashedData.length,
        audience_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync-audience-capi] Erro:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
