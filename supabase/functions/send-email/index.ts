import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para envio de email via SMTP
 * Busca credenciais do usuario na tabela conexoes_email
 * Envia email real usando comandos SMTP diretos
 * SALVA cópia do email enviado na tabela emails_recebidos (pasta=sent)
 * Suporta: anexos via Storage, tracking pixel
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

interface AnexoInfo {
  filename: string;
  storage_path: string;
  mimeType: string;
  size: number;
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
  boundary?: string;
  rawMessage?: string;
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
      let fullResponse = "";
      while (true) {
        const buf = new Uint8Array(4096);
        const n = await conn.read(buf);
        if (n === null) throw new Error("Conexão fechada pelo servidor");
        fullResponse += decoder.decode(buf.subarray(0, n));
        // SMTP multi-line: lines with code+dash continue, code+space is final
        const lines = fullResponse.split("\r\n").filter(l => l.length > 0);
        if (lines.length === 0) continue;
        const lastLine = lines[lines.length - 1];
        // Check if last line is final (3-digit code followed by space or is the only line)
        if (/^\d{3}[\s]/.test(lastLine) || /^\d{3}$/.test(lastLine)) {
          break;
        }
      }
      return fullResponse;
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

    // Se rawMessage foi fornecido (MIME multipart), usa diretamente
    const message = config.rawMessage || buildSimpleMessage(config);

    const msgResp = await sendCommand(message);
    if (!msgResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor não aceitou a mensagem" };
    }

    const messageId = extractMessageId(message);

    await sendCommand("QUIT");
    conn.close();

    return { sucesso: true, mensagem: "Email enviado com sucesso!", messageId };
  } catch (err) {
    const msg = (err as Error).message;
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

  // Adiciona cada anexo
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

    console.log("[send-email] Enviando para:", to, "via", conexao.smtp_host, "anexos:", anexos?.length || 0);

    // Gerar tracking ID
    const trackingId = crypto.randomUUID();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracking?t=${trackingId}`;
    const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;

    // Injetar tracking pixel no corpo HTML
    let finalBody = emailBody || "";
    if (body_type === "html" || !body_type) {
      // Insere antes do </body> ou no final
      if (finalBody.includes("</body>")) {
        finalBody = finalBody.replace("</body>", `${trackingPixel}</body>`);
      } else {
        finalBody += trackingPixel;
      }
    }

    // Preparar anexos: download do Storage
    let anexosProcessados: { filename: string; mimeType: string; base64: string }[] = [];
    const hasAnexos = anexos && anexos.length > 0;

    if (hasAnexos) {
      for (const anexo of anexos!) {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from("email-anexos")
          .download(anexo.storage_path);

        if (downloadError || !fileData) {
          console.error("[send-email] Erro download anexo:", anexo.filename, downloadError);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));

        anexosProcessados.push({
          filename: anexo.filename,
          mimeType: anexo.mimeType,
          base64,
        });
      }
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
