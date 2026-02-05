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
 * AIDEV-NOTE: Edge Function para convidar admins
 * Usa generateLink para evitar o Auth Hook e envia email diretamente via Resend
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// EMAIL TEMPLATE (inline para evitar imports entre functions)
// =====================================================

interface InviteAdminEmailProps {
  nome: string;
  organizacaoNome: string;
  confirmUrl: string;
  token: string;
}

const InviteAdminEmail = ({
  nome = "Usuario",
  organizacaoNome = "CRM",
  confirmUrl = "",
  token = "",
}: InviteAdminEmailProps) => {
  const previewText = `Voce foi convidado para acessar ${organizacaoNome}`;

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, previewText),
    React.createElement(
      Body,
      {
        style: {
          backgroundColor: "#F9FAFB",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      },
      React.createElement(
        Container,
        {
          style: {
            margin: "0 auto",
            padding: "40px 20px",
            maxWidth: "600px",
          },
        },
        // Logo
        React.createElement(
          Section,
          { style: { textAlign: "center" as const, padding: "20px 0" } },
          React.createElement(
            Text,
            {
              style: {
                fontSize: "24px",
                fontWeight: "700",
                color: "#3B82F6",
                margin: "0",
              },
            },
            "CRM Renove"
          )
        ),
        React.createElement(Hr, {
          style: {
            borderColor: "#E2E8F0",
            borderWidth: "1px",
            margin: "24px 0",
          },
        }),
        // Content
        React.createElement(
          Section,
          {
            style: {
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "32px",
              border: "1px solid #E2E8F0",
            },
          },
          React.createElement(
            Heading,
            {
              style: {
                color: "#0F172A",
                fontSize: "24px",
                fontWeight: "600",
                lineHeight: "1.3",
                margin: "0 0 16px 0",
              },
            },
            `Ola, ${nome}! 👋`
          ),
          React.createElement(
            Text,
            {
              style: {
                color: "#0F172A",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              },
            },
            `Voce foi convidado para acessar o CRM como Administrador da organizacao ${organizacaoNome}.`
          ),
          React.createElement(
            Text,
            {
              style: {
                color: "#0F172A",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              },
            },
            "Para comecar, defina sua senha clicando no botao abaixo:"
          ),
          // CTA Button
          React.createElement(
            Section,
            { style: { textAlign: "center" as const, margin: "32px 0" } },
            React.createElement(
              Button,
              {
                style: {
                  backgroundColor: "#3B82F6",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  textAlign: "center" as const,
                  display: "inline-block",
                  padding: "14px 32px",
                },
                href: confirmUrl,
              },
              "Definir Minha Senha"
            )
          ),
          React.createElement(
            Text,
            {
              style: {
                color: "#0F172A",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              },
            },
            "Ou copie e cole o link abaixo no seu navegador:"
          ),
          React.createElement(
            Text,
            {
              style: {
                fontSize: "14px",
                color: "#64748B",
                margin: "0 0 16px 0",
                wordBreak: "break-all" as const,
              },
            },
            React.createElement(
              Link,
              {
                href: confirmUrl,
                style: { color: "#3B82F6", textDecoration: "underline" },
              },
              confirmUrl
            )
          )
        ),
        React.createElement(Hr, {
          style: {
            borderColor: "#E2E8F0",
            borderWidth: "1px",
            margin: "24px 0",
          },
        }),
        // Warning
        React.createElement(
          Section,
          {
            style: {
              backgroundColor: "#FEF3C7",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #FCD34D",
            },
          },
          React.createElement(
            Text,
            {
              style: {
                color: "#92400E",
                fontSize: "14px",
                lineHeight: "1.5",
                margin: "0",
                textAlign: "center" as const,
              },
            },
            "⏰ Este link expira em 24 horas. Caso expire, solicite um novo convite ao administrador."
          )
        ),
        React.createElement(Hr, {
          style: {
            borderColor: "#E2E8F0",
            borderWidth: "1px",
            margin: "24px 0",
          },
        }),
        // Footer
        React.createElement(
          Section,
          { style: { textAlign: "center" as const, padding: "16px 0" } },
          React.createElement(
            Text,
            {
              style: {
                color: "#64748B",
                fontSize: "12px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              },
            },
            `CRM Renove © ${new Date().getFullYear()}`
          ),
          React.createElement(
            Text,
            {
              style: {
                color: "#64748B",
                fontSize: "12px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              },
            },
            "Se voce nao solicitou este convite, pode ignorar este email com seguranca."
          )
        )
      )
    )
  );
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      email,
      nome,
      sobrenome,
      usuario_id,
      organizacao_id,
      organizacao_nome,
    } = await req.json();

    console.log("[invite-admin] Invite request:", {
      email,
      usuario_id,
      organizacao_id,
      organizacao_nome,
    });

    if (!email || !usuario_id || !organizacao_id) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatorios: email, usuario_id, organizacao_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const origin =
      req.headers.get("origin") ||
      "https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app";
    const orgNome = organizacao_nome || "CRM";

    // Usar generateLink em vez de inviteUserByEmail para evitar o Auth Hook
    console.log("[invite-admin] Gerando link de convite com generateLink...");

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: {
            nome,
            sobrenome,
            role: "admin",
            tenant_id: organizacao_id,
            organizacao_nome: orgNome,
            invite_type: "admin",
          },
          redirectTo: `${origin}/auth/set-password`,
        },
      });

    if (linkError) {
      console.error("[invite-admin] generateLink error:", linkError);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = linkData.user?.id;
    console.log("[invite-admin] User created:", userId);

    // Atualizar usuario na tabela
    await supabaseAdmin
      .from("usuarios")
      .update({ auth_id: userId, status: "pendente" })
      .eq("id", usuario_id);

    // Inserir role
    if (userId) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
    }

    // Construir URL de confirmacao
    const tokenHash = linkData.properties?.hashed_token;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=invite&redirect_to=${encodeURIComponent(`${origin}/auth/set-password`)}`;

    console.log("[invite-admin] Confirm URL:", confirmUrl);

    // Enviar email diretamente via Resend (bypass do Auth Hook)
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const html = await renderAsync(
          React.createElement(InviteAdminEmail, {
            nome: nome || "Usuario",
            organizacaoNome: orgNome,
            confirmUrl,
            token: linkData.properties?.token || "",
          })
        );

        const { data: emailData, error: emailError } =
          await resend.emails.send({
            from: "CRM Renove <onboarding@resend.dev>",
            to: [email],
            subject: `Convite para acessar ${orgNome} - CRM`,
            html,
          });

        if (emailError) {
          console.error("[invite-admin] Erro ao enviar email:", emailError);
          // Nao falhar o convite por causa do email - usuario foi criado
        } else {
          console.log(
            "[invite-admin] Email enviado com sucesso:",
            emailData?.id
          );
        }
      } catch (emailErr) {
        console.error("[invite-admin] Erro no envio de email:", emailErr);
      }
    } else {
      console.warn(
        "[invite-admin] RESEND_API_KEY nao configurada, email nao enviado"
      );
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
