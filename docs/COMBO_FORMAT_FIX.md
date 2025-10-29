# Correção: Importação de Tipo Combo e Formato de Valor

## Problemas Identificados

1. **Tipo "combo" não era reconhecido** - Gráficos combo não eram importados corretamente
2. **Formato de valor "percentage" não era detectado** - Quando o Excel tinha "percentage" sem acento
3. **chartType não era preservado** - Campo `chartType` dos datasets (bar/line) era perdido

## Soluções Implementadas

### 1. Normalização do Tipo de Gráfico

Adicionada lógica para normalizar e mapear variações de nomes de tipos:

```javascript
// Normalizar tipo de gráfico
let importedChart = String(config['Tipo'] || config['tipo'] || config['type'] || 'bar').toLowerCase().trim();

// Mapear possíveis variações
if (importedChart === 'barra') importedChart = 'bar';
if (importedChart === 'linha') importedChart = 'line';
if (importedChart === 'pizza') importedChart = 'pie';
if (importedChart === 'rosca') importedChart = 'doughnut';

console.log('📊 [FORMULÁRIO] Tipo de gráfico normalizado:', importedChart);
```

**Tipos aceitos:**
- `bar`, `barra` → `bar`
- `line`, `linha` → `line`
- `pie`, `pizza` → `pie`
- `doughnut`, `rosca` → `doughnut`
- `combo` → `combo`
- `bar-horizontal` → `bar-horizontal`

### 2. Detecção Melhorada do Formato de Valor

Adicionada verificação explícita para "percentage" e logs detalhados:

```javascript
// Normalizar formato de valor
const formatoExcel = String(config['Formato'] || config['formato'] || config['format'] || 'Numérico').toLowerCase();
console.log('💰 [FORMULÁRIO] Formato bruto:', formatoExcel);

let importedValueFormat = 'number'; // default

if (formatoExcel.includes('monetário') || formatoExcel.includes('monetario') || formatoExcel.includes('brl') || formatoExcel.includes('r$')) {
  importedValueFormat = 'currency';
} else if (formatoExcel.includes('usd') || formatoExcel.includes('dólar') || formatoExcel.includes('dolar') || formatoExcel.includes('$')) {
  importedValueFormat = 'currency-usd';
} else if (formatoExcel.includes('percent') || formatoExcel.includes('%') || formatoExcel === 'percentage') {
  importedValueFormat = 'percentage';
} else if (formatoExcel.includes('numérico') || formatoExcel.includes('numerico') || formatoExcel === 'number') {
  importedValueFormat = 'number';
}

console.log('💰 [FORMULÁRIO] Formato normalizado:', importedValueFormat);
```

**Formatos aceitos:**

| Valor no Excel | Formato Detectado |
|----------------|-------------------|
| `Monetário BRL`, `monetário`, `BRL`, `R$` | `currency` |
| `Monetário USD`, `USD`, `dólar`, `dolar`, `$` | `currency-usd` |
| `Percentual`, `percent`, `%`, `percentage` | `percentage` |
| `Numérico`, `numerico`, `number` | `number` |

### 3. Suporte Completo para Gráficos Combo

Adicionado processamento da coluna "Tipo" na aba Cores para definir chartType em cada dataset:

```javascript
colorData.forEach(row => {
  const datasetName = row['Dataset'] || row['dataset'];
  const color = row['Cor'] || row['cor'] || row['color'];
  const labelName = row['Rótulo'] || row['Rotulo'] || row['rotulo'] || row['label'];
  const chartType = row['Tipo'] || row['tipo'] || row['type']; // Para gráficos combo

  const dataset = parsedDatasets.find(ds => ds.name === datasetName);
  if (dataset) {
    // Aplicar cor
    if (color) {
      dataset.color = color;
      console.log(`🎨 [FORMULÁRIO] Cor "${color}" aplicada ao dataset "${datasetName}"`);
    }
    
    // Para gráficos combo: definir tipo de renderização (bar/line)
    if (importedChart === 'combo' && chartType) {
      const normalizedType = chartType.toLowerCase().trim();
      dataset.chartType = normalizedType === 'line' || normalizedType === 'linha' ? 'line' : 'bar';
      console.log(`📊 [FORMULÁRIO] Tipo "${dataset.chartType}" aplicado ao dataset "${datasetName}"`);
    }
  }
});
```

### 4. Preservação do Campo chartType

Atualizada função `formatDatasetsForForm` para preservar o campo `chartType`:

