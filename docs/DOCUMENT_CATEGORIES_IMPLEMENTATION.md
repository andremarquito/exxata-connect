# Implementação de Categorias de Documentos

## Resumo
Sistema completo de categorização de documentos na aba "Documentos" com 12 categorias predefinidas, cada uma com cor única. Inclui filtros por categoria, data de envio e nome, além de modal de seleção de categoria após upload.

## Data de Implementação
24 de novembro de 2025

---

## 1. MIGRAÇÃO SUPABASE

### Arquivo: `supabase/migrations/add_category_to_project_files.sql`

**Alterações:**
- Adicionado campo `category TEXT` à tabela `project_files`
- Constraint CHECK para validar categorias permitidas
- Índices para otimizar filtros por categoria
- Índice composto para filtros combinados (projeto + categoria)

**Categorias Permitidas:**
1. Correspondência
2. ATA
3. E-mail
4. RDO
5. Relatório
6. Análise
7. Singularidades
8. Notificação
9. Plano de Ação
10. Parecer
11. Checklist
12. Procedimento

---

## 2. SERVIÇOS (Backend)

### Arquivo: `src/services/supabaseService.js`

**Nova Função:**
```javascript
async updateFileCategory(fileId, category) {
  // Atualiza a categoria de um arquivo específico
  // Parâmetros:
  //   - fileId: ID do arquivo
  //   - category: Nome da categoria ou null para remover
}
```

---

## 3. CONTEXTO DE PROJETOS

### Arquivo: `src/contexts/ProjectsContext.jsx`

**Alterações no Mapeamento de Arquivos:**
- Adicionado campo `category` ao mapeamento
- Corrigidos campos `original_name`, `size_bytes`, `extension`, `source`, `storage_path`, `uploaded_at`

**Campos Mapeados:**
```javascript
{
  id, name, original_name, size, type, ext, source,
  url, storagePath, uploadedBy, author, uploadedAt, category
}
```

---

## 4. INTERFACE (Frontend)

### Arquivo: `src/pages/ProjectDetails.jsx`

#### 4.1 Constantes de Categorias

**Localização:** Linhas 119-138

```javascript
const DOCUMENT_CATEGORIES = [
  { value: 'Correspondência', label: 'Correspondência', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'ATA', label: 'ATA', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  // ... 10 categorias adicionais
];

const getCategoryColor = (category) => {
  // Retorna a classe CSS de cor para uma categoria
};
```

**Cores por Categoria:**
- **Correspondência**: Azul
- **ATA**: Roxo
- **E-mail**: Ciano
- **RDO**: Verde
- **Relatório**: Amarelo
- **Análise**: Laranja
- **Singularidades**: Vermelho
- **Notificação**: Rosa
- **Plano de Ação**: Índigo
- **Parecer**: Violeta
- **Checklist**: Teal
- **Procedimento**: Lima

#### 4.2 Estados Adicionados

**Localização:** Linhas 984-994

```javascript
// Filtros de categoria e data (período)
const [categoryFilterClient, setCategoryFilterClient] = useState('all');
const [categoryFilterExxata, setCategoryFilterExxata] = useState('all');
const [dateFilterClientStart, setDateFilterClientStart] = useState('');
const [dateFilterClientEnd, setDateFilterClientEnd] = useState('');
const [dateFilterExxataStart, setDateFilterExxataStart] = useState('');
const [dateFilterExxataEnd, setDateFilterExxataEnd] = useState('');

// Modal de categoria
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [selectedFileForCategory, setSelectedFileForCategory] = useState(null);
```

#### 4.3 Função de Atualização de Categoria

**Localização:** Linhas 1780-1793

```javascript
const handleUpdateFileCategory = async (fileId, category) => {
  try {
    const supabaseService = await import('@/services/supabaseService');
    await supabaseService.fileService.updateFileCategory(fileId, category);
    await refreshProjects();
    setShowCategoryModal(false);
    setSelectedFileForCategory(null);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    alert('Erro ao atualizar categoria do arquivo.');
  }
};
```

**Correção Importante:**
O erro 400 era causado por importação incorreta do serviço. A correção usa `supabaseService.fileService.updateFileCategory()` ao invés de apenas `fileService.updateFileCategory()`.

#### 4.4 Upload com Categorização Automática

**Localização:** Linhas 1761-1776

Após upload bem-sucedido:
1. Abre modal de categoria automaticamente
2. Usuário seleciona categoria
3. Categoria é salva no banco

#### 4.5 Filtros na Interface

**Localização:** Linhas 3895-3936

**3 Filtros Disponíveis:**
1. **Busca por Nome**: Campo de texto com ícone de lupa
2. **Categoria**: Select com todas as categorias + "Todas"
3. **Período de Envio**: Dois inputs type="date" (data inicial e final)

