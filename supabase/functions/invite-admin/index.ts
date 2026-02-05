import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge function para enviar convite de admin
 * Usa service_role para criar usuário em auth.users e enviar email de convite
 * Atualiza usuarios.auth_id após criação bem-sucedida
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const { email, nome, sobrenome, usuario_id, organizacao_id } = body;

    console.log("Invite request received:", { email, nome, usuario_id, organizacao_id });

    // Validar campos obrigatórios
    if (!email || !usuario_id || !organizacao_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, usuario_id, organizacao_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter origin do request para redirect
    const origin = req.headers.get("origin") || "https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app";
    const redirectTo = `${origin}/auth/set-password`;

    console.log("Sending invite to:", email, "redirect:", redirectTo);

    // Criar usuário via invite
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nome: nome || "",
          sobrenome: sobrenome || "",
          role: "admin",
          tenant_id: organizacao_id,
        },
        redirectTo,
      }
    );

    if (authError) {
      console.error("Auth invite error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user?.id);

    // Atualizar registro em usuarios com auth_id
    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ 
        auth_id: authData.user?.id,
        status: "pendente"
      })
      .eq("id", usuario_id);

    if (updateError) {
      console.error("Error updating usuario:", updateError);
      // Não falha a operação, apenas loga
    }

    // Criar entrada em user_roles para o admin
    if (authData.user?.id) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "admin"
        });

      if (roleError) {
        console.error("Error creating user_role:", roleError);
        // Não falha a operação, apenas loga
      }
    }

    console.log("Invite completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        auth_id: authData.user?.id,
        message: "Convite enviado com sucesso"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
