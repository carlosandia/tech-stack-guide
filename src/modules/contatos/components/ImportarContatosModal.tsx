/**
 * AIDEV-NOTE: Modal de Importação CSV/XLSX - Wizard 4 etapas
 * Conforme PRD-06 RF-008 - Admin Only
 * Etapa 1: Upload, Etapa 2: Mapeamento, Etapa 3: Segmentação, Etapa 4: Resumo
 */

import { useState, useRef, useCallback, forwardRef } from 'react'
import { X, Upload, FileSpreadsheet, ChevronRight, ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSegmentos } from '../hooks/useSegmentos'
import { CORES_SEGMENTOS } from '../schemas/contatos.schema'
import type { TipoContato } from '../services/contatos.api'

interface ImportarContatosModalProps {
  open: boolean
  onClose: () => void
}

type Step = 1 | 2 | 3 | 4

interface ParsedRow {
  [key: string]: string
}

const CAMPOS_PESSOA = [
  { value: '', label: '— Ignorar —' },
  { value: 'nome', label: 'Nome *' },
  { value: 'sobrenome', label: 'Sobrenome' },
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'linkedin_url', label: 'LinkedIn' },
  { value: 'observacoes', label: 'Observações' },
]

const CAMPOS_EMPRESA = [
  { value: '', label: '— Ignorar —' },
  { value: 'razao_social', label: 'Razão Social *' },
  { value: 'nome_fantasia', label: 'Nome Fantasia' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'website', label: 'Website' },
  { value: 'segmento', label: 'Segmento de Mercado' },
  { value: 'porte', label: 'Porte' },
  { value: 'observacoes', label: 'Observações' },
]

/**
 * AIDEV-NOTE: Parser CSV robusto que respeita campos entre aspas
 * Trata corretamente separadores dentro de aspas e aspas escapadas ("")
 */
function parseCSVLine(line: string, separator: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // pula aspas escapadas
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === separator) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const separator = lines[0].includes(';') ? ';' : ','
  const headers = parseCSVLine(lines[0], separator)
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line, separator)
    const row: ParsedRow = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })

  return { headers, rows }
}

/**
 * AIDEV-NOTE: Parser XLSX usando SheetJS (client-side)
 * Converte para o mesmo formato { headers, rows } do CSV
 */
function parseXLSX(buffer: ArrayBuffer): { headers: string[]; rows: ParsedRow[] } {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

  if (jsonData.length === 0) return { headers: [], rows: [] }

  const headers = Object.keys(jsonData[0])
  const rows: ParsedRow[] = jsonData.map(row => {
    const parsed: ParsedRow = {}
    headers.forEach(h => { parsed[h] = String(row[h] ?? '') })
    return parsed
  })

  return { headers, rows }
}

