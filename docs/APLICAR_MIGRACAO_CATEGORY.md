# Como Aplicar a Migração de Categorias no Supabase

## ⚠️ ERRO ATUAL

```
Could not find the 'category' column of 'project_files' in the schema cache
```

**Causa:** A coluna `category` ainda não foi criada na tabela `project_files` do Supabase.

**Solução:** Aplicar a migração SQL manualmente.

---

## 📋 PASSO A PASSO

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `lrnpdyqcxstghzrujywf`

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Ou acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/sql

3. **Crie uma Nova Query:**
   - Clique em **"New query"**
   - Cole o SQL abaixo:

```sql
-- Adicionar campo de categoria aos arquivos do projeto
-- Data: 2025-11-24

-- Adicionar coluna category à tabela project_files
ALTER TABLE project_files
ADD COLUMN IF NOT EXISTS category TEXT;

-- Adicionar constraint para validar categorias permitidas
ALTER TABLE project_files
ADD CONSTRAINT valid_category CHECK (
  category IS NULL OR 
  category IN (
    'Correspondência',
    'ATA',
    'E-mail',
    'RDO',
    'Relatório',
    'Análise',
    'Singularidades',
    'Notificação',
    'Plano de Ação',
    'Parecer',
    'Checklist',
    'Procedimento'
  )
);

-- Adicionar comentário explicativo
COMMENT ON COLUMN project_files.category IS 'Categoria do documento para organização e filtros';

-- Criar índice para melhorar performance de filtros por categoria
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);

-- Criar índice para filtros combinados (projeto + categoria)
CREATE INDEX IF NOT EXISTS idx_project_files_project_category ON project_files(project_id, category);
```

4. **Execute a Query:**
   - Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
   - Aguarde a confirmação de sucesso

5. **Verifique a Coluna:**
   - No menu lateral, clique em **"Table Editor"**
   - Selecione a tabela **"project_files"**
   - Verifique se a coluna **"category"** aparece na lista de colunas

---

### Opção 2: Via Supabase CLI (Avançado)

Se você tem o Supabase CLI instalado:

```bash
# 1. Navegue até a pasta do projeto
cd "c:\Users\andre\Exxata Engenharia Dropbox\andre dias\8000 - GERENCIAMENTO\00_organizacao\02_marketing\07_softwares_apps\03_connect"

# 2. Aplique a migração
supabase db push

# Ou execute a migração específica
supabase migration up --file supabase/migrations/add_category_to_project_files.sql
```

---

## ✅ VERIFICAÇÃO

Após aplicar a migração, verifique se funcionou:

### 1. Via SQL Editor:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_files' 
  AND column_name = 'category';

-- Verificar constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'project_files'
  AND constraint_name = 'valid_category';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'project_files'
  AND indexname LIKE '%category%';
```

### 2. Via Aplicação:

1. Faça upload de um arquivo
2. Selecione uma categoria no modal
3. Verifique se salva sem erro 400
4. Verifique se o badge de categoria aparece

---

## 🔧 TROUBLESHOOTING

### Erro: "relation 'project_files' does not exist"

**Causa:** Tabela `project_files` não existe
**Solução:** Verifique o nome correto da tabela no seu schema

### Erro: "constraint 'valid_category' already exists"

**Causa:** Constraint já foi criada anteriormente
**Solução:** Remova a constraint antes de recriar:

```sql
ALTER TABLE project_files DROP CONSTRAINT IF EXISTS valid_category;
```

### Erro: "column 'category' already exists"

**Causa:** Coluna já foi criada anteriormente
**Solução:** A migração usa `IF NOT EXISTS`, então isso não deve acontecer. Se acontecer, pule a criação da coluna.

### Cache do Supabase não atualizado

**Causa:** Schema cache do Supabase não foi atualizado
**Solução:** 

1. No Dashboard, vá em **Settings** → **API**
2. Clique em **"Reload schema cache"**
3. Aguarde alguns segundos
4. Tente novamente na aplicação

---

## 📝 NOTAS IMPORTANTES

1. **Backup:** Sempre faça backup antes de alterar o schema
2. **Produção:** Se estiver em produção, teste em staging primeiro
3. **Downtime:** Esta migração é rápida e não causa downtime
4. **Rollback:** Para reverter, execute:

```sql
-- Remover índices
DROP INDEX IF EXISTS idx_project_files_category;
DROP INDEX IF EXISTS idx_project_files_project_category;

-- Remover constraint
ALTER TABLE project_files DROP CONSTRAINT IF EXISTS valid_category;

-- Remover coluna
ALTER TABLE project_files DROP COLUMN IF EXISTS category;
```

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar a migração com sucesso:

1. ✅ Recarregue a aplicação (F5)
2. ✅ Teste o upload de arquivo
3. ✅ Teste a seleção de categoria
4. ✅ Teste os filtros de categoria e período
5. ✅ Verifique se o badge aparece corretamente

---

## 📞 SUPORTE

Se continuar com problemas:

1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Confirme que a coluna foi criada (Table Editor)
4. Confirme que o schema cache foi recarregado
