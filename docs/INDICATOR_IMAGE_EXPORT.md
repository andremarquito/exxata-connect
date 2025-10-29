# Exportação de Indicadores como Imagem PNG

## 📋 Visão Geral

Implementação de botão para exportar indicadores individuais como imagem PNG de alta qualidade, capturando todo o card incluindo título, gráfico e análise Exxata.

## ✨ Funcionalidade Implementada

### **Botão de Exportação de Imagem**

Cada card de indicador possui um botão com ícone de **câmera** (📷) que permite exportar o card completo como imagem PNG.

### **Localização**

```
┌─────────────────────────────────────────────┐
│  Título do Indicador   [📥][📷][✏️][🗑️]     │
│                                             │
│  [Gráfico]                                  │
│                                             │
│  📄 Análise Exxata                          │
│  Texto da análise...                        │
└─────────────────────────────────────────────┘
```

Botões no header do card:
1. **📥 Download** - Exportar Excel (3 abas)
2. **📷 Camera** - Exportar Imagem PNG ← **NOVO!**
3. **✏️ Edit** - Editar indicador
4. **🗑️ Delete** - Excluir indicador

## 🔧 Implementação Técnica

### **Função: `handleExportIndicatorImage(indicatorId, indicatorTitle)`**

```javascript
const handleExportIndicatorImage = async (indicatorId, indicatorTitle) => {
  // 1. Localizar card pelo data-indicator-id
  const cardElement = document.querySelector(`[data-indicator-id="${indicatorId}"]`);
  
  // 2. Ocultar APENAS botões de ação (não a legenda) usando classe específica
  const actionButtons = cardElement.querySelectorAll('.indicator-action-buttons');
  actionButtons.forEach(btn => btn.style.display = 'none');
  
  // 3. Aguardar atualização do DOM
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 4. Capturar card com html2canvas
  const canvas = await html2canvas(cardElement, {
    backgroundColor: '#ffffff',
    scale: 2, // Alta qualidade (2x resolução)
    logging: false,
    useCORS: true,
    allowTaint: true
  });
  
  // 5. Restaurar botões
  actionButtons.forEach(btn => btn.style.display = '');
  
  // 6. Converter para blob PNG
  canvas.toBlob((blob) => {
    // 7. Criar link de download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${indicatorTitle}_${date}.png`;
    link.click();
    
    // 8. Limpar recursos
    URL.revokeObjectURL(url);
  }, 'image/png');
};
```

### **Biblioteca Utilizada**

**html2canvas** - Já importada no projeto
- Converte elementos HTML/CSS em canvas
- Suporta gráficos SVG (Recharts)
- Mantém estilos e formatação
- Alta qualidade com `scale: 2`

### **Atributo de Identificação**

Adicionado `data-indicator-id` ao Card:

```jsx
<Card 
  className="chart-card h-full" 
  data-indicator-id={indicator.id}
>
  {/* Conteúdo do card */}
