/**
 * AIDEV-NOTE: Formulário para criar/editar teste A/B
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface Props {
  onCriar: (payload: {
    nome_teste: string
    descricao_teste?: string
    metrica_objetivo?: string
    minimo_submissoes?: number
  }) => void
  loading?: boolean
}

export function TesteABForm({ onCriar, loading }: Props) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [minimoSubmissoes, setMinimoSubmissoes] = useState(100)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    onCriar({
      nome_teste: nome.trim(),
      descricao_teste: descricao.trim() || undefined,
      metrica_objetivo: 'taxa_conversao',
      minimo_submissoes: minimoSubmissoes,
    })
    setNome('')
    setDescricao('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-border bg-card">
      <h4 className="text-xs font-semibold text-foreground">Novo Teste A/B</h4>
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do teste</Label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Teste cor do botão"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição (opcional)</Label>
        <Input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="O que você está testando?"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Mín. submissões por variante</Label>
        <Input
          type="number"
          value={minimoSubmissoes}
          onChange={(e) => setMinimoSubmissoes(Number(e.target.value))}
          min={10}
          className="h-8 text-xs w-24"
        />
      </div>
      <Button type="submit" size="sm" disabled={!nome.trim() || loading} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        Criar Teste
      </Button>
    </form>
  )
}
