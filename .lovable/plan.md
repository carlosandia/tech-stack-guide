

## Proposta de Copy Premium para Pagina de Parceiro

### Mudancas no Header

Ao lado do logotipo Renove, adicionar o texto **"Programa de Parceiros"** em estilo leve (font-medium, text-slate-400), criando identidade propria para a tela:

```text
[Logo Renove] Programa de Parceiros          [Badge: Parceiro Nome]
```

- O texto "Programa de Parceiros" fica separado do logo por um divisor sutil (`|` ou barra vertical em slate-600)
- Fonte menor que o logo, cor `text-slate-400` para nao competir

### Mudancas no Hero - Copy Premium

**Titulo principal (h1):**
> Bem-vindo, cliente **[Nome do Parceiro]**.
> Seu plano com condições exclusivas.

- Quebra em duas linhas
- Nome do parceiro em destaque com `text-primary`
- "condições exclusivas" reforça pertencimento

**Subtitulo (p):**
> Seu parceiro **[Nome]** garante vantagens especiais para você. Escolha o plano ideal e comece agora.

- Tom pessoal e direto
- Reforça a relacao parceiro-cliente

**Badge de indicacao:**
> Parceiro Certificado

- Troca "Indicado por [Nome]" por um selo mais institucional
- Icone `ShieldCheck` no lugar de `Sparkles` para reforcar credibilidade

### Resumo das Alteracoes

| Elemento | Atual | Proposta |
|----------|-------|----------|
| Header logo | Apenas logo Renove | Logo + "Programa de Parceiros" |
| Badge header | "Indicação [Nome]" | "Parceiro Certificado" com ShieldCheck |
| Titulo h1 | "Escolha o plano ideal para seu negócio" | "Bem-vindo, cliente **[Nome]**. Seu plano com condições exclusivas." |
| Subtitulo | "Comece agora e cancele quando quiser." | "Seu parceiro **[Nome]** garante vantagens especiais para você." |
| Badge hero | "Indicado por [Nome]" com Sparkles | "Parceiro Certificado" com ShieldCheck |

### Detalhes Tecnicos

**Arquivo unico:** `src/modules/public/pages/ParceiroPage.tsx`

1. **Header (linhas 170-188):**
   - Adicionar texto "Programa de Parceiros" apos o logo com separador vertical
   - Badge do header: trocar icone `Sparkles` por `ShieldCheck`, texto para "Parceiro Certificado"

2. **Hero titulo (linha 198-200):**
   - Conteudo dinamico usando `parceiro?.organizacao?.nome`
   - Duas linhas: saudacao + proposta de valor

3. **Hero subtitulo (linha 203-205):**
   - Copy personalizada com nome do parceiro

4. **Badge hero (linhas 208-213):**
   - Trocar `Sparkles` por `ShieldCheck`
   - Texto: "Parceiro Certificado" (sem repetir o nome, ja esta no titulo)

5. **Import:** Adicionar `ShieldCheck` ao import do lucide-react (ja existe `Sparkles`, manter ambos se necessario)

Nenhuma dependencia nova. Apenas alteracoes de copy e icones.

