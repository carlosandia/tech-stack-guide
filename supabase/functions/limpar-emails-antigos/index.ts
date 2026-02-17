import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para limpeza automática de emails antigos (TTL)
 * - Deleta emails da lixeira com mais de 30 dias
 * - Soft delete de emails arquivados com mais de 90 dias
 * Executada via pg_cron diariamente às 3h
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const agora = new Date().toISOString();

    // 1. Deletar fisicamente emails da lixeira com mais de 30 dias
    const dataLimiteTrash = new Date();
    dataLimiteTrash.setDate(dataLimiteTrash.getDate() - 30);

    const { data: trashDeleted, error: trashError } = await supabase
      .from("emails_recebidos")
      .delete()
      .eq("pasta", "trash")
      .lt("atualizado_em", dataLimiteTrash.toISOString())
      .select("id");

    if (trashError) {
      console.error("[limpar-emails] Erro ao limpar lixeira:", trashError.message);
    }

    const trashCount = trashDeleted?.length || 0;
    console.log(`[limpar-emails] Lixeira: ${trashCount} emails removidos (>30 dias)`);

    // 2. Soft delete de emails arquivados com mais de 90 dias
    const dataLimiteArchived = new Date();
    dataLimiteArchived.setDate(dataLimiteArchived.getDate() - 90);

    const { data: archivedUpdated, error: archivedError } = await supabase
      .from("emails_recebidos")
      .update({ deletado_em: agora })
      .eq("pasta", "archived")
      .is("deletado_em", null)
      .lt("atualizado_em", dataLimiteArchived.toISOString())
      .select("id");

    if (archivedError) {
      console.error("[limpar-emails] Erro ao limpar arquivados:", archivedError.message);
    }

    const archivedCount = archivedUpdated?.length || 0;
    console.log(`[limpar-emails] Arquivados: ${archivedCount} emails marcados como deletados (>90 dias)`);

    // 3. Limpar emails já soft-deleted há mais de 30 dias (limpeza definitiva)
    const dataLimiteSoftDeleted = new Date();
    dataLimiteSoftDeleted.setDate(dataLimiteSoftDeleted.getDate() - 30);

    const { data: softDeleted, error: softDeleteError } = await supabase
      .from("emails_recebidos")
      .delete()
      .not("deletado_em", "is", null)
      .lt("deletado_em", dataLimiteSoftDeleted.toISOString())
      .select("id");

    if (softDeleteError) {
      console.error("[limpar-emails] Erro ao purgar soft-deleted:", softDeleteError.message);
    }

    const purgedCount = softDeleted?.length || 0;
    console.log(`[limpar-emails] Purge: ${purgedCount} emails definitivamente removidos`);

    return new Response(
      JSON.stringify({
        sucesso: true,
        lixeira_removidos: trashCount,
        arquivados_soft_deleted: archivedCount,
        purge_definitivo: purgedCount,
        executado_em: agora,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[limpar-emails] Erro:", error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        mensagem: "Erro interno na limpeza",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
