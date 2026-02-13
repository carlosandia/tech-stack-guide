/**
 * AIDEV-NOTE: Edge Function pública que retorna a config do widget WhatsApp
 * e recebe submissões de leads (POST) para criar contato/oportunidade + notificar email.
 * Não requer autenticação — dados são públicos (config do widget).
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// =====================================================
// SMTP Helper (mesmo padrão do processar-submissao-formulario)
// =====================================================

function extractHostnameFromGreeting(greeting: string, fallback: string): string {
  const parts = greeting.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : fallback;
}

async function writeAll(conn: Deno.TcpConn | Deno.TlsConn, data: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < data.length) {
    const n = await conn.write(data.subarray(offset));
    if (n === null || n === 0) throw new Error("Falha ao escrever no socket SMTP");
    offset += n;
  }
}

async function enviarEmailSmtp(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  bodyHtml: string;
}): Promise<{ sucesso: boolean; mensagem: string }> {
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
        const lines = fullResponse.split("\r\n").filter((l) => l.length > 0);
        if (lines.length === 0) continue;
        const lastLine = lines[lines.length - 1];
        if (/^\d{3}[\s]/.test(lastLine) || /^\d{3}$/.test(lastLine)) break;
      }
      return fullResponse;
    };

    const sendCommand = async (cmd: string, timeoutMs = 15000): Promise<string> => {
      await writeAll(conn, encoder.encode(cmd + "\r\n"));
      return await readResponse(timeoutMs);
    };

    const greeting = await readResponse();
    if (!greeting.startsWith("220")) {
      conn.close();
      return { sucesso: false, mensagem: "Servidor SMTP rejeitou conexão" };
    }

    const realHostname = extractHostnameFromGreeting(greeting, config.host);
    await sendCommand("EHLO crmrenove.local");

    if (config.port === 587) {
      const starttlsResp = await sendCommand("STARTTLS");
      if (starttlsResp.startsWith("220")) {
        conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: realHostname });
        await sendCommand("EHLO crmrenove.local");
      }
    }

    const authResp = await sendCommand("AUTH LOGIN");
    if (!authResp.startsWith("334")) { conn.close(); return { sucesso: false, mensagem: "AUTH LOGIN não suportado" }; }
    const userResp = await sendCommand(btoa(config.user));
    if (!userResp.startsWith("334")) { conn.close(); return { sucesso: false, mensagem: "Falha auth (usuário)" }; }
    const passResp = await sendCommand(btoa(config.pass));
    if (!passResp.startsWith("235")) { conn.close(); return { sucesso: false, mensagem: "Falha auth (senha)" }; }

    const mailFromResp = await sendCommand(`MAIL FROM:<${config.from}>`);
    if (!mailFromResp.startsWith("250")) { conn.close(); return { sucesso: false, mensagem: "Remetente rejeitado" }; }
    const rcptResp = await sendCommand(`RCPT TO:<${config.to}>`);
    if (!rcptResp.startsWith("250")) { conn.close(); return { sucesso: false, mensagem: "Destinatário rejeitado" }; }

    const dataResp = await sendCommand("DATA");
    if (!dataResp.startsWith("354")) { conn.close(); return { sucesso: false, mensagem: "DATA rejeitado" }; }

    const messageId = `${crypto.randomUUID()}@crmrenove.local`;
    const fromDisplay = config.fromName ? `"${config.fromName}" <${config.from}>` : config.from;
    const message = [
      `From: ${fromDisplay}`,
      `To: ${config.to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(config.subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      ``,
      config.bodyHtml,
      `.`,
    ].join("\r\n");

    await writeAll(conn, encoder.encode(message + "\r\n"));
    const msgResp = await readResponse(30000);

    if (!msgResp.startsWith("250")) {
      conn.close();
      return { sucesso: false, mensagem: `Mensagem rejeitada: ${msgResp.substring(0, 100)}` };
    }
    dataResponseOk = true;

    try { await sendCommand("QUIT", 5000); } catch (_) { /* ok */ }
    try { conn.close(); } catch (_) { /* ok */ }

    return { sucesso: true, mensagem: "Email enviado" };
  } catch (err) {
    const msg = (err as Error).message;
    if (dataResponseOk && (msg.includes("close_notify") || msg.includes("peer closed"))) {
      return { sucesso: true, mensagem: "Email enviado (close_notify)" };
    }
    return { sucesso: false, mensagem: `Erro SMTP: ${msg}` };
  }
}

