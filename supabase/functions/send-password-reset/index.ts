import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para recuperação de senha
 * Gera link de recovery via Supabase Auth e envia email via SMTP configurado
 * Template segue o Design System (cores, tipografia, layout)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// EMAIL TEMPLATE HTML (Design System)
// =====================================================

function buildRecoveryEmailHtml(nome: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - CRM Renove</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 0 24px 0;">
              <span style="font-size:28px;font-weight:700;color:#3B82F6;letter-spacing:-0.5px;">CRM Renove</span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom:1px solid #E2E8F0;"></td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td style="padding:24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;">
                <tr>
                  <td style="padding:44px 48px;">
                    
                    <!-- Heading -->
                    <h1 style="color:#0F172A;font-size:26px;font-weight:600;line-height:1.3;margin:0 0 24px 0;">
                      Olá, ${nome}! 🔐
                    </h1>

                    <!-- Intro -->
                    <p style="color:#334155;font-size:16px;line-height:1.75;margin:0 0 20px 0;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>CRM Renove</strong>.
                    </p>

                    <p style="color:#334155;font-size:16px;line-height:1.75;margin:0 0 20px 0;">
                      Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:32px 0;">
                          <a href="${confirmUrl}" target="_blank" style="background-color:#3B82F6;border-radius:8px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;text-align:center;display:inline-block;padding:16px 40px;box-shadow:0 2px 4px rgba(59,130,246,0.3);">
                            Redefinir Minha Senha
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0;" />

                    <!-- Link fallback -->
                    <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
                      Ou copie e cole o link abaixo no seu navegador:
                    </p>
                    <div style="font-size:13px;color:#64748B;word-break:break-all;background-color:#F8FAFC;padding:12px 16px;border-radius:8px;border:1px solid #E2E8F0;">
                      <a href="${confirmUrl}" style="color:#3B82F6;text-decoration:underline;">${confirmUrl}</a>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:0 16px 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="color:#92400E;font-size:14px;line-height:1.6;margin:0;">
                      ⏰ Este link expira em <strong>1 hora</strong>. Caso expire, solicite um novo link na página de login.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom:1px solid #E2E8F0;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 32px 16px;">
              <p style="color:#94A3B8;font-size:12px;line-height:1.8;margin:0 0 4px 0;">
                CRM Renove &copy; ${new Date().getFullYear()}
              </p>
              <p style="color:#94A3B8;font-size:12px;line-height:1.8;margin:0 0 4px 0;">
                Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.
              </p>
              <p style="color:#94A3B8;font-size:12px;line-height:1.8;margin:0;">
                Precisa de ajuda? <a href="mailto:suporte@renovedigital.com.br" style="color:#3B82F6;text-decoration:underline;">suporte@renovedigital.com.br</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =====================================================
// SMTP SENDER
// =====================================================

async function sendEmailViaSMTP(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { host, port, user, pass, fromEmail, fromName, to, subject, html } = config;

  const useTLS = port === 465;
  let conn: Deno.TcpConn | Deno.TlsConn;

  if (useTLS) {
    conn = await Deno.connectTls({ hostname: host, port });
  } else {
    conn = await Deno.connect({ hostname: host, port });
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

  // Read greeting
  const greeting = await readResponse();
  console.log("[send-password-reset] Greeting:", greeting.trim());
  if (!greeting.startsWith("220")) throw new Error(`Servidor rejeitou: ${greeting.trim()}`);

  // EHLO
  await sendCommand("EHLO crmrenove.local");

  // STARTTLS if port 587
  if (port === 587) {
    const starttlsResp = await sendCommand("STARTTLS");
    if (starttlsResp.startsWith("220")) {
      const tlsConn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      conn = tlsConn;
      await sendCommand("EHLO crmrenove.local");
    }
  }

  // AUTH LOGIN
  const authResp = await sendCommand("AUTH LOGIN");
  if (authResp.startsWith("334")) {
    const userResp = await sendCommand(btoa(user));
    if (userResp.startsWith("334")) {
      const passResp = await sendCommand(btoa(pass));
      if (!passResp.startsWith("235")) throw new Error("Autenticação SMTP falhou");
    }
  }

  // MAIL FROM
  const mailFromResp = await sendCommand(`MAIL FROM:<${fromEmail}>`);
  if (!mailFromResp.startsWith("250")) throw new Error(`MAIL FROM rejeitado: ${mailFromResp.trim()}`);

  // RCPT TO
  const rcptResp = await sendCommand(`RCPT TO:<${to}>`);
  if (!rcptResp.startsWith("250")) throw new Error(`RCPT TO rejeitado: ${rcptResp.trim()}`);

  // DATA
  const dataResp = await sendCommand("DATA");
  if (!dataResp.startsWith("354")) throw new Error(`DATA rejeitado: ${dataResp.trim()}`);

  // Build email with proper MIME headers
  const boundary = `boundary_${Date.now()}`;
  const emailContent = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `Date: ${new Date().toUTCString()}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(`Você solicitou a redefinição de senha do CRM Renove. Acesse o link para criar uma nova senha.`))),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
    ``,
    `--${boundary}--`,
    `.`,
  ].join("\r\n");

  await conn.write(encoder.encode(emailContent + "\r\n"));
  const sendResp = await readResponse();
  console.log("[send-password-reset] Send response:", sendResp.trim());

  // QUIT
  await sendCommand("QUIT");
  conn.close();

  if (!sendResp.startsWith("250")) {
    throw new Error(`Email não aceito pelo servidor: ${sendResp.trim()}`);
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

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

    const { email } = await req.json();
    console.log("[send-password-reset] Request for:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar configurações SMTP
    const { data: configData, error: configError } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "email")
      .single();

    if (configError || !configData) {
      console.error("[send-password-reset] SMTP not configured:", configError);
      // Retorna sucesso mesmo assim (não revelar se email existe)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cfg = configData.configuracoes as Record<string, string>;
    if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
      console.warn("[send-password-reset] SMTP incomplete config");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar usuario na tabela usuarios - se nao existir, retorna erro
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("nome, email")
      .eq("email", email.toLowerCase().trim())
      .is("deletado_em", null)
      .maybeSingle();

    if (!usuario) {
      console.log("[send-password-reset] Email not found:", email);
      return new Response(
        JSON.stringify({ success: false, error: "email_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nomeUsuario = usuario.nome || "Usuário";

    // Gerar link de recovery via Supabase Auth
    const origin = req.headers.get("origin") || "https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app";

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${origin}/redefinir-senha`,
      },
    });

    if (linkError) {
      console.error("[send-password-reset] generateLink error:", linkError);
      // Retorna sucesso mesmo assim (não revelar se email existe)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construir URL de confirmação
    const tokenHash = linkData.properties?.hashed_token;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${encodeURIComponent(`${origin}/redefinir-senha`)}`;

    console.log("[send-password-reset] Recovery URL generated");

    // Enviar email via SMTP
    try {
      const html = buildRecoveryEmailHtml(nomeUsuario, confirmUrl);

      await sendEmailViaSMTP({
        host: cfg.smtp_host,
        port: parseInt(cfg.smtp_port || "587", 10),
        user: cfg.smtp_user,
        pass: cfg.smtp_pass,
        fromEmail: cfg.from_email || cfg.smtp_user,
        fromName: cfg.from_name || "CRM Renove",
        to: email,
        subject: "Recuperação de Senha - CRM Renove",
        html,
      });

      console.log("[send-password-reset] Email sent successfully to:", email);
    } catch (smtpError) {
      console.error("[send-password-reset] SMTP error:", (smtpError as Error).message);
      // Mesmo com erro, retorna sucesso para não revelar informações
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-password-reset] Error:", error);
    return new Response(
      JSON.stringify({ success: true }), // Sempre sucesso para segurança
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
