import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarOrganizacao, type Organizacao } from '../services/admin.api'
import { useCepLookup } from '../hooks/useCepLookup'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  X,
  Save,
  Loader2,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Tab de Dados da Empresa
 * Exibe todos os campos cadastrados no wizard e permite edição
 */

interface Props {
  orgId: string
  org: Organizacao
}

// Máscara de telefone
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// Máscara de CEP
function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function OrganizacaoDadosTab({ orgId, org }: Props) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: org.nome || '',
    segmento: org.segmento || '',
    email: org.email || '',
    telefone: org.telefone || '',
    website: org.website || '',
    endereco_cep: org.endereco_cep || '',
    endereco_logradouro: org.endereco_logradouro || '',
    endereco_numero: org.endereco_numero || '',
    endereco_complemento: org.endereco_complemento || '',
    endereco_bairro: org.endereco_bairro || '',
    endereco_cidade: org.endereco_cidade || '',
    endereco_estado: org.endereco_estado || '',
  })

  // Reset form when org changes
  useEffect(() => {
    setFormData({
      nome: org.nome || '',
      segmento: org.segmento || '',
      email: org.email || '',
      telefone: org.telefone || '',
      website: org.website || '',
      endereco_cep: org.endereco_cep || '',
      endereco_logradouro: org.endereco_logradouro || '',
      endereco_numero: org.endereco_numero || '',
      endereco_complemento: org.endereco_complemento || '',
      endereco_bairro: org.endereco_bairro || '',
      endereco_cidade: org.endereco_cidade || '',
      endereco_estado: org.endereco_estado || '',
    })
  }, [org])

  const { buscarCep, isLoading: buscandoCep } = useCepLookup()

  const handleCepBlur = async () => {
    const cepDigits = formData.endereco_cep.replace(/\D/g, '')
    if (cepDigits.length === 8) {
      const data = await buscarCep(cepDigits)
      if (data) {
        setFormData((prev) => ({
          ...prev,
          endereco_logradouro: data.logradouro || prev.endereco_logradouro,
          endereco_bairro: data.bairro || prev.endereco_bairro,
          endereco_cidade: data.cidade || prev.endereco_cidade,
          endereco_estado: data.estado || prev.endereco_estado,
        }))
      }
    }
  }

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Organizacao>) => atualizarOrganizacao(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizacao', orgId] })
      setIsEditing(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleCancel = () => {
    setFormData({
      nome: org.nome || '',
      segmento: org.segmento || '',
      email: org.email || '',
      telefone: org.telefone || '',
      website: org.website || '',
      endereco_cep: org.endereco_cep || '',
      endereco_logradouro: org.endereco_logradouro || '',
      endereco_numero: org.endereco_numero || '',
      endereco_complemento: org.endereco_complemento || '',
      endereco_bairro: org.endereco_bairro || '',
      endereco_cidade: org.endereco_cidade || '',
      endereco_estado: org.endereco_estado || '',
    })
    setIsEditing(false)
  }

  // handleCepBlur foi movido para cima
  // Formatar endereço completo para exibição
  const enderecoCompleto = [
    formData.endereco_logradouro,
    formData.endereco_numero,
    formData.endereco_complemento,
    formData.endereco_bairro,
    formData.endereco_cidade && formData.endereco_estado
      ? `${formData.endereco_cidade} - ${formData.endereco_estado}`
      : formData.endereco_cidade || formData.endereco_estado,
    formData.endereco_cep,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-6">
      {/* Header com botão de editar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              form="dados-form"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        )}
      </div>

      {updateMutation.isError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Erro ao salvar: {(updateMutation.error as Error)?.message}
          </p>
        </div>
      )}

      <form id="dados-form" onSubmit={handleSubmit}>
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {/* Nome da Empresa */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Nome da Empresa</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              ) : (
                <p className="text-sm font-medium text-foreground truncate">{formData.nome || '-'}</p>
              )}
            </div>
          </div>

          {/* Segmento */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Segmento</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.segmento}
                  onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm font-medium text-foreground truncate capitalize">{formData.segmento || '-'}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Email da Empresa</p>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm font-medium text-foreground truncate">{formData.email || '-'}</p>
              )}
            </div>
          </div>

          {/* Telefone */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Telefone</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm font-medium text-foreground truncate">{formData.telefone || '-'}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Website</p>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://empresa.com.br"
                  className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : formData.website ? (
                <a
                  href={formData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate block"
                >
                  {formData.website}
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">-</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                {isEditing ? (
                  <div className="space-y-3">
                    {/* CEP */}
                    <div className="max-w-[160px]">
                      <label className="text-xs text-muted-foreground">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.endereco_cep}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_cep: formatCep(e.target.value) })
                          }
                          onBlur={handleCepBlur}
                          placeholder="00000-000"
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {buscandoCep && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Logradouro + Número */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Logradouro</label>
                        <input
                          type="text"
                          value={formData.endereco_logradouro}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_logradouro: e.target.value })
                          }
                          placeholder="Rua, Av..."
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Número</label>
                        <input
                          type="text"
                          value={formData.endereco_numero}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_numero: e.target.value })
                          }
                          placeholder="123"
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Complemento + Bairro */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Complemento</label>
                        <input
                          type="text"
                          value={formData.endereco_complemento}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_complemento: e.target.value })
                          }
                          placeholder="Sala, Andar..."
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Bairro</label>
                        <input
                          type="text"
                          value={formData.endereco_bairro}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_bairro: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Cidade + Estado */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Cidade</label>
                        <input
                          type="text"
                          value={formData.endereco_cidade}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_cidade: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">UF</label>
                        <input
                          type="text"
                          value={formData.endereco_estado}
                          onChange={(e) =>
                            setFormData({ ...formData, endereco_estado: e.target.value.toUpperCase().slice(0, 2) })
                          }
                          maxLength={2}
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {enderecoCompleto || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
