# Exportação Individual de Indicadores

## 📋 Visão Geral

Implementação de botão de exportação individual dentro de cada card de indicador, permitindo exportar um único gráfico no formato de 3 abas (mesmo formato da exportação geral).

## ✨ Funcionalidade Implementada

### **Botão de Exportação no Card**

Cada card de indicador agora possui um botão de **Download** (ícone 📥) que permite exportar aquele indicador específico em formato Excel com 3 abas.

### **Localização**

```
┌─────────────────────────────────────────┐
│  Título do Indicador        [📥][✏️][🗑️] │
│                                         │
│  [Gráfico]                              │
│                                         │
└─────────────────────────────────────────┘
```

Botões no header do card (quando não está em modo de edição):
1. **📥 Download** - Exportar Excel (novo)
2. **✏️ Edit** - Editar indicador
3. **🗑️ Delete** - Excluir indicador

## 🔧 Implementação Técnica

### **Função: `handleExportSingleIndicator(indicator, indicatorIndex)`**

```javascript
const handleExportSingleIndicator = (indicator, indicatorIndex) => {
  // Criar workbook com 3 abas
  const wb = XLSX.utils.book_new();
  
  // ABA 1: Configurações (ID: G1, Título, Tipo, Formato, Tamanho, Ordem)
  // ABA 2: Dados (ID_Gráfico, Dataset, [Labels dinâmicos])
  // ABA 3: Cores (ID_Gráfico, Dataset, Cor/Rótulo, [Tipo para combo])
  
  // Download com nome do indicador
  const fileName = `${indicator.title}_${date}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
```

### **Estrutura do Excel Exportado**

#### **Aba 1: Configurações**
| ID | Título | Tipo | Formato | Tamanho | Ordem |
|----|--------|------|---------|---------|-------|
| G1 | Nome do Gráfico | bar | Monetário | 1 coluna | 0 |

#### **Aba 2: Dados**
| ID_Gráfico | Dataset | Jan | Fev | Mar | ... |
|------------|---------|-----|-----|-----|-----|
| G1 | Vendas | 1000 | 1500 | 2000 | ... |
| G1 | Meta | 1200 | 1600 | 2100 | ... |

#### **Aba 3: Cores**

**Para gráficos normais (bar, line, combo):**
| ID_Gráfico | Dataset | Cor | Tipo |
|------------|---------|-----|------|
| G1 | Vendas | #8884d8 | bar |
| G1 | Meta | #82ca9d | line |

**Para gráficos de pizza/rosca:**
| ID_Gráfico | Dataset | Rótulo | Cor |
|------------|---------|--------|-----|
| G1 | Vendas | Jan | #8884d8 |
| G1 | Vendas | Fev | #82ca9d |
| G1 | Vendas | Mar | #ffc658 |

## 📊 Formato Idêntico à Exportação Geral

A exportação individual usa **exatamente a mesma lógica** da exportação geral (`handleExportIndicators`), garantindo:

✅ **Formato de 3 abas** (Configurações, Dados, Cores)  
✅ **Preservação de tipos** (bar, line, pie, doughnut, combo)  
✅ **Preservação de formatos** (numérico, BRL, USD, percentual)  
✅ **Cores por dataset** (bar, line, combo)  
✅ **Cores por fatia** (pie, doughnut)  
✅ **Tipo de série para combo** (bar/line)  
✅ **Labels preservados** (Jan, Fev, Mar em português)  
✅ **Largura de colunas ajustada**  

## 🎯 Casos de Uso

### **1. Compartilhar Indicador Específico**
Exportar apenas um gráfico para enviar a um cliente ou membro da equipe.

### **2. Backup Individual**
Fazer backup de um indicador importante antes de editar.

### **3. Reutilizar em Outro Projeto**
Exportar um indicador e importar em outro projeto.

### **4. Template Personalizado**
Criar template customizado a partir de um indicador existente.

## 📝 Arquivo Modificado

**src/pages/ProjectDetails.jsx**

### **1. Nova Função (linhas ~1827-1940)**
```javascript
const handleExportSingleIndicator = (indicator, indicatorIndex) => {
  // Mesma lógica da exportação geral, mas para 1 indicador
  // ID fixo: G1
  // Nome do arquivo: titulo_do_indicador_YYYY-MM-DD.xlsx
}
```

### **2. Botão no Card (linhas ~3576-3583)**
```javascript
<Button 
  variant="ghost" 
  size="icon" 
  onClick={() => handleExportSingleIndicator(indicator, index)}
  title="Exportar Excel (3 abas)"
>
  <Download className="h-4 w-4" />
</Button>
```

## 🔄 Fluxo de Uso

1. **Usuário visualiza indicador no card**
2. **Clica no botão Download (📥)**
3. **Arquivo Excel é gerado automaticamente**
4. **Download inicia com nome: `titulo_indicador_2025-01-29.xlsx`**
5. **Arquivo contém 3 abas com todos os dados**

## ✅ Compatibilidade

### **Tipos de Gráfico**
✅ Barras (bar)  
✅ Barras Horizontais (bar-horizontal)  
✅ Linhas (line)  
✅ Pizza (pie)  
✅ Rosca (doughnut)  
✅ Combo (bar + line)  

### **Formatos de Valor**
✅ Numérico  
✅ Monetário BRL (R$)  
✅ Monetário USD ($)  
✅ Percentual (%)  

### **Características Especiais**
✅ Múltiplos datasets  
✅ Cores personalizadas  
✅ Cores por fatia (pizza/rosca)  
✅ Tipo por série (combo)  
✅ Labels em português  
✅ Tamanho do card (1 ou 2 colunas)  

## 🎨 Interface

### **Visual do Botão**

```
Botão ghost (transparente) com ícone Download
Hover: Fundo cinza claro
Tooltip: "Exportar Excel (3 abas)"
```

### **Ordem dos Botões no Card**

```
[📥 Download] [✏️ Editar] [🗑️ Excluir]
```

## 📄 Nome do Arquivo

**Formato:** `{titulo_do_indicador}_{YYYY-MM-DD}.xlsx`

**Exemplos:**
- `Prazo_Decorrido_2025-01-29.xlsx`
- `Faturamento_Acumulado_2025-01-29.xlsx`
- `Comparativo_MOD_2025-01-29.xlsx`

**Normalização:**
- Remove caracteres especiais
- Substitui espaços por underscore
- Mantém apenas letras, números e underscore

## 🐛 Tratamento de Erros

```javascript
try {
  // Validação
  if (!indicator) {
    alert('Indicador inválido.');
    return;
  }
  
  // Exportação
  XLSX.writeFile(wb, fileName);
  console.log('✅ Indicador exportado:', indicator.title);
  
} catch (error) {
  console.error('❌ Erro ao exportar indicador:', error);
  alert('Erro ao exportar indicador. Tente novamente.');
}
```

## 🔍 Logs de Debug

```
✅ Indicador exportado: Prazo Decorrido
```

## 🎉 Vantagens

1. ✅ **Exportação rápida** de indicador específico
2. ✅ **Formato consistente** com exportação geral
3. ✅ **Fácil compartilhamento** de gráficos individuais
4. ✅ **Reutilização** em outros projetos
5. ✅ **Backup seletivo** de indicadores importantes
6. ✅ **Interface intuitiva** com ícone reconhecível

---

**Exportação individual implementada com sucesso!** 📥✅
