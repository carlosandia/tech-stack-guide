/**
 * AIDEV-NOTE: Detalhe de uma submissão individual
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, MapPin, Globe, Monitor, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SubmissaoFormulario } from '../../services/formularios.api'

interface Props {
  submissao: SubmissaoFormulario
  onVoltar: () => void
}

export function SubmissaoDetalhe({ submissao, onVoltar }: Props) {
  const dados = submissao.dados || {}

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onVoltar} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Dados do formulário */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Dados Enviados</h3>
          {Object.entries(dados).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum dado registrado</p>
          ) : (
            <dl className="space-y-2">
              {Object.entries(dados).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                  <dd className="text-sm text-foreground mt-0.5">{String(value ?? '-')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Metadados */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Informações</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Data</dt>
                  <dd className="text-foreground">
                    {format(new Date(submissao.criado_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">User Agent</dt>
                  <dd className="text-foreground text-xs break-all">{submissao.user_agent || '-'}</dd>
                </div>
              </div>

              {(submissao.geo_cidade || submissao.geo_estado || submissao.geo_pais) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Localização</dt>
                    <dd className="text-foreground">
                      {[submissao.geo_cidade, submissao.geo_estado, submissao.geo_pais].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                </div>
              )}

              {submissao.lead_score != null && (
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Lead Score</dt>
                    <dd className="text-foreground font-medium">{submissao.lead_score}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* UTMs */}
          {(submissao.utm_source || submissao.utm_medium || submissao.utm_campaign) && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">UTMs</h3>
              <dl className="space-y-1 text-sm">
                {submissao.utm_source && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="text-foreground">{submissao.utm_source}</dd>
                  </div>
                )}
                {submissao.utm_medium && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Medium</dt>
                    <dd className="text-foreground">{submissao.utm_medium}</dd>
                  </div>
                )}
                {submissao.utm_campaign && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Campaign</dt>
                    <dd className="text-foreground">{submissao.utm_campaign}</dd>
                  </div>
                )}
                {submissao.utm_term && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Term</dt>
                    <dd className="text-foreground">{submissao.utm_term}</dd>
                  </div>
                )}
                {submissao.utm_content && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Content</dt>
                    <dd className="text-foreground">{submissao.utm_content}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
