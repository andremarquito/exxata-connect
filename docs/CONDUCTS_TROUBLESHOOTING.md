# 🔧 Troubleshooting - Sistema de Condutas

## Problemas Comuns e Soluções

---

## 1. Erro: "Não foi possível adicionar conduta"

### Sintomas:
- Botão "Adicionar" não funciona
- Console mostra erro de permissão
- Mensagem: "RLS policy violation"

### Causas Possíveis:
1. **Usuário não é membro do projeto**
2. **RLS policies não estão ativas**
3. **Usuário não está autenticado**

### Soluções:

#### Verificar se usuário é membro:
```sql
SELECT * FROM project_members
WHERE project_id = <PROJECT_ID>
AND user_id = auth.uid();
```

#### Verificar RLS:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'project_conducts';
-- rowsecurity deve ser TRUE
```

#### Adicionar usuário ao projeto:
```sql
INSERT INTO project_members (project_id, user_id, role, added_by)
VALUES (<PROJECT_ID>, auth.uid(), 'member', auth.uid());
```

---

## 2. Erro: "Condutas não aparecem na UI"

### Sintomas:
- Aba "Inteligência Humana" mostra "Nenhuma conduta cadastrada"
- Dados existem no banco mas não aparecem

### Causas Possíveis:
1. **Campo `project` não corresponde ao ID do projeto**
2. **Condutas não foram carregadas**
3. **Mapeamento de campos incorreto**

### Soluções:

#### Verificar dados no banco:
```sql
SELECT * FROM project_conducts
WHERE project = <PROJECT_ID>
ORDER BY display_order;
```

#### Verificar carregamento no console:
```javascript
// Abrir DevTools (F12) e verificar:
console.log('Condutas carregadas:', project.conducts);
```

#### Forçar recarregamento:
```javascript
// No componente ProjectDetails
useEffect(() => {
  getProjectConducts(projectId);
}, [projectId]);
```

---

## 3. Erro: "Drag and Drop não funciona"

### Sintomas:
- Não consegue arrastar condutas
- Ordem não é salva

### Causas Possíveis:
1. **Usuário não tem permissão de edição**
2. **Função `reorderProjectConducts` não está sendo chamada**
3. **IDs das condutas estão incorretos**

### Soluções:

#### Verificar permissões:
```javascript
// No componente
console.log('Can manage insights:', canManageInsights);
// Deve ser true para admin/manager/consultor
```

#### Verificar IDs:
```javascript
// No evento onDrop
console.log('Dragged ID:', draggedId);
console.log('Target ID:', targetId);
console.log('New order:', newOrder);
```

#### Testar reordenação manualmente:
```javascript
await reorderProjectConducts(projectId, [
  'uuid-3',
  'uuid-1',
  'uuid-2'
]);
```

---

## 4. Erro: "Urgência não é salva"

### Sintomas:
- Seleciona urgência mas volta para "Normal"
- Console mostra erro de CHECK constraint

### Causas Possíveis:
1. **Valor de urgência inválido**
2. **Mapeamento incorreto entre UI e DB**

### Soluções:

#### Verificar valores permitidos:
```sql
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'project_conducts'::regclass
AND contype = 'c';
```

Valores válidos: `'Baixa'`, `'Normal'`, `'Alta'`, `'Crítica'`

#### Verificar mapeamento:
```javascript
// Em ProjectDetails.jsx
<SelectItem value="Baixa">Baixa</SelectItem>
<SelectItem value="Normal">Normal</SelectItem>
<SelectItem value="Alta">Alta</SelectItem>
<SelectItem value="Crítica">Crítica</SelectItem>
```

---

## 5. Erro: "Texto não é salvo ao editar"

### Sintomas:
- Edita texto mas ao recarregar volta ao anterior
- Console não mostra erros

### Causas Possíveis:
1. **Evento `onBlur` não está disparando**
2. **Função `updateConduct` não está sendo chamada**
3. **Mapeamento `text` → `content` incorreto**

### Soluções:

#### Adicionar logs:
```javascript
const updateConduct = async (id, patch) => {
  console.log('Updating conduct:', id, patch);
  try {
    await updateProjectConduct(project.id, id, patch);
    console.log('Update successful');
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

#### Verificar mapeamento:
```javascript
// Em ProjectsContext.jsx
if (updates.text !== undefined) {
  supabaseUpdates.content = updates.text; // ✅ Correto
}
```

#### Testar atualização direta:
```sql
UPDATE project_conducts
SET content = 'Teste de atualização'
WHERE id = '<CONDUCT_UUID>';
```

---

## 6. Erro: "Performance lenta ao carregar condutas"

### Sintomas:
- Demora para carregar aba "Inteligência Humana"
- Muitas requisições ao Supabase

### Causas Possíveis:
1. **Falta de índices**
2. **Carregamento desnecessário**
3. **Muitas condutas no projeto**

### Soluções:

#### Verificar índices:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'project_conducts';
```

Índices necessários:
- `idx_project_conducts_project`
- `idx_project_conducts_display_order`

#### Criar índices se não existirem:
```sql
CREATE INDEX IF NOT EXISTS idx_project_conducts_project 
ON project_conducts(project);

CREATE INDEX IF NOT EXISTS idx_project_conducts_display_order 
ON project_conducts(project, display_order);
```

#### Implementar paginação:
```javascript
const [page, setPage] = useState(1);
const CONDUCTS_PER_PAGE = 20;

const paginatedConducts = conducts.slice(
  (page - 1) * CONDUCTS_PER_PAGE,
  page * CONDUCTS_PER_PAGE
);
```

---

## 7. Erro: "Duplicar conduta cria ID duplicado"

### Sintomas:
- Erro "duplicate key value violates unique constraint"
- Console mostra conflito de UUID

### Causas Possíveis:
1. **UUID não está sendo gerado automaticamente**
2. **Tentando inserir com ID existente**

### Soluções:

#### Verificar geração de UUID:
```sql
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'project_conducts'
AND column_name = 'id';
-- Deve retornar: uuid_generate_v4()
```

#### Não passar ID ao criar:
```javascript
// ❌ Errado
await conductService.createConduct(projectId, {
  id: existingId, // Não fazer isso!
  content: 'Texto'
});

// ✅ Correto
await conductService.createConduct(projectId, {
  content: 'Texto',
  urgency: 'Normal'
});
```

---

## 8. Erro: "Conduta deletada ainda aparece"

### Sintomas:
- Deleta conduta mas ela reaparece
- Estado local não atualiza

### Causas Possíveis:
1. **Estado local não está sincronizado**
2. **Erro silencioso na deleção**
3. **Cache do navegador**

### Soluções:

#### Verificar deleção no banco:
```sql
SELECT * FROM project_conducts
WHERE id = '<CONDUCT_UUID>';
-- Deve retornar 0 linhas
```

#### Forçar atualização do estado:
```javascript
// Após deletar
await deleteProjectConduct(projectId, conductId);
await getProjectConducts(projectId); // Recarregar
```

#### Limpar cache:
```javascript
// No navegador: Ctrl + Shift + R (hard refresh)
```

---

## 9. Erro: "TypeError: Cannot read property 'conducts' of undefined"

### Sintomas:
- Erro ao acessar `project.conducts`
- Página quebra ao carregar

### Causas Possíveis:
1. **Projeto não foi carregado ainda**
2. **ID do projeto inválido**
3. **Usuário sem acesso ao projeto**

### Soluções:

#### Adicionar verificação:
```javascript
const conducts = Array.isArray(project?.conducts) 
  ? project.conducts 
  : [];
```

#### Verificar carregamento:
```javascript
if (!project) {
  return <div>Carregando projeto...</div>;
}
```

#### Verificar acesso:
```javascript
if (!userCanSeeProject(project)) {
  return <div>Sem acesso a este projeto</div>;
}
```

---

## 10. Erro: "RLS policy violation" ao criar conduta

### Sintomas:
- Erro 403 ou "new row violates row-level security policy"
- Usuário autenticado mas não consegue criar

### Causas Possíveis:
1. **Política INSERT com WITH CHECK incorreta**
2. **Campo `project` não corresponde a projeto acessível**
3. **Campo `created_by` não corresponde ao usuário atual**

### Soluções:

#### Verificar política INSERT:
```sql
SELECT policyname, with_check
FROM pg_policies
WHERE tablename = 'project_conducts'
AND cmd = 'INSERT';
```

#### Testar acesso ao projeto:
```sql
SELECT EXISTS (
  SELECT 1 FROM project_members
  WHERE project_id = <PROJECT_ID>
  AND user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM projects
  WHERE id = <PROJECT_ID>
  AND created_by = auth.uid()
);
-- Deve retornar TRUE
```

#### Verificar campos na inserção:
```javascript
console.log('Creating conduct:', {
  content: conductData.text,
  urgency: conductData.urgency,
  project_id: projectId,
  created_by: user.id
});
```

---

## Comandos Úteis para Debug

### Ver todas as condutas:
```sql
SELECT 
  pc.*,
  p.name as project_name,
  prof.name as creator_name
FROM project_conducts pc
JOIN projects p ON p.id = pc.project
JOIN profiles prof ON prof.id = pc.created_by
ORDER BY pc.created_at DESC;
```

### Ver condutas de um projeto específico:
```sql
SELECT * FROM project_conducts
WHERE project = <PROJECT_ID>
ORDER BY display_order;
```

### Deletar todas as condutas de teste:
```sql
DELETE FROM project_conducts
WHERE content LIKE '%teste%'
OR content LIKE '%Teste%';
```

### Resetar ordem das condutas:
```sql
UPDATE project_conducts
SET display_order = subquery.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM project_conducts
  WHERE project = <PROJECT_ID>
) AS subquery
WHERE project_conducts.id = subquery.id;
```

---

## Logs Importantes

### Habilitar logs detalhados:
```javascript
// No início do arquivo ProjectsContext.jsx
const DEBUG = true;

const addProjectConduct = async (projectId, conductData) => {
  if (DEBUG) console.log('🔵 addProjectConduct:', { projectId, conductData });
  try {
    const result = await conductService.createConduct(projectId, {
      content: conductData.text || conductData.content || '',
      urgency: conductData.urgency || 'Normal',
      display_order: maxOrder + 1
    });
    if (DEBUG) console.log('✅ Conduta criada:', result);
    return result;
  } catch (error) {
    if (DEBUG) console.error('❌ Erro ao criar conduta:', error);
    throw error;
  }
};
```

---

## Contato para Suporte

Se o problema persistir após tentar todas as soluções acima:

1. **Verificar documentação:** `CONDUCTS_INTEGRATION_SUMMARY.md`
2. **Verificar API:** `CONDUCTS_API_REFERENCE.md`
3. **Abrir issue no repositório** com:
   - Descrição do problema
   - Logs do console
   - Passos para reproduzir
   - Versão do sistema

---

**Última atualização:** 15 de Outubro de 2025  
**Versão:** 1.0.0
