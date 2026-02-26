/**
 * AIDEV-NOTE: Exportação do dashboard como PDF com modal de seleção de período,
 * rate limit client-side e paginação inteligente por blocos (sem cortar seções).
 */

import { useState, useCallback, type RefObject } from 'react'
import { Download, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { Periodo } from '../../types/relatorio.types'

// ── Rate Limit ──────────────────────────────────────
const RATE_LIMIT_KEY = 'pdf_export_timestamps'
const MAX_EXPORTS_PER_HOUR = 10

function getRecentTimestamps(): number[] {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return []
    const stamps: number[] = JSON.parse(raw)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return stamps.filter((t) => t > oneHourAgo)
  } catch {
    return []
  }
}

function registerExport() {
  const stamps = getRecentTimestamps()
  stamps.push(Date.now())
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(stamps))
}

function getRemainingExports() {
  return Math.max(0, MAX_EXPORTS_PER_HOUR - getRecentTimestamps().length)
}

function getMinutesUntilReset(): number {
  const stamps = getRecentTimestamps()
  if (stamps.length === 0) return 0
  const oldest = Math.min(...stamps)
  const resetAt = oldest + 60 * 60 * 1000
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 60000))
}

// ── Helpers ─────────────────────────────────────────
function periodoLabel(p: Periodo, from?: Date, to?: Date): string {
  switch (p) {
    case '7d': return 'Últimos 7 dias'
    case '30d': return 'Últimos 30 dias'
    case '90d': return 'Últimos 90 dias'
    case 'personalizado':
      if (from && to) return `${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`
      return 'Personalizado'
  }
}

// ── Componente ──────────────────────────────────────
interface ExportarRelatorioPDFProps {
  containerRef: RefObject<HTMLDivElement>
  /** Período atual do dashboard (para opção "usar período atual") */
  dashboardPeriodo?: Periodo
  dashboardDataInicio?: string
  dashboardDataFim?: string
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'personalizado', label: 'Personalizado' },
]

