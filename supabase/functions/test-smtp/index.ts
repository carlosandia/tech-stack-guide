import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para testar conexão SMTP real
 * Testa a conexão com o servidor SMTP usando as configurações salvas
 * REQUER AUTENTICAÇÃO: apenas admin e super_admin podem testar
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // =====================================================
    // VALIDAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // =====================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[test-smtp] Requisição sem token de autenticação");
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.warn("[test-smtp] Token inválido:", claimsError?.message);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUserId = claimsData.claims.sub;
    console.log("[test-smtp] Usuário autenticado:", requestingUserId);

    // Verificar se o usuário é admin ou super_admin
    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("role, organizacao_id")
      .eq("auth_id", requestingUserId)
      .single();

    if (userError || !requestingUser) {
      console.warn("[test-smtp] Usuário não encontrado:", userError?.message);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (requestingUser.role !== "admin" && requestingUser.role !== "super_admin") {
      console.warn("[test-smtp] Usuário sem permissão:", requestingUser.role);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Acesso negado: permissão de administrador necessária" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // LÓGICA DE TESTE SMTP
    // =====================================================
    const { plataforma } = await req.json();
    console.log("[test-smtp] Testing platform:", plataforma);

    if (plataforma !== "email") {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Teste disponível apenas para a plataforma Email (SMTP)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar configurações salvas
    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "email")
      .single();

    if (configError || !config) {
      console.error("[test-smtp] Config not found:", configError);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Configurações de email não encontradas. Salve as configurações primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cfg = config.configuracoes as Record<string, string>;
    const smtpHost = cfg.smtp_host;
    const smtpPort = parseInt(cfg.smtp_port || "587", 10);
    const smtpUser = cfg.smtp_user;
    const smtpPass = cfg.smtp_pass;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Campos obrigatórios não preenchidos: SMTP Host, Usuário e Senha são necessários." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[test-smtp] Connecting to", smtpHost, ":", smtpPort);

    // Testar conexão SMTP real usando Deno TCP
    try {
      const useTLS = smtpPort === 465;
      let conn: Deno.TcpConn | Deno.TlsConn;

      if (useTLS) {
        conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });
      } else {
        conn = await Deno.connect({ hostname: smtpHost, port: smtpPort });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const readResponse = async (): Promise<string> => {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);
        if (n === null) throw new Error("Conexão fechada pelo servidor");
        return decoder.decode(buf.subarray(0, n));
      };

      const sendCommand = async (cmd: string): Promise<string> => {
        await conn.write(encoder.encode(cmd + "\r\n"));
        return await readResponse();
      };

      // Read server greeting
      const greeting = await readResponse();
      console.log("[test-smtp] Greeting:", greeting.trim());
      if (!greeting.startsWith("220")) {
        conn.close();
        throw new Error("Servidor rejeitou conexão");
      }

      // EHLO
      const ehloResp = await sendCommand("EHLO crmrenove.local");
      console.log("[test-smtp] EHLO response:", ehloResp.substring(0, 200));

      // STARTTLS if port 587
      if (smtpPort === 587) {
        const starttlsResp = await sendCommand("STARTTLS");
        console.log("[test-smtp] STARTTLS response:", starttlsResp.trim());
        if (starttlsResp.startsWith("220")) {
          const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
          conn = tlsConn;
          const ehlo2 = await sendCommand("EHLO crmrenove.local");
          console.log("[test-smtp] EHLO2 response:", ehlo2.substring(0, 200));
        }
      }

      // AUTH LOGIN
      const authResp = await sendCommand("AUTH LOGIN");
      console.log("[test-smtp] AUTH response:", authResp.trim());

      if (authResp.startsWith("334")) {
        const userResp = await sendCommand(btoa(smtpUser));
        console.log("[test-smtp] User response:", userResp.trim());

        if (userResp.startsWith("334")) {
          const passResp = await sendCommand(btoa(smtpPass));
          console.log("[test-smtp] Pass response:", passResp.trim());

          if (!passResp.startsWith("235")) {
            conn.close();
            await supabaseAdmin
              .from("configuracoes_globais")
              .update({
                ultimo_teste: new Date().toISOString(),
                ultimo_erro: "Autenticação falhou: usuário ou senha incorretos",
                configurado: false,
              })
              .eq("plataforma", "email");

            return new Response(
              JSON.stringify({ sucesso: false, mensagem: "Autenticação SMTP falhou. Verifique o usuário e a senha." }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      await sendCommand("QUIT");
      conn.close();

      console.log("[test-smtp] Connection test successful!");

      await supabaseAdmin
        .from("configuracoes_globais")
        .update({
          configurado: true,
          ultimo_teste: new Date().toISOString(),
          ultimo_erro: null,
        })
        .eq("plataforma", "email");

      return new Response(
        JSON.stringify({ sucesso: true, mensagem: `Conexão SMTP testada com sucesso! Servidor ${smtpHost}:${smtpPort} autenticado.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpError) {
      const errorMsg = (smtpError as Error).message;
      console.error("[test-smtp] SMTP connection error:", errorMsg);

      await supabaseAdmin
        .from("configuracoes_globais")
        .update({
          ultimo_teste: new Date().toISOString(),
          ultimo_erro: errorMsg,
          configurado: false,
        })
        .eq("plataforma", "email");

      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Erro na conexão SMTP. Verifique as configurações e tente novamente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[test-smtp] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno ao processar a requisição" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
