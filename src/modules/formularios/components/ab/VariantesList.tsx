/**
 * AIDEV-NOTE: Lista de variantes de um teste A/B
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Plus, Trash2 } from 'lucide-react'
import type { VarianteAB } from '../../services/formularios.api'

interface Props {
  variantes: VarianteAB[]
  onCriar: (payload: { nome_variante: string; letra_variante: string; e_controle?: boolean; porcentagem_trafego?: number }) => void
  onExcluir: (id: string) => void
  loading?: boolean
  testeAtivo?: boolean
}

export function VariantesList({ variantes, onCriar, onExcluir, loading, testeAtivo }: Props) {
  const [novaVariante, setNovaVariante] = useState('')

  const proximaLetra = () => {
    const usadas = variantes.map((v) => v.letra_variante)
    for (const l of 'ABCDEFGHIJ'.split('')) {
      if (!usadas.includes(l)) return l
    }
    return 'X'
  }

  const handleAdicionar = () => {
    if (!novaVariante.trim()) return
    const letra = proximaLetra()
    onCriar({
      nome_variante: novaVariante.trim(),
      letra_variante: letra,
      e_controle: variantes.length === 0,
      porcentagem_trafego: Math.round(100 / (variantes.length + 1)),
    })
    setNovaVariante('')
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-foreground">Variantes</h4>

      {variantes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma variante criada</p>
      ) : (
        <div className="space-y-2">
          {variantes.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-2.5 rounded-md border border-border bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                  {v.letra_variante}
                </span>
                <div>
                  <span className="text-xs font-medium text-foreground">{v.nome_variante}</span>
                  {v.e_controle && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">(Controle)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">
                    {v.contagem_visualizacoes ?? 0} views · {v.contagem_submissoes ?? 0} conv.
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {(v.taxa_conversao ?? 0).toFixed(1)}%
                  </div>
                </div>
                {!testeAtivo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onExcluir(v.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!testeAtivo && (
        <div className="flex gap-2">
          <Input
            value={novaVariante}
            onChange={(e) => setNovaVariante(e.target.value)}
            placeholder="Nome da variante"
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdicionar())}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdicionar}
            disabled={!novaVariante.trim() || loading}
            className="gap-1 h-8"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </Button>
        </div>
      )}
    </div>
  )
}