**Layout:**
- Linha 1: Busca (50%) + Categoria (50%)
- Linha 2: Label "Período de Envio" + Data Inicial (50%) + Data Final (50%)

**Grid Responsivo:**
- Desktop: 2 colunas na primeira linha, 2 colunas na segunda linha
- Mobile: Empilhado verticalmente

#### 4.6 Lógica de Filtragem

**Localização:** Linhas 3853-3879

```javascript
// Arquivos da Exxata
const exxataFiles = allFiles
  .filter(f => f.source === 'exxata')
  .filter(f => {
    const matchesSearch = /* busca por nome/ext/uploader */;
    const matchesCategory = categoryFilterExxata === 'all' || f.category === categoryFilterExxata;
    const fileDate = f.uploadedAt ? new Date(f.uploadedAt).toISOString().split('T')[0] : null;
    const matchesDateStart = !dateFilterExxataStart || (fileDate && fileDate >= dateFilterExxataStart);
    const matchesDateEnd = !dateFilterExxataEnd || (fileDate && fileDate <= dateFilterExxataEnd);
    return matchesSearch && matchesCategory && matchesDateStart && matchesDateEnd;
  });
```

#### 4.7 Badge de Categoria na Lista

**Localização:** Linhas 3972-3976

```javascript
{file.category && (
  <Badge className={`text-xs ${getCategoryColor(file.category)}`}>
    {file.category}
  </Badge>
)}
```

#### 4.8 Botão de Categoria

**Localização:** Linhas 3987-4000

- **Visível para**: Admin, Gerente, Colaborador
- **Oculto para**: Cliente
- **Ação**: Abre modal de seleção de categoria

#### 4.9 Modal de Seleção de Categoria

**Localização:** Linhas 4047-4106

**Componentes:**
- **Header**: Título + descrição com nome do arquivo
- **Grid 2x6**: 12 botões de categoria com badges coloridos
- **Footer**: Botões "Cancelar" e "Remover Categoria"

**Comportamento:**
- Categoria atual destacada com ring vermelho
- Clique em categoria: salva e fecha modal
- Botão "Remover Categoria": remove categoria e fecha modal
- Clique fora do modal: fecha sem salvar

---

## 5. PERMISSÕES

### Edição de Categorias

**Permitido:**
- ✅ Admin
- ✅ Gerente
- ✅ Colaborador

**Negado:**
- ❌ Cliente

**Implementação:**
```javascript
{!isClientUser && (
  <Button onClick={() => { /* abrir modal */ }}>
    Categoria
  </Button>
)}
```

---

## 6. FLUXO DE USO

### 6.1 Upload de Arquivo

1. Usuário faz upload de arquivo (drag-and-drop ou botão)
2. Arquivo é enviado ao Supabase Storage
3. Registro criado na tabela `project_files` (sem categoria)
4. Modal de categoria abre automaticamente
5. Usuário seleciona categoria
6. Categoria é salva no banco
7. Lista de arquivos é atualizada

### 6.2 Edição de Categoria

1. Usuário clica no botão "Categoria" de um arquivo
2. Modal abre mostrando categorias disponíveis
3. Categoria atual (se houver) é destacada
4. Usuário clica em nova categoria
5. Categoria é atualizada no banco
6. Modal fecha e lista é atualizada

### 6.3 Remoção de Categoria

1. Usuário clica no botão "Categoria" de um arquivo
2. Modal abre
3. Usuário clica em "Remover Categoria"
4. Campo `category` é definido como `null`
5. Badge de categoria desaparece da lista

### 6.4 Filtragem

1. Usuário seleciona categoria no filtro
2. Lista é filtrada em tempo real
3. Paginação é resetada para página 1
4. Contador de resultados é atualizado

---

## 7. VALIDAÇÕES

### Backend (Supabase)

```sql
ALTER TABLE project_files
ADD CONSTRAINT valid_category CHECK (
  category IS NULL OR 
  category IN ('Correspondência', 'ATA', 'E-mail', ...)
);
```

### Frontend

- Apenas categorias predefinidas podem ser selecionadas
- Campo `category` pode ser `null` (sem categoria)
- Filtros são case-sensitive (comparação exata)

---

## 8. PERFORMANCE

### Índices Criados

```sql
-- Índice simples para filtros por categoria
CREATE INDEX idx_project_files_category ON project_files(category);

-- Índice composto para filtros combinados
CREATE INDEX idx_project_files_project_category 
  ON project_files(project_id, category);
```

**Benefícios:**
- Filtros rápidos mesmo com muitos arquivos
- Queries otimizadas para listagem por projeto + categoria

