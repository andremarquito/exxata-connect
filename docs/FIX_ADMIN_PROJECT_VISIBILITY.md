# Fix: Admin não via todos os projetos

## 🐛 Problema Identificado

Usuário admin (`andre.marquito@exxata.com.br`) só conseguia ver 1 projeto na plataforma, quando deveria ver 2 projetos:
1. ✅ "Teste 2'''" (criado por ele - aparecia)
2. ❌ "0799 - ELECNOR x ENERGISA" (é membro - NÃO aparecia)

## 🔍 Causa Raiz

No arquivo `ProjectsContext.jsx`, linha 231, havia um filtro **incorreto** para admins:

```javascript
// ❌ ANTES (ERRADO)
} else {
  // Para admins/managers: buscar projetos criados pelo usuário
  basicResult = await supabase
    .from('projects')
    .select(...)
    .eq('created_by', userId);  // ❌ Filtrava apenas projetos CRIADOS pelo admin
}
```

**Problema:** O código estava **ignorando o RLS** e filtrando manualmente apenas projetos onde `created_by = userId`, impedindo que admins vissem:
- Projetos onde são membros
- Projetos de outros usuários (que admins deveriam ver)

## ✅ Solução Implementada

Removido o filtro `.eq('created_by', userId)` para admins, **delegando todo controle para o RLS**:

```javascript
// ✅ DEPOIS (CORRETO)
} else {
  // Para admins/managers: buscar TODOS os projetos (RLS já controla acesso)
  console.log('👔 Usuário staff detectado, carregando TODOS os projetos via RLS');
  basicResult = await supabase
    .from('projects')
    .select(...);
    // ✅ SEM FILTRO - RLS controla tudo
}
```

## 🎯 Como Funciona Agora

### Para Admins/Managers:
1. **Query:** `SELECT * FROM projects` (sem filtros)
2. **RLS aplica automaticamente:**
   - `created_by = auth.uid()` ✅ Projetos criados
   - `is_admin_or_manager_direct(auth.uid())` ✅ Todos os projetos (é admin)
   - `is_project_member_direct(id, auth.uid())` ✅ Projetos onde é membro
3. **Resultado:** Vê **TODOS** os projetos acessíveis

### Para Clientes/Colaboradores:
1. **Query:** `SELECT * FROM projects` (sem filtros)
2. **RLS aplica automaticamente:**
   - `created_by = auth.uid()` ✅ Projetos criados
   - `is_project_member_direct(id, auth.uid())` ✅ Projetos onde é membro
3. **Resultado:** Vê **apenas seus projetos**

## 📊 Teste de Validação

**Usuário:** André Marquito (admin)
- **ID:** `682a6344-1825-4489-a545-afb06b897684`

**Antes da correção:**
- ❌ Via apenas 1 projeto ("Teste 2'''")

**Depois da correção:**
- ✅ Deve ver 2 projetos:
  1. "Teste 2'''" (creator + owner)
  2. "0799 - ELECNOR x ENERGISA" (member + admin)

## 🔧 Arquivo Modificado

- **Arquivo:** `src/contexts/ProjectsContext.jsx`
- **Linhas:** 179-232
- **Mudança:** Removido `.eq('created_by', userId)` para admins

## 💡 Lição Aprendida

**Não duplicar lógica de controle de acesso:**
- ✅ RLS no Supabase controla acesso
- ❌ Não adicionar filtros manuais no cliente que conflitam com RLS
- ✅ Confiar no RLS para aplicar as regras corretas

## 🧪 Como Testar

1. Fazer login como admin
2. Verificar console do navegador:
   ```
   👔 Usuário staff detectado, carregando TODOS os projetos via RLS
   ✅ Projetos encontrados no Supabase: 2
   📋 Lista de projetos carregados: [...]
   ```
3. Confirmar que ambos os projetos aparecem na lista

---

**Data:** 2024-10-21  
**Status:** ✅ Corrigido
