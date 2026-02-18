import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para envio de email via SMTP
 * Suporta dois modos:
 *   1. Gmail OAuth → smtp.gmail.com + XOAUTH2 (access token)
 *   2. SMTP Manual → servidor configurado + AUTH LOGIN
 * SALVA cópia do email enviado na tabela emails_recebidos (pasta=sent)
 * Suporta: anexos via Storage, tracking pixel
 * 
 * AIDEV-NOTE: Usa writeAll() para garantir envio completo de mensagens grandes.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// =====================================================
// Crypto helpers (compatível com google-auth)
// =====================================================

function simpleDecrypt(encrypted: string, _key: string): string {
  if (encrypted.startsWith("ef:")) {
    return decodeURIComponent(escape(atob(encrypted.substring(3))));
  }
  return encrypted;
}

function simpleEncrypt(text: string, _key: string): string {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  return `ef:${encoded}`;
}

// =====================================================
// Google OAuth helpers
// =====================================================

async function getGoogleConfig(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseAdmin
    .from("configuracoes_globais")
    .select("configuracoes, configurado")
    .eq("plataforma", "google")
    .single();

  if (error || !data || !data.configurado) {
    throw new Error("Google não configurado. Peça ao Super Admin para configurar.");
  }

  const config = data.configuracoes as Record<string, string>;
  if (!config.client_id || !config.client_secret) {
    throw new Error("Credenciais Google incompletas.");
  }

  return { clientId: config.client_id, clientSecret: config.client_secret };
}

/**
 * AIDEV-NOTE: Obtém access token válido para Gmail.
 * Se expirado, faz refresh e atualiza ambas as tabelas (conexoes_email + conexoes_google).
 */
async function getGmailAccessToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  conexao: Record<string, unknown>
): Promise<string> {
  let accessToken = simpleDecrypt(conexao.access_token_encrypted as string, "");

  const expiresAt = conexao.token_expires_at as string | null;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  if (isExpired && conexao.refresh_token_encrypted) {
    console.log("[send-email] Gmail token expirado, renovando...");
    const googleConfig = await getGoogleConfig(supabaseAdmin);
    const refreshToken = simpleDecrypt(conexao.refresh_token_encrypted as string, "");

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await tokenResponse.json();
    if (tokens.access_token) {
      accessToken = tokens.access_token;
      const newExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
      const encryptedToken = simpleEncrypt(tokens.access_token, "");

      // Atualizar token em conexoes_email
      await supabaseAdmin
        .from("conexoes_email")
        .update({
          access_token_encrypted: encryptedToken,
          token_expires_at: newExpiry,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", conexao.id as string);

      // Atualizar token em conexoes_google (mantém sincronizado)
      await supabaseAdmin
        .from("conexoes_google")
        .update({
          access_token_encrypted: encryptedToken,
          token_expires_at: newExpiry,
          atualizado_em: new Date().toISOString(),
        })
        .eq("usuario_id", conexao.usuario_id as string)
        .is("deletado_em", null);

      console.log("[send-email] Gmail token renovado com sucesso");
    } else {
      console.error("[send-email] Falha ao renovar token Gmail:", tokens);
      throw new Error("Token Gmail expirado e não foi possível renovar. Reconecte sua conta Google.");
    }
  }

  return accessToken;
}

// =====================================================
// SMTP helpers
// =====================================================

/** Extrai hostname real do greeting SMTP para validação TLS */
function extractHostnameFromGreeting(greeting: string, fallback: string): string {
  const parts = greeting.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : fallback;
}

/** Converte Uint8Array para base64 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Divide string em linhas de 76 caracteres (MIME standard) */
function splitBase64Lines(base64: string): string {
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 76) {
    lines.push(base64.substring(i, i + 76));
  }
  return lines.join("\r\n");
}

/**
 * AIDEV-NOTE: writeAll garante que TODOS os bytes sejam enviados.
 */
async function writeAll(conn: Deno.TcpConn | Deno.TlsConn, data: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < data.length) {
    const n = await conn.write(data.subarray(offset));
    if (n === null || n === 0) throw new Error("Falha ao escrever no socket SMTP");
    offset += n;
  }
}

