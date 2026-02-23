/**
 * AIDEV-NOTE: Editor visual de alterações para variante A/B
 * Permite configurar cor do botão, texto do botão, título, descrição e cor de fundo
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save } from 'lucide-react'
import type { VarianteAB } from '../../services/formularios.api'

// AIDEV-NOTE: Estrutura do JSON de alterações por variante
export interface AlteracoesVariante {
  botao?: {
    cor_fundo?: string
    cor_texto?: string
    texto?: string
  }
  cabecalho?: {
    titulo?: string
    descricao?: string
  }
  container?: {
    cor_fundo?: string
  }
}

interface Props {
  variante: VarianteAB
  onSalvar: (alteracoes: AlteracoesVariante) => void
  onFechar: () => void
  loading?: boolean
}

export function VarianteEditor({ variante, onSalvar, onFechar, loading }: Props) {
  const alt = (variante.alteracoes || {}) as AlteracoesVariante

  const [botaoCor, setBotaoCor] = useState(alt.botao?.cor_fundo || '')
  const [botaoCorTexto, setBotaoCorTexto] = useState(alt.botao?.cor_texto || '')
  const [botaoTexto, setBotaoTexto] = useState(alt.botao?.texto || '')
  const [titulo, setTitulo] = useState(alt.cabecalho?.titulo || '')
  const [descricao, setDescricao] = useState(alt.cabecalho?.descricao || '')
  const [containerCor, setContainerCor] = useState(alt.container?.cor_fundo || '')

  // AIDEV-NOTE: Contagem de alterações configuradas
  const contarAlteracoes = (): number => {
    let count = 0
    if (botaoCor) count++
    if (botaoCorTexto) count++
    if (botaoTexto) count++
    if (titulo) count++
    if (descricao) count++
    if (containerCor) count++
    return count
  }

  const handleSalvar = () => {
    const alteracoes: AlteracoesVariante = {}

    if (botaoCor || botaoCorTexto || botaoTexto) {
      alteracoes.botao = {}
      if (botaoCor) alteracoes.botao.cor_fundo = botaoCor
      if (botaoCorTexto) alteracoes.botao.cor_texto = botaoCorTexto
      if (botaoTexto) alteracoes.botao.texto = botaoTexto
    }

    if (titulo || descricao) {
      alteracoes.cabecalho = {}
      if (titulo) alteracoes.cabecalho.titulo = titulo
      if (descricao) alteracoes.cabecalho.descricao = descricao
    }

    if (containerCor) {
      alteracoes.container = { cor_fundo: containerCor }
    }

    onSalvar(alteracoes)
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-foreground">
          Configurar Variante {variante.letra_variante}: {variante.nome_variante}
        </h5>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onFechar}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Defina o que muda nesta variante em relação ao formulário original. Deixe em branco para manter o padrão.
      </p>

      {/* Botão */}
      <div className="space-y-2 p-2 rounded border border-border bg-card">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Botão</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Cor de fundo</Label>
            <div className="flex gap-1.5 items-center">
              <input
                type="color"
                value={botaoCor || '#3B82F6'}
                onChange={(e) => setBotaoCor(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer"
              />
              <Input
                value={botaoCor}
                onChange={(e) => setBotaoCor(e.target.value)}
                placeholder="#3B82F6"
                className="h-7 text-[10px] flex-1"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Cor do texto</Label>
            <div className="flex gap-1.5 items-center">
              <input
                type="color"
                value={botaoCorTexto || '#FFFFFF'}
                onChange={(e) => setBotaoCorTexto(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer"
              />
              <Input
                value={botaoCorTexto}
                onChange={(e) => setBotaoCorTexto(e.target.value)}
                placeholder="#FFFFFF"
                className="h-7 text-[10px] flex-1"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Texto do botão</Label>
          <Input
            value={botaoTexto}
            onChange={(e) => setBotaoTexto(e.target.value)}
            placeholder="Ex: Quero receber"
            className="h-7 text-[10px]"
          />
        </div>
        {/* Preview do botão */}
        {(botaoCor || botaoTexto) && (
          <div className="pt-1">
            <span className="text-[10px] text-muted-foreground mb-1 block">Preview:</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: botaoCor || '#3B82F6',
                color: botaoCorTexto || '#FFFFFF',
              }}
            >
              {botaoTexto || 'Enviar'}
            </button>
          </div>
        )}
      </div>

      {/* Cabeçalho */}
      <div className="space-y-2 p-2 rounded border border-border bg-card">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cabeçalho</span>
        <div className="space-y-1">
          <Label className="text-[10px]">Título alternativo</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Oferta Especial"
            className="h-7 text-[10px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Descrição alternativa</Label>
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Preencha e ganhe 10% de desconto"
            className="h-7 text-[10px]"
          />
        </div>
      </div>

      {/* Container */}
      <div className="space-y-2 p-2 rounded border border-border bg-card">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Container</span>
        <div className="space-y-1">
          <Label className="text-[10px]">Cor de fundo</Label>
          <div className="flex gap-1.5 items-center">
            <input
              type="color"
              value={containerCor || '#FFFFFF'}
              onChange={(e) => setContainerCor(e.target.value)}
              className="w-7 h-7 rounded border border-border cursor-pointer"
            />
            <Input
              value={containerCor}
              onChange={(e) => setContainerCor(e.target.value)}
              placeholder="#FFFFFF"
              className="h-7 text-[10px] flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">{contarAlteracoes()} alteração(ões) configurada(s)</span>
        <Button
          size="sm"
          onClick={handleSalvar}
          disabled={loading}
          className="gap-1 h-7 text-xs"
        >
          <Save className="w-3 h-3" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}
