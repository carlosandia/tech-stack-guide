import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { email, nome, sobrenome, usuario_id, organizacao_id } = await req.json();

    console.log("Invite request:", { email, usuario_id, organizacao_id });

    if (!email || !usuario_id || !organizacao_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, usuario_id, organizacao_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app";

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { nome, sobrenome, role: "admin", tenant_id: organizacao_id },
        redirectTo: `${origin}/auth/set-password`,
      }
    );

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created:", authData.user?.id);

    await supabaseAdmin.from("usuarios").update({ auth_id: authData.user?.id, status: "pendente" }).eq("id", usuario_id);

    if (authData.user?.id) {
      await supabaseAdmin.from("user_roles").insert({ user_id: authData.user.id, role: "admin" });
    }

    return new Response(
      JSON.stringify({ success: true, auth_id: authData.user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
