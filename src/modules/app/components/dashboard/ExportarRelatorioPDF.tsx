/**
 * AIDEV-NOTE: Exportação do dashboard como PDF usando html2canvas + jsPDF.
 * Captura o container do dashboard e gera PDF A4 landscape com paginação automática.
 */

import { useState, type RefObject } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ExportarRelatorioPDFProps {
  containerRef: RefObject<HTMLDivElement>
}

export default function ExportarRelatorioPDF({ containerRef }: ExportarRelatorioPDFProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!containerRef.current || exporting) return

    setExporting(true)
    toast.info('Gerando relatório PDF...')

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // A4 landscape: 297mm x 210mm
      const pageWidth = 297
      const pageHeight = 210
      const margin = 10

      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2

      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('l', 'mm', 'a4')

      // Header na primeira página
      pdf.setFontSize(14)
      pdf.text('Relatório de Desempenho', margin, margin + 5)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, margin + 11)
      pdf.setTextColor(0, 0, 0)

      const headerOffset = 16
      const firstPageContent = contentHeight - headerOffset
      let remainingHeight = imgHeight
      let sourceY = 0
      let page = 0

      while (remainingHeight > 0) {
        const sliceHeight = page === 0 ? firstPageContent : contentHeight
        const sliceY = page === 0 ? margin + headerOffset : margin

        if (page > 0) pdf.addPage()

        // Calcular a proporção de corte do canvas
        const canvasSliceHeight = (sliceHeight / imgHeight) * canvas.height

        // Criar canvas temporário para a fatia
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = Math.min(canvasSliceHeight, canvas.height - sourceY)
        const ctx = sliceCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sliceCanvas.height,
            0, 0, sliceCanvas.width, sliceCanvas.height
          )
        }

        const sliceImgData = sliceCanvas.toDataURL('image/png')
        const renderedHeight = (sliceCanvas.height * imgWidth) / canvas.width

        pdf.addImage(sliceImgData, 'PNG', margin, sliceY, imgWidth, renderedHeight)

        sourceY += sliceCanvas.height
        remainingHeight -= sliceHeight
        page++
      }

      pdf.save(`relatorio-desempenho-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      toast.success('PDF exportado com sucesso!')
    } catch (err) {
      console.error('[ExportarPDF] Erro:', err)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      title="Exportar PDF"
    >
      <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-pulse' : ''}`} />
      <span className="hidden sm:inline">{exporting ? 'Gerando...' : 'Exportar'}</span>
    </button>
  )
}
