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
  Img,
  Row,
  Column,
} from "npm:@react-email/components@0.0.22";

/**
 * AIDEV-NOTE: Edge Function para criar admins/membros com senha aleatória
 * Gera senha segura, cria usuário com email confirmado, envia credenciais por email
 * Conforme padrão SaaS e LGPD - sem links com token expirável
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// GERADOR DE SENHA SEGURA
// =====================================================

function generateSecurePassword(length = 12): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  // Garantir pelo menos 1 de cada tipo
  let password = '';
  password += upper[array[0] % upper.length];
  password += lower[array[1] % lower.length];
  password += digits[array[2] % digits.length];
  password += special[array[3] % special.length];

  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }

  // Embaralhar para não ter padrão previsível
  return password
    .split('')
    .sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128)
    .join('');
}

// =====================================================
// EMAIL TEMPLATE - BOAS-VINDAS COM CREDENCIAIS
// =====================================================

interface WelcomeEmailProps {
  nome: string;
  email: string;
  senha: string;
  organizacaoNome: string;
  roleName: string;
  loginUrl: string;
}

const WelcomeEmail = ({
  nome = "Usuario",
  email = "",
  senha = "",
  organizacaoNome = "CRM",
  roleName = "administrador",
  loginUrl = "https://crm.renovedigital.com.br/login",
}: WelcomeEmailProps) => {
  const previewText = `Bem-vindo ao CRM Renove - Seus dados de acesso`;

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
          React.createElement(Img, {
            src: "https://crm.renovedigital.com.br/logo-email.png",
            width: "140",
            alt: "Renove",
            style: styles.logoImg,
          })
        ),

        React.createElement(Hr, { style: styles.divider }),

        // Content Card
        React.createElement(
          Section,
          { style: styles.contentCard },
          React.createElement(
            Row,
            null,
            React.createElement(
              Column,
              { style: styles.contentPadding },

              // Greeting
              React.createElement(
                Heading,
                { style: styles.heading },
                `Bem-vindo, ${nome}! 🎉`
              ),

              // Intro text
              React.createElement(
                Text,
                { style: styles.paragraph },
                `Sua conta no `,
                React.createElement("strong", null, "CRM Renove"),
                ` foi criada com sucesso! Você é ${roleName} da organização `,
                React.createElement("strong", { style: { color: "#3B82F6" } }, organizacaoNome),
                `.`
              ),

              // Credentials box
              React.createElement(
                Section,
                { style: styles.credentialsBox },
                React.createElement(
                  Row,
                  null,
                  React.createElement(
                    Column,
                    { style: styles.credentialsPadding },
                    React.createElement(
                      Text,
                      { style: styles.credentialsTitle },
                      "🔑 Seus dados de acesso"
                    ),
                    React.createElement(
                      Text,
                      { style: styles.credentialLabel },
                      "E-mail:"
                    ),
                    React.createElement(
                      Text,
                      { style: styles.credentialValue },
                      email
                    ),
                    React.createElement(
                      Text,
                      { style: { ...styles.credentialLabel, marginTop: "12px" } },
                      "Senha temporária:"
                    ),
                    React.createElement(
                      Text,
                      { style: styles.credentialPassword },
                      senha
                    )
                  )
                )
              ),

              // CTA Button
              React.createElement(
                Text,
                { style: styles.paragraph },
                "Acesse o CRM agora com suas credenciais:"
              ),

              React.createElement(
                Section,
                { style: styles.buttonContainer },
                React.createElement(
                  Button,
                  { style: styles.button, href: loginUrl },
                  "Acessar o CRM Renove"
                )
              ),

              React.createElement(Hr, { style: styles.innerDivider }),

              // LGPD Notice
              React.createElement(
                Section,
                { style: styles.lgpdBox },
                React.createElement(
                  Row,
                  null,
                  React.createElement(
                    Column,
                    { style: styles.lgpdPadding },
                    React.createElement(
                      Text,
                      { style: styles.lgpdText },
                      "🔒 ",
                      React.createElement("strong", null, "Segurança:"),
                      " Recomendamos que altere sua senha no primeiro acesso através das configurações da sua conta. Nunca compartilhe suas credenciais com terceiros."
                    )
                  )
                )
              )
            )
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
            "Este é um e-mail automático. Não responda a esta mensagem."
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "Precisa de ajuda? ",
            React.createElement(
              Link,
              { href: "mailto:crm@renovedigital.com.br", style: styles.footerLink },
              "crm@renovedigital.com.br"
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
    margin: "0" as const,
  },
  container: {
    margin: "0 auto",
    padding: "0",
    maxWidth: "600px",
    width: "100%" as const,
  },
  logoSection: {
    textAlign: "center" as const,
    padding: "32px 0 24px 0",
  },
  logoImg: {
    margin: "0 auto",
    display: "block",
  },
  divider: {
    borderColor: "#E2E8F0",
    borderWidth: "1px",
    margin: "0",
    borderTop: "none" as const,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "0",
    margin: "24px 16px",
    border: "1px solid #E2E8F0",
  },
  contentPadding: {
    padding: "48px 40px",
  },
  heading: {
    color: "#1E293B",
    fontSize: "22px",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0 0 24px 0",
  },
  paragraph: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 20px 0",
  },
  credentialsBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: "8px",
    margin: "0 0 28px 0",
    border: "1px solid #BFDBFE",
  },
  credentialsPadding: {
    padding: "20px 24px",
  },
  credentialsTitle: {
    color: "#1E40AF",
    fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 16px 0",
    lineHeight: "1.4",
  },
  credentialLabel: {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "500",
    margin: "0 0 4px 0",
    lineHeight: "1.4",
  },
  credentialValue: {
    color: "#1E293B",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
    lineHeight: "1.4",
  },
  credentialPassword: {
    color: "#1E293B",
    fontSize: "18px",
    fontWeight: "700",
    fontFamily: "monospace",
    margin: "0",
    lineHeight: "1.4",
    letterSpacing: "1px",
    backgroundColor: "#DBEAFE",
    padding: "8px 12px",
    borderRadius: "6px",
    display: "inline-block" as const,
  },
  buttonContainer: {
    textAlign: "center" as const,
    padding: "12px 0 32px 0",
  },
  button: {
    backgroundColor: "#60A5FA",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "500",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 36px",
  },
  innerDivider: {
    borderColor: "#E2E8F0",
    borderTop: "none" as const,
    borderWidth: "1px",
    margin: "0 0 24px 0",
  },
  lgpdBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: "8px",
    margin: "0",
    border: "1px solid #BBF7D0",
  },
  lgpdPadding: {
    padding: "14px 20px",
  },
  lgpdText: {
    color: "#166534",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0",
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

    // AIDEV-NOTE: SEGURANCA - Buscar usuario da tabela com todas verificacoes
    // Fonte da verdade é sempre o banco, não JWT claims
    const { data: requestingUser, error: requestingUserError } = await supabaseAdmin
      .from("usuarios")
      .select("id, role, organizacao_id, nome, email, status")
      .eq("auth_id", requestingUserId)
      .is("deletado_em", null)
      .single();

    if (requestingUserError || !requestingUser) {
      console.warn("[invite-admin] Usuário não encontrado:", requestingUserError?.message);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // AIDEV-NOTE: Verificar status ativo antes de permitir operações
    if (requestingUser.status !== "ativo") {
      console.warn("[invite-admin] Usuário inativo tentando convidar:", requestingUserId);
      return new Response(
        JSON.stringify({ error: "Usuário inativo" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
      role: inviteRole,
    } = await req.json();

    const userRole = inviteRole || "member";

    console.log("[invite-admin] Request:", {
      email,
      usuario_id,
      organizacao_id,
      organizacao_nome,
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

    const orgNome = organizacao_nome || "CRM";
    const loginUrl = "https://crm.renovedigital.com.br/login";

    // =====================================================
    // GERAR SENHA SEGURA E CRIAR/ATUALIZAR USUÁRIO
    // =====================================================
    const senhaGerada = generateSecurePassword(12);
    console.log("[invite-admin] Senha segura gerada para:", email);

    let authUserId: string | undefined;

    // Tentar criar usuário novo
    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senhaGerada,
        email_confirm: true,
        user_metadata: {
          nome,
          sobrenome,
          role: userRole,
          tenant_id: organizacao_id,
          organizacao_nome: orgNome,
        },
      });

    if (createError) {
      // Se usuário já existe, atualizar a senha
      if (
        createError.message?.includes("already been registered") ||
        (createError as any).code === "email_exists"
      ) {
        console.log("[invite-admin] Usuário já existe, atualizando senha...");

        // Buscar o user ID existente
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u: any) => u.email === email.toLowerCase().trim()
        );

        if (existingUser) {
          authUserId = existingUser.id;
          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUser(existingUser.id, {
              password: senhaGerada,
              user_metadata: {
                nome,
                sobrenome,
                role: userRole,
                tenant_id: organizacao_id,
                organizacao_nome: orgNome,
              },
            });

          if (updateError) {
            console.error("[invite-admin] Erro ao atualizar usuário:", updateError);
            return new Response(
              JSON.stringify({ error: updateError.message }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: "Usuário existente não encontrado" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else {
        console.error("[invite-admin] createUser error:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      authUserId = createData.user?.id;
      console.log("[invite-admin] Novo usuário criado:", authUserId);
    }

    // Atualizar usuario na tabela com status 'ativo'
    await supabaseAdmin
      .from("usuarios")
      .update({ auth_id: authUserId, status: "ativo" })
      .eq("id", usuario_id);

    console.log("[invite-admin] Usuário atualizado para status 'ativo'");

    // AIDEV-NOTE: Audit log para rastreabilidade de criação de usuários
    await supabaseAdmin.from("audit_log").insert({
      usuario_id: requestingUser.id,
      organizacao_id,
      acao: "usuario_convidado",
      entidade: "usuarios",
      entidade_id: usuario_id,
      detalhes: {
        email: email,
        role: userRole,
        convidado_por: requestingUser.email,
        convidado_por_role: requestingUser.role,
      },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    // =====================================================
    // ENVIAR EMAIL COM CREDENCIAIS VIA RESEND
    // =====================================================
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const html = await renderAsync(
          React.createElement(WelcomeEmail, {
            nome: nome || "Usuário",
            email,
            senha: senhaGerada,
            organizacaoNome: orgNome,
            roleName: userRole === "admin" ? "administrador" : "membro",
            loginUrl,
          })
        );

        const { data: emailData, error: emailError } =
          await resend.emails.send({
            from: "CRM Renove <crm@renovedigital.com.br>",
            to: [email],
            subject: "Bem-vindo ao CRM Renove - Seus dados de acesso",
            html,
          });

        if (emailError) {
          console.error("[invite-admin] Erro ao enviar email:", emailError);
        } else {
          console.log("[invite-admin] Email de boas-vindas enviado:", emailData?.id);
        }
      } catch (emailErr) {
        console.error("[invite-admin] Erro no envio:", emailErr);
      }
    } else {
      console.warn("[invite-admin] RESEND_API_KEY não configurada");
    }

    return new Response(
      JSON.stringify({ success: true, auth_id: authUserId }),
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
