/**
 * AIDEV-NOTE: Tab A/B Testing do editor de formulário
 */

import { useState } from 'react'
import { Loader2, Play, Pause, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useTestesAB,
  useVariantesAB,
  useCriarTesteAB,
  useIniciarTesteAB,
  usePausarTesteAB,
  useConcluirTesteAB,
  useCriarVarianteAB,
  useExcluirVarianteAB,
  useAtualizarVarianteAB,
} from '../../hooks/useFormularioAB'
import { TesteABForm } from '../ab/TesteABForm'
import { VariantesList } from '../ab/VariantesList'
import { ResultadosAB } from '../ab/ResultadosAB'
import type { Formulario, TesteAB } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Em Andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-primary/10 text-primary',
  pausado: 'bg-amber-500/10 text-amber-600',
  concluido: 'bg-green-500/10 text-green-600',
}

export function EditorTabsAB({ formulario }: Props) {
  const { data: testes = [], isLoading } = useTestesAB(formulario.id)
  const criarTeste = useCriarTesteAB(formulario.id)
  const iniciarTeste = useIniciarTesteAB(formulario.id)
  const pausarTeste = usePausarTesteAB(formulario.id)
  const concluirTeste = useConcluirTesteAB(formulario.id)

  const [testeExpandido, setTesteExpandido] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full">
      <div className="border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Teste variações para otimizar conversão</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Crie testes A/B para descobrir qual versão do formulário gera mais resultados.
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
              Ex: "Botão verde vs azul" · "Formulário curto vs longo" · "Título diferente"
            </p>
          </div>
        </div>
      </div>

      <TesteABForm
        onCriar={(p) => criarTeste.mutate(p)}
        loading={criarTeste.isPending}
      />

      {testes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhum teste A/B criado
        </p>
      ) : (
        <div className="space-y-3">
          {testes.map((teste) => (
            <TesteABCard
              key={teste.id}
              teste={teste}
              
              expandido={testeExpandido === teste.id}
              onToggle={() => setTesteExpandido(testeExpandido === teste.id ? null : teste.id)}
              onIniciar={() => iniciarTeste.mutate(teste.id)}
              onPausar={() => pausarTeste.mutate(teste.id)}
              onConcluir={() => concluirTeste.mutate(teste.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TesteABCard({
  teste,
  expandido,
  onToggle,
  onIniciar,
  onPausar,
  onConcluir,
}: {
  teste: TesteAB
  expandido: boolean
  onToggle: () => void
  onIniciar: () => void
  onPausar: () => void
  onConcluir: () => void
}) {
  const { data: variantes = [], isLoading } = useVariantesAB(expandido ? teste.id : null)
  const criarVariante = useCriarVarianteAB(teste.id)
  const excluirVariante = useExcluirVarianteAB(teste.id)
  const atualizarVariante = useAtualizarVarianteAB(teste.id)

  const testeAtivo = teste.status === 'em_andamento'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{teste.nome_teste}</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', STATUS_COLORS[teste.status])}>
            {STATUS_LABELS[teste.status] || teste.status}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {teste.criado_em ? new Date(teste.criado_em).toLocaleDateString('pt-BR') : ''}
        </span>
      </button>

      {expandido && (
        <div className="border-t border-border p-3 space-y-3">
          {teste.descricao_teste && (
            <p className="text-xs text-muted-foreground">{teste.descricao_teste}</p>
          )}

          {/* Ações do teste */}
          <div className="flex gap-2">
            {teste.status === 'rascunho' && (
              <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={onIniciar}>
                <Play className="w-3 h-3" /> Iniciar
              </Button>
            )}
            {teste.status === 'em_andamento' && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={onPausar}>
                  <Pause className="w-3 h-3" /> Pausar
                </Button>
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={onConcluir}>
                  <CheckCircle className="w-3 h-3" /> Concluir
                </Button>
              </>
            )}
            {teste.status === 'pausado' && (
              <>
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={onIniciar}>
                  <Play className="w-3 h-3" /> Retomar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={onConcluir}>
                  <CheckCircle className="w-3 h-3" /> Concluir
                </Button>
              </>
            )}
          </div>

          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <VariantesList
                variantes={variantes}
                onCriar={(p) => criarVariante.mutate(p)}
                onExcluir={(id) => excluirVariante.mutate(id)}
                onAtualizarAlteracoes={(varianteId, alteracoes) =>
                  atualizarVariante.mutate({ varianteId, alteracoes: alteracoes as Record<string, unknown> })
                }
                loading={criarVariante.isPending}
                loadingAlteracoes={atualizarVariante.isPending}
                testeAtivo={testeAtivo}
              />

              {(teste.status === 'em_andamento' || teste.status === 'concluido') && variantes.length > 0 && (
                <ResultadosAB teste={teste} variantes={variantes} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
