# Troubleshooting - Atualização de Categoria de Documentos

## 🐛 Problema Reportado

**Sintomas:**
- Ao clicar para alterar a categoria, os documentos deixam de ficar visíveis
- A categoria não é alterada
- Console não mostra nenhum erro

---

## ✅ Correções Aplicadas

### 1. **Importação do Serviço Corrigida**

**Antes (incorreto):**
```javascript
// Importação dinâmica dentro da função
const supabaseService = await import('@/services/supabaseService');
await supabaseService.fileService.updateFileCategory(fileId, category);
```

**Depois (correto):**
```javascript
// Importação estática no topo do arquivo
import { fileService } from '@/services/supabaseService';

// Uso direto na função
await fileService.updateFileCategory(fileId, category);
```

**Por quê?** A importação dinâmica pode causar problemas de timing e cache. A importação estática garante que o serviço está sempre disponível.

---

### 2. **Logs Detalhados Adicionados**

Agora a função `handleUpdateFileCategory` tem logs em cada etapa:

```javascript
console.log('🔄 Iniciando atualização de categoria:', { fileId, category });
console.log('📤 Chamando fileService.updateFileCategory...');
console.log('✅ Categoria atualizada no Supabase:', result);
console.log('🔄 Recarregando projetos...');
console.log('✅ Projetos recarregados');
console.log('✅ Modal fechado com sucesso');
```

**Como usar:**
1. Abra o Console do navegador (F12)
2. Tente atualizar uma categoria
3. Observe os logs para identificar onde o processo para

---

### 3. **Estado de Loading Adicionado**

**Novo estado:**
```javascript
const [updatingCategory, setUpdatingCategory] = useState(false);
```

**Benefícios:**
- ✅ Impede cliques múltiplos durante atualização
- ✅ Mostra feedback visual ("Atualizando categoria...")
- ✅ Desabilita todos os botões durante o processo
- ✅ Impede fechamento acidental do modal

**Interface atualizada:**
- Botões de categoria: `disabled={updatingCategory}`
- Botão Cancelar: `disabled={updatingCategory}`
- Botão Remover: `disabled={updatingCategory}`
- Descrição do modal: Mostra "Atualizando categoria..." durante o processo

---

### 4. **Tratamento de Erros Melhorado**

```javascript
catch (error) {
  console.error('❌ Erro ao atualizar categoria:', error);
  console.error('❌ Detalhes do erro:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
  alert(`Erro ao atualizar categoria: ${error.message || 'Erro desconhecido'}`);
}
```

**O que mudou:**
- Logs mais detalhados com todos os campos do erro
- Alert com mensagem específica do erro
- Bloco `finally` para sempre resetar o loading

---

## 🔍 Como Diagnosticar o Problema

### Passo 1: Verificar Console

Abra o Console (F12) e tente atualizar uma categoria. Você deve ver:

```
🔄 Iniciando atualização de categoria: {fileId: "38", category: "Relatório"}
📤 Chamando fileService.updateFileCategory...
✅ Categoria atualizada no Supabase: {id: "38", category: "Relatório", ...}
🔄 Recarregando projetos...
✅ Projetos recarregados
✅ Modal fechado com sucesso
```

**Se parar em algum ponto:**
- Parou em "Chamando fileService...": Problema no serviço Supabase
- Parou em "Recarregando projetos...": Problema no `refreshProjects()`
- Não aparece nada: Função não está sendo chamada

---

### Passo 2: Verificar Rede (Network Tab)

1. Abra DevTools (F12) → Aba **Network**
2. Filtre por **Fetch/XHR**
3. Tente atualizar categoria
4. Procure por requisição para `project_files?id=eq.XX`

**Verificar:**
- ✅ Status: 200 (sucesso)
- ❌ Status: 400 (erro - coluna não existe)
- ❌ Status: 401 (não autorizado)
- ❌ Status: 500 (erro no servidor)

**Payload esperado:**
```json
{
  "category": "Relatório"
}
```

**Resposta esperada:**
```json
{
  "id": "38",
  "category": "Relatório",
  "name": "documento.pdf",
  ...
}
```

---

### Passo 3: Verificar Supabase

**Verificar se a coluna existe:**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
  AND column_name = 'category';
```

**Resultado esperado:**
```
column_name | data_type
------------|----------
category    | text
```

**Se não retornar nada:** A coluna não foi criada. Execute a migração.

---

### Passo 4: Verificar Permissões RLS

**Verificar políticas de UPDATE:**

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'project_files' 
  AND cmd = 'UPDATE';
```

**Deve haver uma política permitindo UPDATE para usuários autenticados.**

---

## 🎯 Possíveis Causas e Soluções

### Causa 1: Coluna não existe no banco

