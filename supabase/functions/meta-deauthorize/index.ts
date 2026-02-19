/**
 * AIDEV-NOTE: Edge Function para callback de desautorizacao do Meta
 * Recebe POST com signed_request quando usuario remove o app
 * Marca conexao como desconectada na tabela conexoes_meta
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
    // Meta envia como application/x-www-form-urlencoded
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("[meta-deauthorize] signed_request ausente");
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

    // Decodificar payload
    const payloadData = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    const metaUserId = payloadData.user_id;

    // Buscar app_secret da configuracao global
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
      console.error("[meta-deauthorize] Config Meta nao encontrada");
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
      console.error("[meta-deauthorize] Assinatura invalida");
      return new Response(JSON.stringify({ error: "Assinatura invalida" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[meta-deauthorize] Desautorizacao recebida para meta_user_id: ${metaUserId}`);

    // Marcar conexao como desconectada
    if (metaUserId) {
      const { error: updateError } = await supabaseAdmin
        .from("conexoes_meta")
        .update({
          status: "desconectado",
          atualizado_em: new Date().toISOString(),
        })
        .eq("meta_user_id", metaUserId);

      if (updateError) {
        console.error("[meta-deauthorize] Erro ao atualizar conexao:", updateError);
      } else {
        console.log(`[meta-deauthorize] Conexao desconectada para meta_user_id: ${metaUserId}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[meta-deauthorize] Erro interno:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
