import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para sincronizar emails via IMAP
 * Conecta ao servidor IMAP do usuário, busca emails recentes
 * e salva na tabela emails_recebidos
 * Usa raw TCP/TLS (mesmo padrão do SMTP no codebase)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// IMAP Host Detection
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
// Minimal IMAP Client (raw TLS)
// =====================================================

class ImapClient {
  private conn: Deno.TlsConn | null = null;
  private rawBuffer = new Uint8Array(0);
  private tagNum = 0;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

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
          const line = this.decoder.decode(this.rawBuffer.subarray(0, i));
          this.rawBuffer = this.rawBuffer.subarray(i + 2);
          return line;
        }
      }
      await this.fill(this.rawBuffer.length + 1);
    }
  }

  private async readNBytes(n: number): Promise<string> {
    await this.fill(n);
    const data = this.decoder.decode(this.rawBuffer.subarray(0, n));
    this.rawBuffer = this.rawBuffer.subarray(n);
    return data;
  }

  private async send(data: string): Promise<void> {
    await this.conn!.write(this.encoder.encode(data));
  }

  async connect(host: string, port: number): Promise<string> {
    console.log(`[sync-emails] Conectando IMAP ${host}:${port}`);
    this.conn = await Deno.connectTls({ hostname: host, port });
    const greeting = await this.readLine();
    console.log("[sync-emails] IMAP greeting:", greeting.substring(0, 100));
    return greeting;
  }

  async command(cmd: string): Promise<{ lines: string[]; ok: boolean }> {
    const tag = `A${String(++this.tagNum).padStart(4, "0")}`;
    const logCmd = cmd.startsWith("LOGIN") ? "LOGIN ***" : cmd.substring(0, 80);
    console.log(`[sync-emails] > ${tag} ${logCmd}`);
    await this.send(`${tag} ${cmd}\r\n`);

    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();

      // Handle literal {N}
      const litMatch = line.match(/\{(\d+)\}$/);
      if (litMatch) {
        const size = parseInt(litMatch[1]);
        const litData = await this.readNBytes(size);
        lines.push(line + "\n" + litData);
        continue;
      }

      lines.push(line);

      if (
        line.startsWith(`${tag} OK`) ||
        line.startsWith(`${tag} NO`) ||
        line.startsWith(`${tag} BAD`)
      ) {
        const ok = line.startsWith(`${tag} OK`);
        if (!ok) console.warn("[sync-emails] IMAP error:", line);
        return { lines, ok };
      }
    }
  }

  async login(user: string, pass: string): Promise<boolean> {
    const escaped = pass.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const result = await this.command(`LOGIN "${user}" "${escaped}"`);
    return result.ok;
  }

  async selectInbox(): Promise<{ exists: number; uidValidity: number }> {
    const result = await this.command("SELECT INBOX");
    let exists = 0;
    let uidValidity = 0;
    for (const line of result.lines) {
      const existsMatch = line.match(/\* (\d+) EXISTS/);
      if (existsMatch) exists = parseInt(existsMatch[1]);
      const uidvMatch = line.match(/UIDVALIDITY (\d+)/);
      if (uidvMatch) uidValidity = parseInt(uidvMatch[1]);
    }
    return { exists, uidValidity };
  }

  async uidSearch(criteria: string): Promise<number[]> {
    const result = await this.command(`UID SEARCH ${criteria}`);
    for (const line of result.lines) {
      if (line.startsWith("* SEARCH")) {
        const nums = line.substring(9).trim();
        if (!nums) return [];
        return nums.split(/\s+/).map(Number).filter((n) => !isNaN(n) && n > 0);
      }
    }
    return [];
  }

  async uidFetchHeaders(uids: number[]): Promise<string[][]> {
    if (uids.length === 0) return [];
    const uidList = uids.join(",");
    const result = await this.command(
      `UID FETCH ${uidList} (FLAGS INTERNALDATE UID BODY.PEEK[HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID)])`
    );
    // Group lines by FETCH response
    const groups: string[][] = [];
    let current: string[] = [];
    for (const line of result.lines) {
      if (line.match(/^\* \d+ FETCH/)) {
        if (current.length > 0) groups.push(current);
        current = [line];
      } else if (
        !line.startsWith(`A${String(this.tagNum).padStart(4, "0")}`)
      ) {
        current.push(line);
      }
    }
    if (current.length > 0) groups.push(current);
    return groups;
  }

  async logout(): Promise<void> {
    try {
      await this.command("LOGOUT");
    } catch { /* ignore */ }
    try {
      this.conn?.close();
    } catch { /* ignore */ }
  }
}

