# Logs de Debug - Milestone

## Objetivo

Rastrear o fluxo completo do campo `isMilestone` desde o carregamento do Supabase até a renderização visual, para identificar onde o valor está sendo perdido após F5.

## Logs Adicionados

### 1. 🔍 [ATIVIDADE CARREGADA] - ProjectsContext.jsx (linha 354)

**Quando:** Durante o carregamento inicial das atividades do Supabase

**Localização:** `src/contexts/ProjectsContext.jsx` - função `loadProjectsFromSupabase()`

**O que mostra:**
```javascript
{
  id: act.id,
  name: act.name,
  is_milestone_RAW: act.is_milestone,        // Valor bruto do Supabase
  is_milestone_TYPE: typeof act.is_milestone, // Tipo do valor
  is_milestone_FINAL: act.is_milestone ?? false // Valor após processamento
}
```

**Objetivo:** Verificar se o Supabase está retornando o valor correto e qual é o tipo de dado.

---

### 2. 🎯 [TOGGLE] - ProjectDetails.jsx (linha 1485)

**Quando:** Ao clicar no botão de toggle para alternar entre milestone e barra

**Localização:** `src/pages/ProjectDetails.jsx` - função `toggleActivityMilestone()`

**O que mostra:**
```javascript
{
  activityId: activity.id,
  activityName: activity.title,
  isMilestone_ANTES: activity.isMilestone,  // Valor antes do toggle
  isMilestone_DEPOIS: newIsMilestone        // Valor depois do toggle
}
```

**Objetivo:** Confirmar que o toggle está invertendo o valor corretamente.

---

### 3. 📅 [UPDATE] - ProjectsContext.jsx (linha 878)

**Quando:** Ao enviar a atualização para o Supabase

**Localização:** `src/contexts/ProjectsContext.jsx` - função `updateProjectActivity()`

**O que mostra:**
```javascript
{
  projectId,
  activityId,
  patch  // Objeto com { isMilestone: true/false }
}
```

**Objetivo:** Verificar qual valor está sendo enviado para o Supabase.

---

### 4. ✅ [UPDATE] - ProjectsContext.jsx (linha 882)

**Quando:** Após receber a resposta do Supabase

**Localização:** `src/contexts/ProjectsContext.jsx` - função `updateProjectActivity()`

**O que mostra:**
```javascript
{
  id: updatedActivity.id,
  name: updatedActivity.name,
  is_milestone_RAW: updatedActivity.is_milestone,        // Valor retornado do Supabase
  is_milestone_TYPE: typeof updatedActivity.is_milestone // Tipo do valor
}
```

**Objetivo:** Confirmar que o Supabase salvou e retornou o valor correto.

---

### 5. 🔄 [UPDATE] - ProjectsContext.jsx (linha 898)

**Quando:** Ao atualizar o estado local após a resposta do Supabase

**Localização:** `src/contexts/ProjectsContext.jsx` - função `updateProjectActivity()`

**O que mostra:**
```javascript
{
  activityId,
  is_milestone_antes: a.isMilestone,    // Valor antes da atualização
  is_milestone_depois: newIsMilestone   // Valor depois da atualização
}
```

**Objetivo:** Verificar se o estado local está sendo atualizado corretamente.

---

### 6. 🎨 [RENDER] - ProjectDetails.jsx (linha 5149)

**Quando:** Durante a renderização da lista de atividades (apenas primeira atividade)

**Localização:** `src/pages/ProjectDetails.jsx` - renderização da tabela

**O que mostra:**
```javascript
{
  totalAtividades: sortedActivities.length,
  primeiraAtividade: {
    id: a.id,
    title: a.title,
    isMilestone: a.isMilestone,
    isMilestone_TYPE: typeof a.isMilestone
  }
}
```

**Objetivo:** Verificar qual valor está chegando na renderização da tabela.

---

### 7. 📊 [GANTT] - ProjectDetails.jsx (linha 5559)

**Quando:** Durante a renderização do Gantt (apenas primeira atividade)

**Localização:** `src/pages/ProjectDetails.jsx` - renderização do Gantt

**O que mostra:**
```javascript
{
  atividade: a.title,
  isMilestone: a.isMilestone,
  isMilestone_TYPE: typeof a.isMilestone,
  renderizarComo: a.isMilestone ? 'LOSANGO' : 'BARRA'
}
```

**Objetivo:** Verificar qual valor está sendo usado para decidir entre losango e barra.

---

## Fluxo Esperado

### Ao Alternar Milestone (Toggle):

1. 🎯 **[TOGGLE]** - Usuário clica, valor inverte
2. 📅 **[UPDATE]** - Envia para Supabase
3. ✅ **[UPDATE]** - Supabase confirma salvamento
4. 🔄 **[UPDATE]** - Estado local atualizado
5. 🎨 **[RENDER]** - Tabela re-renderiza com novo valor
6. 📊 **[GANTT]** - Gantt re-renderiza com novo valor

### Ao Dar F5 (Reload):

1. 🔍 **[ATIVIDADE CARREGADA]** - Carrega do Supabase
2. 🎨 **[RENDER]** - Renderiza tabela
3. 📊 **[GANTT]** - Renderiza Gantt

---

## Como Usar

1. Abra o console do navegador (F12)
2. Acesse a aba "Atividades" de um projeto
3. Clique no toggle de uma atividade
4. Observe a sequência de logs
5. Dê F5 na página
6. Observe os logs de carregamento
7. Compare os valores em cada etapa

---

## O Que Procurar

### ✅ Comportamento Correto:
- `is_milestone_RAW` deve ser `true` ou `false` (booleano)
- `is_milestone_TYPE` deve ser `"boolean"`
- `is_milestone_FINAL` deve preservar o valor booleano
- Valor deve ser consistente em todas as etapas

### ❌ Comportamento Incorreto:
- `is_milestone_RAW` é `null` ou `undefined`
- `is_milestone_TYPE` é `"object"` ou `"undefined"`
- `is_milestone_FINAL` é sempre `false` mesmo quando deveria ser `true`
- Valor muda entre etapas sem motivo

---

## Próximos Passos

Após identificar onde o valor está sendo perdido:

1. Se o problema está no **carregamento do Supabase**: Verificar query SQL
2. Se o problema está no **salvamento**: Verificar mapeamento de campos
3. Se o problema está no **estado local**: Verificar lógica de atualização
4. Se o problema está na **renderização**: Verificar condições de exibição

---

## Remover Logs

Após identificar e corrigir o problema, remover os logs adicionados para manter o código limpo:

- ProjectsContext.jsx: linhas 354-360, 882-887, 898-902
- ProjectDetails.jsx: linhas 1485-1490, 5148-5158, 5558-5565
