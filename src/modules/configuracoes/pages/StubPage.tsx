import { useEffect } from 'react'
import { Construction } from 'lucide-react'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'

/**
 * AIDEV-NOTE: Página stub reutilizável para seções ainda não implementadas
 * Será substituída pelas implementações reais nos próximos prompts
 */

interface Props {
  titulo: string
  descricao?: string
}

export function StubPage({ titulo, descricao }: Props) {
  const { setSubtitle, setActions } = useConfigToolbar()

  useEffect(() => {
    setSubtitle(descricao || '')
    setActions(null)
    return () => { setSubtitle(null); setActions(null) }
  }, [descricao, setSubtitle, setActions])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{titulo}</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Esta seção será implementada em breve. Estamos trabalhando para disponibilizar
        todas as funcionalidades do módulo de Configurações.
      </p>
    </div>
  )
}
