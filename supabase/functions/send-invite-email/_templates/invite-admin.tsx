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
  const previewText = `Você foi convidado para acessar o CRM Renove`

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
          <Section style={contentCard}>
            <Heading style={heading}>
              Olá, {nome}! 👋
            </Heading>

            <Text style={paragraph}>
              Você foi convidado para acessar o <strong>CRM Renove</strong> como{' '}
              <strong>Administrador</strong> da organização{' '}
              <strong style={highlight}>{organizacaoNome}</strong>.
            </Text>

            <Text style={paragraph}>
              Para começar, defina sua senha clicando no botão abaixo:
            </Text>

            {/* Botao CTA */}
            <Section style={buttonContainer}>
              <Button style={button} href={confirmUrl}>
                Definir Minha Senha
              </Button>
            </Section>

            <Hr style={innerDivider} />

            <Text style={smallText}>
              Ou copie e cole o link abaixo no seu navegador:
            </Text>

            <Text style={linkTextStyle}>
              <Link href={confirmUrl} style={link}>
                {confirmUrl}
              </Link>
            </Text>

            {/* Codigo alternativo */}
            {token && (
              <>
                <Text style={smallText}>
                  Você também pode usar este código de verificação:
                </Text>
                <Section style={codeContainer}>
                  <Text style={code}>{token}</Text>
                </Section>
              </>
            )}
          </Section>

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
              Se você não solicitou este convite, pode ignorar este email com segurança.
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
  backgroundColor: '#F1F5F9',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  padding: '20px 0',
}

const container = {
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  padding: '32px 0 24px 0',
}

const logoText = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#3B82F6',
  margin: '0',
  letterSpacing: '-0.5px',
}

const divider = {
  borderColor: '#E2E8F0',
  borderWidth: '1px',
  margin: '0',
}

const contentCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '40px 36px',
  margin: '24px 16px',
  border: '1px solid #E2E8F0',
}

const heading = {
  color: '#0F172A',
  fontSize: '26px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
}

const paragraph = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.75',
  margin: '0 0 20px 0',
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
  padding: '16px 40px',
  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
}

const innerDivider = {
  borderColor: '#E2E8F0',
  borderWidth: '1px',
  margin: '28px 0',
}

const smallText = {
  color: '#64748B',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
}

const linkTextStyle = {
  fontSize: '13px',
  color: '#64748B',
  margin: '0 0 20px 0',
  wordBreak: 'break-all' as const,
  backgroundColor: '#F8FAFC',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
}

const link = {
  color: '#3B82F6',
  textDecoration: 'underline',
}

const codeContainer = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '12px 0',
  border: '1px solid #E2E8F0',
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
  backgroundColor: '#FFFBEB',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 16px 24px 16px',
  border: '1px solid #FDE68A',
}

const warningText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}

const footer = {
  textAlign: 'center' as const,
  padding: '24px 16px 32px 16px',
}

const footerText = {
  color: '#94A3B8',
  fontSize: '12px',
  lineHeight: '1.8',
  margin: '0 0 4px 0',
}

const footerLink = {
  color: '#3B82F6',
  textDecoration: 'underline',
}
