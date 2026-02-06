import { createClient } from "npm:@supabase/supabase-js@2";
import React from "npm:react@18.3.1";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
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
} from "npm:@react-email/components@0.0.22";

/**
 * AIDEV-NOTE: Edge Function para convidar membros/admins
 * Usa generateLink para evitar o Auth Hook e envia email diretamente via Resend
 * Template moderno com informações de quem enviou o convite
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// EMAIL TEMPLATE
// =====================================================

interface InviteEmailProps {
  nome: string;
  email: string;
  organizacaoNome: string;
  confirmUrl: string;
  token: string;
  convidadoPor?: string;
  convidadoPorEmail?: string;
}

const InviteEmail = ({
  nome = "Usuario",
  email = "",
  organizacaoNome = "CRM",
  confirmUrl = "",
  convidadoPor = "",
  convidadoPorEmail = "",
}: InviteEmailProps) => {
  const previewText = convidadoPor
    ? `${convidadoPor} convidou você para acessar o CRM Renove`
    : `Você foi convidado para acessar o CRM Renove`;

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, previewText),
    React.createElement(
      Body,
      { style: styles.main },
      React.createElement(
        Container,
        { style: styles.container },

        // Logo Section
        React.createElement(
          Section,
          { style: styles.logoSection },
          React.createElement(Text, { style: styles.logoText }, "CRM Renove")
        ),

        React.createElement(Hr, { style: styles.divider }),

        // Content Card
        React.createElement(
          Section,
          { style: styles.contentCard },

          // Greeting
          React.createElement(
            Heading,
            { style: styles.heading },
            `Olá, ${nome}! 👋`
          ),

          // Invite context - quem convidou
          convidadoPor
            ? React.createElement(
                Section,
                { style: styles.inviterBox },
                React.createElement(
                  Text,
                  { style: styles.inviterText },
                  `📨 `,
                  React.createElement("strong", null, convidadoPor),
                  convidadoPorEmail ? ` (${convidadoPorEmail})` : "",
                  ` convidou você para fazer parte da equipe.`
                )
              )
            : null,

          // Intro text
          React.createElement(
            Text,
            { style: styles.paragraph },
            `Você foi convidado para acessar o `,
            React.createElement("strong", null, "CRM Renove"),
            ` da organização `,
            React.createElement("strong", { style: { color: "#3B82F6" } }, organizacaoNome),
            `.`
          ),

          // Login info box
          React.createElement(
            Section,
            { style: styles.loginInfoBox },
            React.createElement(
              Text,
              { style: styles.loginInfoLabel },
              "📧 Seu email de acesso:"
            ),
            React.createElement(
              Text,
              { style: styles.loginInfoEmail },
              email
            )
          ),

          // Instruction text
          React.createElement(
            Text,
            { style: styles.paragraph },
            "Para começar, defina sua senha clicando no botão abaixo:"
          ),

          // CTA Button
          React.createElement(
            Section,
            { style: styles.buttonContainer },
            React.createElement(
              Button,
              { style: styles.button, href: confirmUrl },
              "Definir Minha Senha e Acessar"
            )
          ),

          React.createElement(Hr, { style: styles.innerDivider }),

          // Link fallback
          React.createElement(
            Text,
            { style: styles.smallText },
            "Ou copie e cole o link abaixo no seu navegador:"
          ),
          React.createElement(
            Text,
            { style: styles.linkText },
            React.createElement(
              Link,
              { href: confirmUrl, style: styles.link },
              confirmUrl
            )
          )
        ),

        // Warning Section
        React.createElement(
          Section,
          { style: styles.warningSection },
          React.createElement(
            Text,
            { style: styles.warningText },
            "⏰ Este link expira em ",
            React.createElement("strong", null, "24 horas"),
            ". Caso expire, solicite um novo convite ao administrador."
          )
        ),

        React.createElement(Hr, { style: styles.divider }),

        // Footer
        React.createElement(
          Section,
          { style: styles.footer },
          React.createElement(
            Text,
            { style: styles.footerText },
            `CRM Renove © ${new Date().getFullYear()}`
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "Se você não solicitou este convite, pode ignorar este email com segurança."
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "Precisa de ajuda? ",
            React.createElement(
              Link,
              { href: "mailto:suporte@renovedigital.com.br", style: styles.footerLink },
              "suporte@renovedigital.com.br"
            )
          )
        )
      )
    )
  );
};

// =====================================================
// ESTILOS
// =====================================================

const styles = {
  main: {
    backgroundColor: "#F1F5F9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "20px 0",
  },
  container: {
    margin: "0 auto",
    padding: "0",
    maxWidth: "600px",
  },
  logoSection: {
    textAlign: "center" as const,
    padding: "32px 0 24px 0",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#3B82F6",
    margin: "0",
    letterSpacing: "-0.5px",
  },
  divider: {
    borderColor: "#E2E8F0",
    borderWidth: "1px",
    margin: "0",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    paddingTop: "40px",
    paddingBottom: "40px",
    paddingLeft: "48px",
    paddingRight: "48px",
    margin: "24px 16px",
    border: "1px solid #E2E8F0",
  },
  heading: {
    color: "#0F172A",
    fontSize: "26px",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0 0 24px 0",
  },
  inviterBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: "8px",
    padding: "14px 20px",
    margin: "0 0 24px 0",
    border: "1px solid #BBF7D0",
  },
  inviterText: {
    color: "#166534",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0",
  },
  paragraph: {
    color: "#334155",
    fontSize: "16px",
    lineHeight: "1.75",
    margin: "0 0 20px 0",
  },
  loginInfoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "0 0 24px 0",
    border: "1px solid #BFDBFE",
  },
  loginInfoLabel: {
    color: "#1E40AF",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 6px 0",
    lineHeight: "1.4",
  },
  loginInfoEmail: {
    color: "#1E3A5F",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0",
    lineHeight: "1.4",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#3B82F6",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "16px 40px",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
  },
  innerDivider: {
    borderColor: "#E2E8F0",
    borderWidth: "1px",
    margin: "28px 0",
  },
  smallText: {
    color: "#64748B",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  linkText: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0",
    wordBreak: "break-all" as const,
    backgroundColor: "#F8FAFC",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
  },
  link: {
    color: "#3B82F6",
    textDecoration: "underline",
  },
  warningSection: {
    backgroundColor: "#FFFBEB",
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "0 16px 24px 16px",
    border: "1px solid #FDE68A",
  },
  warningText: {
    color: "#92400E",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    textAlign: "center" as const,
  },
  footer: {
    textAlign: "center" as const,
    padding: "24px 16px 32px 16px",
  },
  footerText: {
    color: "#94A3B8",
    fontSize: "12px",
    lineHeight: "1.8",
    margin: "0 0 4px 0",
  },
  footerLink: {
    color: "#3B82F6",
    textDecoration: "underline",
  },
};

// =====================================================
// MAIN HANDLER
// =====================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // =====================================================
    // VALIDAÇÃO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // =====================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[invite-admin] Requisição sem token de autenticação");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar JWT do usuário requisitante
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.warn("[invite-admin] Token inválido:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestingUserId = claimsData.claims.sub;
    console.log("[invite-admin] Usuário autenticado:", requestingUserId);

    // Verificar se o usuário requisitante é admin ou super_admin
    const { data: requestingUser, error: requestingUserError } = await supabaseAdmin
      .from("usuarios")
      .select("role, organizacao_id, nome, email")
      .eq("auth_id", requestingUserId)
      .single();

    if (requestingUserError || !requestingUser) {
      console.warn("[invite-admin] Usuário não encontrado:", requestingUserError?.message);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Apenas admin e super_admin podem convidar
    if (requestingUser.role !== "admin" && requestingUser.role !== "super_admin") {
      console.warn("[invite-admin] Usuário sem permissão:", requestingUser.role);
      return new Response(
        JSON.stringify({ error: "Acesso negado: permissão de administrador necessária" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =====================================================
    // PARSE DO BODY
    // =====================================================
    const {
      email,
      nome,
      sobrenome,
      usuario_id,
      organizacao_id,
      organizacao_nome,
      convidado_por,
      convidado_por_email,
    } = await req.json();

    console.log("[invite-admin] Invite request:", {
      email,
      usuario_id,
      organizacao_id,
      organizacao_nome,
      convidado_por,
      requestedBy: requestingUserId,
    });

    if (!email || !usuario_id || !organizacao_id) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios: email, usuario_id, organizacao_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Admin só pode convidar para sua própria organização
    if (requestingUser.role !== "super_admin" && requestingUser.organizacao_id !== organizacao_id) {
      console.warn("[invite-admin] Admin tentando convidar para outra organização");
      return new Response(
        JSON.stringify({ error: "Acesso negado: não é possível convidar para outra organização" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const origin =
      req.headers.get("origin") ||
      "https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app";
    const orgNome = organizacao_nome || "CRM";

    // Usar nome do convidador do body ou do requesting user
    const inviterName = convidado_por || requestingUser.nome || "";
    const inviterEmail = convidado_por_email || requestingUser.email || "";

    // Gerar link de convite
    console.log("[invite-admin] Gerando link de convite...");

    let linkData: any = null;
    let userId: string | undefined;

    // 1. Tentar invite (usuario novo)
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: {
            nome,
            sobrenome,
            role: "member",
            tenant_id: organizacao_id,
            organizacao_nome: orgNome,
            invite_type: "member",
          },
          redirectTo: `${origin}/auth/set-password`,
        },
      });

    if (inviteError) {
      // Se usuario já existe, gerar magiclink
      if (inviteError.message?.includes("already been registered") || (inviteError as any).code === "email_exists") {
        console.log("[invite-admin] Usuário já existe, gerando magiclink...");

        const { data: magicData, error: magicError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: {
              data: {
                nome,
                sobrenome,
                role: "member",
                tenant_id: organizacao_id,
                organizacao_nome: orgNome,
                invite_type: "member",
              },
              redirectTo: `${origin}/auth/set-password`,
            },
          });

        if (magicError) {
          console.error("[invite-admin] magiclink error:", magicError);
          return new Response(JSON.stringify({ error: magicError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        linkData = magicData;
        userId = magicData.user?.id;
      } else {
        console.error("[invite-admin] generateLink error:", inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      linkData = inviteData;
      userId = inviteData.user?.id;
      console.log("[invite-admin] Novo usuário criado:", userId);
    }

    // Atualizar usuario na tabela
    await supabaseAdmin
      .from("usuarios")
      .update({ auth_id: userId, status: "pendente" })
      .eq("id", usuario_id);

    // Construir URL de confirmação
    const tokenHash = linkData.properties?.hashed_token;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=invite&redirect_to=${encodeURIComponent(`${origin}/auth/set-password`)}`;

    console.log("[invite-admin] Confirm URL gerada");

    // Enviar email via Resend
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const html = await renderAsync(
          React.createElement(InviteEmail, {
            nome: nome || "Usuário",
            email,
            organizacaoNome: orgNome,
            confirmUrl,
            token: linkData.properties?.token || "",
            convidadoPor: inviterName,
            convidadoPorEmail: inviterEmail,
          })
        );

        const { data: emailData, error: emailError } =
          await resend.emails.send({
            from: "CRM Renove <crm@renovedigital.com.br>",
            to: [email],
            subject: inviterName
              ? `${inviterName} convidou você para o CRM Renove`
              : "Convite para acesso ao CRM Renove",
            html,
          });

        if (emailError) {
          console.error("[invite-admin] Erro ao enviar email:", emailError);
        } else {
          console.log("[invite-admin] Email enviado:", emailData?.id);
        }
      } catch (emailErr) {
        console.error("[invite-admin] Erro no envio:", emailErr);
      }
    } else {
      console.warn("[invite-admin] RESEND_API_KEY não configurada");
    }

    return new Response(
      JSON.stringify({ success: true, auth_id: userId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[invite-admin] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