// =====================================================
// Email Header Parsing
// =====================================================

function parseEmailHeaders(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = "";
  let currentValue = "";
  for (const line of lines) {
    if (/^\s/.test(line) && currentKey) {
      currentValue += " " + line.trim();
    } else {
      if (currentKey) result[currentKey.toLowerCase()] = currentValue;
      const idx = line.indexOf(":");
      if (idx > 0) {
        currentKey = line.substring(0, idx).trim();
        currentValue = line.substring(idx + 1).trim();
      } else {
        currentKey = "";
        currentValue = "";
      }
    }
  }
  if (currentKey) result[currentKey.toLowerCase()] = currentValue;
  return result;
}

function decodeRFC2047(str: string): string {
  if (!str) return str;
  return str.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g,
    (_, _charset: string, encoding: string, data: string) => {
      try {
        if (encoding.toUpperCase() === "B") {
          return new TextDecoder().decode(
            Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
          );
        } else {
          const decoded = data
            .replace(/_/g, " ")
            .replace(/=([0-9A-Fa-f]{2})/g, (__, hex: string) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          return decoded;
        }
      } catch {
        return data;
      }
    }
  );
}

function parseEmailAddress(raw: string): { name: string | null; email: string } {
  if (!raw) return { name: null, email: "" };
  const decoded = decodeRFC2047(raw.trim());
  const match = decoded.match(/^"?([^"<]*)"?\s*<([^>]+)>/);
  if (match) {
    return { name: match[1].trim() || null, email: match[2].trim() };
  }
  return { name: null, email: decoded.replace(/[<>]/g, "").trim() };
}

interface ParsedEmail {
  uid: number;
  flags: string[];
  internalDate: string;
  from: { name: string | null; email: string };
  to: string;
  cc: string | null;
  subject: string;
  date: string;
  messageId: string;
  isSeen: boolean;
  isFlagged: boolean;
}

function parseFetchGroup(group: string[]): ParsedEmail | null {
  const firstLine = group[0] || "";

  // Extract UID
  const uidMatch = firstLine.match(/UID (\d+)/);
  const uid = uidMatch ? parseInt(uidMatch[1]) : 0;
  if (!uid) return null;

  // Extract FLAGS
  const flagsMatch = firstLine.match(/FLAGS \(([^)]*)\)/);
  const flags = flagsMatch
    ? flagsMatch[1].split(/\s+/).filter(Boolean)
    : [];

  // Extract INTERNALDATE
  const dateMatch = firstLine.match(/INTERNALDATE "([^"]+)"/);
  const internalDate = dateMatch ? dateMatch[1] : "";

  // Find header literal
  let headerText = "";
  for (const line of group) {
    const litIdx = line.indexOf("{");
    if (litIdx >= 0 && line.includes("HEADER.FIELDS")) {
      const nlIdx = line.indexOf("\n", litIdx);
      if (nlIdx >= 0) {
        headerText = line.substring(nlIdx + 1);
      }
    }
  }

  if (!headerText) return null;

  const headers = parseEmailHeaders(headerText);
  const from = parseEmailAddress(headers["from"] || "");
  const subject = decodeRFC2047(headers["subject"] || "(sem assunto)");
  const messageId = (headers["message-id"] || `uid-${uid}@imap`).replace(
    /[<>]/g,
    ""
  );

  return {
    uid,
    flags,
    internalDate,
    from,
    to: headers["to"] || "",
    cc: headers["cc"] || null,
    subject,
    date: headers["date"] || internalDate,
    messageId,
    isSeen: flags.some((f) => f.toLowerCase() === "\\seen"),
    isFlagged: flags.some((f) => f.toLowerCase() === "\\flagged"),
  };
}

// =====================================================
// IMAP Date Helper
// =====================================================

