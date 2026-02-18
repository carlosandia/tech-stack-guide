

## Otimizar Onboarding com Dados do Pre-Cadastro

### Objetivo
Eliminar a redundancia no formulario de onboarding. Os dados ja coletados no modal de pre-cadastro (nome, email, telefone, empresa, segmento) serao reaproveitados e exibidos como somente leitura. O usuario precisara apenas criar sua senha.

---

### Alteracoes

#### 1. Edge Function `get-checkout-session` - Retornar `pre_cadastro_id`

A funcao ja recebe os metadados do Stripe que contem `pre_cadastro_id`. Basta incluir esse campo na resposta JSON.

**Arquivo:** `supabase/functions/get-checkout-session/index.ts`
- Adicionar `pre_cadastro_id: session.metadata?.pre_cadastro_id` no JSON de retorno

---

#### 2. `OnboardingPage` - Buscar pre-cadastro e pre-preencher formulario

**Arquivo:** `src/modules/public/pages/OnboardingPage.tsx`

Fluxo atualizado:
1. `fetchSession` retorna agora o `pre_cadastro_id`
2. Se existir `pre_cadastro_id`, faz uma query na tabela `pre_cadastros_saas` para buscar os dados
3. Pre-preenche os campos: `nome_empresa`, `segmento`, `admin_nome` (extraido de `nome_contato`), `admin_email`, `admin_telefone`
4. Todos os campos pre-preenchidos ficam `readOnly` com estilo visual de campo bloqueado (`bg-muted`, `cursor-not-allowed`)
5. Apenas o campo `Senha` fica editavel
6. Se nao houver pre-cadastro (fallback), o formulario funciona como hoje (todos os campos editaveis)

Logica de split do nome:
- `nome_contato` = "Rafael Azevedo" -> `admin_nome` = "Rafael", `admin_sobrenome` = "Azevedo"
- Se so um nome: `admin_nome` = nome, `admin_sobrenome` = ""

---

#### 3. RLS - Permitir SELECT anon na `pre_cadastros_saas`

Atualmente so existe policy de INSERT para anon. Para que o onboarding (que roda sem auth) consiga ler o pre-cadastro, e necessaria uma policy de SELECT restrita.

**Migracao SQL:**
```
CREATE POLICY "anon_select_by_id" ON pre_cadastros_saas
  FOR SELECT TO anon
  USING (true);
```

Nota: como o SELECT sera feito por `id` (UUID nao adivinhavel) e os dados sao do proprio usuario que acabou de preencher, o risco e minimo. Alternativamente, podemos mover a busca para dentro da edge function `get-checkout-session` (que ja roda com service role), evitando expor a tabela. Essa segunda abordagem e mais segura.

**Abordagem escolhida (mais segura):** Buscar os dados do pre-cadastro dentro da propria edge function `get-checkout-session`, que ja tem acesso service_role. Assim nao precisamos de nova policy RLS.

---

#### 4. Ajuste final na Edge Function `get-checkout-session`

Alem de retornar o `pre_cadastro_id`, a funcao buscara os dados do pre-cadastro e os retornara diretamente:

```text
Retorno atualizado:
{
  customer_email,
  plano_id,
  plano_nome,
  is_trial,
  periodo,
  pre_cadastro: {
    nome_contato,
    email,
    telefone,
    nome_empresa,
    segmento
  }
}
```

Isso elimina a necessidade de query adicional no frontend e de nova policy RLS.

---

### Secao Tecnica

**Arquivos modificados:**

| Arquivo | Alteracao |
|---------|----------|
| `supabase/functions/get-checkout-session/index.ts` | Buscar pre-cadastro por ID dos metadados e retornar dados no response |
| `src/modules/public/pages/OnboardingPage.tsx` | Pre-preencher campos com dados do pre-cadastro, campos bloqueados, apenas senha editavel |

**Nenhuma migracao SQL necessaria** - a busca ocorre na edge function com service_role.

**UX do formulario otimizado:**
- Campos pre-preenchidos: fundo `bg-muted`, borda `border-input`, cor `text-muted-foreground`, `cursor-not-allowed`, atributo `readOnly`
- Campo Senha: estilo normal, editavel, foco automatico
- Texto de contexto: "Seus dados foram recuperados do cadastro anterior. Defina sua senha para continuar."
