/**
 * AIDEV-NOTE: Edge Function para receber webhooks de Lead Ads do Meta
 * Responsabilidades:
 * - GET: Verificacao do webhook (challenge do Meta)
 * - POST: Processamento de leads - busca dados via Graph API, cria contato + oportunidade
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VERIFY_TOKEN = "crm_renove_leadgen_webhook";
const GRAPH_API_VERSION = "v24.0";

Deno.serve(async (req: Request) => {
  // =====================================================
  // GET - Verificacao do webhook pelo Meta
  // =====================================================
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[meta-leadgen-webhook] Verificacao OK");
      return new Response(challenge, { status: 200 });
    }

    console.warn("[meta-leadgen-webhook] Verificacao falhou - token invalido");
    return new Response("Forbidden", { status: 403 });
  }

  // =====================================================
  // POST - Processamento de leads
  // =====================================================
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[meta-leadgen-webhook] Payload recebido:", JSON.stringify(body));

      // Responder 200 imediatamente para o Meta nao reenviar
      const entries = body?.entry || [];

      for (const entry of entries) {
        const changes = entry?.changes || [];

        for (const change of changes) {
          if (change?.field !== "leadgen") continue;

          const { leadgen_id, form_id, page_id } = change.value || {};

          if (!leadgen_id || !form_id || !page_id) {
            console.warn("[meta-leadgen-webhook] Dados incompletos no change:", change.value);
            continue;
          }

          try {
            await processarLead(String(page_id), String(form_id), String(leadgen_id));
          } catch (err) {
            console.error(`[meta-leadgen-webhook] Erro ao processar lead ${leadgen_id}:`, err);
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[meta-leadgen-webhook] Erro geral:", err);
      return new Response(JSON.stringify({ success: false }), {
        status: 200, // Sempre 200 para o Meta
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

// =====================================================
// Processar um lead individual
// =====================================================
async function processarLead(pageId: string, formId: string, leadgenId: string) {
  console.log(`[meta-leadgen-webhook] Processando lead: page=${pageId}, form=${formId}, leadgen=${leadgenId}`);

  // 1. Buscar pagina pelo page_id para obter token e organizacao_id
  const { data: pagina, error: errPagina } = await supabase
    .from("paginas_meta")
    .select("id, organizacao_id, page_access_token_encrypted")
    .eq("page_id", pageId)
    .eq("ativo", true)
    .limit(1)
    .single();

  if (errPagina || !pagina) {
    console.error(`[meta-leadgen-webhook] Pagina nao encontrada para page_id=${pageId}:`, errPagina);
    return;
  }

  const orgId = pagina.organizacao_id;
  const pageToken = pagina.page_access_token_encrypted;

  if (!pageToken) {
    console.error(`[meta-leadgen-webhook] Pagina sem token para page_id=${pageId}`);
    return;
  }

  // 2. Buscar configuracao do formulario
  const { data: configForm, error: errConfig } = await supabase
    .from("formularios_lead_ads")
    .select("id, funil_id, etapa_destino_id, mapeamento_campos, owner_id, criar_oportunidade, tags_automaticas")
    .eq("organizacao_id", orgId)
    .eq("form_id", formId)
    .eq("ativo", true)
    .is("deletado_em", null)
    .limit(1)
    .single();

  if (errConfig || !configForm) {
    console.warn(`[meta-leadgen-webhook] Formulario nao configurado: form_id=${formId}, org=${orgId}`);
    return;
  }

  // 3. Buscar dados do lead na Graph API
  const leadData = await buscarDadosLead(leadgenId, pageToken);
  if (!leadData) {
    console.error(`[meta-leadgen-webhook] Falha ao buscar dados do lead ${leadgenId}`);
    return;
  }

  console.log(`[meta-leadgen-webhook] Dados do lead:`, JSON.stringify(leadData));

  // 4. Aplicar mapeamento de campos
  const dadosContato = aplicarMapeamento(leadData, configForm.mapeamento_campos as any[]);
  console.log(`[meta-leadgen-webhook] Dados mapeados:`, JSON.stringify(dadosContato));

  // 5. Criar ou atualizar contato
  const contatoId = await criarOuAtualizarContato(orgId, dadosContato);
  if (!contatoId) {
    console.error(`[meta-leadgen-webhook] Falha ao criar/atualizar contato`);
    return;
  }

  // 6. Criar oportunidade (se configurado)
  if (configForm.criar_oportunidade !== false) {
    // Buscar etapa destino - se nao configurada, pegar a primeira etapa (tipo entrada) do funil
    let etapaId = configForm.etapa_destino_id;

    if (!etapaId && configForm.funil_id) {
      const { data: primeiraEtapa } = await supabase
        .from("etapas_funil")
        .select("id")
        .eq("funil_id", configForm.funil_id)
        .eq("ativo", true)
        .is("deletado_em", null)
        .order("ordem", { ascending: true })
        .limit(1)
        .single();

      etapaId = primeiraEtapa?.id || null;
    }

    if (configForm.funil_id && etapaId) {
      const nomeContato = dadosContato.nome || dadosContato.email || "Lead Meta";
      
      const { error: errOp } = await supabase.from("oportunidades").insert({
        organizacao_id: orgId,
        contato_id: contatoId,
        funil_id: configForm.funil_id,
        etapa_id: etapaId,
        titulo: `Lead Meta - ${nomeContato}`,
        origem: "meta_lead_ads",
        usuario_responsavel_id: configForm.owner_id || null,
        valor: 0,
        posicao: 0,
      });

      if (errOp) {
        console.error(`[meta-leadgen-webhook] Erro ao criar oportunidade:`, errOp);
      } else {
        console.log(`[meta-leadgen-webhook] Oportunidade criada para contato ${contatoId}`);
      }
    }
  }

  // 7. Incrementar contagem de leads
  const { error: errUpdate } = await supabase
    .from("formularios_lead_ads")
    .update({
      total_leads_recebidos: (configForm as any).total_leads_recebidos
        ? (configForm as any).total_leads_recebidos + 1
        : 1,
      ultimo_lead_recebido: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", configForm.id);

  if (errUpdate) {
    console.error(`[meta-leadgen-webhook] Erro ao atualizar contagem:`, errUpdate);
  }

  // Melhor: usar RPC ou SQL para incrementar atomicamente
  await supabase.rpc("incrementar_lead_formulario_meta", { p_formulario_id: configForm.id }).catch(() => {
    // Se a RPC nao existir, o update acima ja fez o trabalho
  });

  console.log(`[meta-leadgen-webhook] Lead processado com sucesso: ${leadgenId}`);
}

// =====================================================
// Buscar dados do lead via Graph API
// =====================================================
async function buscarDadosLead(leadgenId: string, pageToken: string) {
  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?access_token=${pageToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[meta-leadgen-webhook] Graph API erro ${response.status}: ${errText}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(`[meta-leadgen-webhook] Erro fetch Graph API:`, err);
    return null;
  }
}

// =====================================================
// Aplicar mapeamento de campos
// =====================================================
function aplicarMapeamento(leadData: any, mapeamento: any[]): Record<string, string> {
  const resultado: Record<string, string> = {};
  const fieldData: Array<{ name: string; values: string[] }> = leadData?.field_data || [];

  if (!mapeamento || !Array.isArray(mapeamento)) {
    // Mapeamento padrao se nenhum configurado
    for (const field of fieldData) {
      const name = field.name?.toLowerCase();
      const value = field.values?.[0] || "";

      if (name === "full_name" || name === "nome") resultado.nome = value;
      else if (name === "email") resultado.email = value;
      else if (name === "phone_number" || name === "telefone") resultado.telefone = value;
      else if (name === "first_name") resultado.nome = value;
      else if (name === "last_name") resultado.sobrenome = value;
      else if (name === "company_name" || name === "empresa") resultado.empresa = value;
      else if (name === "job_title" || name === "cargo") resultado.cargo = value;
    }
    return resultado;
  }

  // Aplicar mapeamento configurado
  for (const map of mapeamento) {
    const formField = map.form_field || map.campo_formulario;
    const crmField = map.crm_field || map.campo_crm;

    if (!formField || !crmField) continue;

    const field = fieldData.find(
      (f) => f.name?.toLowerCase() === formField.toLowerCase()
    );

    if (field && field.values?.[0]) {
      resultado[crmField] = field.values[0];
    }
  }

  console.log(`[meta-leadgen-webhook] Resultado bruto do mapeamento:`, JSON.stringify(resultado));

  // AIDEV-NOTE: Normalizar chaves prefixadas (pessoa:nome -> nome, empresa:nome_fantasia -> nome_fantasia, etc.)
  // O mapeamento salva chaves com prefixo de entidade, mas criarOuAtualizarContato espera chaves simples
  const normalizado: Record<string, string> = {};
  for (const [key, value] of Object.entries(resultado)) {
    if (key.startsWith("pessoa:")) {
      normalizado[key.replace("pessoa:", "")] = value;
    } else if (key.startsWith("empresa:")) {
      normalizado[key.replace("empresa:", "")] = value;
    } else if (key.startsWith("oportunidade:")) {
      normalizado[key.replace("oportunidade:", "")] = value;
    } else if (key.startsWith("custom:")) {
      normalizado[key] = value; // Manter campos custom para uso futuro
    } else {
      normalizado[key] = value;
    }
  }

  console.log(`[meta-leadgen-webhook] Resultado normalizado:`, JSON.stringify(normalizado));

  return normalizado;
}

// =====================================================
// Criar ou atualizar contato
// =====================================================
async function criarOuAtualizarContato(orgId: string, dados: Record<string, string>): Promise<string | null> {
  const email = dados.email;
  const telefone = dados.telefone;
  const nome = dados.nome || dados.full_name || "";
  const sobrenome = dados.sobrenome || "";

  // Tentar encontrar contato existente por email ou telefone
  if (email) {
    const { data: existente } = await supabase
      .from("contatos")
      .select("id")
      .eq("organizacao_id", orgId)
      .eq("email", email)
      .is("deletado_em", null)
      .limit(1)
      .single();

    if (existente) {
      // Atualizar dados se necessario
      await supabase
        .from("contatos")
        .update({
          nome: nome || undefined,
          sobrenome: sobrenome || undefined,
          telefone: telefone || undefined,
          cargo: dados.cargo || undefined,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", existente.id);

      return existente.id;
    }
  }

  if (telefone && !email) {
    const { data: existente } = await supabase
      .from("contatos")
      .select("id")
      .eq("organizacao_id", orgId)
      .eq("telefone", telefone)
      .is("deletado_em", null)
      .limit(1)
      .single();

    if (existente) {
      return existente.id;
    }
  }

  // Criar novo contato
  const { data: novoContato, error: errContato } = await supabase
    .from("contatos")
    .insert({
      organizacao_id: orgId,
      tipo: "pessoa",
      nome: nome || "Lead Meta",
      sobrenome: sobrenome || null,
      email: email || null,
      telefone: telefone || null,
      cargo: dados.cargo || null,
      origem: "meta_lead_ads",
      status: "ativo",
    })
    .select("id")
    .single();

  if (errContato || !novoContato) {
    console.error(`[meta-leadgen-webhook] Erro ao criar contato:`, errContato);
    return null;
  }

  return novoContato.id;
}
