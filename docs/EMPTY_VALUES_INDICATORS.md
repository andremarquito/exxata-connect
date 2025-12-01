# Células Vazias em Indicadores

## Implementação Completa

Atualizado em: 01/12/2025

---

## 📋 Resumo

O sistema agora permite que células de valores nos indicadores sejam deixadas **vazias** (sem preenchimento), ao invés de forçar o valor `0`. Isso é útil para representar:

- **Dados futuros**: Meses/períodos ainda não realizados
- **Dados parciais**: Séries temporais incompletas
- **Ausência de dados**: Diferença entre "zero" e "não disponível"

---

## 🔧 Implementação Técnica

### **Armazenamento Interno**
- Valores vazios são armazenados como `null` (não como string vazia ou 0)
- Compatível com Supabase (JSONB aceita null)

### **Renderização de Gráficos**
- Valores `null` são **convertidos para `0`** na renderização
- Isso mantém os gráficos funcionais (Recharts requer números)
- Não quebra cálculos de domínio (min/max do eixo Y)

### **Interface do Usuário**
- Campos de input mostram vazio quando valor é `null`
- Usuário pode deixar campo vazio ou apagar valor existente
- Ao digitar, valor é convertido para número ou `null`

### **Exportação Excel**
- Valores `null` são exportados como **células vazias** no Excel
- Mantém distinção visual entre "vazio" e "zero"

### **Importação Excel**
- Células vazias no Excel são importadas como `null`
- Função `parseNumberBR()` retorna `null` para valores vazios
- Compatível com formato de 3 abas (Configurações, Dados, Cores)

---

## 📁 Arquivos Modificados

### **1. src/pages/ProjectDetails.jsx**

#### Função `parseNumberBR()` (linha 118-121)
```javascript
const parsed = parseFloat(cleaned);
// Retornar null para valores vazios, permitindo células sem preenchimento
// O sistema tratará null como 0 na renderização dos gráficos
return isNaN(parsed) ? null : parsed;
```

#### Processamento de valores em datasets (linhas 271-276, 351-356)
```javascript
ds.values.split(',').map(v => {
  const trimmed = v.trim();
  if (trimmed === '' || trimmed === ' ') return null;
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
})
```

#### Atualização de células (linha 314-316)
```javascript
const trimmed = String(value).trim();
vals[rowIdx] = (trimmed === '' || trimmed === ' ') ? null : (parseFloat(value) || null);
```

#### Input de valores para pizza/rosca (linha 767-769)
```javascript
const val = e.target.value.trim();
newValues[index] = (val === '' || val === ' ') ? null : (parseFloat(val) || null);
```

#### Exibição de valores na tabela de edição (linha 871-873)
```javascript
// Permitir valores vazios (null) - não forçar 0
const rawVal = vals[rowIdx];
const val = (rawVal === null || rawVal === undefined) ? '' : rawVal;
```
**Correção crítica**: Antes forçava `|| 0`, impedindo edição de células vazias

#### Preenchimento de arrays (linhas 211, 242, 313, 3154)
```javascript
// Antes: vals.push(0);
// Depois: vals.push(null);
```

### **2. src/components/projects/IndicatorChart.jsx**

#### Processamento de dados para renderização (linhas 131-149)
```javascript
const data = labels.map((label, index) => {
  const dataEntry = { name: label };
  datasets.forEach(dataset => {
    const raw = dataset.values?.[index];
    // Para gráficos de linha/combo: manter null para interromper a linha
    // Para outros tipos: converter null para 0
    if (raw === null || raw === undefined) {
      if (type === 'line' || type === 'combo') {
        dataEntry[dataset.name] = null; // Mantém null para interromper linha
      } else {
        dataEntry[dataset.name] = 0; // Converte para 0 em barras/pizza
      }
    } else {
      const num = typeof raw === 'number' ? raw : Number(raw);
      dataEntry[dataset.name] = Number.isFinite(num) ? num : 0;
    }
  });
  return dataEntry;
});
```

#### Componente Line com connectNulls={false} (linhas 218-229, 304-317)
```javascript
<Line 
  type="monotone" 
  dataKey={dataset.name} 
  stroke={dataset.color || '#8884d8'} 
  connectNulls={false}  // ← Interrompe linha em valores null
>
```
**Comportamento**: Linha para no último valor conhecido, não desce até zero

---

## ✅ Compatibilidade

### **Não Quebra**
- ✅ Gráficos existentes continuam funcionando
- ✅ Exportação/Importação Excel mantida
- ✅ Todos os tipos de gráfico (bar, line, pie, doughnut, combo)
- ✅ Formatação de valores (BRL, USD, %, Numérico)
- ✅ Tooltips e labels de dados
- ✅ Cálculos de eixos Y (min/max)

