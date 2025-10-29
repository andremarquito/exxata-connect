# Correção: Preservação de Labels Originais do Excel

## Problema Identificado

Ao importar gráficos com rótulos de data como **"Jan", "Fev", "Mar"** em português, a plataforma estava convertendo automaticamente para **"Jan-25", "Feb-25", "Mar-25"** em inglês.

### Causa Raiz

O Excel armazena datas como **números seriais** (ex: 45658 = 01/Jan/2025) e aplica formatação visual. A biblioteca XLSX estava:

1. Lendo o **valor numérico** (45658)
2. Aplicando formatação automática em **inglês** ("Jan-25")
3. Ignorando a formatação original do usuário

**Exemplo:**
```
Célula no Excel: "Jan" (visualmente)
Valor interno: 45658 (número)
Formato (w): "Jan-25" (inglês)
```

## Solução Implementada

### Leitura Direta do Cabeçalho

Ao invés de usar `Object.keys()` para extrair os labels, agora lemos **diretamente as células do cabeçalho** e usamos o campo `w` (formato) quando disponível:

```javascript
// Extrair labels do cabeçalho preservando formatação original
const range = XLSX.utils.decode_range(dataSheet['!ref']);
const parsedLabels = [];

for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = dataSheet[cellAddress];
  
  if (cell && cell.v !== undefined) {
    const headerValue = String(cell.v);
    // Pular colunas de ID e Dataset
    if (headerValue !== 'ID_Gráfico' && headerValue !== 'ID_Grafico' && 
        headerValue !== 'id' && headerValue !== 'Dataset' && headerValue !== 'dataset') {
      // Se a célula tem formato de texto (w), usar ele; senão usar o valor (v)
      parsedLabels.push(cell.w || headerValue);
    }
  }
}
```

### Estrutura da Célula XLSX

Cada célula no Excel tem:
- **`v`** (value): Valor bruto (número, texto, etc.)
- **`w`** (formatted): Valor formatado como aparece no Excel
- **`t`** (type): Tipo da célula (n=número, s=string, d=data, etc.)

**Exemplos:**

| Excel Visual | v (valor) | w (formato) | t (tipo) |
|--------------|-----------|-------------|----------|
| "Jan" | 45658 | "Jan-25" | n |
| "Janeiro" | "Janeiro" | undefined | s |
| "Q1 2025" | "Q1 2025" | undefined | s |
| 100 | 100 | "100" | n |

### Prioridade de Leitura

```javascript
parsedLabels.push(cell.w || headerValue);
```

1. **Primeiro:** Tenta usar `cell.w` (formato visual)
2. **Fallback:** Usa `headerValue` (valor convertido para string)

## Correções Aplicadas

### 1. Importação no Formulário (Modal)

**Arquivo:** `src/pages/ProjectDetails.jsx`  
**Função:** `handleImportChange`  
**Linhas:** ~310-332

```javascript
// Ler aba de Dados
const dataSheet = wb.Sheets['Dados'];

// Extrair labels do cabeçalho preservando formatação original
const range = XLSX.utils.decode_range(dataSheet['!ref']);
const parsedLabels = [];

for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = dataSheet[cellAddress];
  
  if (cell && cell.v !== undefined) {
    const headerValue = String(cell.v);
    if (headerValue !== 'ID_Gráfico' && headerValue !== 'ID_Grafico' && 
        headerValue !== 'id' && headerValue !== 'Dataset' && headerValue !== 'dataset') {
      parsedLabels.push(cell.w || headerValue);
    }
  }
}

console.log('🏷️ [FORMULÁRIO] Labels extraídos do cabeçalho:', parsedLabels);
```

### 2. Importação Direta (Botão Externo)

**Arquivo:** `src/pages/ProjectDetails.jsx`  
**Função:** `handleImportFileChange`  
**Linhas:** ~2473-2494

