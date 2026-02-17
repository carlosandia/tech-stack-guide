import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para testar conexão SMTP real
 * Suporta 2 modos:
 *   1. Global: lê credenciais de configuracoes_globais (plataforma='email')
 *   2. Direto: recebe email + senha no body para teste de conexão individual
 * REQUER AUTENTICAÇÃO: apenas admin e super_admin podem testar
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Auto-detecta configurações SMTP com base no domínio do email */
function detectSmtpConfig(email: string): { host: string; port: number } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  const providers: Record<string, { host: string; port: number }> = {
    "gmail.com": { host: "smtp.gmail.com", port: 587 },
    "googlemail.com": { host: "smtp.gmail.com", port: 587 },
    "outlook.com": { host: "smtp.office365.com", port: 587 },
    "hotmail.com": { host: "smtp.office365.com", port: 587 },
    "live.com": { host: "smtp.office365.com", port: 587 },
    "yahoo.com": { host: "smtp.mail.yahoo.com", port: 587 },
    "yahoo.com.br": { host: "smtp.mail.yahoo.com", port: 587 },
    "icloud.com": { host: "smtp.mail.me.com", port: 587 },
    "me.com": { host: "smtp.mail.me.com", port: 587 },
    "zoho.com": { host: "smtp.zoho.com", port: 587 },
    "uol.com.br": { host: "smtps.uol.com.br", port: 587 },
    "bol.com.br": { host: "smtps.bol.com.br", port: 587 },
    "terra.com.br": { host: "smtp.terra.com.br", port: 587 },
    "ig.com.br": { host: "smtp.ig.com.br", port: 587 },
  };

  if (providers[domain]) return providers[domain];

  // Domínios Google Workspace/custom → tenta smtp.gmail.com por padrão genérico
  // Caso não reconheça, tenta smtp.<domain>
  return { host: `smtp.${domain}`, port: 587 };
}

async function testSmtpConnection(smtpHost: string, smtpPort: number, smtpUser: string, smtpPass: string): Promise<{ sucesso: boolean; mensagem: string }> {
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
      return { sucesso: false, mensagem: "Servidor rejeitou conexão" };
    }

    // Extrair hostname real do greeting (ex: "220 smtp-sp221-144.uni5.net ESMTP")
    // O certificado TLS do servidor pode não corresponder ao hostname DNS usado,
    // então usamos o hostname que o servidor anuncia no greeting para TLS.
    const greetingParts = greeting.trim().split(/\s+/);
    const realHostname = greetingParts.length > 1 ? greetingParts[1] : smtpHost;
    console.log("[test-smtp] Hostname real do servidor:", realHostname);

    // EHLO
    const ehloResp = await sendCommand("EHLO crmrenove.local");
    console.log("[test-smtp] EHLO response:", ehloResp.substring(0, 200));

    // STARTTLS if port 587
    if (smtpPort === 587) {
      const starttlsResp = await sendCommand("STARTTLS");
      console.log("[test-smtp] STARTTLS response:", starttlsResp.trim());
      if (starttlsResp.startsWith("220")) {
        // Usa o hostname real do servidor para validação TLS
        const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: realHostname });
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
          return { sucesso: false, mensagem: "Autenticação SMTP falhou. Verifique o usuário e a senha." };
        }
      }
    }

    await sendCommand("QUIT");
    conn.close();

    console.log("[test-smtp] Connection test successful!");
    return { sucesso: true, mensagem: `Conexão SMTP testada com sucesso! Servidor ${smtpHost}:${smtpPort} autenticado.` };
  } catch (smtpError) {
    const errorMsg = (smtpError as Error).message;
    console.error("[test-smtp] SMTP connection error:", errorMsg);
    return { sucesso: false, mensagem: "Erro na conexão SMTP. Verifique as configurações e tente novamente." };
  }
}

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
    const body = await req.json();
    const { plataforma, email, senha, modo } = body;

    // Modo "salvar": testa + salva na tabela conexoes_email
    if (modo === "salvar" && email && senha) {
      console.log("[test-smtp] Modo salvar — email:", email);

      const smtpConfig = detectSmtpConfig(email);
      if (!smtpConfig) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Não foi possível detectar o servidor SMTP para este email." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Testar conexão primeiro
      const testResult = await testSmtpConnection(smtpConfig.host, smtpConfig.port, email, senha);
      if (!testResult.sucesso) {
        return new Response(
          JSON.stringify(testResult),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar usuario_id e organizacao_id
      const { data: usuario, error: usuarioError } = await supabaseAdmin
        .from("usuarios")
        .select("id, organizacao_id")
        .eq("auth_id", requestingUserId)
        .single();

      if (usuarioError || !usuario) {
        console.error("[test-smtp] Usuário não encontrado para salvar:", usuarioError?.message);
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se já existe conexão para este usuario nesta org (incluindo soft-deleted)
      const { data: existente } = await supabaseAdmin
        .from("conexoes_email")
        .select("id")
        .eq("organizacao_id", usuario.organizacao_id)
        .eq("usuario_id", usuario.id)
        .maybeSingle();

      const conexaoData = {
        email,
        tipo: "smtp" as const,
        status: "ativo",
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
        smtp_user: email,
        smtp_pass_encrypted: senha, // TODO: encrypt properly
        smtp_tls: true,
        smtp_auto_detected: true,
        conectado_em: new Date().toISOString(),
        organizacao_id: usuario.organizacao_id,
        usuario_id: usuario.id,
        ultimo_erro: null,
        deletado_em: null,
      };

      let dbError;
      if (existente) {
        // Atualizar existente
        const { error } = await supabaseAdmin
          .from("conexoes_email")
          .update(conexaoData)
          .eq("id", existente.id);
        dbError = error;
      } else {
        // Criar nova
        const { error } = await supabaseAdmin
          .from("conexoes_email")
          .insert(conexaoData);
        dbError = error;
      }

      if (dbError) {
        console.error("[test-smtp] Erro ao salvar conexão:", dbError);
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Erro ao salvar conexão no banco de dados." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[test-smtp] Conexão email salva com sucesso!");
      return new Response(
        JSON.stringify({ sucesso: true, mensagem: "Conexão de email salva com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Modo "direto": recebe email + senha no body (para teste de conexão individual)
    if (modo === "direto" && email && senha) {
      console.log("[test-smtp] Modo direto — testando email:", email);

      const smtpConfig = detectSmtpConfig(email);
      if (!smtpConfig) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Não foi possível detectar o servidor SMTP para este email." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[test-smtp] SMTP detectado:", smtpConfig.host, ":", smtpConfig.port);

      const result = await testSmtpConnection(smtpConfig.host, smtpConfig.port, email, senha);

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Modo "global": lê credenciais de configuracoes_globais
    console.log("[test-smtp] Modo global — plataforma:", plataforma);

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

    const result = await testSmtpConnection(smtpHost, smtpPort, smtpUser, smtpPass);

    // Atualizar status na tabela
    await supabaseAdmin
      .from("configuracoes_globais")
      .update({
        configurado: result.sucesso,
        ultimo_teste: new Date().toISOString(),
        ultimo_erro: result.sucesso ? null : result.mensagem,
      })
      .eq("plataforma", "email");

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[test-smtp] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno ao processar a requisição" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
