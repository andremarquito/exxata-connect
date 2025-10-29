# Implementação de Eixo Y Secundário para Gráficos Combo

## 📊 Visão Geral

Esta funcionalidade permite que gráficos do tipo **Combo (Barra + Linha)** utilizem **dois eixos Y independentes** (esquerdo e direito), cada um com sua própria escala, formato de valor e limites configuráveis.

## 🎯 Casos de Uso

### 1. **Faturamento Mensal vs Acumulado** (Modelo g4)
- **Mensal** (barras, eixo esquerdo): R$ 0 - 350k
- **Acumulado** (linha, eixo direito): R$ 0 - 3M
- **Problema resolvido**: O faturamento acumulado cresce muito mais que o mensal, tornando as barras mensais quase invisíveis em um único eixo.

### 2. **Valores Absolutos vs Percentuais**
- **Vendas em R$** (eixo esquerdo)
- **% de Crescimento** (eixo direito)
- **Problema resolvido**: Unidades completamente diferentes não podem compartilhar a mesma escala.

### 3. **Diferentes Ordens de Grandeza**
- **Custos em milhares** (eixo esquerdo)
- **Receita em milhões** (eixo direito)
- **Problema resolvido**: Uma série "esmaga" visualmente a outra quando as magnitudes são muito diferentes.

## 🛠️ Como Usar

### Opção 1: Interface do Formulário

1. **Criar/Editar Indicador** do tipo "Combo (Barra + Linha)"

2. **Configurar cada Dataset**:
   - **Tipo**: Barra ou Linha
   - **Eixo Y**: Esquerdo ou Direito
   - **Formato**: Numérico, Monetário BRL, Monetário USD ou Percentual
   - **Cor**: Cor da série

3. **Configurar Limites dos Eixos** (opcional):
   - **Eixo Esquerdo**: Mínimo e Máximo
   - **Eixo Direito**: Mínimo e Máximo
   - Deixe em branco para ajuste automático

### Opção 2: Importar via Excel

#### Estrutura do Arquivo Excel (4 abas)

**Aba 1: Configurações**
```
| ID | Título                          | Tipo  | Formato  | Tamanho    | Ordem |
|----|----------------------------------|-------|----------|------------|-------|
| G1 | Faturamento Mensal vs Acumulado | combo | currency | 2 colunas  | 1     |
```

**Aba 2: Dados**
```
| ID_Gráfico | Dataset                 | Jan    | Fev    | Mar    | ... |
|------------|-------------------------|--------|--------|--------|-----|
| G1         | Faturamento Mensal      | 150000 | 180000 | 165000 | ... |
| G1         | Faturamento Acumulado   | 150000 | 330000 | 495000 | ... |
```

**Aba 3: Cores** (✨ NOVAS COLUNAS)
```
| ID_Gráfico | Dataset               | Cor      | Tipo | Eixo Y    | Formato  |
|------------|-----------------------|----------|------|-----------|----------|
| G1         | Faturamento Mensal    | #3b82f6  | bar  | Esquerdo  | currency |
| G1         | Faturamento Acumulado | #10b981  | line | Direito   | currency |
```

**Aba 4: Eixos** (✨ NOVA ABA)
```
| ID_Gráfico | Eixo      | Mínimo | Máximo  |
|------------|-----------|--------|---------|
| G1         | Esquerdo  | 0      | 350000  |
| G1         | Direito   | 0      | 3000000 |
```

### Opção 3: Usar Modelo Pré-configurado

1. Clicar em **"Usar Modelo"** na aba Indicadores
2. Selecionar **"Faturamento Mensal (Combo)"** (g4)
3. O modelo já vem com eixo secundário configurado!

## 📐 Estrutura de Dados

### Estrutura JSON no Supabase

```javascript
{
  "title": "Faturamento Mensal vs Acumulado",
  "chart_type": "combo",
  "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  "datasets": [
    {
      "name": "Faturamento Mensal",
      "values": [150000, 180000, 165000, 195000, 210000, 225000, 240000, 255000, 270000, 285000, 300000, 315000],
      "color": "#3b82f6",
      "chartType": "bar",
      "yAxisId": "left",
      "valueFormat": "currency"
    },
    {
      "name": "Faturamento Acumulado",
      "values": [150000, 330000, 495000, 690000, 900000, 1125000, 1365000, 1620000, 1890000, 2175000, 2475000, 2790000],
      "color": "#10b981",
      "chartType": "line",
      "yAxisId": "right",
      "valueFormat": "currency"
    }
  ],
  "options": {
    "valueFormat": "currency",
    "showDataLabels": true,
    "leftAxis": {
      "min": 0,
      "max": 350000
    },
    "rightAxis": {
      "min": 0,
      "max": 3000000
    }
  }
}
```

### Propriedades dos Datasets

| Propriedade | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `name` | string | ✅ | Nome da série |
| `values` | number[] | ✅ | Valores numéricos |
| `color` | string | ✅ | Cor em hexadecimal |
| `chartType` | string | ✅ | `"bar"` ou `"line"` |
| `yAxisId` | string | ❌ | `"left"` ou `"right"` (padrão: `"left"`) |
| `valueFormat` | string | ❌ | `"number"`, `"currency"`, `"currency-usd"`, `"percentage"` |

### Propriedades dos Eixos

| Propriedade | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `options.leftAxis.min` | number | ❌ | Valor mínimo do eixo esquerdo |
| `options.leftAxis.max` | number | ❌ | Valor máximo do eixo esquerdo |
| `options.rightAxis.min` | number | ❌ | Valor mínimo do eixo direito |
| `options.rightAxis.max` | number | ❌ | Valor máximo do eixo direito |

