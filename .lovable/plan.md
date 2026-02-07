

# Plano: PhoneInputField + Campos Globais no Modal "Nova Oportunidade"

## Contexto

O formulario inline de criacao de contato dentro do modal "Nova Oportunidade" possui dois problemas:

1. **Telefone sem seletor de pais** - Usa mascara simples `formatTelefone()` em vez do componente `PhoneInputField` com bandeira, DDI e busca de pais (que ja existe e funciona em `/contatos/pessoas`)
2. **Campos estaticos (hardcoded)** - Labels, obrigatoriedade e campos visiveis sao fixos no codigo, sem respeitar a configuracao global de `/configuracoes/campos`

## O que ja existe e sera reutilizado

- `PhoneInputField` (`src/modules/contatos/components/PhoneInputField.tsx`) - Componente completo com bandeira, DDI, busca de pais e mascara automatica
- `useCamposConfig` (`src/modules/contatos/hooks/useCamposConfig.ts`) - Hook que mapeia configuracoes globais para campos do modulo contatos (labels, obrigatoriedade, placeholders)
- `ContatoFormFieldsToggle` (`src/modules/contatos/components/ContatoFormFieldsToggle.tsx`) - Popover com icone de olho para controlar visibilidade dos campos, com persistencia no localStorage
- `getFieldVisibility` - Funcao que retorna o mapa de visibilidade salvo localmente

## Etapas de Implementacao

### Etapa 1: Integrar `useCamposConfig` no modal

Importar e usar o hook `useCamposConfig(tipoContato)` dentro do `NovaOportunidadeModal` para obter:
- `getLabel(fieldKey)` - Label dinamica do campo
- `isRequired(fieldKey)` - Obrigatoriedade global
- `getPlaceholder(fieldKey)` - Placeholder configurado
- `campos` - Lista completa de campos ativos

Isso permitira que todos os campos do formulario inline reflitam automaticamente as configuracoes definidas em `/configuracoes/campos`.

### Etapa 2: Substituir campo de telefone pelo `PhoneInputField`

Trocar o `<input type="tel">` atual com mascara `formatTelefone` pelo componente `PhoneInputField` que ja inclui:
- Seletor de bandeira (Brasil padrao)
- DDI do pais selecionado (+55, +1, etc.)
- Mascara automatica por pais
- Dropdown pesquisavel de paises
- Armazenamento no formato `+55XXXXXXXXXXX`

Aplicar tanto para o formulario de **Pessoa** quanto para o de **Empresa**.

### Etapa 3: Adicionar botao de visibilidade de campos (icone de olho)

Integrar o componente `ContatoFormFieldsToggle` no header do formulario inline, ao lado de "Nova Pessoa" / "Nova Empresa" e do link "Buscar existente". O botao exibira:
- Icone de olho
- Contagem "Campos X/Y"
- Popover com toggles para cada campo

Usar `getFieldVisibility(tipoContato)` para controlar quais campos sao exibidos. Campos obrigatorios (pela config global) nao podem ser ocultados.

### Etapa 4: Renderizar campos dinamicamente baseado na config global

Substituir o grid de campos hardcoded por uma renderizacao dinamica que:
1. Consulta a lista de campos do sistema ativos via `useCamposConfig`
2. Verifica visibilidade via `getFieldVisibility`
3. Aplica labels da config global (em vez de strings fixas)
4. Marca campos obrigatorios com asterisco vermelho conforme config global
5. Usa placeholders da config global
6. Renderiza campos customizados (nao-sistema) quando existirem e estiverem visiveis

Mapeamento de campos para o formulario inline:
- **Pessoa**: nome (sempre visivel), sobrenome, email, telefone, cargo, linkedin_url + campos customizados
- **Empresa**: razao_social (sempre visivel, porem o campo principal exibido sera nome_fantasia por ser o que ja existe no fluxo), nome_fantasia, cnpj, email, telefone, website, segmento, porte + campos customizados

### Etapa 5: Ajustar validacao no submit

Atualizar a validacao `contatoValido` para respeitar campos obrigatorios da config global (usando `isRequired()`). Se um campo marcado como obrigatorio globalmente estiver vazio, o formulario nao permite submit.

Atualizar `criarContatoRapido` para enviar todos os campos preenchidos (incluindo novos campos que antes nao existiam no formulario inline).

---

## Detalhamento Tecnico

### Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/negocios/components/modals/NovaOportunidadeModal.tsx` | Importar `useCamposConfig`, `PhoneInputField`, `ContatoFormFieldsToggle`, `getFieldVisibility`. Refatorar secao de contato inline. |

### Nenhuma migracao de banco necessaria

Todas as funcionalidades dependem de componentes e hooks ja existentes no modulo de contatos.

### Novos imports no modal

```
import { useCamposConfig } from '@/modules/contatos/hooks/useCamposConfig'
import { PhoneInputField } from '@/modules/contatos/components/PhoneInputField'
import { ContatoFormFieldsToggle, getFieldVisibility } from '@/modules/contatos/components/ContatoFormFieldsToggle'
```

### Mudancas no state do componente

- Adicionar states para novos campos que podem aparecer dinamicamente (cargo, linkedin_url, website, segmento, porte, cnpj, razao_social, campos customizados)
- Ou usar um `Record<string, string>` generico para campos adicionais

### Layout do formulario inline (apos mudancas)

```
+---------------------------------------------+
| Nova Pessoa   [Campos 4/6]  Buscar existente|
+---------------------------------------------+
| Nome *              | Sobrenome *           |  <- labels da config global
| [_______________]   | [_______________]     |
| Email               | Telefone              |
| [_______________]   | [BR +55 v] [(00)...]  |  <- PhoneInputField
| Cargo               | LinkedIn              |  <- se visivel
| [_______________]   | [_______________]     |
+---------------------------------------------+
```

### Fluxo de dados

1. Modal monta -> `useCamposConfig('pessoa')` busca config global
2. `getFieldVisibility('pessoa')` retorna mapa de visibilidade (localStorage)
3. Campos sao renderizados dinamicamente com labels/obrigatoriedade da config
4. Usuario clica no icone de olho -> `ContatoFormFieldsToggle` altera visibilidade
5. Ao trocar tipo (Pessoa/Empresa), `useCamposConfig` recarrega para a nova entidade
6. No submit, campos preenchidos sao enviados para `criarContatoRapido`

