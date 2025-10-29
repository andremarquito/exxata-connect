# Implementação: Sistema de Modelos de Indicadores

## 📋 Visão Geral

Sistema completo de modelos pré-configurados de indicadores que permite aos usuários selecionar e importar templates prontos ao adicionar novos gráficos ao projeto.

## ✨ Funcionalidades Implementadas

### 1. **Seletor Visual de Modelos**
- Interface modal elegante com grid de cards
- Categorização por tipo (Faturamento, MOD, MOI, Equipamentos, Recursos, Prazo, Comparativo)
- Filtros por categoria
- Preview com ícones e descrições
- Seleção visual com feedback
- 14 modelos pré-configurados

### 2. **Botões de Ação**
- **"Incluir gráfico"**: Abre seletor de modelos
- **"Criar do zero"**: Abre formulário vazio (comportamento anterior)
- Ambos disponíveis na aba Indicadores

### 3. **Importação Automática**
- Carrega arquivo Excel do modelo selecionado
- Processa formato de 3 abas (Configurações, Dados, Cores)
- Preserva formatação original dos labels
- Suporta todos os tipos de gráfico (bar, line, pie, doughnut, combo)
- Aplica cores personalizadas
- Salva automaticamente no Supabase

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

**1. `src/components/projects/IndicatorTemplateSelector.jsx`**
- Componente React do seletor de modelos
- Interface visual com categorias e filtros
- Metadados de todos os 14 modelos
- Sistema de cores por categoria
- Ícones específicos por tipo de gráfico

### Arquivos Modificados

**2. `src/pages/ProjectDetails.jsx`**
- Import do componente `IndicatorTemplateSelector`
- Estado `showTemplateSelector` para controlar modal
- Função `handleTemplateSelect()` para processar modelo
- Botões "Incluir gráfico" e "Criar do zero"
- Renderização condicional do seletor

## 🎨 Modelos Disponíveis

### Categoria: Prazo
1. **g1_prazo_decorrido.xlsx**
   - Tipo: Rosca (doughnut)
   - Descrição: Percentual de prazo decorrido vs restante
   - Formato: Percentual

### Categoria: Faturamento
2. **g2_comparativo_faturamento_acumulado.xlsx**
   - Tipo: Barras (bar)
   - Descrição: Comparativo entre faturamento contratado e realizado (acumulado)
   - Formato: Monetário BRL

3. **g4_comparativo_faturamento_mes_combo.xlsx**
   - Tipo: Combo (bar + line)
   - Descrição: Comparativo mensal de faturamento com barras e linhas
   - Formato: Monetário BRL

### Categoria: Recursos
4. **g3_alocacao_recursos.xlsx**
   - Tipo: Barras (bar)
   - Descrição: Distribuição de recursos alocados no projeto
   - Formato: Numérico

5. **g14_comparativo_hh.xlsx**
   - Tipo: Barras (bar)
   - Descrição: Comparativo de horas trabalhadas (Homem-Hora)
   - Formato: Numérico

### Categoria: MOD (Mão de Obra Direta)
6. **g5_comparativo_mod_mes_combo.xlsx**
   - Tipo: Combo (bar + line)
   - Descrição: Comparativo mensal de Mão de Obra Direta
   - Formato: Monetário BRL

7. **g6_comparativo_mod_relevantes.xlsx**
   - Tipo: Barras (bar)
   - Descrição: Comparativo dos itens mais relevantes de MOD
   - Formato: Monetário BRL

### Categoria: MOI (Mão de Obra Indireta)
8. **g8_comparativo_moi_mes_combo.xlsx**
   - Tipo: Combo (bar + line)
   - Descrição: Comparativo mensal de Mão de Obra Indireta
   - Formato: Monetário BRL

9. **g9_comparativo_moi_relevantes.xlsx**
   - Tipo: Barras (bar)
   - Descrição: Comparativo dos itens mais relevantes de MOI
   - Formato: Monetário BRL

### Categoria: Equipamentos
10. **g12_comparativo_eqp_mes_combo.xlsx**
    - Tipo: Combo (bar + line)
    - Descrição: Comparativo mensal de custos com equipamentos
    - Formato: Monetário BRL