// =====================================================
// Main handler
// =====================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org");

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'org' é obrigatório" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // =====================================================
    // POST: Receber submissão do widget (notificação email)
    // =====================================================
    if (req.method === "POST") {
      const body = await req.json();
      const { dados, config: widgetCfg } = body;

      if (!dados || !widgetCfg) {
        return new Response(
          JSON.stringify({ error: "Dados inválidos" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Verificar se notificação por email está ativa
      if (widgetCfg.notificar_email && widgetCfg.email_destino) {
        console.log("[widget-submit] Enviando notificação por email para:", widgetCfg.email_destino);

        // Buscar conexão SMTP
        const { data: conexao } = await supabase
          .from("conexoes_email")
          .select("email, nome_remetente, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted")
          .eq("organizacao_id", orgId)
          .in("status", ["ativo", "conectado"])
          .is("deletado_em", null)
          .limit(1)
          .single();

        if (conexao?.smtp_host && conexao?.smtp_user && conexao?.smtp_pass_encrypted) {
          // Montar HTML do email
          const camposHtml = Object.entries(dados as Record<string, string>)
            .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;text-transform:capitalize;background:#f9fafb">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${v}</td></tr>`)
            .join("");

          // Buscar nome do funil
          let funilNome = "Widget WhatsApp";
          if (widgetCfg.funil_id) {
            const { data: funil } = await supabase
              .from("funis")
              .select("nome")
              .eq("id", widgetCfg.funil_id)
              .maybeSingle();
            if (funil?.nome) funilNome = funil.nome;
          }

          const bodyHtml = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#1a1a2e">🎯 Novo Lead via Widget WhatsApp</h2>
              <p><strong>Origem:</strong> Widget WhatsApp no Website</p>
              <p><strong>Pipeline:</strong> ${funilNome}</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <thead><tr><th style="padding:8px 12px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left">Campo</th><th style="padding:8px 12px;border:1px solid #e5e7eb;background:#f3f4f6;text-align:left">Valor</th></tr></thead>
                <tbody>${camposHtml}</tbody>
              </table>
              <p style="color:#666;font-size:12px">Enviado automaticamente pelo CRM Renove</p>
            </div>`;

          const nomeContato = dados.nome || dados.Nome || "Lead";
          const result = await enviarEmailSmtp({
            host: conexao.smtp_host,
            port: conexao.smtp_port || 587,
            user: conexao.smtp_user,
            pass: conexao.smtp_pass_encrypted,
            from: conexao.email,
            fromName: conexao.nome_remetente || "CRM Renove",
            to: widgetCfg.email_destino,
            subject: `Novo lead via Widget: ${nomeContato}`,
            bodyHtml,
          });

          console.log("[widget-submit] Resultado email:", result);
        } else {
          console.warn("[widget-submit] Sem conexão SMTP válida para org:", orgId);
        }
      }

      return new Response(
        JSON.stringify({ sucesso: true }),
        { headers: corsHeaders }
      );
    }

    // =====================================================
    // GET: Retornar configuração do widget
    // =====================================================
    const { data: configTenant, error: errConfig } = await supabase
      .from("configuracoes_tenant")
      .select("widget_whatsapp_ativo, widget_whatsapp_config")
      .eq("organizacao_id", orgId)
      .maybeSingle();

    if (errConfig) {
      console.error("Erro ao buscar config:", errConfig);
      return new Response(
        JSON.stringify({ error: "Erro interno" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!configTenant || !configTenant.widget_whatsapp_ativo) {
      return new Response(
        JSON.stringify({ ativo: false }),
        { headers: corsHeaders }
      );
    }

    const widgetConfig = configTenant.widget_whatsapp_config as Record<string, unknown>;

    // Buscar nomes dos campos selecionados
    const campoIds = (widgetConfig?.campos_formulario as string[]) || [];
    let camposInfo: Array<{ id: string; nome: string; tipo: string; placeholder: string | null }> = [];

    if (campoIds.length > 0) {
      const { data: campos } = await supabase
        .from("campos_customizados")
        .select("id, nome, tipo, placeholder")
        .in("id", campoIds)
        .eq("organizacao_id", orgId);

      if (campos) {
        camposInfo = campoIds
          .map((id) => campos.find((c: any) => c.id === id))
          .filter(Boolean) as typeof camposInfo;
      }
    }

    return new Response(
      JSON.stringify({
        ativo: true,
        config: widgetConfig,
        campos: camposInfo,
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Erro na edge function widget-whatsapp-config:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
