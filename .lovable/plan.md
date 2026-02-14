

# Salvar Configuracao de Colunas no Banco de Dados

## Resumo

Adicionar um botao "Salvar Colunas" acima do "Restaurar Padrao" no popover de colunas. Ao clicar, a configuracao atual de colunas visiveis sera persistida no banco (por usuario + tipo de contato), e ao carregar a pagina, o sistema buscara essa configuracao salva ao inves de usar apenas o localStorage.

## Etapas

### 1. Criar tabela no banco de dados

Criar a tabela `preferencias_colunas_contatos` com a seguinte estrutura:

- `id` (uuid, PK, default gen_random_uuid())
- `usuario_id` (uuid, FK para usuarios.id, NOT NULL)
- `tipo` (varchar, 'pessoa' ou 'empresa', NOT NULL)
- `colunas` (jsonb, NOT NULL) -- array de ColumnConfig
- `criado_em` (timestamptz, default now())
- `atualizado_em` (timestamptz, default now())
- Constraint UNIQUE em (usuario_id, tipo)
- RLS habilitado: usuario so acessa seus proprios registros

### 2. Criar service de preferencias

Novo arquivo `src/modules/contatos/services/preferenciasColunasContatos.ts`:

- `salvarPreferenciaColunas(tipo, colunas)` -- upsert via Supabase
- `buscarPreferenciaColunas(tipo)` -- select por usuario logado e tipo

### 3. Criar hook `usePreferenciaColunas`

Novo arquivo `src/modules/contatos/hooks/usePreferenciaColunas.ts`:

- Usa `useQuery` para buscar preferencia salva no banco
- Usa `useMutation` para salvar/atualizar
- Integra com `useAuth` para pegar o `user.id`

### 4. Alterar `ContatoColumnsToggle.tsx`

- Adicionar botao "Salvar Colunas" acima do "Restaurar Padrao"
- Botao chama a mutation de salvar
- Exibir toast de confirmacao ao salvar com sucesso

### 5. Alterar `ContatosPage.tsx`

- Usar o hook `usePreferenciaColunas` para carregar colunas salvas no banco ao inicializar
- Prioridade: banco > localStorage > default

---

## Detalhes Tecnicos

### Migracao SQL

```sql
CREATE TABLE preferencias_colunas_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('pessoa', 'empresa')),
  colunas jsonb NOT NULL,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(usuario_id, tipo)
);

ALTER TABLE preferencias_colunas_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios acessam suas proprias preferencias"
  ON preferencias_colunas_contatos
  FOR ALL
  USING (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()))
  WITH CHECK (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));
```

### Botao no popover

O botao "Salvar Colunas" sera estilizado como botao primario (text-primary, hover:underline) posicionado logo acima do "Restaurar Padrao", separado por borda superior, seguindo o design system.

### Fluxo

1. Usuario abre popover de colunas
2. Marca/desmarca colunas (funciona como hoje via localStorage)
3. Clica em "Salvar Colunas" para persistir no banco
4. Toast: "Configuracao de colunas salva com sucesso"
5. Proximo acesso: sistema carrega do banco automaticamente

