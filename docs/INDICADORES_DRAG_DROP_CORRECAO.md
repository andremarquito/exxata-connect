# Correção - Drag & Drop de Indicadores - Persistência no Supabase

**Data:** 30/10/2025  
**Status:** ✅ CORRIGIDO

---

## 🔍 Problema Identificado

A funcionalidade de **reordenação de indicadores por drag & drop** na aba "Indicadores" funcionava localmente, mas **não persistia no Supabase**. Após recarregar a página, os indicadores voltavam à ordem anterior.

### Causa Raiz

O código estava atualizando o campo **`order`** (que existe na tabela mas não é usado), quando deveria atualizar o campo **`display_order`** (que é usado para ordenação).

**Evidência:**
```sql
-- Campos na tabela project_indicators:
display_order INTEGER NOT NULL DEFAULT 0  -- ✅ Usado para ordenação
order INTEGER NULL                         -- ❌ Existe mas não é usado
```

**Query de carregamento:**
```javascript
// src/services/supabaseService.js linha 717
.order('display_order', { ascending: true })  // Ordena por display_order
```

---

## ❌ Código Problemático (ANTES)

### 1. Drag & Drop (ProjectDetails.jsx linha 1921)
```javascript
// ❌ ERRADO: Atualizava campo 'order' que não é usado
await updateProjectIndicator(project.id, indicators[i].id, { order: i });
```

### 2. Exportação Excel (linhas 1972 e 2173)
```javascript
// ❌ ERRADO: Exportava campo 'order'
'Ordem': indicator.order !== undefined ? indicator.order : index
```

### 3. Importação Excel (linhas 3132, 3414, 3422)
```javascript
// ❌ ERRADO: Importava como 'order'
order: order !== undefined ? parseInt(order) : undefined
// ...
order: graph.order
// ...
if (a.order !== undefined && b.order !== undefined) {
  return a.order - b.order;
}
```

---

## ✅ Correção Aplicada

### 1. Drag & Drop - Atualizar display_order
**Arquivo:** `src/pages/ProjectDetails.jsx`  
**Linha:** 1921

```javascript
// ✅ CORRETO: Atualiza campo 'display_order'
await updateProjectIndicator(project.id, indicators[i].id, { display_order: i });
```

### 2. Exportação Excel - Exportar display_order
**Linhas:** 1972, 2173

```javascript
// ✅ CORRETO: Exporta campo 'display_order'
'Ordem': indicator.display_order !== undefined ? indicator.display_order : index
```

### 3. Importação Excel - Importar como display_order
**Linhas:** 3132, 3414, 3422

```javascript
// ✅ CORRETO: Importa como 'display_order'
display_order: order !== undefined ? parseInt(order) : undefined
// ...
display_order: graph.display_order
// ...
if (a.display_order !== undefined && b.display_order !== undefined) {
  return a.display_order - b.display_order;
}
```

---

## 📊 Schema do Supabase

**Tabela:** `project_indicators`

| Campo | Tipo | Nullable | Default | Uso |
|-------|------|----------|---------|-----|
| `display_order` | integer | NO | 0 | ✅ **Usado para ordenação** |
| `order` | integer | YES | null | ❌ Existe mas não é usado |

**Query de carregamento:**
```javascript
// src/services/supabaseService.js
async getProjectIndicators(projectId) {
  const { data, error } = await supabase
    .from('project_indicators')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true }); // ← Ordena por display_order
  
  return data || [];
}
```

---

## 🔧 Fluxo Completo Corrigido

### 1. Drag & Drop
```
Usuário arrasta indicador
  ↓
handleIndicatorDrop() reordena array local
  ↓
updateProject() atualiza estado local (feedback visual imediato)
  ↓
Loop: updateProjectIndicator() com { display_order: i }
  ↓
indicatorService.updateIndicator() salva no Supabase
  ↓
✅ Ordem persistida no campo display_order
```

### 2. Recarregamento
```
Página recarrega
  ↓
getProjectIndicators() busca do Supabase
  ↓
.order('display_order', { ascending: true })
  ↓
✅ Indicadores carregados na ordem correta
```

### 3. Export/Import Excel
```
Exportação:
  indicator.display_order → Coluna "Ordem" no Excel
  
Importação:
  Coluna "Ordem" do Excel → display_order no objeto
  ↓
  Salvo no Supabase com display_order correto
```

---

## 🧪 Como Testar

### Teste 1: Drag & Drop
1. Abra um projeto com múltiplos indicadores
2. Clique em "Editar Gráficos"
3. Arraste um indicador para outra posição
4. Verifique no console: `✅ Ordem dos indicadores salva no Supabase`
5. **Recarregue a página (F5)**
6. ✅ A ordem deve permanecer após o reload

### Teste 2: Verificação no Supabase
Execute no SQL Editor:

```sql
-- Ver ordem atual dos indicadores
SELECT 
  id,
  title,
  display_order,
  "order",
  created_at
FROM project_indicators
WHERE project_id = 'SEU_PROJECT_ID_AQUI'
ORDER BY display_order ASC;
```

**Resultado esperado:**
- `display_order` deve ter valores sequenciais (0, 1, 2, 3...)
- `order` pode ser NULL ou ter valores antigos (não importa)

### Teste 3: Export/Import Excel
1. Exporte indicadores para Excel
2. Verifique coluna "Ordem" na aba "Configurações"
3. Modifique a ordem no Excel (troque valores)
4. Importe o arquivo
5. ✅ Indicadores devem aparecer na nova ordem
6. **Recarregue a página**
7. ✅ Ordem deve permanecer

---

## 📝 Logs de Debug

### Console ao arrastar indicador:
```
📊 Atualizando indicador: { projectId: "...", indicatorId: "...", updates: { display_order: 2 } }
✅ Indicador atualizado: { id: "...", display_order: 2, ... }
✅ Ordem dos indicadores salva no Supabase
```

### Console ao carregar projeto:
```
📊 Buscando indicadores do projeto: ...
✅ Indicadores encontrados: 5
[Indicadores ordenados por display_order]
```

---

## 🎯 Resultado Final

✅ **Drag & Drop funciona e persiste no Supabase**  
✅ **Ordem mantida após reload da página**  
✅ **Export/Import Excel com ordem correta**  
✅ **Campo display_order usado consistentemente**  
✅ **Logs de debug adicionados para facilitar troubleshooting**

---

## 📚 Arquivos Modificados

1. **src/pages/ProjectDetails.jsx**
   - Linha 1921: Drag & Drop usa `display_order`
   - Linha 1972: Export usa `display_order`
   - Linha 2173: Export individual usa `display_order`
   - Linha 3132: Import mapeia para `display_order`
   - Linha 3414: Import usa `display_order`
   - Linha 3422: Sort usa `display_order`

2. **src/services/supabaseService.js**
   - Linha 717: Query ordena por `display_order` (já estava correto)

---

## 🔄 Compatibilidade

### Indicadores Existentes
- ✅ Indicadores com `order` NULL funcionam normalmente
- ✅ Indicadores com `order` antigo não são afetados
- ✅ Ao arrastar, `display_order` é atualizado corretamente

### Migração Automática
Não é necessária migração. O sistema funciona com:
- `display_order` = 0 (default) para indicadores novos
- `display_order` atualizado ao arrastar
- `order` ignorado (pode ter qualquer valor ou NULL)

---

**Desenvolvido por:** Cascade AI  
**Revisado em:** 30/10/2025
