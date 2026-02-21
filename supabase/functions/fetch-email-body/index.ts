import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para buscar corpo do email sob demanda (lazy loading)
 * Conecta via IMAP usando o provider_id (UID) e salva corpo_html/corpo_texto no banco
 * Chamada pelo frontend quando o usuário abre um email sem corpo carregado
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// IMAP Host Detection (mesmo do sync-emails)
// =====================================================

function detectImapHost(smtpHost: string): { host: string; port: number } {
  const map: Record<string, { host: string; port: number }> = {
    "smtp.gmail.com": { host: "imap.gmail.com", port: 993 },
    "smtp.office365.com": { host: "outlook.office365.com", port: 993 },
    "smtp.mail.yahoo.com": { host: "imap.mail.yahoo.com", port: 993 },
    "smtp.mail.me.com": { host: "imap.mail.me.com", port: 993 },
    "smtp.zoho.com": { host: "imap.zoho.com", port: 993 },
    "smtps.uol.com.br": { host: "imap.uol.com.br", port: 993 },
    "smtps.bol.com.br": { host: "imap.bol.com.br", port: 993 },
    "smtp.terra.com.br": { host: "imap.terra.com.br", port: 993 },
  };
  if (map[smtpHost]) return map[smtpHost];
  return { host: smtpHost.replace(/^smtps?\./, "imap."), port: 993 };
}

// =====================================================
// Byte Helpers
// =====================================================

function latin1ToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function decodeBytes(bytes: Uint8Array, charset?: string): string {
  const cs = (charset || "utf-8").trim().toLowerCase();
  try {
    return new TextDecoder(cs, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

// =====================================================
// MIME Parsing
// =====================================================

function decodeQuotedPrintableToBytes(str: string): Uint8Array {
  const raw = str.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "=" && i + 2 < raw.length) {
      const hex = raw.substring(i + 1, i + 3);
      const val = parseInt(hex, 16);
      if (!isNaN(val)) {
        bytes.push(val);
        i += 3;
        continue;
      }
    }
    bytes.push(raw.charCodeAt(i) & 0xff);
    i++;
  }
  return new Uint8Array(bytes);
}

function decodeContentBody(content: string, encoding: string, charset?: string): string {
  const enc = (encoding || "7bit").trim().toLowerCase();
  switch (enc) {
    case "base64": {
      const cleaned = content.replace(/\s/g, "");
      if (!cleaned) return "";
      try {
        const bytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
        return decodeBytes(bytes, charset);
      } catch {
        return content;
      }
    }
    case "quoted-printable": {
      const bytes = decodeQuotedPrintableToBytes(content);
      return decodeBytes(bytes, charset);
    }
    default: {
      const bytes = latin1ToBytes(content);
      return decodeBytes(bytes, charset || "utf-8");
    }
  }
}

function extractCharset(contentTypeHeader: string): string | undefined {
  const match = contentTypeHeader.match(/charset="?([^"\s;]+)"?/i);
  return match ? match[1].trim().toLowerCase() : undefined;
}

// AIDEV-NOTE: Detecta charset declarado em tags <meta> do HTML (fallback quando MIME headers não declaram)
function detectCharsetFromHtmlMeta(html: string): string | undefined {
  // <meta charset="iso-8859-1">
  const m1 = html.match(/<meta\s+charset\s*=\s*"?([^"\s;>]+)"?\s*\/?>/i);
  if (m1) return m1[1].trim().toLowerCase();
  // <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
  const m2 = html.match(/<meta\s+http-equiv\s*=\s*"?Content-Type"?\s+content\s*=\s*"[^"]*charset=([^"\s;>]+)"?\s*\/?>/i);
  if (m2) return m2[1].trim().toLowerCase();
  return undefined;
}

// AIDEV-NOTE: Re-decodifica conteúdo se contiver replacement chars e charset HTML difere
function reDecodeIfNeeded(decoded: string, rawContent: string, encoding: string, mimeCharset?: string): string {
  if (!decoded.includes("\uFFFD")) return decoded;
  const htmlCharset = detectCharsetFromHtmlMeta(decoded);
  if (htmlCharset && htmlCharset !== (mimeCharset || "utf-8")) {
    const reDecoded = decodeContentBody(rawContent, encoding, htmlCharset);
    if (!reDecoded.includes("\uFFFD") || reDecoded.split("\uFFFD").length < decoded.split("\uFFFD").length) {
      return reDecoded;
    }
  }
  // Fallback: try latin1/iso-8859-1 if not already tried
  if (mimeCharset !== "iso-8859-1" && mimeCharset !== "latin1" && (!decoded.includes("\uFFFD") === false)) {
    const latin1 = decodeContentBody(rawContent, encoding, "iso-8859-1");
    if (!latin1.includes("\uFFFD")) return latin1;
  }
  return decoded;
}