11. **g13_comparativo_eqp_relevantes.xlsx**
    - Tipo: Barras (bar)
    - Descrição: Comparativo dos equipamentos mais relevantes
    - Formato: Monetário BRL

### Categoria: Comparativo
12. **g7_comparativo_fat_mod.xlsx**
    - Tipo: Barras (bar)
    - Descrição: Comparativo entre faturamento e mão de obra direta
    - Formato: Monetário BRL

13. **g10_comparativo_fat_moi.xlsx**
    - Tipo: Barras (bar)
    - Descrição: Comparativo entre faturamento e mão de obra indireta
    - Formato: Monetário BRL

14. **g11_comparativo_fat_eqp.xlsx**
    - Tipo: Barras (bar)
    - Descrição: Comparativo entre faturamento e custos de equipamentos
    - Formato: Monetário BRL

## 🎯 Fluxo de Uso

### Para o Usuário

1. **Acessar aba Indicadores**
2. **Clicar em "Incluir gráfico"**
3. **Seletor de modelos abre automaticamente**
4. **Filtrar por categoria** (opcional)
5. **Clicar no modelo desejado**
6. **Clicar em "Usar Modelo"**
7. **Modelo é importado e salvo automaticamente**

### Alternativa: Criar do Zero

1. **Clicar em "Criar do zero"**
2. **Formulário vazio abre**
3. **Preencher manualmente**

## 🔧 Detalhes Técnicos

### Função `handleTemplateSelect(filename)`

```javascript
const handleTemplateSelect = async (filename) => {
  // 1. Carregar arquivo do modelo via fetch
  const response = await fetch(`/modelo_indicadores/${filename}`);
  const arrayBuffer = await response.arrayBuffer();
  const wb = XLSX.read(arrayBuffer);
  
  // 2. Verificar formato (3 abas)
  const hasConfigSheet = wb.SheetNames.includes('Configurações');
  const hasDataSheet = wb.SheetNames.includes('Dados');
  
  // 3. Processar configuração
  const configData = XLSX.utils.sheet_to_json(wb.Sheets['Configurações']);
  const config = configData[0];
  
  // 4. Extrair labels preservando formatação
  const parsedLabels = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = dataSheet[cellAddress];
    parsedLabels.push(cell.w || headerValue);
  }
  
  // 5. Processar datasets
  const parsedDatasets = graphData.map(row => ({
    name: datasetName,
    values: parsedLabels.map(label => parseFloat(row[label]) || 0),
    color: '#8884d8'
  }));
  
  // 6. Processar cores (se houver)
  if (hasColorSheet) {
    colorData.forEach(row => {
      // Aplicar cores por dataset ou por fatia (pizza/rosca)
    });
  }
  
  // 7. Normalizar tipo e formato
  let chartType = normalizeChartType(config['Tipo']);
  let valueFormat = normalizeValueFormat(config['Formato']);
  
  // 8. Criar e salvar indicador
  await addProjectIndicator(project.id, indicatorData);
  
  // 9. Fechar seletor e notificar
  setShowTemplateSelector(false);
  alert('Modelo importado com sucesso!');
};
```

### Metadados dos Modelos

```javascript
const TEMPLATE_METADATA = {
  'g1_prazo_decorrido.xlsx': {
    name: 'Prazo Decorrido',
    description: 'Gráfico de rosca mostrando percentual de prazo decorrido vs restante',
    type: 'doughnut',
    category: 'Prazo',
    icon: Clock,
    color: 'blue'
  },
  // ... outros modelos
};
```

### Categorias e Cores

```javascript
const CATEGORIES = [
  'Todos', 
  'Faturamento',  // Verde
  'MOD',          // Laranja
  'MOI',          // Vermelho
  'Equipamentos', // Índigo
  'Recursos',     // Roxo
  'Prazo',        // Azul
  'Comparativo'   // Cinza
];
```

## 🎨 Interface do Usuário

### Layout do Seletor

