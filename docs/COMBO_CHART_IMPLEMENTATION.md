# Implementação de Gráficos Combo (Barra + Linha)

**Data:** 29 de Janeiro de 2025  
**Versão:** 1.0

## 📊 Visão Geral

Implementação completa do tipo de gráfico **Combo (Barra + Linha)** no sistema de indicadores do Exxata Connect. Este tipo de gráfico permite combinar barras e linhas no mesmo gráfico, ideal para comparar diferentes métricas com escalas similares.

## ✨ Funcionalidades Implementadas

### 1. **Novo Tipo de Gráfico: Combo**

Adicionado ao dropdown de seleção de tipo de gráfico:
- Barra
- Barra Horizontal
- Linha
- Pizza
- Rosca
- **Combo (Barra + Linha)** ✨ NOVO

### 2. **Seletor de Tipo por Dataset**

Quando o tipo "Combo" é selecionado, cada dataset (série) pode ser configurado individualmente como:
- **Barra**: Renderizado como coluna vertical
- **Linha**: Renderizado como linha com pontos

O seletor aparece no cabeçalho de cada série na tabela de dados.

### 3. **Renderização com ComposedChart**

Utiliza o componente `ComposedChart` da biblioteca Recharts para renderizar barras e linhas no mesmo gráfico:
- Barras mantêm rótulos de dados no topo
- Linhas mantêm rótulos de dados acima dos pontos
- Cores personalizadas por série
- Tooltip e legenda unificados

### 4. **Export/Import Excel**

#### **Exportação:**
- **Aba Configurações**: Tipo 'combo' é exportado
- **Aba Dados**: Valores exportados normalmente
- **Aba Cores**: Nova coluna "Tipo" indica se o dataset é 'bar' ou 'line'

Exemplo da aba Cores para gráfico combo:
```
| ID_Gráfico | Dataset | Cor      | Tipo |
|------------|---------|----------|------|
| G1         | Vendas  | #8884d8  | bar  |
| G1         | Meta    | #82ca9d  | line |
```

#### **Importação:**
- Reconhece coluna "Tipo" na aba Cores
- Aplica automaticamente o tipo correto para cada dataset
- Compatível com formato antigo (sem coluna Tipo = padrão bar)

## 🗄️ Integração Supabase

### Migração Aplicada

```sql
ALTER TABLE project_indicators 
DROP CONSTRAINT IF EXISTS project_indicators_chart_type_check;

ALTER TABLE project_indicators 
ADD CONSTRAINT project_indicators_chart_type_check 
CHECK (chart_type IN ('bar', 'bar-horizontal', 'line', 'pie', 'doughnut', 'combo'));
```

**Status:** ✅ Aplicada com sucesso no projeto `lrnpdyqcxstghzrujywf`

### Estrutura de Dados

```javascript
{
  title: "Vendas vs Meta",
  chart_type: "combo",
  labels: ["Jan", "Fev", "Mar", "Abr"],
  datasets: [
    {
      name: "Vendas",
      values: [100, 150, 120, 180],
      color: "#8884d8",
      chartType: "bar"  // Renderiza como barra
    },
    {
      name: "Meta",
      values: [120, 140, 130, 160],
      color: "#82ca9d",
      chartType: "line"  // Renderiza como linha
    }
  ],
  options: {
    valueFormat: "currency",
    showDataLabels: true
  }
}
```

## 📁 Arquivos Modificados

### 1. **src/pages/ProjectDetails.jsx**

**Linhas 347-354:** Adicionada opção "Combo (Barra + Linha)" no select
```jsx
<option value="combo">Combo (Barra + Linha)</option>
```

**Linhas 452-461:** Adicionado seletor de tipo por dataset
```jsx
{chartType === 'combo' && (
  <select
    value={ds.chartType || 'bar'}
    onChange={(e) => handleDatasetChange(index, 'chartType', e.target.value)}
  >
    <option value="bar">Barra</option>
    <option value="line">Linha</option>
  </select>
)}
```