function parseMimeMessage(raw: string): { html: string; text: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const headerEnd = normalized.indexOf("\n\n");
  if (headerEnd < 0) return { html: "", text: "" };

  const rawHeaders = normalized.substring(0, headerEnd);
  const body = normalized.substring(headerEnd + 2);
  const headers = rawHeaders.replace(/\n[ \t]+/g, " ");

  const isMultipart = /Content-Type:\s*multipart\//i.test(headers);
  if (isMultipart) {
    const boundaryMatch = headers.match(/boundary="?([^"\s;]+)"?/i);
    if (boundaryMatch) {
      const result = parseMultipart(body, boundaryMatch[1].trim());
      // Re-decode if needed
      if (result.html) result.html = reDecodeIfNeeded(result.html, body, "7bit");
      if (result.text) result.text = reDecodeIfNeeded(result.text, body, "7bit");
      return result;
    }
  }

  const ctMatch = headers.match(/Content-Type:\s*([^\n]+)/i);
  const contentTypeRaw = ctMatch ? ctMatch[1].trim() : "text/plain";
  const contentType = contentTypeRaw.toLowerCase();
  const charset = extractCharset(contentTypeRaw) || extractCharset(headers);
  const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*([^\n]+)/i);
  const encoding = encodingMatch ? encodingMatch[1].trim() : "7bit";

  let decoded = decodeContentBody(body, encoding, charset);
  decoded = reDecodeIfNeeded(decoded, body, encoding, charset);
  if (contentType.includes("text/html")) return { html: decoded, text: "" };
  return { html: "", text: decoded };
}

function parseMultipart(body: string, boundary: string): { html: string; text: string } {
  const parts = body.split(`--${boundary}`);
  let html = "";
  let text = "";

  for (const part of parts) {
    if (part.startsWith("--") || !part.trim()) continue;
    const partHeaderEnd = part.indexOf("\n\n");
    if (partHeaderEnd < 0) continue;

    const rawPartHeaders = part.substring(0, partHeaderEnd);
    const partBody = part.substring(partHeaderEnd + 2);
    const partHeaders = rawPartHeaders.replace(/\n[ \t]+/g, " ");

    const isNestedMultipart = /Content-Type:\s*multipart\//i.test(partHeaders);
    if (isNestedMultipart) {
      const nestedBoundary = partHeaders.match(/boundary="?([^"\s;]+)"?/i);
      if (nestedBoundary) {
        const nested = parseMultipart(partBody, nestedBoundary[1].trim());
        if (nested.html && !html) html = nested.html;
        if (nested.text && !text) text = nested.text;
        continue;
      }
    }

    const ctMatch = partHeaders.match(/Content-Type:\s*([^\n]+)/i);
    const contentTypeRaw = ctMatch ? ctMatch[1].trim() : "";
    const contentType = contentTypeRaw.toLowerCase();
    const charset = extractCharset(contentTypeRaw) || extractCharset(partHeaders);
    const encodingMatch = partHeaders.match(/Content-Transfer-Encoding:\s*([^\n]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].trim() : "7bit";

    if (contentType.includes("text/html") && !html) {
      html = decodeContentBody(partBody, encoding, charset);
    } else if (contentType.includes("text/plain") && !text) {
      text = decodeContentBody(partBody, encoding, charset);
    }
  }

  return { html, text };
}

// =====================================================
// HTML Sanitization (same as sync-emails)
// =====================================================

function sanitizeEmailHtml(html: string): string {
  if (!html) return html;
  let sanitized = html;

  sanitized = sanitized.replace(
    /src\s*=\s*["']data:image\/[^;]+;base64,[^"']+["']/gi,
    'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="[imagem removida]"'
  );
  sanitized = sanitized.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  sanitized = sanitized.replace(/<script\b[^>]*\/>/gi, '');
  sanitized = sanitized.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (match) => {
    if (match.length > 5120) return '<!-- style block removido (>5KB) -->';
    return match;
  });

  const MAX_SIZE = 200 * 1024;
  if (sanitized.length > MAX_SIZE) {
    sanitized = sanitized.substring(0, MAX_SIZE) +
      '\n<!-- [HTML truncado: conteúdo original excedeu 200KB] -->';
  }

  return sanitized;
}

// =====================================================
// Minimal IMAP Client (single body fetch)
// =====================================================

class ImapClient {
  private conn: Deno.TlsConn | null = null;
  private rawBuffer = new Uint8Array(0);
  private tagNum = 0;
  private encoder = new TextEncoder();
  private lineDecoder = new TextDecoder("utf-8");

  private concat(a: Uint8Array, b: Uint8Array): Uint8Array {
    const r = new Uint8Array(a.length + b.length);
    r.set(a);
    r.set(b, a.length);
    return r;
  }

  private async fill(min: number): Promise<void> {
    while (this.rawBuffer.length < min) {
      const buf = new Uint8Array(16384);
      const n = await this.conn!.read(buf);
      if (n === null) throw new Error("IMAP: conexão fechada");
      this.rawBuffer = this.concat(this.rawBuffer, buf.subarray(0, n));
    }
  }