```
┌─────────────────────────────────────────────────────┐
│  Selecionar Modelo de Indicador              [X]    │
│  Escolha um modelo pré-configurado para começar     │
├─────────────────────────────────────────────────────┤
│  [Todos] [Faturamento] [MOD] [MOI] ...             │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 📊       │  │ 💰       │  │ 👥       │          │
│  │ Prazo    │  │ Faturame │  │ Alocação │          │
│  │ Decorrido│  │ nto Acum │  │ Recursos │          │
│  │          │  │          │  │          │          │
│  │ [Prazo]  │  │ [Faturame│  │ [Recurso │          │
│  │ doughnut │  │ nto] bar │  │ s] bar   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Modelo selecionado: Prazo Decorrido               │
│                          [Cancelar] [Usar Modelo]  │
└─────────────────────────────────────────────────────┘
```

### Botões na Aba Indicadores

```
┌─────────────────────────────────────────┐
│  [+ Incluir gráfico] [📄 Criar do zero] │
└─────────────────────────────────────────┘
```

## ✅ Vantagens

1. **Produtividade**: Criação rápida de indicadores sem configuração manual
2. **Padronização**: Modelos seguem padrões visuais consistentes
3. **Facilidade**: Interface intuitiva com categorização
4. **Flexibilidade**: Opção de criar do zero ainda disponível
5. **Manutenção**: Fácil adicionar novos modelos
6. **Reutilização**: Modelos podem ser usados em múltiplos projetos

## 🔄 Compatibilidade

✅ **Todos os tipos de gráfico**: bar, line, pie, doughnut, combo  
✅ **Todos os formatos de valor**: numérico, BRL, USD, percentual  
✅ **Cores personalizadas**: Por dataset ou por fatia  
✅ **Labels preservados**: Mantém formatação original  
✅ **Supabase**: Integração completa  

## 📝 Como Adicionar Novos Modelos

### 1. Criar Arquivo Excel

Criar arquivo `.xlsx` na pasta `modelo_indicadores/` com formato de 3 abas:
- **Configurações**: ID, Título, Tipo, Formato
- **Dados**: ID_Gráfico, Dataset, [Labels dinâmicos]
- **Cores**: ID_Gráfico, Dataset, Cor, [Tipo para combo]

### 2. Adicionar Metadados

Editar `IndicatorTemplateSelector.jsx`:

```javascript
const TEMPLATE_METADATA = {
  // ... modelos existentes
  'g15_novo_modelo.xlsx': {
    name: 'Nome do Modelo',
    description: 'Descrição breve do modelo',
    type: 'bar', // bar, line, pie, doughnut, combo
    category: 'Categoria', // Faturamento, MOD, MOI, etc.
    icon: BarChart3, // Ícone do lucide-react
    color: 'blue' // blue, green, orange, red, purple, indigo
  }
};
```

### 3. Testar

1. Acessar aba Indicadores
2. Clicar em "Incluir gráfico"
3. Verificar se novo modelo aparece
4. Selecionar e importar
5. Verificar se dados foram importados corretamente

## 🐛 Tratamento de Erros

- ❌ **Arquivo não encontrado**: Mensagem de erro clara
- ❌ **Formato inválido**: Validação de 3 abas
- ❌ **Dados incompletos**: Validação de campos obrigatórios
- ❌ **Erro no Supabase**: Mensagem com detalhes do erro
- ✅ **Logs detalhados**: Console mostra todo o processo

## 📊 Logs de Debug

```
📋 Carregando modelo: g1_prazo_decorrido.xlsx
📋 Modelo carregado, abas: ['Configurações', 'Dados', 'Cores']
✅ Modelo processado: { title: 'Prazo Decorrido', chart_type: 'doughnut', ... }
✅ Modelo importado com sucesso!
```

## 🎉 Resultado Final

Os usuários agora podem:
1. ✅ Selecionar modelos pré-configurados visualmente
2. ✅ Filtrar por categoria
3. ✅ Importar com 1 clique
4. ✅ Economizar tempo na criação de indicadores
5. ✅ Manter padrões visuais consistentes
6. ✅ Criar do zero quando necessário

---

**Implementação completa e funcional!** 🚀