</Card>
```

## 📸 Conteúdo Capturado

A imagem PNG exportada inclui:

✅ **Título do indicador**  
✅ **Gráfico completo** (com cores, labels, valores)  
✅ **Legenda** (mantida na exportação) ← **Importante!**  
✅ **Análise Exxata** (se houver)  
✅ **Bordas e estilos do card**  
✅ **Fundo branco**  

**NÃO inclui:**
❌ Botões de ação (Download, Camera, Edit, Delete) - **Ocultados automaticamente**  
❌ Ícones de edição (GripVertical, Maximize/Minimize) - **Ocultados automaticamente**

**Nota:** Apenas os botões de ação do header são ocultados. A legenda do gráfico é preservada usando seletor CSS específico (`.indicator-action-buttons`).  

## 🎨 Configurações de Qualidade

```javascript
{
  backgroundColor: '#ffffff',  // Fundo branco sólido
  scale: 2,                    // 2x resolução (alta qualidade)
  logging: false,              // Sem logs no console
  useCORS: true,               // Permitir recursos externos
  allowTaint: true             // Permitir canvas "tainted"
}
```

### **Resolução**

- **scale: 2** = Imagem com o dobro da resolução
- Exemplo: Card 800x600px → Imagem 1600x1200px
- Qualidade ideal para apresentações e relatórios

## 📄 Nome do Arquivo

**Formato:** `{titulo_do_indicador}_{YYYY-MM-DD}.png`

**Exemplos:**
- `Prazo_Decorrido_2025-01-29.png`
- `Faturamento_Acumulado_2025-01-29.png`
- `Comparativo_MOD_2025-01-29.png`

**Normalização:**
- Remove caracteres especiais
- Substitui espaços por underscore
- Mantém apenas letras, números e underscore

## 🎯 Casos de Uso

### **1. Apresentações**
Inserir gráficos em PowerPoint, Google Slides, etc.

### **2. Relatórios**
Incluir indicadores em documentos Word, PDF, etc.

### **3. Compartilhamento Rápido**
Enviar gráfico por WhatsApp, email, Slack, etc.

### **4. Redes Sociais**
Publicar indicadores em LinkedIn, Instagram, etc.

### **5. Documentação**
Arquivar snapshots de indicadores importantes.

## ✅ Compatibilidade

### **Tipos de Gráfico**
✅ Barras (bar)  
✅ Barras Horizontais (bar-horizontal)  
✅ Linhas (line)  
✅ Pizza (pie)  
✅ Rosca (doughnut)  
✅ Combo (bar + line)  

### **Elementos Capturados**
✅ Gráficos SVG (Recharts)  
✅ Textos e títulos  
✅ Cores personalizadas  
✅ Legendas  
✅ Tooltips (se visíveis no momento)  
✅ Análise Exxata  
✅ Bordas e sombras do card  

### **Navegadores**
✅ Chrome/Edge (melhor suporte)  
✅ Firefox  
✅ Safari (pode ter limitações com CORS)  

## 🐛 Tratamento de Erros

```javascript
try {
  // Validação
  if (!cardElement) {
    alert('Erro ao localizar o indicador. Tente novamente.');
    return;
  }
  
  // Captura e download
  const canvas = await html2canvas(cardElement, {...});
  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Erro ao gerar imagem. Tente novamente.');
      return;
    }
    // Download...
  });
  
  console.log('✅ Imagem exportada:', indicatorTitle);
  
} catch (error) {
  console.error('❌ Erro ao exportar imagem:', error);
  alert('Erro ao exportar imagem. Tente novamente.');
}
```

## 📝 Arquivos Modificados

**src/pages/ProjectDetails.jsx**

### **1. Nova Função (linhas ~1943-1988)**
```javascript
const handleExportIndicatorImage = async (indicatorId, indicatorTitle) => {
  // Captura card com html2canvas
  // Converte para PNG
  // Faz download
}
```

### **2. Atributo no Card (linha ~3600)**
```jsx
<Card 
  className="chart-card h-full" 
  data-indicator-id={indicator.id}
>
```

### **3. Botão no Header (linhas ~3632-3639)**
```jsx
<Button 
  variant="ghost" 
  size="icon" 
  onClick={() => handleExportIndicatorImage(indicator.id, indicator.title)}
  title="Exportar Imagem PNG"
>
  <Camera className="h-4 w-4" />
</Button>
```

## 🔄 Fluxo de Uso

1. **Usuário visualiza indicador no card**
2. **Clica no botão Camera (📷)**
3. **Sistema oculta botões de ação temporariamente**
4. **html2canvas captura o card limpo**
5. **Sistema restaura botões de ação**
6. **Imagem PNG é gerada (alta qualidade)**
7. **Download inicia automaticamente**
8. **Arquivo salvo:** `titulo_indicador_2025-01-29.png`

## 💡 Dicas de Uso

### **Melhor Qualidade**
- Esperar gráfico carregar completamente
- Evitar exportar durante animações
- Usar em tela de alta resolução

### **Apresentações**
- Imagem PNG com fundo branco
- Fácil de inserir em slides
- Mantém qualidade ao redimensionar

### **Redes Sociais**
- Formato universal (PNG)
- Boa compressão
- Cores preservadas

## 🎨 Exemplo Visual

### **Card Original:**
```
┌─────────────────────────────────────┐
│  Faturamento Acumulado              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  [Gráfico de Barras]        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📄 Análise Exxata                  │
│  O faturamento está 15% acima...   │
└─────────────────────────────────────┘
```

### **Imagem PNG Exportada:**
- Mesma aparência visual
- Resolução 2x (1600x1200px se card for 800x600px)
- Fundo branco sólido
- Sem botões de ação

## 🎉 Vantagens

1. ✅ **Alta qualidade** (scale: 2)
2. ✅ **Captura completa** do card
3. ✅ **Fácil compartilhamento** (PNG universal)
4. ✅ **Rápido** (1-2 segundos)
5. ✅ **Sem servidor** (processamento local)
6. ✅ **Mantém formatação** e cores
7. ✅ **Pronto para apresentações**

---

**Exportação de imagens PNG implementada com sucesso!** 📷✅