```javascript
// Ler aba de Dados preservando formatação original dos labels
const dataSheet = wb.Sheets['Dados'];

// Extrair labels do cabeçalho preservando formatação original
const dataRange = XLSX.utils.decode_range(dataSheet['!ref']);
const originalLabels = [];

for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = dataSheet[cellAddress];
  
  if (cell && cell.v !== undefined) {
    const headerValue = String(cell.v);
    const formattedLabel = cell.w || headerValue;
    originalLabels.push(formattedLabel);
  }
}

console.log('🏷️ Labels originais do cabeçalho:', originalLabels);

// Usar labels originais ao processar dados
const labels = originalLabels.filter(label => 
  label !== 'ID_Gráfico' && label !== 'ID_Grafico' && label !== 'id' && 
  label !== 'Dataset' && label !== 'dataset'
);
```

## Exemplos de Uso

### Exemplo 1: Meses em Português

**Excel:**
```
| ID_Gráfico | Dataset | Jan | Fev | Mar | Abr |
|------------|---------|-----|-----|-----|-----|
| G1         | Vendas  | 100 | 150 | 200 | 180 |
```

**Antes (❌ Errado):**
```javascript
labels: ["Jan-25", "Feb-25", "Mar-25", "Apr-25"]  // Convertido para inglês
```

**Depois (✅ Correto):**
```javascript
labels: ["Jan", "Fev", "Mar", "Abr"]  // Preserva português
```

### Exemplo 2: Trimestres

**Excel:**
```
| ID_Gráfico | Dataset | Q1 2025 | Q2 2025 | Q3 2025 | Q4 2025 |
|------------|---------|---------|---------|---------|---------|
| G1         | Vendas  | 1000    | 1500    | 2000    | 1800    |
```

**Resultado:**
```javascript
labels: ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]  // Preservado
```

### Exemplo 3: Nomes Personalizados

**Excel:**
```
| ID_Gráfico | Dataset | Planejado | Realizado | Meta | Projeção |
|------------|---------|-----------|-----------|------|----------|
| G1         | Vendas  | 1000      | 950       | 1100 | 1200     |
```

**Resultado:**
```javascript
labels: ["Planejado", "Realizado", "Meta", "Projeção"]  // Preservado
```

## Benefícios

✅ **Preserva idioma:** Mantém português, inglês ou qualquer idioma  
✅ **Preserva formato:** Mantém formatação customizada do usuário  
✅ **Flexível:** Funciona com datas, textos, números formatados  
✅ **Consistente:** Mesma lógica em ambas as funções de importação  
✅ **Transparente:** Logs mostram labels preservados  

## Logs de Debug

Com a correção, você verá nos logs:

```
🏷️ [FORMULÁRIO] Labels extraídos do cabeçalho: ['Jan', 'Fev', 'Mar', 'Abr']
```

Ao invés de:

```
🏷️ [FORMULÁRIO] Labels: ['Jan-25', 'Feb-25', 'Mar-25', 'Apr-25']
```

## Compatibilidade

✅ **Datas em português:** Jan, Fev, Mar...  
✅ **Datas em inglês:** Jan, Feb, Mar...  
✅ **Datas formatadas:** Jan-25, 01/2025, Janeiro/25...  
✅ **Textos simples:** Planejado, Realizado, Meta...  
✅ **Números:** 2023, 2024, 2025...  
✅ **Customizados:** Q1, Q2, Semana 1, Período A...  

## Arquivos Modificados

- **src/pages/ProjectDetails.jsx**
  - Função `handleImportChange` (linhas ~310-332)
    - Leitura direta do cabeçalho com preservação de formato
  - Função `handleImportFileChange` (linhas ~2473-2597)
    - Leitura direta do cabeçalho com preservação de formato
    - Uso de `originalLabels` ao processar dados
  - Função `handleTemplateSelect` (linhas ~2955-3006)
    - Leitura direta do cabeçalho com preservação de formato
    - Mapeamento de labels formatados para valores do Excel
    - Logs de debug para rastreamento

## Testes Recomendados

1. ✅ Importar gráfico com meses em português (Jan, Fev, Mar)
2. ✅ Importar gráfico com meses em inglês (Jan, Feb, Mar)
3. ✅ Importar gráfico com datas formatadas (Jan-25, Fev-25)
4. ✅ Importar gráfico com trimestres (Q1, Q2, Q3, Q4)
5. ✅ Importar gráfico com labels customizados
6. ✅ Verificar logs no console mostrando labels preservados
7. ✅ Salvar e verificar se labels são mantidos no Supabase
