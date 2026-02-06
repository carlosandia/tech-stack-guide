/**
 * AIDEV-NOTE: Modal detalhado Meta Ads (Lead Ads, CAPI, Audiences)
 * Conforme PRD-08 Seções 2-4 - Meta Ads pós-conexão
 * Exibe sub-seções com tabs para gerenciar recursos conectados
 */

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { LeadAdsPanel } from './meta/LeadAdsPanel'
import { CapiConfigPanel } from './meta/CapiConfigPanel'
import { CustomAudiencesPanel } from './meta/CustomAudiencesPanel'

interface MetaAdsDetailModalProps {
  onClose: () => void
  integracaoId: string
}

type Tab = 'lead_ads' | 'capi' | 'audiences'

const TABS: { value: Tab; label: string }[] = [
  { value: 'lead_ads', label: 'Lead Ads' },
  { value: 'capi', label: 'Conversions API' },
  { value: 'audiences', label: 'Públicos' },
]

export function MetaAdsDetailModal({ onClose, integracaoId }: MetaAdsDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('lead_ads')

  return (
    <ModalBase
      onClose={onClose}
      title="Meta Ads — Configurações"
      description="Gerencie Lead Ads, Conversions API e Públicos"
      icon={BarChart3}
      variant="create"
      size="lg"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-border px-4 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'lead_ads' && <LeadAdsPanel integracaoId={integracaoId} />}
          {activeTab === 'capi' && <CapiConfigPanel />}
          {activeTab === 'audiences' && <CustomAudiencesPanel />}
        </div>
      </div>
    </ModalBase>
  )
}
