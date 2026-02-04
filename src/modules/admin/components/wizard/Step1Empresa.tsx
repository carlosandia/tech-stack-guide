import { useFormContext } from 'react-hook-form'
import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { SEGMENTOS, type CriarOrganizacaoData } from '../../schemas/organizacao.schema'

/**
 * AIDEV-NOTE: Etapa 1 do Wizard - Dados da Empresa
 * Conforme PRD-14 - RF-002
 */

export function Step1Empresa() {
  const [mostrarEndereco, setMostrarEndereco] = useState(false)
  const {
    register,
    formState: { errors },
  } = useFormContext<CriarOrganizacaoData>()

  return (
    <div className="space-y-4">
      {/* Nome da Empresa */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Nome da Empresa <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          {...register('nome')}
          placeholder="Ex: Acme Corp"
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      {/* Segmento */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Segmento <span className="text-destructive">*</span>
        </label>
        <select
          {...register('segmento')}
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="">Selecione um segmento</option>
          {SEGMENTOS.map((seg) => (
            <option key={seg.value} value={seg.value}>
              {seg.label}
            </option>
          ))}
        </select>
        {errors.segmento && (
          <p className="mt-1 text-sm text-destructive">{errors.segmento.message}</p>
        )}
      </div>

      {/* Email da Empresa */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email da Empresa <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          {...register('email')}
          placeholder="contato@empresa.com.br"
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Telefone e Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Telefone
          </label>
          <input
            type="tel"
            {...register('telefone')}
            placeholder="(11) 99999-9999"
            className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Website
          </label>
          <input
            type="url"
            {...register('website')}
            placeholder="https://empresa.com.br"
            className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>
      </div>

      {/* Accordion Endereco */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarEndereco(!mostrarEndereco)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Endereco (opcional)
          </div>
          {mostrarEndereco ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {mostrarEndereco && (
          <div className="p-4 space-y-4 border-t border-border">
            {/* CEP */}
            <div className="max-w-[200px]">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                CEP
              </label>
              <input
                type="text"
                {...register('endereco.cep')}
                placeholder="00000-000"
                maxLength={9}
                className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Logradouro e Numero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Logradouro
                </label>
                <input
                  type="text"
                  {...register('endereco.logradouro')}
                  placeholder="Rua, Av..."
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Numero
                </label>
                <input
                  type="text"
                  {...register('endereco.numero')}
                  placeholder="123"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            {/* Complemento e Bairro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Complemento
                </label>
                <input
                  type="text"
                  {...register('endereco.complemento')}
                  placeholder="Sala 101"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Bairro
                </label>
                <input
                  type="text"
                  {...register('endereco.bairro')}
                  placeholder="Centro"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  {...register('endereco.cidade')}
                  placeholder="Sao Paulo"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Estado
                </label>
                <input
                  type="text"
                  {...register('endereco.estado')}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent uppercase"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
