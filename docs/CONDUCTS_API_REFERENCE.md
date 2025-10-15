# 📚 API Reference - Sistema de Condutas

## Índice
- [Estrutura de Dados](#estrutura-de-dados)
- [Context API](#context-api)
- [Service Layer](#service-layer)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Estrutura de Dados

### Conduta (UI Format)
```typescript
interface Conduct {
  id: string | number;           // UUID do Supabase ou ID local
  text: string;                  // Conteúdo da conduta
  urgency: 'Baixa' | 'Normal' | 'Alta' | 'Crítica';
  order: number;                 // Ordem de exibição
  createdAt: string;             // ISO timestamp
  createdBy: string;             // UUID do usuário
}
```

### Conduta (Supabase Format)
```typescript
interface ConductDB {
  id: string;                    // UUID
  content: string;               // Conteúdo da conduta
  urgency: 'Baixa' | 'Normal' | 'Alta' | 'Crítica';
  display_order: number;         // Ordem de exibição
  created_at: string;            // Timestamp
  updated_at: string;            // Timestamp
  created_by: string;            // UUID do profile
  project: number;               // ID do projeto (bigint)
}
```

---

## Context API

### `ProjectsContext`

#### `addProjectConduct(projectId, conductData)`
Adiciona uma nova conduta ao projeto.

**Parâmetros:**
- `projectId` (number): ID do projeto
- `conductData` (object):
  - `text` (string): Conteúdo da conduta
  - `urgency` (string): 'Baixa' | 'Normal' | 'Alta' | 'Crítica'

**Retorno:** Promise<Conduct>

**Exemplo:**
```javascript
const newConduct = await addProjectConduct(123, {
  text: 'Revisar cláusula contratual 5.2',
  urgency: 'Alta'
});
```

---

#### `updateProjectConduct(projectId, conductId, updates)`
Atualiza uma conduta existente.

**Parâmetros:**
- `projectId` (number): ID do projeto
- `conductId` (string): UUID da conduta
- `updates` (object):
  - `text?` (string): Novo conteúdo
  - `urgency?` (string): Nova urgência
  - `order?` (number): Nova ordem

**Retorno:** Promise<Conduct>

**Exemplo:**
```javascript
await updateProjectConduct(123, 'uuid-123', {
  text: 'Texto atualizado',
  urgency: 'Crítica'
});
```

---

#### `deleteProjectConduct(projectId, conductId)`
Remove uma conduta do projeto.

**Parâmetros:**
- `projectId` (number): ID do projeto
- `conductId` (string): UUID da conduta

**Retorno:** Promise<{ success: boolean }>

**Exemplo:**
```javascript
await deleteProjectConduct(123, 'uuid-123');
```

---

#### `reorderProjectConducts(projectId, newOrder)`
Reordena as condutas do projeto.

**Parâmetros:**
- `projectId` (number): ID do projeto
- `newOrder` (string[]): Array de UUIDs na nova ordem

**Retorno:** Promise<{ success: boolean }>

**Exemplo:**
```javascript
await reorderProjectConducts(123, [
  'uuid-3',
  'uuid-1',
  'uuid-2'
]);
```

---

#### `getProjectConducts(projectId)`
Busca todas as condutas do projeto.

**Parâmetros:**
- `projectId` (number): ID do projeto

**Retorno:** Promise<Conduct[]>

**Exemplo:**
```javascript
const conducts = await getProjectConducts(123);
console.log(conducts); // [{ id: 'uuid-1', text: '...', ... }]
```

---

## Service Layer

### `conductService`

#### `getProjectConducts(projectId)`
```javascript
const conducts = await conductService.getProjectConducts(123);
```

#### `createConduct(projectId, conductData)`
```javascript
const newConduct = await conductService.createConduct(123, {
  content: 'Texto da conduta',
  urgency: 'Normal',
  display_order: 0
});
```

#### `updateConduct(conductId, updates)`
```javascript
const updated = await conductService.updateConduct('uuid-123', {
  content: 'Novo texto',
  urgency: 'Alta'
});
```

#### `deleteConduct(conductId)`
```javascript
await conductService.deleteConduct('uuid-123');
```

#### `reorderConducts(projectId, newOrder)`
```javascript
await conductService.reorderConducts(123, ['uuid-1', 'uuid-2']);
```

---

## Exemplos de Uso

### Exemplo 1: Adicionar Conduta na UI

```javascript
import { useProjects } from '@/contexts/ProjectsContext';

function ConductsManager({ projectId }) {
  const { addProjectConduct } = useProjects();
  
  const handleAddConduct = async () => {
    try {
      await addProjectConduct(projectId, {
        text: 'Nova conduta',
        urgency: 'Normal'
      });
      alert('Conduta adicionada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar conduta');
    }
  };
  
  return (
    <button onClick={handleAddConduct}>
      Adicionar Conduta
    </button>
  );
}
```

---

### Exemplo 2: Editar Conduta com Debounce

```javascript
import { useProjects } from '@/contexts/ProjectsContext';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

function ConductEditor({ projectId, conduct }) {
  const { updateProjectConduct } = useProjects();
  const [text, setText] = useState(conduct.text);
  
  const debouncedUpdate = useCallback(
    debounce(async (newText) => {
      try {
        await updateProjectConduct(projectId, conduct.id, {
          text: newText
        });
      } catch (error) {
        console.error('Erro ao atualizar:', error);
      }
    }, 500),
    [projectId, conduct.id]
  );
  
  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    debouncedUpdate(newText);
  };
  
  return (
    <textarea
      value={text}
      onChange={handleChange}
      placeholder="Descreva a conduta"
    />
  );
}
```

---

### Exemplo 3: Drag and Drop para Reordenar

```javascript
import { useProjects } from '@/contexts/ProjectsContext';
import { useState } from 'react';

function ConductsList({ projectId, conducts }) {
  const { reorderProjectConducts } = useProjects();
  const [draggedId, setDraggedId] = useState(null);
  
  const handleDragStart = (e, conductId) => {
    setDraggedId(conductId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) return;
    
    const fromIdx = conducts.findIndex(c => c.id === draggedId);
    const toIdx = conducts.findIndex(c => c.id === targetId);
    
    const reordered = [...conducts];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    
    const newOrder = reordered.map(c => c.id);
    
    try {
      await reorderProjectConducts(projectId, newOrder);
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
    
    setDraggedId(null);
  };
  
  return (
    <div>
      {conducts.map(conduct => (
        <div
          key={conduct.id}
          draggable
          onDragStart={(e) => handleDragStart(e, conduct.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, conduct.id)}
        >
          {conduct.text}
        </div>
      ))}
    </div>
  );
}
```

---

### Exemplo 4: Carregar Condutas ao Montar Componente

```javascript
import { useProjects } from '@/contexts/ProjectsContext';
import { useEffect, useState } from 'react';

function ProjectConducts({ projectId }) {
  const { getProjectConducts } = useProjects();
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadConducts = async () => {
      try {
        setLoading(true);
        const data = await getProjectConducts(projectId);
        setConducts(data);
      } catch (error) {
        console.error('Erro ao carregar condutas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConducts();
  }, [projectId]);
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      {conducts.map(conduct => (
        <div key={conduct.id}>{conduct.text}</div>
      ))}
    </div>
  );
}
```

---

## Tratamento de Erros

Todas as funções podem lançar erros. Sempre use try/catch:

```javascript
try {
  await addProjectConduct(projectId, conductData);
} catch (error) {
  if (error.code === 'PGRST116') {
    console.error('Tabela não existe');
  } else if (error.message.includes('RLS')) {
    console.error('Sem permissão');
  } else {
    console.error('Erro desconhecido:', error);
  }
}
```

---

## Permissões (RLS)

O usuário precisa ser:
- **Criador do projeto** (`projects.created_by = auth.uid()`), OU
- **Membro do projeto** (`project_members.user_id = auth.uid()`)

Caso contrário, as operações falharão com erro de RLS.

---

## Performance

### Otimizações Implementadas:
- ✅ Índice em `project` para filtros rápidos
- ✅ Índice composto em `(project, display_order)` para ordenação
- ✅ Estado local no Context para reduzir chamadas ao Supabase
- ✅ Debounce recomendado para edições de texto

### Boas Práticas:
- Use `getProjectConducts()` apenas ao montar o componente
- Implemente debounce para edições em tempo real
- Evite chamadas desnecessárias ao Supabase

---

**Última atualização:** 15 de Outubro de 2025  
**Versão:** 1.0.0
