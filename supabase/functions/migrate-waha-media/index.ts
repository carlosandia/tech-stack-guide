/**
 * AIDEV-NOTE: Edge function temporária para migrar mídias antigas do WAHA para Supabase Storage
 * Busca mensagens com media_url apontando para WAHA, baixa e re-faz upload no bucket chat-media
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get WAHA config
    const { data: wahaConfig } = await supabaseAdmin
      .from("configuracoes_globais")
      .select("configuracoes")
      .eq("plataforma", "waha")
      .maybeSingle();

    const wahaApiUrl = (wahaConfig?.configuracoes as Record<string, string>)?.api_url?.replace(/\/+$/, "") || "";
    const wahaApiKey = (wahaConfig?.configuracoes as Record<string, string>)?.api_key || "";

    if (!wahaApiUrl || !wahaApiKey) {
      return new Response(JSON.stringify({ error: "WAHA config not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find messages with WAHA URLs
    const { data: messages, error } = await supabaseAdmin
      .from("mensagens")
      .select("id, media_url, media_mimetype, conversa_id, message_id")
      .like("media_url", "%waha.renovedigital.com.br%")
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[migrate-waha-media] Found ${messages?.length || 0} messages to migrate`);

    const results: Array<{ id: string; status: string; newUrl?: string }> = [];

    for (const msg of messages || []) {
      try {
        const wahaUrl = msg.media_url as string;
        
        // Download from WAHA
        const response = await fetch(wahaUrl, {
          headers: { "X-Api-Key": wahaApiKey },
        });

        if (!response.ok) {
          results.push({ id: msg.id, status: `download_failed_${response.status}` });
          continue;
        }

        const mediaBlob = await response.arrayBuffer();
        const mediaBytes = new Uint8Array(mediaBlob);

        // Determine extension
        const mime = (msg.media_mimetype as string) || "";
        const extMap: Record<string, string> = {
          "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
          "video/mp4": "mp4", "audio/ogg": "ogg", "audio/ogg; codecs=opus": "ogg",
          "audio/mpeg": "mp3",
        };
        const ext = extMap[mime.toLowerCase()] || mime.split("/")[1]?.split(";")[0] || "bin";

        // Upload to Storage
        const messageIdSafe = (msg.message_id as string).replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `conversas/${msg.conversa_id}/${messageIdSafe}.${ext}`;
        const contentType = mime || "application/octet-stream";

        const { error: uploadError } = await supabaseAdmin.storage
          .from("chat-media")
          .upload(storagePath, mediaBytes, { contentType, upsert: true });

        if (uploadError) {
          results.push({ id: msg.id, status: `upload_failed: ${uploadError.message}` });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("chat-media")
          .getPublicUrl(storagePath);

        const newUrl = publicUrlData?.publicUrl;
        if (!newUrl) {
          results.push({ id: msg.id, status: "no_public_url" });
          continue;
        }

        // Update message
        const { error: updateError } = await supabaseAdmin
          .from("mensagens")
          .update({ media_url: newUrl, atualizado_em: new Date().toISOString() })
          .eq("id", msg.id);

        if (updateError) {
          results.push({ id: msg.id, status: `update_failed: ${updateError.message}` });
        } else {
          results.push({ id: msg.id, status: "migrated", newUrl });
          console.log(`[migrate-waha-media] ✅ Migrated ${msg.id} -> ${newUrl}`);
        }
      } catch (e) {
        results.push({ id: msg.id, status: `error: ${e.message}` });
      }
    }

    return new Response(JSON.stringify({ migrated: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
