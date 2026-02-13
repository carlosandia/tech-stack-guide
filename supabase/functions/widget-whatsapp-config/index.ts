/**
 * AIDEV-NOTE: Edge Function pública que retorna a config do widget WhatsApp
 * para um dado organizacao_id. Chamada pelo script embed no site do cliente.
 * Não requer autenticação — dados são públicos (config do widget).
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

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

    // Buscar config do widget
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
        // Manter ordem original
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
