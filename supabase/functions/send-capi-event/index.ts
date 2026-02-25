/**
 * AIDEV-NOTE: Edge Function - Enviar eventos reais para Meta Conversions API
 * Recebe eventos do CRM (via processar-eventos-automacao) e dispara para o Meta CAPI.
 * 
 * Entrada (body):
 * {
 *   organizacao_id: string,
 *   event_name: string,        // Lead, Schedule, CompleteRegistration, Purchase, Other
 *   contato_id: string,
 *   valor?: number,            // apenas para Purchase
 *   oportunidade_id?: string,  // rastreabilidade
 *   titulo_oportunidade?: string,
 *   event_source_url?: string
 * }
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AIDEV-NOTE: Hash SHA-256 conforme exigido pelo Meta (lowercase hex)
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Normalizar telefone: apenas dígitos
function normalizarTelefone(tel: string): string {
  return tel.replace(/[^\d]/g, "");
}

// AIDEV-NOTE: Mapeamento de event_name para chave em eventos_habilitados
const EVENT_KEY_MAP: Record<string, string> = {
  Lead: "lead",
  Schedule: "schedule",
  CompleteRegistration: "mql",
  Purchase: "won",
  Other: "lost",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const {
      organizacao_id,
      event_name,
      contato_id,
      valor,
      oportunidade_id,
      titulo_oportunidade,
      event_source_url,
    } = body;

    if (!organizacao_id || !event_name || !contato_id) {
      return jsonResponse({ error: "organizacao_id, event_name e contato_id são obrigatórios" }, 400);
    }

    console.log(`[send-capi] Iniciando: ${event_name} para org ${organizacao_id}, contato ${contato_id}`);

    // 1. Buscar config CAPI da organização
    const { data: config, error: configErr } = await supabase
      .from("config_conversions_api")
      .select("*")
      .eq("organizacao_id", organizacao_id)
      .eq("ativo", true)
      .single();

    if (configErr || !config) {
      console.log(`[send-capi] CAPI não configurada ou inativa para org ${organizacao_id}`);
      return jsonResponse({ skipped: true, reason: "CAPI não configurada ou inativa" });
    }

    // 2. Verificar se o evento está habilitado
    const eventKey = EVENT_KEY_MAP[event_name];
    if (!eventKey) {
      return jsonResponse({ error: `Evento desconhecido: ${event_name}` }, 400);
    }

    const eventosHabilitados = config.eventos_habilitados as Record<string, boolean>;
    if (!eventosHabilitados?.[eventKey]) {
      console.log(`[send-capi] Evento ${event_name} (${eventKey}) não habilitado`);
      return jsonResponse({ skipped: true, reason: `Evento ${eventKey} não habilitado` });
    }

    // 3. Obter access_token - usar o da config_conversions_api
    const accessToken = config.access_token_encrypted;
    if (!accessToken) {
      console.error(`[send-capi] Sem access_token para org ${organizacao_id}`);
      return jsonResponse({ error: "Sem access_token configurado" }, 400);
    }

    // 4. Buscar dados do contato
    const { data: contato, error: contatoErr } = await supabase
      .from("contatos")
      .select("email, telefone, nome, sobrenome")
      .eq("id", contato_id)
      .single();

    if (contatoErr || !contato) {
      console.error(`[send-capi] Contato ${contato_id} não encontrado`);
      return jsonResponse({ error: "Contato não encontrado" }, 404);
    }

    // 5. Montar user_data com hashes SHA-256
    const userData: Record<string, unknown> = {
      client_ip_address: "127.0.0.1",
      client_user_agent: "CRM-Server/1.0",
    };

    if (contato.email) {
      userData.em = [await sha256(contato.email)];
    }
    if (contato.telefone) {
      const telNormalizado = normalizarTelefone(contato.telefone);
      if (telNormalizado) {
        userData.ph = [await sha256(telNormalizado)];
      }
    }
    if (contato.nome) {
      userData.fn = [await sha256(contato.nome)];
    }
    if (contato.sobrenome) {
      userData.ln = [await sha256(contato.sobrenome)];
    }

    // 6. Montar evento CAPI
    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = crypto.randomUUID();

    const capiEvent: Record<string, unknown> = {
      event_name,
      event_time: eventTime,
      event_id: eventId,
      action_source: "website",
      event_source_url: event_source_url || "https://crm.renovedigital.com.br",
      user_data: userData,
    };

    // 7. Para Purchase: incluir custom_data com valor
    if (event_name === "Purchase") {
      const configEventos = config.config_eventos as Record<string, Record<string, boolean>> | null;
      const enviarValor = configEventos?.won?.enviar_valor !== false; // default true

      const customData: Record<string, unknown> = {
        currency: "BRL",
      };

      if (enviarValor && valor !== undefined && valor !== null) {
        customData.value = Number(valor);
      } else {
        customData.value = 0;
      }

      if (oportunidade_id) {
        customData.content_ids = [oportunidade_id];
      }
      if (titulo_oportunidade) {
        customData.content_name = titulo_oportunidade;
      }

      capiEvent.custom_data = customData;
    }

    // 8. Enviar para Meta CAPI
    const pixelId = config.pixel_id;
    const capiPayload = { data: [capiEvent] };

    console.log(`[send-capi] Enviando ${event_name} para pixel ${pixelId}`);

    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capiPayload),
      }
    );

    const metaResult = await metaResponse.json();

    // 9. Atualizar contadores
    const sucesso = metaResponse.ok;
    const updateData: Record<string, unknown> = {
      total_eventos_enviados: (config.total_eventos_enviados || 0) + 1,
      ultimo_evento_enviado: new Date().toISOString(),
    };
    if (sucesso) {
      updateData.total_eventos_sucesso = (config.total_eventos_sucesso || 0) + 1;
    }

    await supabase
      .from("config_conversions_api")
      .update(updateData)
      .eq("id", config.id);

    if (!sucesso) {
      console.error(`[send-capi] Erro Meta API:`, JSON.stringify(metaResult));
      return jsonResponse({
        success: false,
        event_name,
        event_id: eventId,
        error: metaResult.error?.message || "Erro na API Meta",
        meta_response: metaResult,
      }, 502);
    }

    console.log(`[send-capi] Sucesso: ${event_name}, events_received: ${metaResult.events_received}`);

    return jsonResponse({
      success: true,
      event_name,
      event_id: eventId,
      events_received: metaResult.events_received,
      fbtrace_id: metaResult.fbtrace_id,
    });
  } catch (err) {
    console.error("[send-capi] Erro geral:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
