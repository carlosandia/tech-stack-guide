import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

/**
 * AIDEV-NOTE: Template de Email para Convite de Admin
 * Conforme PRD-14 e Design System
 * 
 * Cores do Design System:
 * - Primary: #3B82F6
 * - Background: #FFFFFF
 * - Foreground: #0F172A
 * - Muted: #64748B
 * - Border: #E2E8F0
 */

interface InviteAdminEmailProps {
  nome: string
  organizacaoNome: string
  confirmUrl: string
  token: string
}

export const InviteAdminEmail = ({
  nome = 'Usuario',
  organizacaoNome = 'CRM',
  confirmUrl = '',
  token = '',
}: InviteAdminEmailProps) => {
  const previewText = `Voce foi convidado para acessar ${organizacaoNome}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header com Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>CRM Renove</Text>
          </Section>

          <Hr style={divider} />

          {/* Conteudo Principal */}
          <Section style={contentSection}>
            <Heading style={heading}>
              Ola, {nome}! 👋
            </Heading>

            <Text style={paragraph}>
              Voce foi convidado para acessar o <strong>CRM</strong> como{' '}
              <strong>Administrador</strong> da organizacao{' '}
              <strong style={highlight}>{organizacaoNome}</strong>.
            </Text>

            <Text style={paragraph}>
              Para comecar, defina sua senha clicando no botao abaixo:
            </Text>

            {/* Botao CTA */}
            <Section style={buttonContainer}>
              <Button style={button} href={confirmUrl}>
                Definir Minha Senha
              </Button>
            </Section>

            <Text style={paragraph}>
              Ou copie e cole o link abaixo no seu navegador:
            </Text>

            <Text style={linkText}>
              <Link href={confirmUrl} style={link}>
                {confirmUrl}
              </Link>
            </Text>

            {/* Codigo alternativo */}
            {token && (
              <>
                <Text style={paragraph}>
                  Voce tambem pode usar este codigo de verificacao:
                </Text>
                <Section style={codeContainer}>
                  <Text style={code}>{token}</Text>
                </Section>
              </>
            )}
          </Section>

          <Hr style={divider} />

          {/* Aviso de Expiracao */}
          <Section style={warningSection}>
            <Text style={warningText}>
              ⏰ Este link expira em <strong>24 horas</strong>. Caso expire,
              solicite um novo convite ao administrador.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              CRM Renove © {new Date().getFullYear()}
            </Text>
            <Text style={footerText}>
              Se voce nao solicitou este convite, pode ignorar este email com seguranca.
            </Text>
            <Text style={footerText}>
              Precisa de ajuda?{' '}
              <Link href="mailto:suporte@renovedigital.com.br" style={footerLink}>
                suporte@renovedigital.com.br
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default InviteAdminEmail

// =====================================================
// ESTILOS (Inline CSS para compatibilidade com emails)
// =====================================================

const main = {
  backgroundColor: '#F9FAFB',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const logoText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#3B82F6',
  margin: '0',
}

const divider = {
  borderColor: '#E2E8F0',
  borderWidth: '1px',
  margin: '24px 0',
}

const contentSection = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid #E2E8F0',
}

const heading = {
  color: '#0F172A',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
}

const paragraph = {
  color: '#0F172A',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const highlight = {
  color: '#3B82F6',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const linkText = {
  fontSize: '14px',
  color: '#64748B',
  margin: '0 0 16px 0',
  wordBreak: 'break-all' as const,
}

const link = {
  color: '#3B82F6',
  textDecoration: 'underline',
}

const codeContainer = {
  backgroundColor: '#F1F5F9',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const code = {
  fontFamily: 'monospace',
  fontSize: '24px',
  fontWeight: '600',
  color: '#0F172A',
  letterSpacing: '4px',
  margin: '0',
}

const warningSection = {
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #FCD34D',
}

const warningText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}

const footer = {
  textAlign: 'center' as const,
  padding: '16px 0',
}

const footerText = {
  color: '#64748B',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
}

const footerLink = {
  color: '#3B82F6',
  textDecoration: 'underline',
}