**Linhas 1534-1537:** Exportação - adiciona coluna Tipo na aba Cores
```javascript
if (indicator.chart_type === 'combo') {
  colorRow['Tipo'] = dataset.chartType || 'bar';
}
```

**Linhas 2263, 2291-2294:** Importação - processa coluna Tipo
```javascript
const chartType = row['Tipo'] || row['tipo'] || row['type'];
if (graph.chart_type === 'combo' && chartType) {
  dataset.chartType = chartType.toLowerCase() === 'line' ? 'line' : 'bar';
}
```

### 2. **src/components/projects/IndicatorChart.jsx**

**Linha 2:** Importação do ComposedChart
```javascript
import { ..., ComposedChart } from 'recharts';
```

**Linhas 210-253:** Renderização do gráfico combo
```jsx
if (type === 'combo') {
  return (
    <ComposedChart data={data}>
      {datasets.map((dataset, index) => {
        if (dataset.chartType === 'line') {
          return <Line ... />;
        }
        return <Bar ... />;
      })}
    </ComposedChart>
  );
}
```

### 3. **supabase/migrations/add_combo_chart_type.sql**

Migração SQL aplicada no Supabase para adicionar constraint do tipo 'combo'.

## 🎯 Casos de Uso

### Exemplo 1: Vendas vs Meta
- **Vendas**: Barras azuis
- **Meta**: Linha vermelha
- **Formato**: Monetário BRL

### Exemplo 2: Produção vs Capacidade
- **Produção Real**: Barras verdes
- **Capacidade Instalada**: Linha pontilhada laranja
- **Formato**: Numérico

### Exemplo 3: Custos vs Orçamento
- **Custos Reais**: Barras vermelhas
- **Orçamento Previsto**: Linha azul
- **Formato**: Monetário USD

## ✅ Compatibilidade

| Recurso | Status |
|---------|--------|
| Formatos de valor (BRL, USD, %, Numérico) | ✅ Suportado |
| Rótulos de dados | ✅ Suportado |
| Exportação Excel (3 abas) | ✅ Suportado |
| Importação Excel (3 abas) | ✅ Suportado |
| Múltiplos datasets | ✅ Suportado |
| Cores personalizadas | ✅ Suportado |
| Tooltip customizado | ✅ Suportado |
| Legenda | ✅ Suportado |

## 🚀 Como Usar

### Criar um Gráfico Combo:

1. Na aba **Indicadores**, clique em "Incluir gráfico"
2. Selecione **Tipo de Gráfico**: "Combo (Barra + Linha)"
3. Adicione os rótulos (ex: Jan, Fev, Mar)
4. Para cada série de dados:
   - Digite o nome da série
   - Escolha a cor
   - **Selecione o tipo**: Barra ou Linha
   - Preencha os valores
5. Configure o formato de valor (Monetário, Numérico, etc.)
6. Clique em "Salvar"

### Importar via Excel:

1. Exporte um gráfico combo existente para ver o formato
2. Na **aba Cores**, adicione a coluna "Tipo" com valores "bar" ou "line"
3. Importe o arquivo Excel
4. O sistema aplicará automaticamente os tipos corretos

## 📝 Notas Técnicas

- **Biblioteca**: Recharts v2.x
- **Componente**: ComposedChart
- **Performance**: Otimizado para até 50 pontos de dados por série
- **Responsividade**: 100% responsivo via ResponsiveContainer
- **Acessibilidade**: Suporte a tooltips e legendas descritivas

## 🔄 Próximas Melhorias (Futuro)

- [ ] Suporte a duplo eixo Y (escalas diferentes)
- [ ] Gráficos de área sobreposta
- [ ] Barras empilhadas no modo combo
- [ ] Animações de transição entre tipos

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em `/docs/` ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido por:** Exxata Engenharia  
**Última atualização:** 29/01/2025