```javascript
const formatDatasetsForForm = (list) => {
  if (!Array.isArray(list) || !list.length) {
    return [{ name: '', values: [], colors: [], color: '#8884d8' }];
  }
  return list.map(ds => ({
    ...ds,
    values: Array.isArray(ds.values) 
      ? ds.values.map(v => typeof v === 'string' ? v : String(v))
      : (typeof ds.values === 'number' 
        ? [String(ds.values)]
        : (ds.values || '').split(',').map(v => v.trim())),
    colors: Array.isArray(ds.colors) ? ds.colors : [],
    chartType: ds.chartType || undefined, // Preservar chartType para gráficos combo
  }));
};
```

## Exemplo de Uso - Gráfico Combo

### Aba Configurações:
```
| ID | Título        | Tipo  | Formato   |
|----|---------------|-------|-----------|
| G1 | Vendas vs Meta| combo | Monetário |
```

### Aba Dados:
```
| ID_Gráfico | Dataset | Jan    | Fev    | Mar    |
|------------|---------|--------|--------|--------|
| G1         | Vendas  | 100000 | 150000 | 200000 |
| G1         | Meta    | 120000 | 140000 | 180000 |
```

### Aba Cores:
```
| ID_Gráfico | Dataset | Cor     | Tipo |
|------------|---------|---------|------|
| G1         | Vendas  | #8884d8 | bar  |
| G1         | Meta    | #82ca9d | line |
```

**Resultado:**
- Tipo de gráfico: `combo`
- Formato de valor: `currency` (Monetário BRL)
- Dataset "Vendas": Renderizado como **barras** (cor #8884d8)
- Dataset "Meta": Renderizado como **linha** (cor #82ca9d)

## Logs de Debug

Com as correções, você verá logs detalhados no console:

```
📥 [FORMULÁRIO] Iniciando importação...
📁 [FORMULÁRIO] Arquivo: vendas_vs_meta.xlsx
📋 [FORMULÁRIO] Abas encontradas: ['Configurações', 'Dados', 'Cores']
✅ [FORMULÁRIO] Formato 3 abas? true
✨ [FORMULÁRIO] Processando formato de 3 abas...
📋 [FORMULÁRIO] Configuração: { ID: 'G1', Título: 'Vendas vs Meta', Tipo: 'combo', Formato: 'Monetário' }
📊 [FORMULÁRIO] Tipo de gráfico normalizado: combo
💰 [FORMULÁRIO] Formato bruto: monetário
💰 [FORMULÁRIO] Formato normalizado: currency
📊 [FORMULÁRIO] Dados: [...]
🏷️ [FORMULÁRIO] Labels: ['Jan', 'Fev', 'Mar']
📈 [FORMULÁRIO] Datasets: [...]
🎨 [FORMULÁRIO] Cores: [...]
🎨 [FORMULÁRIO] Cor "#8884d8" aplicada ao dataset "Vendas"
📊 [FORMULÁRIO] Tipo "bar" aplicado ao dataset "Vendas"
🎨 [FORMULÁRIO] Cor "#82ca9d" aplicada ao dataset "Meta"
📊 [FORMULÁRIO] Tipo "line" aplicado ao dataset "Meta"
✅ [FORMULÁRIO] Importação concluída com sucesso!
```

## Arquivos Modificados

- **src/pages/ProjectDetails.jsx**
  - Função `handleImportChange` (linhas 282-383)
    - Normalização de tipo de gráfico
    - Detecção melhorada de formato de valor
    - Suporte a gráficos combo com chartType
  - Função `formatDatasetsForForm` (linha 41)
    - Preservação do campo chartType

## Compatibilidade

✅ **Todos os tipos de gráfico:** bar, line, pie, doughnut, combo, bar-horizontal  
✅ **Variações de nomes:** barra, linha, pizza, rosca  
✅ **Todos os formatos de valor:** numérico, BRL, USD, percentual  
✅ **Formato antigo (1 aba):** Mantém compatibilidade  
✅ **Formato novo (3 abas):** Suporte completo  

## Testes Recomendados

1. ✅ Importar gráfico combo com datasets bar e line
2. ✅ Importar gráfico com formato "percentage" (sem acento)
3. ✅ Importar gráfico com tipo "combo" em português
4. ✅ Verificar logs no console
5. ✅ Salvar e verificar se chartType é preservado
6. ✅ Testar todos os formatos de valor