  private async readLine(): Promise<string> {
    while (true) {
      for (let i = 0; i < this.rawBuffer.length - 1; i++) {
        if (this.rawBuffer[i] === 0x0d && this.rawBuffer[i + 1] === 0x0a) {
          const line = this.lineDecoder.decode(this.rawBuffer.subarray(0, i));
          this.rawBuffer = this.rawBuffer.subarray(i + 2);
          return line;
        }
      }
      await this.fill(this.rawBuffer.length + 1);
    }
  }

  private async readNBytesLatin1(n: number): Promise<string> {
    await this.fill(n);
    const data = new TextDecoder("latin1").decode(this.rawBuffer.subarray(0, n));
    this.rawBuffer = this.rawBuffer.subarray(n);
    return data;
  }

  private async send(data: string): Promise<void> {
    await this.conn!.write(this.encoder.encode(data));
  }

  async connect(host: string, port: number): Promise<string> {
    this.conn = await Deno.connectTls({ hostname: host, port });
    return await this.readLine();
  }

  async command(cmd: string): Promise<{ lines: string[]; ok: boolean }> {
    const tag = `A${String(++this.tagNum).padStart(4, "0")}`;
    await this.send(`${tag} ${cmd}\r\n`);

    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      const litMatch = line.match(/\{(\d+)\}$/);
      if (litMatch) {
        const size = parseInt(litMatch[1]);
        const litData = await this.readNBytesLatin1(size);
        lines.push(line + "\n" + litData);
        continue;
      }
      lines.push(line);
      if (line.startsWith(`${tag} OK`) || line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
        return { lines, ok: line.startsWith(`${tag} OK`) };
      }
    }
  }

  async login(user: string, pass: string): Promise<boolean> {
    const escaped = pass.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const result = await this.command(`LOGIN "${user}" "${escaped}"`);
    return result.ok;
  }

  async selectInbox(): Promise<boolean> {
    const result = await this.command("SELECT INBOX");
    return result.ok;
  }

  async fetchBody(uid: number): Promise<string | null> {
    const resp = await this.command(`UID FETCH ${uid} (UID BODY.PEEK[]<0.262144>)`);
    for (const line of resp.lines) {
      if (!line.match(/^\* \d+ FETCH/)) continue;
      const nlIdx = line.indexOf("\n");
      if (nlIdx >= 0) {
        return line.substring(nlIdx + 1).replace(/\)\s*$/, "");
      }
    }
    return null;
  }

  async logout(): Promise<void> {
    try { await this.command("LOGOUT"); } catch { /* ignore */ }
    try { this.conn?.close(); } catch { /* ignore */ }
  }
}

// =====================================================
// Main Handler
// =====================================================

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

    // AUTH
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

    // AIDEV-NOTE: Usar getUser() em vez de getClaims() (Supabase JS v2)
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id, organizacao_id")
      .eq("auth_id", authUserId)
      .single();

    if (!usuario) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const { email_id } = await req.json();
    if (!email_id) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "email_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email record
    const { data: email } = await supabaseAdmin
      .from("emails_recebidos")
      .select("id, provider_id, corpo_html, corpo_texto, conexao_email_id")
      .eq("id", email_id)
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("usuario_id", usuario.id)
      .single();

    if (!email) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Email não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already has body? Return it
    if (email.corpo_html || email.corpo_texto) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          corpo_html: email.corpo_html,
          corpo_texto: email.corpo_texto,
          cached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Need IMAP fetch
    const uid = parseInt(email.provider_id || "0");
    if (!uid) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Email sem provider_id para busca IMAP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connection
    const { data: conexao } = await supabaseAdmin
      .from("conexoes_email")
      .select("*")
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo")
      .is("deletado_em", null)
      .maybeSingle();

    if (!conexao?.smtp_host || !conexao?.smtp_user || !conexao?.smtp_pass_encrypted) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Nenhuma conexão de email ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imapConfig = detectImapHost(conexao.smtp_host);
    const imap = new ImapClient();

    try {
      await imap.connect(imapConfig.host, imapConfig.port);
      const loginOk = await imap.login(conexao.smtp_user, conexao.smtp_pass_encrypted);
      if (!loginOk) throw new Error("Falha na autenticação IMAP");

      await imap.selectInbox();
      const raw = await imap.fetchBody(uid);
      await imap.logout();

      if (!raw) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: "Corpo do email não encontrado no servidor" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { html, text } = parseMimeMessage(raw);
      const sanitizedHtml = sanitizeEmailHtml(html);

      // Save to DB
      const preview = (text || "").substring(0, 200).replace(/\s+/g, " ").trim();
      const updateData: Record<string, unknown> = {
        corpo_html: sanitizedHtml || null,
        corpo_texto: text || null,
      };
      if (preview) updateData.preview = preview;

      await supabaseAdmin
        .from("emails_recebidos")
        .update(updateData)
        .eq("id", email_id);

      return new Response(
        JSON.stringify({
          sucesso: true,
          corpo_html: sanitizedHtml || null,
          corpo_texto: text || null,
          cached: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (imapError) {
      await imap.logout().catch(() => {});
      console.error("[fetch-email-body] IMAP error:", (imapError as Error).message);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: `Erro IMAP: ${(imapError as Error).message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[fetch-email-body] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