export const ImportarContatosModal = forwardRef<HTMLDivElement, ImportarContatosModalProps>(function ImportarContatosModal({ open, onClose }, _ref) {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [tipoContato, setTipoContato] = useState<TipoContato>('pessoa')
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({ headers: [], rows: [] })
  const [mapping, setMapping] = useState<Record<string, string>>({})
  // AIDEV-NOTE: Armazena mapeamento por tipo para restaurar ao trocar
  const mappingPorTipo = useRef<Record<TipoContato, Record<string, string>>>({ pessoa: {}, empresa: {} })
  const [segmentoOpcao, setSegmentoOpcao] = useState<'nenhum' | 'existente' | 'novo'>('nenhum')
  const [segmentoId, setSegmentoId] = useState('')
  const [novoSegmentoNome, setNovoSegmentoNome] = useState('')
  const [novoSegmentoCor, setNovoSegmentoCor] = useState<string>(CORES_SEGMENTOS[0])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ importados: number; erros: number } | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string }>({ current: 0, total: 0, status: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const { data: segmentosData } = useSegmentos()
  const segmentos = segmentosData?.segmentos || []

  const handleFileChange = useCallback(async (selectedFile: File) => {
    setError(null)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Arquivo excede o limite de 5MB')
      return
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Formato inválido. Use CSV ou XLSX')
      return
    }

    setFile(selectedFile)

    if (ext === 'csv') {
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      if (parsed.rows.length > 10000) {
        setError('Máximo de 10.000 registros por arquivo')
        return
      }
      setParsedData(parsed)
      // Auto-map by name similarity
      const autoMap: Record<string, string> = {}
      const campos = tipoContato === 'pessoa' ? CAMPOS_PESSOA : CAMPOS_EMPRESA
      parsed.headers.forEach(h => {
        const hl = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const match = campos.find(c => c.value && hl.includes(c.value.replace('_', '')))
        if (match) autoMap[h] = match.value
      })
      setMapping(autoMap)
    } else {
      // AIDEV-NOTE: Parse XLSX/XLS no client-side via SheetJS
      try {
        const buffer = await selectedFile.arrayBuffer()
        const parsed = parseXLSX(buffer)
        if (parsed.rows.length > 10000) {
          setError('Máximo de 10.000 registros por arquivo')
          return
        }
        setParsedData(parsed)
        const autoMap: Record<string, string> = {}
        const campos = tipoContato === 'pessoa' ? CAMPOS_PESSOA : CAMPOS_EMPRESA
        parsed.headers.forEach(h => {
          const hl = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const match = campos.find(c => c.value && hl.includes(c.value.replace('_', '')))
          if (match) autoMap[h] = match.value
        })
        setMapping(autoMap)
      } catch (xlsxErr: any) {
        console.error('[import] Erro ao ler XLSX:', xlsxErr)
        setError(`Erro ao ler arquivo XLSX: ${xlsxErr?.message || 'formato inválido'}`)
      }
    }
  }, [tipoContato])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileChange(droppedFile)
  }, [handleFileChange])

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    const totalRows = parsedData.rows.length
    setImportProgress({ current: 0, total: totalRows, status: 'Preparando importação...' })
    try {
      const { contatosApi, segmentosApi } = await import('../services/contatos.api')
      let targetSegmentoId: string | null = null

      if (segmentoOpcao === 'novo' && novoSegmentoNome.trim()) {
        setImportProgress(p => ({ ...p, status: 'Criando segmento...' }))
        try {
          const novoSeg = await segmentosApi.criar({
            nome: novoSegmentoNome.trim(),
            cor: novoSegmentoCor,
          })
          if (novoSeg?.id) {
            targetSegmentoId = novoSeg.id
            toast.success(`Segmento "${novoSegmentoNome.trim()}" criado`)
          } else {
            toast.error('Erro: segmento criado sem ID')
            setError('Falha ao criar segmento - resposta sem ID')
            setImporting(false)
            return
          }
        } catch (segErr: any) {
          console.error('[import] Erro ao criar segmento:', segErr)
          toast.error(`Erro ao criar segmento: ${segErr?.message || 'desconhecido'}`)
          setError(`Falha ao criar segmento: ${segErr?.message || 'erro desconhecido'}`)
          setImporting(false)
          return
        }
      } else if (segmentoOpcao === 'existente' && segmentoId) {
        targetSegmentoId = segmentoId
      }

      setImportProgress(p => ({ ...p, status: 'Importando contatos...' }))
      const campos = Object.entries(mapping).filter(([, v]) => v)
      const contatos = parsedData.rows.map(row => {
        const obj: Record<string, string> = { tipo: tipoContato }
        campos.forEach(([csvCol, crmField]) => {
          if (row[csvCol]) obj[crmField] = row[csvCol]
        })
        return obj
      })

      let importados = 0
      let erros = 0
      const importedIds: string[] = []

      // AIDEV-NOTE: Sem limite artificial - processa todos os registros
      // Delay a cada 50 para não travar a UI
      for (let i = 0; i < contatos.length; i++) {
        try {
          const created = await contatosApi.criar(contatos[i])
          importados++
          if (created?.id) importedIds.push(created.id)
        } catch (criarErr) {
          console.error('[import] Erro ao criar contato:', criarErr)
          erros++
        }
        setImportProgress({ current: i + 1, total: totalRows, status: `Importando contato ${i + 1} de ${totalRows}...` })
        if ((i + 1) % 50 === 0) {
          await new Promise(r => setTimeout(r, 100))
        }
      }

      if (targetSegmentoId && importedIds.length > 0) {
        setImportProgress(p => ({ ...p, status: 'Vinculando segmento aos contatos...' }))
        try {
          await contatosApi.segmentarLote({
            ids: importedIds,
            adicionar: [targetSegmentoId],
            remover: [],
          })
          toast.success(`${importedIds.length} contato(s) vinculados ao segmento`)
        } catch (linkErr: any) {
          console.error('[import] Erro ao vincular segmento:', linkErr)
          toast.error(`Erro ao vincular contatos ao segmento: ${linkErr?.message || 'desconhecido'}`)
        }
      }

      setImportResult({ importados, erros })
      // AIDEV-NOTE: Invalidar cache para atualizar listagem imediatamente
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      setStep(4)
    } catch (globalErr: any) {
      console.error('[import] Erro geral:', globalErr)
      setError(`Erro ao importar contatos: ${globalErr?.message || 'desconhecido'}`)
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setFile(null)
    setParsedData({ headers: [], rows: [] })
    setMapping({})
    mappingPorTipo.current = { pessoa: {}, empresa: {} }
    setSegmentoOpcao('nenhum')
    setSegmentoId('')
    setNovoSegmentoNome('')
    setError(null)
    setImportResult(null)
    onClose()
  }

  if (!open) return null

  const camposDisponiveis = tipoContato === 'pessoa' ? CAMPOS_PESSOA : CAMPOS_EMPRESA
  const temCampoObrigatorio = tipoContato === 'pessoa'
    ? Object.values(mapping).includes('nome')
    : Object.values(mapping).includes('razao_social')

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={resetModal} />
      <div className="relative bg-background rounded-lg shadow-lg w-[calc(100%-32px)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col z-10 mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Importar Contatos</h3>
            <p className="text-sm text-muted-foreground">Etapa {step} de 4</p>
          </div>
          <button onClick={resetModal} className="p-2 hover:bg-accent rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsedData.rows.length} registros encontrados
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Arraste seu arquivo aqui</p>
                    <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-2">Formatos: CSV, XLSX | Máximo: 5MB</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileChange(f)
                  }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Mapeamento */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tipo de Contato</label>
                <select
                  value={tipoContato}
                  onChange={(e) => {
                    const novoTipo = e.target.value as TipoContato
                    // AIDEV-NOTE: Salvar mapeamento atual antes de trocar
                    mappingPorTipo.current[tipoContato] = { ...mapping }
                    setTipoContato(novoTipo)
                    // Restaurar mapeamento salvo do novo tipo, se existir
                    const salvo = mappingPorTipo.current[novoTipo]
                    const temSalvo = Object.values(salvo).some(v => v)
                    if (temSalvo) {
                      setMapping({ ...salvo })
                    } else {
                      // Auto-map para o novo tipo
                      const novosCampos = novoTipo === 'pessoa' ? CAMPOS_PESSOA : CAMPOS_EMPRESA
                      const autoMap: Record<string, string> = {}
                      const camposUsados = new Set<string>()
                      parsedData.headers.forEach(h => {
                        const hl = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        const match = novosCampos.find(c => c.value && !camposUsados.has(c.value) && hl.includes(c.value.replace('_', '')))
                        if (match) {
                          autoMap[h] = match.value
                          camposUsados.add(match.value)
                        }
                      })
                      setMapping(autoMap)
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pessoa">Pessoa</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium min-w-[150px]">Planilha</span>
                  <span className="w-4" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium flex-1">Campo CRM</span>
                </div>
                {parsedData.headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <span className="text-sm text-foreground min-w-[150px] truncate" title={header}>{header}</span>
                    <span className="text-muted-foreground">→</span>
                    <select
                      value={mapping[header] || ''}
                      onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {camposDisponiveis.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {!temCampoObrigatorio && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Mapeie o campo obrigatório: {tipoContato === 'pessoa' ? 'Nome' : 'Razão Social'}
                  </p>
                </div>
              )}

              {/* Preview */}
              {parsedData.rows.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preview (primeiras 3 linhas):</p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          {parsedData.headers.map(h => (
                            <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.rows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {parsedData.headers.map(h => (
                              <td key={h} className="px-2 py-1.5 text-foreground truncate max-w-[150px]">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Segmentação */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-foreground font-medium">Deseja adicionar estes contatos a um segmento?</p>

              <label className="flex items-center gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-accent/50">
                <input type="radio" name="seg" checked={segmentoOpcao === 'nenhum'} onChange={() => setSegmentoOpcao('nenhum')} className="rounded-full" />
                <span className="text-sm text-foreground">Não adicionar a nenhum segmento</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-accent/50">
                <input type="radio" name="seg" checked={segmentoOpcao === 'existente'} onChange={() => setSegmentoOpcao('existente')} className="rounded-full mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">Adicionar a segmento existente</span>
                  {segmentoOpcao === 'existente' && (
                    <select
                      value={segmentoId}
                      onChange={(e) => setSegmentoId(e.target.value)}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecionar segmento...</option>
                      {segmentos.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-accent/50">
                <input type="radio" name="seg" checked={segmentoOpcao === 'novo'} onChange={() => setSegmentoOpcao('novo')} className="rounded-full mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">Criar novo segmento</span>
                  {segmentoOpcao === 'novo' && (
                    <div className="mt-2 space-y-2">
                      <input
                        value={novoSegmentoNome}
                        onChange={(e) => setNovoSegmentoNome(e.target.value)}
                        placeholder="Nome do segmento"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex gap-1.5">
                        {CORES_SEGMENTOS.slice(0, 6).map(cor => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => setNovoSegmentoCor(cor)}
                            className={`w-6 h-6 rounded-full border-2 ${novoSegmentoCor === cor ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Step 4: Resumo */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              {importResult ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Importação concluída!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {importResult.importados} contato(s) importado(s)
                      {importResult.erros > 0 && `, ${importResult.erros} com erro`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-primary" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">Pronto para importar</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {parsedData.rows.length} {tipoContato === 'pessoa' ? 'pessoa(s)' : 'empresa(s)'} serão importadas
                    </p>
                    {segmentoOpcao === 'existente' && segmentoId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Segmento: {segmentos.find(s => s.id === segmentoId)?.nome}
                      </p>
                    )}
                    {segmentoOpcao === 'novo' && novoSegmentoNome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Novo segmento: {novoSegmentoNome}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetModal} className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors">
              {step === 4 && importResult ? 'Fechar' : 'Cancelar'}
            </button>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!file || parsedData.rows.length === 0}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!temCampoObrigatorio}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && !importing && (
              <button
                onClick={handleImport}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Importar
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && importing && (
              <div className="flex items-center gap-3 px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="min-w-[180px]">
                  <p className="text-xs font-medium text-foreground">{importProgress.status}</p>
                  {importProgress.total > 0 && (
                    <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                      />
                    </div>
                  )}
                  {importProgress.total > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {importProgress.current}/{importProgress.total}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
ImportarContatosModal.displayName = 'ImportarContatosModal'
