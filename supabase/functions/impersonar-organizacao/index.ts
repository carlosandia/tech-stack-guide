/**
 * AIDEV-NOTE: Edge Function para Impersonação de Organização
 * Conforme PRD-14 - Permite Super Admin acessar CRM como admin do tenant
 * 
 * POST com action=iniciar: Gera magic link para admin do tenant
 * POST com action=encerrar: Encerra sessão de impersonação
 */

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validar auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente com token do usuário para verificar identidade
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerAuthId = claimsData.claims.sub;
    const callerRole = claimsData.claims.user_metadata?.role;

    // Validar que é super_admin
    if (callerRole !== "super_admin") {
      return new Response(JSON.stringify({ error: "Acesso restrito a Super Admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente service_role para operações admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // ========== INICIAR IMPERSONAÇÃO ==========
    if (action === "iniciar") {
      const { organizacao_id, motivo } = body;

      if (!organizacao_id || !motivo || motivo.trim().length < 5) {
        return new Response(
          JSON.stringify({ error: "organizacao_id e motivo (min 5 chars) são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar super_admin na tabela usuarios
      const { data: superAdmin } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("auth_id", callerAuthId)
        .single();

      if (!superAdmin) {
        return new Response(JSON.stringify({ error: "Super Admin não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Buscar admin ativo da organização alvo
      const { data: adminAlvo, error: adminError } = await supabaseAdmin
        .from("usuarios")
        .select("id, email, nome, auth_id")
        .eq("organizacao_id", organizacao_id)
        .eq("role", "admin")
        .eq("status", "ativo")
        .is("deletado_em", null)
        .limit(1)
        .single();

      if (adminError || !adminAlvo) {
        return new Response(
          JSON.stringify({ error: "Nenhum admin ativo encontrado para esta organização" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar nome da org
      const { data: orgData } = await supabaseAdmin
        .from("organizacoes_saas")
        .select("nome")
        .eq("id", organizacao_id)
        .single();

      // Gerar magic link via Admin API
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: adminAlvo.email,
        options: {
          redirectTo: `https://crm.renovedigital.com.br/dashboard?impersonation=true&org_nome=${encodeURIComponent(orgData?.nome || "")}`,
        },
      });

      if (linkError || !linkData) {
        console.error("[impersonar] Erro ao gerar magic link:", linkError);
        return new Response(
          JSON.stringify({ error: "Erro ao gerar link de acesso" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash simples do token para auditoria (não armazenar token raw)
      const tokenHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(linkData.properties?.hashed_token || ""))
        .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));

      // Registrar sessão de impersonação
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

      await supabaseAdmin.from("sessoes_impersonacao").insert({
        super_admin_id: superAdmin.id,
        organizacao_id,
        admin_alvo_id: adminAlvo.id,
        motivo: motivo.trim(),
        token_hash: tokenHash,
        ativo: true,
        expira_em: expiraEm,
        ip_origem: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
        user_agent: req.headers.get("user-agent") || null,
      });

      // Registrar no audit_log
      await supabaseAdmin.from("audit_log").insert({
        organizacao_id,
        usuario_id: superAdmin.id,
        acao: "impersonacao_iniciada",
        entidade: "organizacoes_saas",
        entidade_id: organizacao_id,
        detalhes: {
          motivo: motivo.trim(),
          admin_alvo_id: adminAlvo.id,
          admin_alvo_email: adminAlvo.email,
          expira_em: expiraEm,
        },
        ip: req.headers.get("x-forwarded-for") || null,
        user_agent: req.headers.get("user-agent") || null,
      });

      // Construir URL do magic link
      // O generateLink retorna properties.action_link com a URL completa
      const magicLinkUrl = linkData.properties?.action_link;

      if (!magicLinkUrl) {
        return new Response(
          JSON.stringify({ error: "Magic link não gerado corretamente" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[impersonar] Super Admin ${superAdmin.id} impersonando org ${organizacao_id} (admin: ${adminAlvo.email})`);

      return new Response(
        JSON.stringify({
          success: true,
          magic_link_url: magicLinkUrl,
          organizacao_nome: orgData?.nome || "",
          admin_email: adminAlvo.email,
          expira_em: expiraEm,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ENCERRAR IMPERSONAÇÃO ==========
    if (action === "encerrar") {
      const { sessao_id } = body;

      if (!sessao_id) {
        return new Response(
          JSON.stringify({ error: "sessao_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("sessoes_impersonacao")
        .update({ ativo: false, encerrado_em: new Date().toISOString() })
        .eq("id", sessao_id)
        .eq("ativo", true);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Erro ao encerrar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Audit log
      const { data: superAdmin } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("auth_id", callerAuthId)
        .single();

      if (superAdmin) {
        await supabaseAdmin.from("audit_log").insert({
          usuario_id: superAdmin.id,
          acao: "impersonacao_encerrada",
          entidade: "sessoes_impersonacao",
          entidade_id: sessao_id,
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "action deve ser 'iniciar' ou 'encerrar'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[impersonar] Erro:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
