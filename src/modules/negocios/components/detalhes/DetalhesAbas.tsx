/**
 * AIDEV-NOTE: Bloco 2 - Abas de funcionalidades (RF-14.3)
 * 5 abas: Anotações, Tarefas, Documentos, E-mail, Agenda
 * Padrão Tabs do Design System 10.9
 */

import { useState } from 'react'
import { MessageSquare, CheckSquare, FileText, Mail, Calendar } from 'lucide-react'
import { AbaAnotacoes } from './AbaAnotacoes'
import { AbaTarefas } from './AbaTarefas'
import { AbaDocumentos } from './AbaDocumentos'
import { AbaEmail } from './AbaEmail'
import { AbaAgenda } from './AbaAgenda'

interface DetalhesAbasProps {
  oportunidadeId: string
  funilId?: string
  usuarioAtualId?: string
  emailContato?: string | null
  abaInicial?: string
}

const TABS = [
  { id: 'anotacoes', label: 'Anotações', icon: MessageSquare },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
] as const

type TabId = typeof TABS[number]['id']

export function DetalhesAbas({ oportunidadeId, funilId, usuarioAtualId, emailContato, abaInicial }: DetalhesAbasProps) {
  const [activeTab, setActiveTab] = useState<TabId>((abaInicial as TabId) || 'anotacoes')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-border overflow-x-auto">
        <div className="flex min-w-max justify-center w-full">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium
                  border-b-2 transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === 'anotacoes' && (
          <AbaAnotacoes oportunidadeId={oportunidadeId} usuarioAtualId={usuarioAtualId} />
        )}
        {activeTab === 'tarefas' && (
          <AbaTarefas oportunidadeId={oportunidadeId} funilId={funilId} />
        )}
        {activeTab === 'documentos' && (
          <AbaDocumentos oportunidadeId={oportunidadeId} />
        )}
        {activeTab === 'email' && <AbaEmail oportunidadeId={oportunidadeId} emailContato={emailContato} />}
        {activeTab === 'agenda' && <AbaAgenda oportunidadeId={oportunidadeId} />}
      </div>
    </div>
  )
}
