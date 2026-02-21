import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para traduzir conteúdo de email via Lovable AI
 * Recebe email_id, traduz corpo_texto/corpo_html para PT-BR
 * Retorna o texto traduzido sem alterar o registro original
 */

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AUTH
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // AIDEV-NOTE: Usar getUser() em vez de getClaims() (Supabase JS v2)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id, organizacao_id")
      .eq("auth_id", authUserId)
      .single();

    if (!usuario) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email_id } = await req.json();
    if (!email_id) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "email_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch email
    const { data: email, error: emailErr } = await supabaseAdmin
      .from("emails_recebidos")
      .select("corpo_texto, corpo_html, assunto")
      .eq("id", email_id)
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("usuario_id", usuario.id)
      .single();

    if (emailErr || !email) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Email não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text content for translation (prefer plain text, fallback to stripping HTML)
    let contentToTranslate = email.corpo_texto || "";
    if (!contentToTranslate && email.corpo_html) {
      // Strip HTML tags for translation
      contentToTranslate = email.corpo_html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (!contentToTranslate || contentToTranslate.length < 5) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Email sem conteúdo para traduzir" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit content length
    const maxLen = 8000;
    if (contentToTranslate.length > maxLen) {
      contentToTranslate = contentToTranslate.substring(0, maxLen) + "...";
    }

    // Call Lovable AI for translation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Você é um tradutor profissional. Traduza o seguinte conteúdo de email para Português Brasileiro (PT-BR). Mantenha a formatação original (quebras de linha, listas, etc). Retorne APENAS a tradução, sem comentários adicionais. Se o texto já estiver em PT-BR, retorne-o sem alterações.",
          },
          {
            role: "user",
            content: `Assunto: ${email.assunto || "(sem assunto)"}\n\n${contentToTranslate}`,
          },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Créditos insuficientes para tradução." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("[translate-email] AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Erro no serviço de tradução" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const translated = aiData.choices?.[0]?.message?.content || "";

    if (!translated) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Tradução retornou vazia" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ sucesso: true, traducao: translated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[translate-email] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