### **Comportamento**
| Situação | Armazenamento | Renderização | Excel Export | Excel Import |
|----------|---------------|--------------|--------------|--------------|
| Campo vazio | `null` | `0` | Célula vazia | `null` |
| Valor 0 digitado | `0` | `0` | `0` | `0` |
| Valor numérico | Número | Número | Número | Número |

---

## 🎯 Casos de Uso

### **1. Planejamento Futuro**
```
Mês       | Jan | Fev | Mar | Abr | Mai | Jun
Realizado | 100 | 150 |     |     |     |
Previsto  | 100 | 150 | 200 | 200 | 250 | 250
```
- Meses futuros sem dados reais ficam vazios
- Gráfico renderiza como 0 (não quebra visualização)

### **2. Dados Parciais**
```
Trimestre | Q1  | Q2  | Q3  | Q4
Vendas    | 500 | 600 |     |
```
- Q3 e Q4 ainda não têm dados
- Diferente de "vendas zero"

### **3. Comparações**
```
Produto | Vendas 2023 | Vendas 2024
A       | 100         | 150
B       |             | 200
C       | 50          |
```
- Produto B não existia em 2023 (vazio)
- Produto C descontinuado em 2024 (vazio)

---

## 🔍 Validações

### **Gráficos de Pizza/Rosca**
- Se **todos** os valores forem `null`, mostra: "Nenhum dado disponível para exibir"
- Se **algum** valor for > 0, gráfico renderiza normalmente
- Valores `null` são tratados como 0 nas fatias

### **Gráficos de Linha/Combo**
- Valores `null` **interrompem a linha** (não descem até zero) ✅
- Propriedade `connectNulls={false}` do Recharts
- Útil para dados futuros: linha para no último valor conhecido
- Exemplo: Linha vai até Fev/26, depois para (não cai para 0 em Mar/26)

### **Gráficos de Barra**
- Valores `null` aparecem como 0 no gráfico
- Não quebra cálculo de domínio do eixo Y
- Labels de dados mostram "0" (formatado conforme tipo)

---

## 🚀 Como Usar

### **No Formulário**
1. Criar/editar indicador
2. Na tabela de valores, **deixar célula vazia** ou **apagar valor**
3. Salvar normalmente

### **No Excel (Importação)**
1. Exportar indicadores para Excel
2. Deixar células vazias onde não há dados
3. Importar de volta - células vazias viram `null`

### **Visualização**
- Gráfico renderiza valores vazios como 0
- Não há diferença visual entre `null` e `0` no gráfico
- Diferença está no **significado** (ausência vs zero real)

---

## ⚠️ Observações

1. **Visualmente**: `null` e `0` aparecem iguais no gráfico (ambos como zero)
2. **Semanticamente**: `null` = "sem dado", `0` = "valor zero real"
3. **Excel**: Única forma de distinguir visualmente (célula vazia vs célula com 0)
4. **Recharts**: Biblioteca de gráficos não suporta `null`, por isso conversão para 0

---

## 📊 Exemplo Completo

### **Dados no Formulário**
```
Rótulos: Jan, Fev, Mar, Abr
Dataset "Vendas": 100, 150, [vazio], [vazio]
```

### **Armazenamento (Supabase)**
```json
{
  "labels": ["Jan", "Fev", "Mar", "Abr"],
  "datasets": [{
    "name": "Vendas",
    "values": [100, 150, null, null]
  }]
}
```

### **Renderização (Gráfico)**
```javascript
// Dados processados para Recharts
[
  { name: "Jan", Vendas: 100 },
  { name: "Fev", Vendas: 150 },
  { name: "Mar", Vendas: 0 },    // null → 0
  { name: "Abr", Vendas: 0 }     // null → 0
]
```

### **Excel Exportado**
```
| Dataset | Jan | Fev | Mar | Abr |
|---------|-----|-----|-----|-----|
| Vendas  | 100 | 150 |     |     |
```

---

## 🎉 Benefícios

1. **Flexibilidade**: Permite representar ausência de dados
2. **Clareza**: Diferença entre "zero" e "não disponível"
3. **Compatibilidade**: Não quebra nada existente
4. **Excel**: Células vazias são mais intuitivas
5. **Planejamento**: Útil para dados futuros/parciais

---

## 🔄 Migração

**Indicadores existentes**: Nenhuma ação necessária
- Valores `0` continuam como `0`
- Sistema totalmente retrocompatível
- Novos indicadores podem usar células vazias

---

## 📝 Notas Técnicas

- `null` é o valor padrão para células vazias (não `undefined`, `""`, ou `0`)
- Conversão `null → 0` acontece apenas na renderização (IndicatorChart.jsx)
- Armazenamento mantém `null` (permite distinguir "vazio" de "zero")
- Função `parseNumberBR()` é o ponto central de conversão na importação