interface AnexoInfo {
  filename: string;
  storage_path: string;
  mimeType: string;
  size: number;
}

/** Envia email via SMTP com AUTH LOGIN ou XOAUTH2 + STARTTLS */
async function sendSmtpEmail(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  authMethod?: 'login' | 'xoauth2';
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  bodyType: string;
  rawMessage?: string;
}): Promise<{ sucesso: boolean; mensagem: string; messageId?: string }> {
  // AIDEV-NOTE: Flag para saber se o servidor aceitou o DATA (250 OK)
  let dataResponseOk = false;

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

    const readResponse = async (timeoutMs = 15000): Promise<string> => {
      let fullResponse = "";
      while (true) {
        const buf = new Uint8Array(4096);
        const readPromise = conn.read(buf);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const n = await Promise.race([readPromise, timeoutPromise]);
        if (n === null) throw new Error("Timeout lendo resposta SMTP");
        if (n === 0) throw new Error("Conexão fechada pelo servidor");
        fullResponse += decoder.decode(buf.subarray(0, n as number));
        const lines = fullResponse.split("\r\n").filter(l => l.length > 0);
        if (lines.length === 0) continue;
        const lastLine = lines[lines.length - 1];
        if (/^\d{3}[\s]/.test(lastLine) || /^\d{3}$/.test(lastLine)) {
          break;
        }
      }
      return fullResponse;
    };

    const sendCommand = async (cmd: string, timeoutMs = 15000): Promise<string> => {
      const safeLog = cmd.startsWith(btoa("")) ? "[REDACTED]" : cmd;
      console.log(`[SMTP] >>> ${safeLog.substring(0, 100)}`);
      await writeAll(conn, encoder.encode(cmd + "\r\n"));
      const resp = await readResponse(timeoutMs);
      console.log(`[SMTP] <<< ${resp.substring(0, 200).replace(/\r\n/g, " | ")}`);
      return resp;
    };

    // Greeting
    const greeting = await readResponse();
    console.log(`[SMTP] Greeting: ${greeting.substring(0, 200).replace(/\r\n/g, " | ")}`);
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
        console.log("[SMTP] TLS upgraded successfully");
        await sendCommand("EHLO crmrenove.local");
      }
    }

    // AIDEV-NOTE: Autenticação SMTP - suporta AUTH LOGIN (SMTP manual) e XOAUTH2 (Gmail OAuth)
    if (config.authMethod === 'xoauth2') {
      // Gmail XOAUTH2: https://developers.google.com/gmail/imap/xoauth2-protocol
      const xoauth2Token = btoa(`user=${config.user}\x01auth=Bearer ${config.pass}\x01\x01`);
      const authResp = await sendCommand(`AUTH XOAUTH2 ${xoauth2Token}`);
      if (!authResp.startsWith("235")) {
        conn.close();
        return { sucesso: false, mensagem: `Falha na autenticação Gmail XOAUTH2: ${authResp.substring(0, 100)}` };
      }
    } else {
      // AUTH LOGIN padrão
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
        return { sucesso: false, mensagem: `Falha na autenticação SMTP: ${passResp.substring(0, 100)}` };
      }
    }

    // MAIL FROM
    const mailFromResp = await sendCommand(`MAIL FROM:<${config.from}>`);
    if (!mailFromResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: `Servidor rejeitou remetente: ${mailFromResp.substring(0, 100)}` };
    }

    // RCPT TO - destinatário principal
    const rcptResp = await sendCommand(`RCPT TO:<${config.to}>`);
    if (!rcptResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: `Servidor rejeitou destinatário: ${rcptResp.substring(0, 200)}` };
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

    // DATA command
    const dataResp = await sendCommand("DATA");
    if (!dataResp.startsWith("354")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor não aceitou início de dados" };
    }

    // AIDEV-NOTE: Envio separado do body — NÃO usa sendCommand.
    // Escreve diretamente com writeAll para garantir envio completo.
    const message = config.rawMessage || buildSimpleMessage(config);
    const messageBytes = encoder.encode(message + "\r\n");
    console.log(`[SMTP] Enviando corpo da mensagem: ${messageBytes.length} bytes`);

    await writeAll(conn, messageBytes);

    // Ler resposta do servidor após o body (250 OK)
    const dataTimeout = config.rawMessage ? 120000 : 30000;
    const msgResp = await readResponse(dataTimeout);
    console.log(`[SMTP] <<< DATA resp: ${msgResp.substring(0, 200).replace(/\r\n/g, " | ")}`);

    if (!msgResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: `Servidor não aceitou a mensagem: ${msgResp.substring(0, 100)}` };
    }

    // Servidor aceitou o email
    dataResponseOk = true;
    const messageId = extractMessageId(message);

    // QUIT - tolerante a erros TLS (close_notify)
    try {
      await sendCommand("QUIT", 5000);
    } catch (_quitErr) {
      console.log("[SMTP] QUIT ignorado (conexão já fechada pelo servidor)");
    }
    try { conn.close(); } catch (_) { /* já fechada */ }

    return { sucesso: true, mensagem: "Email enviado com sucesso!", messageId };
  } catch (err) {
    const msg = (err as Error).message;
    // AIDEV-NOTE: Só trata close_notify como sucesso se o servidor JÁ respondeu 250 ao DATA
    if (dataResponseOk && (msg.includes("close_notify") || msg.includes("peer closed"))) {
      console.log("[send-email] TLS close_notify após 250 OK - email foi enviado");
      return { sucesso: true, mensagem: "Email enviado com sucesso!" };
    }
    console.error("[send-email] SMTP error:", msg);
    return { sucesso: false, mensagem: `Erro SMTP: ${msg}` };
  }
}

