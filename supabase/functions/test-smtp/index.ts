import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para testar conexão SMTP real
 * Testa a conexão com o servidor SMTP usando as configurações salvas
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
    const fromEmail = cfg.from_email || smtpUser;
    const fromName = cfg.from_name || "CRM Renove";

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
        conn = await Deno.connectTls({
          hostname: smtpHost,
          port: smtpPort,
        });
      } else {
        conn = await Deno.connect({
          hostname: smtpHost,
          port: smtpPort,
        });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Helper to read response
      const readResponse = async (): Promise<string> => {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);
        if (n === null) throw new Error("Conexão fechada pelo servidor");
        return decoder.decode(buf.subarray(0, n));
      };

      // Helper to send command
      const sendCommand = async (cmd: string): Promise<string> => {
        await conn.write(encoder.encode(cmd + "\r\n"));
        return await readResponse();
      };

      // Read server greeting
      const greeting = await readResponse();
      console.log("[test-smtp] Greeting:", greeting.trim());
      if (!greeting.startsWith("220")) {
        conn.close();
        throw new Error(`Servidor rejeitou conexão: ${greeting.trim()}`);
      }

      // EHLO
      const ehloResp = await sendCommand(`EHLO crmrenove.local`);
      console.log("[test-smtp] EHLO response:", ehloResp.substring(0, 200));

      // STARTTLS if port 587
      if (smtpPort === 587) {
        const starttlsResp = await sendCommand("STARTTLS");
        console.log("[test-smtp] STARTTLS response:", starttlsResp.trim());
        if (starttlsResp.startsWith("220")) {
          // Upgrade to TLS
          const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
          conn = tlsConn;

          // Re-EHLO after STARTTLS
          const ehlo2 = await sendCommand("EHLO crmrenove.local");
          console.log("[test-smtp] EHLO2 response:", ehlo2.substring(0, 200));
        }
      }

      // AUTH LOGIN
      const authResp = await sendCommand("AUTH LOGIN");
      console.log("[test-smtp] AUTH response:", authResp.trim());

      if (authResp.startsWith("334")) {
        // Send username (base64)
        const userResp = await sendCommand(btoa(smtpUser));
        console.log("[test-smtp] User response:", userResp.trim());

        if (userResp.startsWith("334")) {
          // Send password (base64)
          const passResp = await sendCommand(btoa(smtpPass));
          console.log("[test-smtp] Pass response:", passResp.trim());

          if (!passResp.startsWith("235")) {
            conn.close();

            // Update DB with error
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

      // Send QUIT
      await sendCommand("QUIT");
      conn.close();

      console.log("[test-smtp] Connection test successful!");

      // Update DB with success
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

      // Update DB with error
      await supabaseAdmin
        .from("configuracoes_globais")
        .update({
          ultimo_teste: new Date().toISOString(),
          ultimo_erro: errorMsg,
          configurado: false,
        })
        .eq("plataforma", "email");

      return new Response(
        JSON.stringify({ sucesso: false, mensagem: `Erro na conexão SMTP: ${errorMsg}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[test-smtp] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