**Nota**: Se não especificados, os limites são calculados automaticamente com 10% de margem.

## 🎨 Renderização (Recharts)

### Lógica de Renderização

```jsx
// Detectar quais eixos são necessários
const hasLeftAxis = datasets.some(ds => !ds.yAxisId || ds.yAxisId === 'left');
const hasRightAxis = datasets.some(ds => ds.yAxisId === 'right');

// Obter formatos por eixo
const leftFormat = datasets.find(ds => !ds.yAxisId || ds.yAxisId === 'left')?.valueFormat || valueFormat;
const rightFormat = datasets.find(ds => ds.yAxisId === 'right')?.valueFormat || valueFormat;

// Renderizar eixos
{hasLeftAxis && (
  <YAxis
    yAxisId="left"
    orientation="left"
    domain={[minLeft, maxLeft]}
    tickFormatter={(v) => formatValue(v, leftFormat, { compact: true })}
  />
)}

{hasRightAxis && (
  <YAxis
    yAxisId="right"
    orientation="right"
    domain={[minRight, maxRight]}
    tickFormatter={(v) => formatValue(v, rightFormat, { compact: true })}
  />
)}

// Vincular datasets aos eixos
<Bar yAxisId="left" dataKey="Faturamento Mensal" />
<Line yAxisId="right" dataKey="Faturamento Acumulado" />
```

## 📦 Arquivos Modificados

### 1. `src/components/projects/IndicatorChart.jsx`
- Renderização com múltiplos `YAxis`
- Lógica de domínio (min/max) configurável
- Formatação independente por eixo
- Margem direita ajustada quando há eixo direito

### 2. `src/pages/ProjectDetails.jsx`
- **Estados**: `leftAxisMin`, `leftAxisMax`, `rightAxisMin`, `rightAxisMax`
- **Formulário**: Seletores de Eixo Y e Formato por dataset
- **Seção**: Configuração de limites dos eixos
- **buildFormData()**: Inclui configurações de eixos em `options`

### 3. Export Excel (`handleExportIndicators`)
- **Aba Cores**: Colunas "Eixo Y" e "Formato"
- **Aba Eixos**: Nova aba com limites min/max
- Exporta 4 abas quando há gráficos combo com limites

### 4. Import Excel (`handleImportFileChange`)
- Processa coluna "Eixo Y" (Esquerdo/Direito, left/right)
- Processa coluna "Formato" por dataset
- Processa aba "Eixos" para limites min/max

### 5. Template g4 (`modelo_indicadores/g4_comparativo_faturamento_mes_combo.xlsx`)
- Atualizado com configuração de eixo secundário
- Pronto para importação direta

## ✅ Compatibilidade

### Retrocompatibilidade
✅ Gráficos combo existentes continuam funcionando (eixo esquerdo por padrão)  
✅ Formato global ainda funciona como fallback  
✅ Limites automáticos quando não configurados  
✅ Import/Export Excel totalmente compatível  

### Validações
- Se `yAxisId` não especificado → usa `"left"`
- Se `valueFormat` não especificado no dataset → usa formato global
- Se limites não especificados → calcula automaticamente (0 a dataMax * 1.1)
- Se aba "Eixos" não existir no Excel → ignora silenciosamente

## 🧪 Testando a Funcionalidade

### Teste 1: Criar Gráfico Manualmente
1. Criar novo indicador tipo "Combo"
2. Adicionar 2 séries
3. Configurar série 1: Barra, Eixo Esquerdo, Formato BRL
4. Configurar série 2: Linha, Eixo Direito, Formato Percentual
5. Definir limites: Esquerdo (0-1000), Direito (0-100)
6. Salvar e verificar renderização

### Teste 2: Importar Template g4
1. Clicar em "Usar Modelo"
2. Selecionar "Faturamento Mensal (Combo)"
3. Verificar que o gráfico tem 2 eixos Y
4. Verificar que as escalas são diferentes

### Teste 3: Export/Import Excel
1. Criar gráfico combo com eixo secundário
2. Exportar para Excel
3. Verificar que a aba "Eixos" foi criada
4. Modificar valores no Excel
5. Importar de volta
6. Verificar que as configurações foram mantidas

## 🐛 Troubleshooting

### Problema: Eixo direito não aparece
**Solução**: Certifique-se de que pelo menos um dataset tem `yAxisId: "right"`

### Problema: Formatação incorreta
**Solução**: Verifique se `valueFormat` está definido no dataset ou globalmente

### Problema: Limites não respeitados
**Solução**: Verifique se os valores de min/max são números válidos (não strings vazias)

### Problema: Import Excel não reconhece eixo
**Solução**: Na aba Cores, coluna "Eixo Y" deve ser exatamente "Esquerdo" ou "Direito" (ou "left"/"right")

## 📚 Referências

- **Recharts - Multiple Axes**: https://recharts.org/en-US/examples/LineChartWithReferenceLines
- **Documentação Combo Chart**: `docs/COMBO_CHART_IMPLEMENTATION.md`
- **Modelo de Importação**: `docs/MODELO_IMPORTACAO_INDICADORES.md`

## 🎉 Benefícios

✅ **Clareza Visual**: Comparação clara de métricas com escalas diferentes  
✅ **Flexibilidade**: Cada série pode ter seu próprio formato e eixo  
✅ **Controle Preciso**: Limites configuráveis para ajuste fino  
✅ **Facilidade de Uso**: Interface intuitiva e templates prontos  
✅ **Compatibilidade**: Mantém gráficos existentes funcionando  
✅ **Produtividade**: Import/Export Excel com suporte completo  

---

**Versão**: 1.0  
**Data**: Outubro 2025  
**Autor**: Cascade AI + André Dias
