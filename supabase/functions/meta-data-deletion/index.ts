/**
 * AIDEV-NOTE: Edge Function para callback de exclusao de dados do Meta
 * Recebe POST com signed_request para solicitacao de exclusao de dados
 * Retorna JSON com confirmation_code e url de status (obrigatorio pelo Meta)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlDecode(input: string): Uint8Array {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return new Uint8Array(signature);
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("[meta-data-deletion] signed_request ausente");
      return new Response(JSON.stringify({ error: "signed_request ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [encodedSig, payload] = signedRequest.split(".");
    if (!encodedSig || !payload) {
      return new Response(JSON.stringify({ error: "signed_request mal formatado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payloadData = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    const metaUserId = payloadData.user_id;

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
      console.error("[meta-data-deletion] Config Meta nao encontrada");
      return new Response(JSON.stringify({ error: "Config nao encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const configuracoes = config.configuracoes as Record<string, unknown>;
    const appSecret =
      (configuracoes.app_secret_encrypted as string) ||
      (configuracoes.app_secret as string) ||
      "";

    // Verificar assinatura HMAC-SHA256
    const expectedSig = await hmacSha256(appSecret, payload);
    const actualSig = base64UrlDecode(encodedSig);

    if (!arraysEqual(expectedSig, actualSig)) {
      console.error("[meta-data-deletion] Assinatura invalida");
      return new Response(JSON.stringify({ error: "Assinatura invalida" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[meta-data-deletion] Solicitacao de exclusao para meta_user_id: ${metaUserId}`);

    // Gerar confirmation_code unico
    const confirmationCode = crypto.randomUUID().replace(/-/g, "").substring(0, 16);

    // Remover dados do usuario (soft delete + limpar tokens)
    if (metaUserId) {
      const { error: updateError } = await supabaseAdmin
        .from("conexoes_meta")
        .update({
          status: "desconectado",
          access_token_encrypted: "",
          refresh_token_encrypted: null,
          meta_user_name: null,
          meta_user_email: null,
          deletado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        })
        .eq("meta_user_id", metaUserId);

      if (updateError) {
        console.error("[meta-data-deletion] Erro ao excluir dados:", updateError);
      } else {
        console.log(`[meta-data-deletion] Dados excluidos para meta_user_id: ${metaUserId}`);
      }
    }

    // Registrar no audit_log
    await supabaseAdmin.from("audit_log").insert({
      acao: "meta_data_deletion",
      entidade: "conexoes_meta",
      detalhes: {
        meta_user_id: metaUserId,
        confirmation_code: confirmationCode,
      },
    });

    // Retorno obrigatorio pelo Meta
    const statusUrl = `https://crm.renovedigital.com.br/app/configuracoes/conexoes?deletion_status=${confirmationCode}`;

    return new Response(
      JSON.stringify({
        url: statusUrl,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[meta-data-deletion] Erro interno:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
