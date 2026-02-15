/**
 * AIDEV-NOTE: Modal de Importação CSV/XLSX - Wizard 4 etapas
 * Conforme PRD-06 RF-008 - Admin Only
 * Etapa 1: Upload, Etapa 2: Mapeamento, Etapa 3: Segmentação, Etapa 4: Resumo
 */

import { useState, useRef, useCallback, forwardRef } from 'react'
import { X, Upload, FileSpreadsheet, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react'
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

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const separator = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: ParsedRow = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })

  return { headers, rows }
}

export const ImportarContatosModal = forwardRef<HTMLDivElement, ImportarContatosModalProps>(function ImportarContatosModal({ open, onClose }, _ref) {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [tipoContato, setTipoContato] = useState<TipoContato>('pessoa')
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({ headers: [], rows: [] })
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [segmentoOpcao, setSegmentoOpcao] = useState<'nenhum' | 'existente' | 'novo'>('nenhum')
  const [segmentoId, setSegmentoId] = useState('')
  const [novoSegmentoNome, setNovoSegmentoNome] = useState('')
  const [novoSegmentoCor, setNovoSegmentoCor] = useState<string>(CORES_SEGMENTOS[0])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ importados: number; erros: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      setError('Para XLSX, o processamento será feito pelo backend. Por enquanto, use CSV.')
    }
  }, [tipoContato])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileChange(droppedFile)
  }, [handleFileChange])

  const handleImport = async () => {
    setImporting(true)
    try {
      // Build rows from mapping
      const campos = Object.entries(mapping).filter(([, v]) => v)
      const contatos = parsedData.rows.map(row => {
        const obj: Record<string, string> = { tipo: tipoContato }
        campos.forEach(([csvCol, crmField]) => {
          if (row[csvCol]) obj[crmField] = row[csvCol]
        })
        return obj
      })

      // For now, import one by one via API (batch import should be backend)
      const { contatosApi } = await import('../services/contatos.api')
      let importados = 0
      let erros = 0

      for (const contato of contatos.slice(0, 100)) {
        try {
          await contatosApi.criar(contato)
          importados++
        } catch {
          erros++
        }
      }

      // If segment was selected, we'd need to link - simplified for now
      setImportResult({ importados, erros })
      setStep(4)
    } catch {
      setError('Erro ao importar contatos')
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setFile(null)
    setParsedData({ headers: [], rows: [] })
    setMapping({})
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
                  onChange={(e) => setTipoContato(e.target.value as TipoContato)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pessoa">Pessoa</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Mapeamento de Campos</p>
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
            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
ImportarContatosModal.displayName = 'ImportarContatosModal'
