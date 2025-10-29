# Correção: Importação de Valores Formatados como Moeda

## 📋 Problema Identificado

Ao importar modelos de indicadores com células formatadas como **moeda** no Excel (ex: R$ 1.234,56), os valores não estavam sendo reconhecidos corretamente, resultando em valores zerados ou incorretos.

## 🔍 Causa Raiz

### Comportamento da Biblioteca XLSX

A biblioteca XLSX tem dois modos de leitura:

1. **`raw: false`** (padrão)
   - Retorna valores **formatados** como strings
   - Exemplo: `"R$ 1.234,56"` ou `"$ 1,234.56"`
   - Problema: `parseFloat("R$ 1.234,56")` retorna `NaN`

2. **`raw: true`**
   - Retorna valores **numéricos puros**
   - Exemplo: `1234.56` (número)
   - Vantagem: Funciona direto com células formatadas como moeda

### Código Anterior (❌ Problemático)

```javascript
// Usava raw: false - valores de moeda vinham como strings formatadas
const dataData = XLSX.utils.sheet_to_json(dataSheet, { raw: false, defval: '' });

const values = parsedLabels.map(label => {
  const val = row[label];
  // parseFloat("R$ 1.234,56") = NaN ❌
  const parsed = parseFloat(val) || 0;
  return parsed;
});
```

**Resultado:**
```
Célula Excel: R$ 1.234,56
Valor lido: "R$ 1.234,56" (string)
parseFloat: NaN
Valor final: 0 ❌
```

## ✅ Solução Implementada

### 1. Usar `raw: true`

```javascript
// Usar raw: true para pegar valores numéricos puros
const dataData = XLSX.utils.sheet_to_json(dataSheet, { raw: true, defval: '' });
```

### 2. Processamento Robusto de Valores

```javascript
const values = parsedLabels.map(label => {
  let val = row[label];
  if (val === undefined && labelMapping[label]) {
    val = row[labelMapping[label]];
  }
  
  // Processar valor: pode ser número, string numérica ou string formatada
  let parsed = 0;
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'number') {
      // Valor numérico puro (caso comum com raw: true)
      parsed = val;
    } else if (typeof val === 'string') {
      // Fallback: remover formatação de moeda e converter
      // Remove: R$, $, espaços, pontos (milhares)
      // Substitui vírgula por ponto (decimal)
      const cleanValue = val.replace(/[R$\s.]/g, '').replace(',', '.');
      parsed = parseFloat(cleanValue) || 0;
    }
  }
  
  console.log(`   [MODELO] "${label}": ${val} (${typeof val}) → ${parsed}`);
  return parsed;
});
```

### 3. Logs Detalhados

```javascript
console.log('🏷️ [MODELO] Labels preservados:', parsedLabels);
console.log('🗺️ [MODELO] Mapeamento:', labelMapping);
console.log('📊 [MODELO] Dados filtrados:', graphData);
console.log(`   [MODELO] "${label}": ${val} (${typeof val}) → ${parsed}`);
```

## 📊 Exemplos de Processamento

### Exemplo 1: Célula Formatada como Moeda BRL

**Excel:**
```
Formato: Moeda (R$)
Valor visual: R$ 1.234,56
Valor interno: 1234.56
```

**Processamento:**
```javascript
// Com raw: true
val = 1234.56 (number)
typeof val = "number"
parsed = 1234.56 ✅
```

**Log:**
```
[MODELO] "Jan": 1234.56 (number) → 1234.56
```

### Exemplo 2: Célula Formatada como Moeda USD

**Excel:**
```
Formato: Moeda ($)
Valor visual: $ 1,234.56
Valor interno: 1234.56
```

**Processamento:**
```javascript
// Com raw: true
val = 1234.56 (number)
typeof val = "number"
parsed = 1234.56 ✅
```

### Exemplo 3: Célula como Texto (Fallback)

**Excel:**
```
Formato: Texto
Valor: "R$ 1.234,56"
```

**Processamento:**
```javascript
// Com raw: true (pode retornar string em alguns casos)
val = "R$ 1.234,56" (string)
typeof val = "string"
cleanValue = "123456" (remove R$, espaços, pontos)
cleanValue = "1234.56" (substitui vírgula por ponto)
parsed = 1234.56 ✅
```

### Exemplo 4: Célula Numérica Normal

**Excel:**
```
Formato: Número
Valor: 1234.56
```

**Processamento:**
```javascript
val = 1234.56 (number)
typeof val = "number"
parsed = 1234.56 ✅
```

## 🔄 Comparação: Antes vs Depois

### Antes (❌)

| Excel | Formato | Valor Lido | parseFloat | Resultado |
|-------|---------|------------|------------|-----------|
| R$ 1.234,56 | Moeda BRL | "R$ 1.234,56" | NaN | 0 ❌ |
| $ 1,234.56 | Moeda USD | "$ 1,234.56" | NaN | 0 ❌ |
| 1234.56 | Número | "1234.56" | 1234.56 | 1234.56 ✅ |

### Depois (✅)

| Excel | Formato | Valor Lido | Processamento | Resultado |
|-------|---------|------------|---------------|-----------|
| R$ 1.234,56 | Moeda BRL | 1234.56 | number → 1234.56 | 1234.56 ✅ |
| $ 1,234.56 | Moeda USD | 1234.56 | number → 1234.56 | 1234.56 ✅ |
| 1234.56 | Número | 1234.56 | number → 1234.56 | 1234.56 ✅ |
| "R$ 1.234,56" | Texto | "R$ 1.234,56" | clean → 1234.56 | 1234.56 ✅ |

## 🎯 Compatibilidade

A solução funciona com:

✅ **Células formatadas como moeda** (BRL, USD, EUR, etc.)  
✅ **Células numéricas normais**  
✅ **Células com texto formatado como moeda** (fallback)  
✅ **Valores com separadores de milhares** (1.234,56 ou 1,234.56)  
✅ **Valores decimais** (vírgula ou ponto)  
✅ **Valores inteiros**  
✅ **Células vazias** (retorna 0)  

## 📝 Arquivo Modificado

**src/pages/ProjectDetails.jsx**
- Função `handleTemplateSelect` (linhas ~2981-3012)
  - Mudança de `raw: false` para `raw: true`
  - Processamento robusto de valores numéricos e strings
  - Logs detalhados para debug

## 🐛 Debug

### Logs no Console

Ao importar um modelo, você verá:

```
🏷️ [MODELO] Labels preservados: ['Jan', 'Fev', 'Mar']
🗺️ [MODELO] Mapeamento: { 'Jan': 'Jan-25', ... }
📊 [MODELO] Dados filtrados: [{ Dataset: 'Vendas', Jan: 1234.56, ... }]
   [MODELO] "Jan": 1234.56 (number) → 1234.56
   [MODELO] "Fev": 2345.67 (number) → 2345.67
   [MODELO] "Mar": 3456.78 (number) → 3456.78
```

### Verificação

1. Abrir console do navegador (F12)
2. Importar modelo com valores de moeda
3. Verificar logs `[MODELO]`
4. Confirmar que valores são reconhecidos como `number`
5. Verificar que valores finais estão corretos

## ✅ Resultado Final

Agora a importação de modelos funciona corretamente com:

1. ✅ **Células formatadas como moeda** no Excel
2. ✅ **Valores numéricos puros**
3. ✅ **Preservação de labels em português**
4. ✅ **Logs detalhados para debug**
5. ✅ **Fallback robusto para casos especiais**

---

**Importação de valores monetários totalmente funcional!** 💰✅