export default function ExportarRelatorioPDF({
  containerRef,
  dashboardPeriodo = '30d',
  dashboardDataInicio,
  dashboardDataFim,
}: ExportarRelatorioPDFProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [useDashboardPeriod, setUseDashboardPeriod] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [remaining, setRemaining] = useState(getRemainingExports)

  const handleOpen = () => {
    setRemaining(getRemainingExports())
    setOpen(true)
  }

  const activePeriodo = useDashboardPeriod ? dashboardPeriodo : periodo
  const activeFrom = useDashboardPeriod
    ? (dashboardDataInicio ? new Date(dashboardDataInicio) : undefined)
    : dateRange.from
  const activeTo = useDashboardPeriod
    ? (dashboardDataFim ? new Date(dashboardDataFim) : undefined)
    : dateRange.to

  const canExport = remaining > 0 && !exporting && (
    activePeriodo !== 'personalizado' || (activeFrom && activeTo)
  )

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) setDateRange(range)
  }

  // ── Geração do PDF com paginação inteligente ──
  const handleExport = useCallback(async () => {
    if (!containerRef.current || !canExport) return

    setExporting(true)
    toast.info('Gerando relatório PDF...')

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      // A4 landscape: 297mm x 210mm
      const pageWidth = 297
      const pageHeight = 210
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2
      const headerOffset = 18
      const footerOffset = 8
      const gapMM = 4

      // Coletar blocos filhos visíveis do container (pular o header/filtros)
      const container = containerRef.current
      const children = Array.from(container.children) as HTMLElement[]
      
      // Filtra apenas elementos visíveis com altura > 0
      const blocks = children.filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.height > 10 && el.offsetParent !== null
      })

      if (blocks.length === 0) {
        toast.error('Nenhum conteúdo visível para exportar.')
        setExporting(false)
        return
      }

      // Calcular fator de conversão px → mm baseado na largura do container
      const containerWidth = container.offsetWidth
      const pxToMm = (px: number) => (px / containerWidth) * contentWidth

      // Agrupar blocos em páginas sem cortar
      type PageGroup = HTMLElement[]
      const pages: PageGroup[] = [[]]
      let usedHeight = headerOffset // primeira página tem header

      for (const block of blocks) {
        const blockHeightMM = pxToMm(block.offsetHeight)

        const availableHeight = pages.length === 1 && pages[0].length === 0
          ? contentHeight - headerOffset - footerOffset
          : contentHeight - footerOffset

        if (usedHeight + blockHeightMM > availableHeight && pages[pages.length - 1].length > 0) {
          pages.push([])
          usedHeight = 0
        }

        pages[pages.length - 1].push(block)
        usedHeight += blockHeightMM + gapMM
      }

      const totalPages = pages.length
      const pdf = new jsPDF('l', 'mm', 'a4')

      // Texto do período para o header
      const periodoTexto = periodoLabel(activePeriodo, activeFrom, activeTo)

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) pdf.addPage()

        let cursorY = margin

        // Header apenas na primeira página
        if (pageIdx === 0) {
          pdf.setFontSize(14)
          pdf.setTextColor(30, 30, 30)
          pdf.text('Relatório de Desempenho', margin, cursorY + 5)
          pdf.setFontSize(8)
          pdf.setTextColor(128, 128, 128)
          pdf.text(
            `Período: ${periodoTexto}  •  Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
            margin,
            cursorY + 11
          )
          pdf.setTextColor(0, 0, 0)
          cursorY += headerOffset
        }

        // Renderizar cada bloco da página
        const pageBlocks = pages[pageIdx]
        for (const block of pageBlocks) {
          const canvas = await html2canvas(block, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          })

          const blockWidthMM = contentWidth
          const blockHeightMM = (canvas.height * blockWidthMM) / canvas.width
          const imgData = canvas.toDataURL('image/png')

          pdf.addImage(imgData, 'PNG', margin, cursorY, blockWidthMM, blockHeightMM)
          cursorY += blockHeightMM + gapMM
        }

        // Rodapé com número da página
        pdf.setFontSize(7)
        pdf.setTextColor(160, 160, 160)
        pdf.text(
          `Página ${pageIdx + 1} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        )
      }

      // Nome do arquivo com período
      const periodoSlug = activePeriodo === 'personalizado' && activeFrom && activeTo
        ? `${format(activeFrom, 'yyyyMMdd')}-${format(activeTo, 'yyyyMMdd')}`
        : activePeriodo
      pdf.save(`relatorio-desempenho-${periodoSlug}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)

      registerExport()
      setRemaining(getRemainingExports())
      toast.success('PDF exportado com sucesso!')
      setOpen(false)
    } catch (err) {
      console.error('[ExportarPDF] Erro:', err)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }, [containerRef, canExport, activePeriodo, activeFrom, activeTo])

  const limitReached = remaining <= 0

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        title="Exportar PDF"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
            <DialogDescription>
              Escolha o período e gere o PDF do dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Switch: usar período do dashboard */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">
                Usar período atual do dashboard
              </label>
              <Switch
                checked={useDashboardPeriod}
                onCheckedChange={setUseDashboardPeriod}
              />
            </div>

            {/* Seleção de período customizado */}
            {!useDashboardPeriod && (
              <div className="space-y-3">
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[500]">
                    {PERIODOS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-sm">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {periodo === 'personalizado' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-sm font-normal">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} — ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
                          : 'Selecionar datas'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[500]" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange as { from: Date; to: Date }}
                        onSelect={handleDateSelect as never}
                        numberOfMonths={2}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Info do período atual do dashboard */}
            {useDashboardPeriod && (
              <p className="text-xs text-muted-foreground">
                Período: <span className="font-medium text-foreground">{periodoLabel(dashboardPeriodo, activeFrom, activeTo)}</span>
              </p>
            )}
          </div>

          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col">
            <Button
              onClick={handleExport}
              disabled={!canExport || limitReached}
              className="w-full"
            >
              <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Gerando...' : 'Gerar PDF'}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              {limitReached
                ? `Limite atingido. Tente novamente em ${getMinutesUntilReset()} min`
                : `${remaining} exportações restantes nesta hora`}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
