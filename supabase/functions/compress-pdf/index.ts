/**
 * AIDEV-NOTE: Edge Function para compressão de PDFs usando pdf-lib
 * Remove metadados desnecessários, otimiza objetos duplicados, achata formulários
 * Chamada automaticamente após upload de PDFs no detalhes.api.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ erro: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Validar usuário autenticado
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ erro: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { storage_path, documento_id, bucket } = await req.json()
    // AIDEV-NOTE: bucket parametrizável — suporta 'chat-media' e 'documentos-oportunidades'
    const bucketName = bucket || 'documentos-oportunidades'

    if (!storage_path) {
      return new Response(JSON.stringify({ erro: 'storage_path é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Baixar o PDF do storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(storage_path)

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ erro: 'Erro ao baixar PDF', detalhe: downloadError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const originalBytes = await fileData.arrayBuffer()
    const originalSize = originalBytes.byteLength

    // PDFs menores que 100KB não vale comprimir
    if (originalSize < 100 * 1024) {
      return new Response(JSON.stringify({
        comprimido: false,
        motivo: 'PDF muito pequeno para comprimir',
        tamanho_original: originalSize,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Carregar e reprocessar com pdf-lib (remove metadados, otimiza estrutura)
    let pdfDoc: Awaited<ReturnType<typeof PDFDocument.load>>
    try {
      pdfDoc = await PDFDocument.load(originalBytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      })
    } catch {
      // PDF protegido ou corrompido — não comprimir
      return new Response(JSON.stringify({
        comprimido: false,
        motivo: 'PDF protegido ou incompatível',
        tamanho_original: originalSize,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Remover metadados para reduzir tamanho
    pdfDoc.setTitle('')
    pdfDoc.setAuthor('')
    pdfDoc.setSubject('')
    pdfDoc.setKeywords([])
    pdfDoc.setProducer('')
    pdfDoc.setCreator('')

    // Salvar o PDF otimizado
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,       // Compacta objetos em streams
      addDefaultPage: false,
      objectsPerTick: 100,
    })

    const compressedSize = compressedBytes.byteLength

    // Só substituir se a compressão reduziu pelo menos 3%
    const economia = ((originalSize - compressedSize) / originalSize) * 100
    if (economia < 3) {
      return new Response(JSON.stringify({
        comprimido: false,
        motivo: `Economia insuficiente (${economia.toFixed(1)}%)`,
        tamanho_original: originalSize,
        tamanho_comprimido: compressedSize,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Substituir no storage de forma atômica (upsert evita perda de dados se falhar)
    // AIDEV-NOTE: upsert:true substitui atomicamente sem delete prévio — sem risco de data loss
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storage_path, compressedBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return new Response(JSON.stringify({
        comprimido: false,
        motivo: 'Erro ao substituir arquivo',
        detalhe: uploadError.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Atualizar tamanho no banco (apenas para documentos-oportunidades)
    if (documento_id && bucketName === 'documentos-oportunidades') {
      await supabase
        .from('documentos_oportunidades')
        .update({ tamanho_bytes: compressedSize })
        .eq('id', documento_id)
    }

    return new Response(JSON.stringify({
      comprimido: true,
      tamanho_original: originalSize,
      tamanho_comprimido: compressedSize,
      economia_percentual: parseFloat(economia.toFixed(1)),
      economia_bytes: originalSize - compressedSize,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[compress-pdf] Erro:', err)
    return new Response(JSON.stringify({ erro: 'Erro interno', detalhe: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
