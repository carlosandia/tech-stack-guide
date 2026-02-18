import { LandingHeader } from '../components/landing/LandingHeader'
import { HeroSection } from '../components/landing/HeroSection'
import { SocialProofBar } from '../components/landing/SocialProofBar'
import { PainSection } from '../components/landing/PainSection'
import { SolutionSection } from '../components/landing/SolutionSection'
import { ModulesSection } from '../components/landing/ModulesSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { TestimonialsSection } from '../components/landing/TestimonialsSection'
import { ComparisonSection } from '../components/landing/ComparisonSection'
import { FAQSection } from '../components/landing/FAQSection'
import { FinalCTASection } from '../components/landing/FinalCTASection'
import { LandingFooter } from '../components/landing/LandingFooter'

/**
 * AIDEV-NOTE: Landing page de alta conversão - CRM Renove
 * Estrutura de funil por seção com storytelling amarrado
 * Rota: / (visitantes não autenticados)
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <SocialProofBar />
        <PainSection />
        <SolutionSection />
        <ModulesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <ComparisonSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