**Sintoma:** Erro 400 com mensagem "Could not find the 'category' column"

**Solução:**
1. Acesse Supabase Dashboard → SQL Editor
2. Execute a migração `add_category_to_project_files.sql`
3. Recarregue o schema cache (Settings → API → Reload schema cache)

---

### Causa 2: Permissões RLS bloqueando UPDATE

**Sintoma:** Erro 403 ou UPDATE não tem efeito

**Solução:**
```sql
-- Verificar política atual
SELECT * FROM pg_policies WHERE tablename = 'project_files';

-- Se necessário, criar política de UPDATE
CREATE POLICY "Users can update their project files"
ON project_files FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id = project_files.project_id
  )
);
```

---

### Causa 3: refreshProjects() causando perda de estado

**Sintoma:** Documentos desaparecem após atualização

**Possível causa:** O `refreshProjects()` está recarregando todos os projetos e pode estar causando um re-render que perde o estado local.

**Solução alternativa:** Atualizar apenas o arquivo específico sem recarregar tudo:

```javascript
// Em vez de refreshProjects(), atualizar localmente
const updatedFile = await fileService.updateFileCategory(fileId, category);

// Atualizar apenas o arquivo no estado local
setProjects(prev => prev.map(p => 
  p.id === project.id 
    ? {
        ...p,
        files: p.files.map(f => 
          f.id === fileId ? { ...f, category } : f
        )
      }
    : p
));
```

---

### Causa 4: Categoria não está sendo mapeada no contexto

**Sintoma:** Categoria salva no banco mas não aparece na UI

**Verificar:** `src/contexts/ProjectsContext.jsx` linha ~359

```javascript
files: (project.project_files || []).map(file => ({
  id: file.id,
  name: file.name,
  // ... outros campos ...
  category: file.category, // ← DEVE ESTAR PRESENTE
})),
```

**Se não estiver:** Adicione o campo `category` ao mapeamento.

---

## 📊 Checklist de Verificação

Antes de reportar o problema, verifique:

- [ ] Migração SQL foi aplicada no Supabase
- [ ] Coluna `category` existe na tabela `project_files`
- [ ] Schema cache foi recarregado
- [ ] Console mostra os logs de atualização
- [ ] Requisição HTTP retorna status 200
- [ ] Campo `category` está no mapeamento do contexto
- [ ] Permissões RLS permitem UPDATE
- [ ] Não há erros no console

---

## 🚀 Teste Completo

Execute este teste passo a passo:

1. **Recarregue a página** (F5)
2. **Abra o Console** (F12)
3. **Navegue até um projeto**
4. **Vá para aba Documentos**
5. **Clique em "Categoria" de um arquivo**
6. **Observe o console** - deve mostrar logs
7. **Selecione uma categoria**
8. **Observe:**
   - Console mostra "✅ Categoria atualizada"
   - Console mostra "✅ Projetos recarregados"
   - Modal fecha automaticamente
   - Badge de categoria aparece no arquivo
   - Documentos continuam visíveis

---

## 📞 Se o Problema Persistir

Se após todas as correções o problema continuar:

1. **Capture os logs completos do console**
2. **Capture a requisição HTTP (Network tab)**
3. **Verifique a resposta do Supabase**
4. **Verifique se há erros no Supabase Logs** (Dashboard → Logs)
5. **Teste com outro navegador** (para descartar cache)
6. **Limpe o cache do navegador** (Ctrl+Shift+Del)

---

## 📝 Notas Técnicas

### Fluxo Completo de Atualização

```
1. Usuário clica em categoria
   ↓
2. handleUpdateFileCategory() é chamada
   ↓
3. setUpdatingCategory(true) - Desabilita UI
   ↓
4. fileService.updateFileCategory() - Atualiza no Supabase
   ↓
5. refreshProjects() - Recarrega todos os projetos
   ↓
6. setShowCategoryModal(false) - Fecha modal
   ↓
7. setUpdatingCategory(false) - Reabilita UI
   ↓
8. Badge de categoria aparece na lista
```

### Tempo Esperado

- Atualização no Supabase: ~100-300ms
- Recarregamento de projetos: ~500-1000ms
- **Total:** ~1-2 segundos

Se demorar mais de 5 segundos, há um problema de performance.

---

## ✅ Resultado Esperado

Após as correções:

1. ✅ Clique em "Categoria" abre modal
2. ✅ Clique em categoria mostra "Atualizando categoria..."
3. ✅ Console mostra logs detalhados
4. ✅ Categoria é salva no Supabase
5. ✅ Modal fecha automaticamente
6. ✅ Badge de categoria aparece
7. ✅ Documentos permanecem visíveis
8. ✅ Filtros funcionam com a nova categoria