---

## 9. RESPONSIVIDADE

### Desktop (≥768px)
- Filtros em grid de 3 colunas
- Modal de categoria: largura máxima 28rem
- Grid de categorias: 2 colunas

### Mobile (<768px)
- Filtros empilhados verticalmente
- Modal ocupa 90% da largura
- Grid de categorias: 2 colunas (mantido)

---

## 10. ACESSIBILIDADE

- Botões com `title` descritivo
- Labels implícitos nos selects
- Placeholders informativos
- Cores com contraste adequado (WCAG AA)
- Foco visível em todos os elementos interativos

---

## 11. TESTES RECOMENDADOS

### Testes Funcionais

1. **Upload com Categorização**
   - Upload arquivo → Modal abre → Selecionar categoria → Verificar badge

2. **Edição de Categoria**
   - Clicar "Categoria" → Selecionar nova → Verificar atualização

3. **Remoção de Categoria**
   - Clicar "Categoria" → "Remover Categoria" → Verificar badge sumiu

4. **Filtros**
   - Filtrar por categoria → Verificar apenas arquivos da categoria
   - Filtrar por data → Verificar apenas arquivos da data
   - Combinar filtros → Verificar AND lógico

5. **Permissões**
   - Login como cliente → Verificar botão "Categoria" oculto
   - Login como admin → Verificar botão visível

### Testes de Borda

1. Arquivo sem categoria → Badge não aparece
2. Categoria inválida no banco → Badge cinza (fallback)
3. Upload múltiplo → Modal abre para primeiro arquivo
4. Filtro "Todas" → Mostra todos os arquivos
5. Data inválida → Filtro ignorado

---

## 12. MELHORIAS FUTURAS

### Possíveis Expansões

1. **Categorização em Lote**
   - Selecionar múltiplos arquivos
   - Aplicar categoria a todos de uma vez

2. **Subcategorias**
   - Hierarquia de categorias
   - Ex: Relatório → Mensal, Trimestral, Anual

3. **Estatísticas**
   - Gráfico de distribuição por categoria
   - Arquivos mais recentes por categoria

4. **Busca Avançada**
   - Buscar dentro de categorias específicas
   - Operadores AND/OR/NOT

5. **Exportação**
   - Exportar lista de arquivos com categorias
   - Formato Excel com filtros

6. **Histórico**
   - Log de alterações de categoria
   - Quem alterou e quando

---

## 13. TROUBLESHOOTING

### Problema: Erro 400 ao atualizar categoria

**Causa:** Importação incorreta do serviço (`fileService` ao invés de `supabaseService.fileService`)
**Solução:** Usar `const supabaseService = await import('@/services/supabaseService')` e depois `supabaseService.fileService.updateFileCategory()`

### Problema: Badge não aparece após categorização

**Causa:** Projeto não foi recarregado
**Solução:** Verificar se `refreshProjects()` está sendo chamado após atualização

### Problema: Filtro de período não funciona

**Causa:** Comparação de datas incorreta ou formato inválido
**Solução:** Verificar se as datas estão no formato ISO (YYYY-MM-DD) e se a lógica de >= e <= está correta

### Problema: Filtro não funciona

**Causa:** Comparação case-sensitive
**Solução:** Verificar se categoria no banco está exatamente igual à constante

### Problema: Modal não abre após upload

**Causa:** Upload retornou erro ou null
**Solução:** Verificar logs do console e resposta do Supabase

### Problema: Cliente consegue editar categoria

**Causa:** Verificação de `isClientUser` não está funcionando
**Solução:** Verificar role do usuário no contexto de autenticação

---

## 14. COMPATIBILIDADE

### Navegadores Suportados

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dependências

- React 18+
- Tailwind CSS 3+
- Lucide React (ícones)
- Supabase JS Client 2+

---

## 15. CHECKLIST DE IMPLEMENTAÇÃO

- [x] Migração SQL criada
- [x] Função `updateFileCategory` no serviço
- [x] Campo `category` mapeado no contexto
- [x] Constantes de categorias definidas
- [x] Estados de filtros adicionados
- [x] Lógica de filtragem implementada
- [x] Filtros na UI (busca, categoria, data)
- [x] Badge de categoria na lista
- [x] Botão de categoria (oculto para cliente)
- [x] Modal de seleção de categoria
- [x] Categorização automática após upload
- [x] Permissões implementadas
- [x] Documentação completa

---

## 16. CONTATO E SUPORTE

Para dúvidas ou problemas relacionados a esta funcionalidade:
- Verificar logs do console do navegador
- Verificar logs do Supabase
- Consultar esta documentação
- Revisar código-fonte com comentários inline