function imapDateStr(date: Date): string {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
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

    // =====================================================
    // AUTH
    // =====================================================
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

    // Get user
    const { data: usuario, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, organizacao_id")
      .eq("auth_id", authUserId)
      .single();

    if (userError || !usuario) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email connection
    const { data: conexao } = await supabaseAdmin
      .from("conexoes_email")
      .select("*")
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo")
      .is("deletado_em", null)
      .maybeSingle();

    if (!conexao || !conexao.smtp_host || !conexao.smtp_user || !conexao.smtp_pass_encrypted) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Nenhuma conexão de email ativa. Configure em Configurações → Conexões." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =====================================================
    // IMAP SYNC
    // =====================================================
    const imapConfig = detectImapHost(conexao.smtp_host);
    console.log(`[sync-emails] IMAP: ${imapConfig.host}:${imapConfig.port} user: ${conexao.smtp_user}`);

    const imap = new ImapClient();
    let novos = 0;

    try {
      // Connect
      const greeting = await imap.connect(imapConfig.host, imapConfig.port);
      if (!greeting.includes("OK") && !greeting.includes("ready")) {
        throw new Error("Servidor IMAP rejeitou conexão");
      }

      // Login
      const loginOk = await imap.login(conexao.smtp_user, conexao.smtp_pass_encrypted);
      if (!loginOk) {
        throw new Error("Falha na autenticação IMAP. Verifique as credenciais.");
      }
      console.log("[sync-emails] Login OK");

      // Select INBOX
      const inbox = await imap.selectInbox();
      console.log(`[sync-emails] INBOX: ${inbox.exists} mensagens, UIDVALIDITY: ${inbox.uidValidity}`);

      if (inbox.exists === 0) {
        await imap.logout();
        return new Response(
          JSON.stringify({ sucesso: true, mensagem: "Caixa de entrada vazia", novos: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Search recent emails (last 14 days)
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 14);
      const uids = await imap.uidSearch(`SINCE ${imapDateStr(sinceDate)}`);
      console.log(`[sync-emails] Encontrados ${uids.length} UIDs recentes`);

      if (uids.length === 0) {
        await imap.logout();
        return new Response(
          JSON.stringify({ sucesso: true, mensagem: "Nenhum email novo nos últimos 14 dias", novos: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Limit to last 50
      const recentUids = uids.slice(-50);

      // Get existing message_ids for dedup
      const { data: existing } = await supabaseAdmin
        .from("emails_recebidos")
        .select("message_id")
        .eq("organizacao_id", usuario.organizacao_id)
        .eq("usuario_id", usuario.id)
        .eq("pasta", "inbox");

      const existingIds = new Set(
        (existing || []).map((e: { message_id: string }) => e.message_id)
      );

      // Fetch headers
      const fetchGroups = await imap.uidFetchHeaders(recentUids);
      console.log(`[sync-emails] Fetched ${fetchGroups.length} mensagens`);

      // Parse and insert
      const toInsert: Record<string, unknown>[] = [];

      for (const group of fetchGroups) {
        const parsed = parseFetchGroup(group);
        if (!parsed) continue;

        // Dedup
        if (existingIds.has(parsed.messageId)) continue;

        // Parse date
        let emailDate: string;
        try {
          emailDate = new Date(parsed.date || parsed.internalDate).toISOString();
        } catch {
          emailDate = new Date().toISOString();
        }

        toInsert.push({
          organizacao_id: usuario.organizacao_id,
          usuario_id: usuario.id,
          conexao_email_id: conexao.id,
          message_id: parsed.messageId,
          provider_id: String(parsed.uid),
          de_email: parsed.from.email,
          de_nome: parsed.from.name,
          para_email: parsed.to || conexao.email,
          cc_email: parsed.cc,
          assunto: parsed.subject,
          preview: parsed.subject.substring(0, 200),
          pasta: "inbox",
          lido: parsed.isSeen,
          favorito: parsed.isFlagged,
          tem_anexos: false,
          data_email: emailDate,
          sincronizado_em: new Date().toISOString(),
        });
      }

      // Batch insert
      if (toInsert.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from("emails_recebidos")
          .insert(toInsert);

        if (insertError) {
          console.error("[sync-emails] Erro ao inserir emails:", insertError);
          // Try one by one for partial success
          for (const email of toInsert) {
            const { error } = await supabaseAdmin
              .from("emails_recebidos")
              .insert(email);
            if (!error) novos++;
            else console.warn("[sync-emails] Skip email:", (email as { message_id: string }).message_id, error.message);
          }
        } else {
          novos = toInsert.length;
        }
      }

      console.log(`[sync-emails] ${novos} novos emails salvos`);

      // Update sync state
      await supabaseAdmin
        .from("conexoes_email")
        .update({
          ultimo_erro: null,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", conexao.id);

      // Logout
      await imap.logout();
    } catch (imapError) {
      const errMsg = (imapError as Error).message;
      console.error("[sync-emails] IMAP error:", errMsg);

      // Update connection with error
      await supabaseAdmin
        .from("conexoes_email")
        .update({
          ultimo_erro: `Erro IMAP: ${errMsg}`,
        })
        .eq("id", conexao.id);

      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem: `Erro ao sincronizar: ${errMsg}`,
          novos,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: novos > 0
          ? `${novos} novo(s) email(s) sincronizado(s)`
          : "Nenhum email novo",
        novos,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-emails] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno", novos: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
