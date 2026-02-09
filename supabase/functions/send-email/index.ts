import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para envio de email via SMTP
 * Busca credenciais do usuario na tabela conexoes_email
 * Envia email real usando comandos SMTP diretos
 * SALVA cópia do email enviado na tabela emails_recebidos (pasta=sent)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extrai hostname real do greeting SMTP para validação TLS */
function extractHostnameFromGreeting(greeting: string, fallback: string): string {
  const parts = greeting.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : fallback;
}

/** Envia email via SMTP com AUTH LOGIN + STARTTLS */
async function sendSmtpEmail(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  bodyType: string;
}): Promise<{ sucesso: boolean; mensagem: string; messageId?: string }> {
  try {
    const useTLS = config.port === 465;
    let conn: Deno.TcpConn | Deno.TlsConn;

    if (useTLS) {
      conn = await Deno.connectTls({ hostname: config.host, port: config.port });
    } else {
      conn = await Deno.connect({ hostname: config.host, port: config.port });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (n === null) throw new Error("Conexão fechada pelo servidor");
      return decoder.decode(buf.subarray(0, n));
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    // Greeting
    const greeting = await readResponse();
    if (!greeting.startsWith("220")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor SMTP rejeitou conexão" };
    }

    const realHostname = extractHostnameFromGreeting(greeting, config.host);

    // EHLO
    await sendCommand("EHLO crmrenove.local");

    // STARTTLS if port 587
    if (config.port === 587) {
      const starttlsResp = await sendCommand("STARTTLS");
      if (starttlsResp.startsWith("220")) {
        const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: realHostname });
        conn = tlsConn;
        await sendCommand("EHLO crmrenove.local");
      }
    }

    // AUTH LOGIN
    const authResp = await sendCommand("AUTH LOGIN");
    if (!authResp.startsWith("334")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor não suporta AUTH LOGIN" };
    }

    const userResp = await sendCommand(btoa(config.user));
    if (!userResp.startsWith("334")) {
      conn.close();
      return { sucesso: false, mensagem: "Falha na autenticação (usuário)" };
    }

    const passResp = await sendCommand(btoa(config.pass));
    if (!passResp.startsWith("235")) {
      conn.close();
      return { sucesso: false, mensagem: "Falha na autenticação SMTP. Verifique suas credenciais." };
    }

    // MAIL FROM
    const fromAddr = config.from;
    const mailFromResp = await sendCommand(`MAIL FROM:<${fromAddr}>`);
    if (!mailFromResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor rejeitou remetente" };
    }

    // RCPT TO - destinatário principal
    const rcptResp = await sendCommand(`RCPT TO:<${config.to}>`);
    if (!rcptResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor rejeitou destinatário" };
    }

    // RCPT TO - CC
    if (config.cc) {
      const ccAddrs = config.cc.split(",").map((e) => e.trim()).filter(Boolean);
      for (const addr of ccAddrs) {
        await sendCommand(`RCPT TO:<${addr}>`);
      }
    }

    // RCPT TO - BCC
    if (config.bcc) {
      const bccAddrs = config.bcc.split(",").map((e) => e.trim()).filter(Boolean);
      for (const addr of bccAddrs) {
        await sendCommand(`RCPT TO:<${addr}>`);
      }
    }

    // DATA
    const dataResp = await sendCommand("DATA");
    if (!dataResp.startsWith("354")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor não aceitou início de dados" };
    }

    // Compose message
    const messageId = `${crypto.randomUUID()}@crmrenove.local`;
    const fromDisplay = config.fromName ? `"${config.fromName}" <${fromAddr}>` : fromAddr;
    const contentType = config.bodyType === "html"
      ? "text/html; charset=UTF-8"
      : "text/plain; charset=UTF-8";

    const headers = [
      `From: ${fromDisplay}`,
      `To: ${config.to}`,
    ];

    if (config.cc) {
      headers.push(`Cc: ${config.cc}`);
    }

    headers.push(
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(config.subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: ${contentType}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
    );

    const message = [...headers, ``, config.body, `.`].join("\r\n");

    const msgResp = await sendCommand(message);
    if (!msgResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor não aceitou a mensagem" };
    }

    await sendCommand("QUIT");
    conn.close();

    return { sucesso: true, mensagem: "Email enviado com sucesso!", messageId };
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[send-email] SMTP error:", msg);
    return { sucesso: false, mensagem: `Erro SMTP: ${msg}` };
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

    // Autenticação
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = claimsData.claims.sub;

    // Buscar usuario
    const { data: usuario, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, organizacao_id, nome")
      .eq("auth_id", authUserId)
      .single();

    if (userError || !usuario) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conexão email ativa do usuário
    const { data: conexao, error: conexaoError } = await supabaseAdmin
      .from("conexoes_email")
      .select("*")
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo")
      .is("deletado_em", null)
      .maybeSingle();

    if (conexaoError || !conexao) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Nenhuma conexão de email ativa encontrada. Configure em Configurações → Conexões." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!conexao.smtp_host || !conexao.smtp_user || !conexao.smtp_pass_encrypted) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Configuração SMTP incompleta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const { to, cc, bcc, subject, body: emailBody, body_type } = body;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Destinatário e assunto são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-email] Enviando para:", to, "via", conexao.smtp_host);

    // Enviar
    const result = await sendSmtpEmail({
      host: conexao.smtp_host,
      port: conexao.smtp_port || 587,
      user: conexao.smtp_user,
      pass: conexao.smtp_pass_encrypted,
      from: conexao.email,
      fromName: conexao.nome_remetente || usuario.nome,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      body: emailBody || "",
      bodyType: body_type || "html",
    });

    // Atualizar contadores na conexão
    if (result.sucesso) {
      await supabaseAdmin
        .from("conexoes_email")
        .update({
          total_emails_enviados: (conexao.total_emails_enviados || 0) + 1,
          ultimo_envio: new Date().toISOString(),
          ultimo_erro: null,
        })
        .eq("id", conexao.id);

      // =====================================================
      // SALVAR CÓPIA DO EMAIL ENVIADO na tabela emails_recebidos
      // =====================================================
      const now = new Date().toISOString();
      const preview = (emailBody || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 200)
        .trim();

      const { error: saveError } = await supabaseAdmin
        .from("emails_recebidos")
        .insert({
          organizacao_id: usuario.organizacao_id,
          usuario_id: usuario.id,
          conexao_email_id: conexao.id,
          message_id: result.messageId || `${crypto.randomUUID()}@crmrenove.local`,
          de_email: conexao.email,
          de_nome: conexao.nome_remetente || usuario.nome,
          para_email: to,
          cc_email: cc || null,
          bcc_email: bcc || null,
          assunto: subject,
          corpo_html: emailBody || null,
          corpo_texto: preview || null,
          preview: preview || null,
          pasta: "sent",
          lido: true,
          favorito: false,
          tem_anexos: false,
          data_email: now,
          sincronizado_em: now,
        });

      if (saveError) {
        console.error("[send-email] Erro ao salvar cópia do email enviado:", saveError);
        // Não falha o request — o email já foi enviado
      } else {
        console.log("[send-email] Cópia salva na pasta 'sent'");
      }
    } else {
      await supabaseAdmin
        .from("conexoes_email")
        .update({
          ultimo_erro: result.mensagem,
        })
        .eq("id", conexao.id);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno ao enviar email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
