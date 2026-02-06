import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function pública para receber webhooks de entrada
 * Recebe leads de N8N, Zapier, Make.com e outras plataformas
 * Autenticação via API Key (header X-Api-Key ou Authorization: Bearer)
 * URL: /functions/v1/webhook-entrada/{url_token}
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Extrair url_token do path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const urlToken = pathParts[pathParts.length - 1];

    if (!urlToken || urlToken === "webhook-entrada") {
      console.warn("[webhook-entrada] Token ausente no path");
      return new Response(
        JSON.stringify({ error: "Token do webhook não encontrado na URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[webhook-entrada] Token recebido:", urlToken);

    // Buscar webhook pelo url_token
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks_entrada")
      .select("id, organizacao_id, api_key, secret_key, ativo")
      .eq("url_token", urlToken)
      .is("deletado_em", null)
      .single();

    if (webhookError || !webhook) {
      console.warn("[webhook-entrada] Webhook não encontrado:", webhookError?.message);
      return new Response(
        JSON.stringify({ error: "Webhook não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se está ativo
    if (!webhook.ativo) {
      console.warn("[webhook-entrada] Webhook desabilitado:", webhook.id);
      return new Response(
        JSON.stringify({ error: "Webhook está desabilitado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar API Key se configurada
    if (webhook.api_key) {
      const apiKeyHeader = req.headers.get("x-api-key") ||
        req.headers.get("authorization")?.replace("Bearer ", "");

      if (!apiKeyHeader || apiKeyHeader !== webhook.api_key) {
        console.warn("[webhook-entrada] API Key inválida");
        return new Response(
          JSON.stringify({ error: "API Key inválida ou ausente" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse do body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Body inválido. Envie um JSON válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[webhook-entrada] Dados recebidos:", JSON.stringify(body).substring(0, 500));

    // Mapear campos do lead
    const nome = (body.nome || body.name || body.first_name || "") as string;
    const sobrenome = (body.sobrenome || body.last_name || "") as string;
    const email = (body.email || body.e_mail || "") as string;
    const telefone = (body.telefone || body.phone || body.tel || body.whatsapp || "") as string;
    const empresa = (body.empresa || body.company || body.company_name || "") as string;
    const origem = (body.origem || body.source || body.utm_source || "webhook") as string;
    const observacoes = (body.observacoes || body.notes || body.message || body.mensagem || "") as string;

    // Criar contato
    const contatoData: Record<string, unknown> = {
      organizacao_id: webhook.organizacao_id,
      tipo: "pessoa",
      nome: nome || "Lead via Webhook",
      sobrenome: sobrenome || null,
      email: email || null,
      telefone: telefone || null,
      origem: origem,
      observacoes: observacoes || null,
      status: "ativo",
    };

    // Se tem dados de empresa, pode criar como empresa ou anotar
    if (empresa) {
      contatoData.observacoes = `${observacoes ? observacoes + '\n' : ''}Empresa: ${empresa}`;
    }

    const { data: contato, error: contatoError } = await supabase
      .from("contatos")
      .insert(contatoData)
      .select("id")
      .single();

    if (contatoError) {
      console.error("[webhook-entrada] Erro ao criar contato:", contatoError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao processar lead", details: contatoError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar contadores do webhook
    await supabase
      .from("webhooks_entrada")
      .update({
        total_requests: (webhook as any).total_requests ? (webhook as any).total_requests + 1 : 1,
        ultimo_request: new Date().toISOString(),
      })
      .eq("id", webhook.id);

    console.log("[webhook-entrada] Lead criado com sucesso:", contato.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead recebido com sucesso",
        contato_id: contato.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[webhook-entrada] Erro:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