function extractMessageId(message: string): string {
  const match = message.match(/Message-ID:\s*<([^>]+)>/i);
  return match ? match[1] : `${crypto.randomUUID()}@crmrenove.local`;
}

function buildSimpleMessage(config: {
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  bodyType: string;
}): string {
  const messageId = `${crypto.randomUUID()}@crmrenove.local`;
  const fromDisplay = config.fromName ? `"${config.fromName}" <${config.from}>` : config.from;
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

  return [...headers, ``, config.body, `.`].join("\r\n");
}

function buildMimeMessage(config: {
  from: string;
  fromName?: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  anexos: { filename: string; mimeType: string; base64: string }[];
}): string {
  const messageId = `${crypto.randomUUID()}@crmrenove.local`;
  const boundary = `----=_Part_${crypto.randomUUID().replace(/-/g, "")}`;
  const fromDisplay = config.fromName ? `"${config.fromName}" <${config.from}>` : config.from;

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
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${messageId}>`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    config.body,
  );

  for (const anexo of config.anexos) {
    headers.push(
      `--${boundary}`,
      `Content-Type: ${anexo.mimeType}; name="=?UTF-8?B?${btoa(unescape(encodeURIComponent(anexo.filename)))}?="`,
      `Content-Disposition: attachment; filename="=?UTF-8?B?${btoa(unescape(encodeURIComponent(anexo.filename)))}?="`,
      `Content-Transfer-Encoding: base64`,
      ``,
      splitBase64Lines(anexo.base64),
    );
  }

  headers.push(`--${boundary}--`, `.`);

  return headers.join("\r\n");
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
      .in("status", ["ativo", "conectado"])
      .is("deletado_em", null)
      .maybeSingle();

    if (conexaoError || !conexao) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Nenhuma conexão de email ativa encontrada. Configure em Configurações → Conexões." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AIDEV-NOTE: Resolver configuração SMTP baseado no tipo de conexão
    const isGmail = conexao.tipo === 'gmail' || conexao.tipo === 'gmail_oauth';
    let smtpHost: string;
    let smtpPort: number;
    let smtpUser: string;
    let smtpPass: string;
    let authMethod: 'login' | 'xoauth2' = 'login';

    if (isGmail) {
      // Gmail OAuth → smtp.gmail.com + XOAUTH2
      if (!conexao.access_token_encrypted) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Token Gmail não encontrado. Reconecte sua conta Google em Configurações → Conexões." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const accessToken = await getGmailAccessToken(supabaseAdmin, conexao);
      smtpHost = "smtp.gmail.com";
      smtpPort = 587;
      smtpUser = conexao.email;
      smtpPass = accessToken; // XOAUTH2 usa o access token como "password"
      authMethod = 'xoauth2';
    } else {
      // SMTP Manual → configuração armazenada
      if (!conexao.smtp_host || !conexao.smtp_user || !conexao.smtp_pass_encrypted) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Configuração SMTP incompleta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      smtpHost = conexao.smtp_host;
      smtpPort = conexao.smtp_port || 587;
      smtpUser = conexao.smtp_user;
      smtpPass = conexao.smtp_pass_encrypted;
    }

    // Parse body
    const body = await req.json();
    const { to, cc, bcc, subject, body: emailBody, body_type, anexos } = body as {
      to: string;
      cc?: string;
      bcc?: string;
      subject: string;
      body: string;
      body_type?: string;
      anexos?: AnexoInfo[];
    };

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Destinatário e assunto são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-email] Enviando para: ${to} via ${smtpHost} (${isGmail ? 'XOAUTH2' : 'AUTH LOGIN'}) anexos: ${anexos?.length || 0}`);

    // Gerar tracking ID
    const trackingId = crypto.randomUUID();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracking?t=${trackingId}`;
    const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;

    // Injetar tracking pixel no corpo HTML
    let finalBody = emailBody || "";
    if (body_type === "html" || !body_type) {
      if (finalBody.includes("</body>")) {
        finalBody = finalBody.replace("</body>", `${trackingPixel}</body>`);
      } else {
        finalBody += trackingPixel;
      }
    }

    // AIDEV-NOTE: Download PARALELO de anexos do Storage
    let anexosProcessados: { filename: string; mimeType: string; base64: string }[] = [];
    const hasAnexos = anexos && anexos.length > 0;

    if (hasAnexos) {
      const downloads = anexos!.map(async (anexo) => {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from("email-anexos")
          .download(anexo.storage_path);

        if (downloadError || !fileData) {
          console.error("[send-email] Erro download anexo:", anexo.filename, downloadError);
          return null;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));

        return {
          filename: anexo.filename,
          mimeType: anexo.mimeType,
          base64,
        };
      });

      const resultados = await Promise.all(downloads);
      anexosProcessados = resultados.filter((r): r is NonNullable<typeof r> => r !== null);
    }

    // Construir e enviar mensagem
    let rawMessage: string | undefined;

    if (anexosProcessados.length > 0) {
      rawMessage = buildMimeMessage({
        from: conexao.email,
        fromName: conexao.nome_remetente || usuario.nome,
        to,
        cc: cc || undefined,
        subject,
        body: finalBody,
        anexos: anexosProcessados,
      });
    }

    const result = await sendSmtpEmail({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      authMethod,
      from: conexao.email,
      fromName: conexao.nome_remetente || usuario.nome,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      body: finalBody,
      bodyType: body_type || "html",
      rawMessage,
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

      // SALVAR CÓPIA DO EMAIL ENVIADO
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
          tem_anexos: hasAnexos || false,
          anexos_info: hasAnexos ? anexos : null,
          data_email: now,
          sincronizado_em: now,
          tracking_id: trackingId,
        });

      if (saveError) {
        console.error("[send-email] Erro ao salvar cópia:", saveError);
      }

      // Cleanup: remover arquivos do storage após envio bem-sucedido
      if (hasAnexos) {
        const paths = anexos!.map((a) => a.storage_path);
        await supabaseAdmin.storage.from("email-anexos").remove(paths);
      }
    } else {
      await supabaseAdmin
        .from("conexoes_email")
        .update({ ultimo_erro: result.mensagem })
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
