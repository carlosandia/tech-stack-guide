import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AIDEV-NOTE: Edge Function para tracking de abertura de emails
 * Serve um pixel 1x1 transparente e registra a abertura
 * GET /email-tracking?t={tracking_id}
 */

const TRANSPARENT_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

Deno.serve(async (req) => {
  // Apenas GET
  if (req.method !== "GET") {
    return new Response(null, { status: 405 });
  }

  const url = new URL(req.url);
  const trackingId = url.searchParams.get("t");

  if (!trackingId) {
    return new Response(TRANSPARENT_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  // Registrar abertura de forma assíncrona (não bloqueia o pixel)
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Atualizar apenas se ainda não foi aberto (primeira abertura)
    // e incrementar total_aberturas
    const now = new Date().toISOString();

    await supabase.rpc("registrar_abertura_email", { p_tracking_id: trackingId });

    console.log(`[email-tracking] Abertura registrada: ${trackingId}`);
  } catch (err) {
    console.error("[email-tracking] Erro:", (err as Error).message);
    // Não falha — sempre retorna o pixel
  }

  return new Response(TRANSPARENT_PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
