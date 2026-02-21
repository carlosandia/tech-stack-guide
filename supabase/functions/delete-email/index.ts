import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para excluir email do servidor IMAP
 * Conecta via IMAP, marca com \Deleted flag e faz EXPUNGE
 * Depois remove do banco local (soft delete)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Minimal IMAP client for delete operation
class ImapDeleteClient {
  private conn: Deno.TlsConn | null = null;
  private rawBuffer = new Uint8Array(0);
  private tagNum = 0;
  private encoder = new TextEncoder();

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
          const line = new TextDecoder("utf-8").decode(this.rawBuffer.subarray(0, i));
          this.rawBuffer = this.rawBuffer.subarray(i + 2);
          return line;
        }
      }
      await this.fill(this.rawBuffer.length + 1);
    }
  }

  private async send(data: string): Promise<void> {
    await this.conn!.write(this.encoder.encode(data));
  }

  async connect(host: string, port: number): Promise<string> {
    this.conn = await Deno.connectTls({ hostname: host, port });
    return await this.readLine();
  }

  async command(cmd: string): Promise<{ lines: string[]; ok: boolean }> {
    const tag = `D${String(++this.tagNum).padStart(4, "0")}`;
    await this.send(`${tag} ${cmd}\r\n`);

    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();

      // Handle literal
      const litMatch = line.match(/\{(\d+)\}$/);
      if (litMatch) {
        const size = parseInt(litMatch[1]);
        await this.fill(size);
        this.rawBuffer = this.rawBuffer.subarray(size);
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

  async uidStore(uid: number, flags: string): Promise<boolean> {
    const result = await this.command(`UID STORE ${uid} +FLAGS (${flags})`);
    return result.ok;
  }

  async expunge(): Promise<boolean> {
    const result = await this.command("EXPUNGE");
    return result.ok;
  }

  async logout(): Promise<void> {
    try { await this.command("LOGOUT"); } catch { /* ignore */ }
    try { this.conn?.close(); } catch { /* ignore */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

    const { email_id } = await req.json();
    if (!email_id) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "email_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email with provider_id (IMAP UID)
    const { data: email, error: emailErr } = await supabaseAdmin
      .from("emails_recebidos")
      .select("id, provider_id, conexao_email_id")
      .eq("id", email_id)
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("usuario_id", usuario.id)
      .single();

    if (emailErr || !email) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Email não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connection for IMAP credentials
    const { data: conexao } = await supabaseAdmin
      .from("conexoes_email")
      .select("*")
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo")
      .is("deletado_em", null)
      .maybeSingle();

    let deletedFromServer = false;
    const imapUid = parseInt(email.provider_id || "0");

    // Try to delete from IMAP if we have credentials and a valid UID
    if (conexao?.smtp_host && conexao?.smtp_user && conexao?.smtp_pass_encrypted && imapUid > 0) {
      const imapConfig = detectImapHost(conexao.smtp_host);
      const imap = new ImapDeleteClient();

      try {
        const greeting = await imap.connect(imapConfig.host, imapConfig.port);
        if (!greeting.includes("OK") && !greeting.includes("ready")) {
          throw new Error("Servidor IMAP rejeitou conexão");
        }

        const loginOk = await imap.login(conexao.smtp_user, conexao.smtp_pass_encrypted);
        if (!loginOk) throw new Error("Falha na autenticação IMAP");

        const selectOk = await imap.selectInbox();
        if (!selectOk) throw new Error("Não foi possível selecionar INBOX");

        // Mark as deleted
        const storeOk = await imap.uidStore(imapUid, "\\Deleted");
        if (storeOk) {
          await imap.expunge();
          deletedFromServer = true;
          console.log(`[delete-email] UID ${imapUid} deleted from IMAP server`);
        } else {
          console.warn(`[delete-email] Failed to set \\Deleted flag on UID ${imapUid}`);
        }

        await imap.logout();
      } catch (imapErr) {
        console.warn(`[delete-email] IMAP delete failed: ${(imapErr as Error).message}`);
        // Continue with local delete even if IMAP fails
        try { await imap.logout(); } catch { /* ignore */ }
      }
    }

    // Soft delete locally (move to trash with deletado_em)
    const { error: deleteErr } = await supabaseAdmin
      .from("emails_recebidos")
      .update({
        pasta: "trash",
        deletado_em: new Date().toISOString(),
      })
      .eq("id", email_id);

    if (deleteErr) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Erro ao excluir localmente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        deletado_servidor: deletedFromServer,
        mensagem: deletedFromServer
          ? "Email excluído do servidor e do CRM"
          : "Email excluído do CRM (não foi possível remover do servidor)",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[delete-email] Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
