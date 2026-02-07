/**
 * AIDEV-NOTE: Aba Documentos (RF-14.3 Tab 3)
 * Placeholder - upload para Supabase Storage será implementado em iteração futura
 */

import { FileText } from 'lucide-react'

interface AbaDocumentosProps {
  oportunidadeId: string
}

export function AbaDocumentos({ oportunidadeId: _id }: AbaDocumentosProps) {
  return (
    <div className="text-center py-8 space-y-3">
      <FileText className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <div>
        <p className="text-sm font-medium text-foreground">Documentos</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload de documentos será disponibilizado em breve.
        </p>
        <p className="text-xs text-muted-foreground">
          Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
        </p>
      </div>
    </div>
  )
}
