# Como Adicionar Fonte Manrope ao PDF

## 📋 Visão Geral

Este guia explica como adicionar a fonte Manrope aos PDFs gerados pelo sistema, substituindo a fonte padrão Helvetica.

---

## 🎯 Pré-requisitos

- Arquivos da fonte Manrope em formato TTF
- Node.js instalado
- Acesso ao terminal

---

## 📥 Passo 1: Obter os Arquivos da Fonte

### Opção A: Download do Google Fonts

1. Acesse: https://fonts.google.com/specimen/Manrope
2. Clique em "Download family"
3. Extraia o arquivo ZIP
4. Você precisará dos arquivos:
   - `Manrope-Regular.ttf`
   - `Manrope-Bold.ttf` (opcional)
   - `Manrope-Medium.ttf` (opcional)

### Opção B: Usar Fonte Existente

Se você já tem a fonte no projeto, localize os arquivos `.ttf`.

---

## 📂 Passo 2: Organizar os Arquivos

Crie a estrutura de pastas e coloque as fontes:

```
public/
  fonts/
    Manrope-Regular.ttf
    Manrope-Bold.ttf
    Manrope-Medium.ttf
```

---

## 🔄 Passo 3: Converter para Base64

Execute o script de conversão:

```bash
node scripts/convert-font-to-base64.js
```

**O que o script faz:**
- Lê os arquivos `.ttf` de `public/fonts/`
- Converte para base64
- Gera arquivo `src/fonts/manrope-base64.js`

**Saída esperada:**
```
Convertendo Manrope-Regular.ttf...
✓ Manrope-Regular.ttf convertido com sucesso!
Convertendo Manrope-Bold.ttf...
✓ Manrope-Bold.ttf convertido com sucesso!

✓ Arquivo gerado: src/fonts/manrope-base64.js
```

---

## 📝 Passo 4: Verificar Arquivo Gerado

O arquivo `src/fonts/manrope-base64.js` deve conter:

```javascript
/**
 * Fontes Manrope em formato base64 para jsPDF
 * Gerado automaticamente - NÃO EDITAR MANUALMENTE
 */

export const manropeRegularBase64 = 'AAEAAAASAQAABAAgR0RFRgBJ...';

export const manropeBoldBase64 = 'AAEAAAASAQAABAAgR0RFRgBJ...';
```

---

## 🔧 Passo 5: Integrar no Componente PDF

Edite `src/components/pdf/IndicatorsPDFExporter.jsx`:

### 5.1 Importar as Fontes

```javascript
import { manropeRegularBase64, manropeBoldBase64 } from '@/fonts/manrope-base64';
```

### 5.2 Adicionar Fontes ao PDF

No início da função `handleExport`, após criar o PDF:

```javascript
const handleExport = async () => {
  // ... código existente ...
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [167.06, 297]
  });
  
  // ===== ADICIONAR FONTES MANROPE =====
  
  // Adicionar fonte Regular
  pdf.addFileToVFS('Manrope-Regular.ttf', manropeRegularBase64);
  pdf.addFont('Manrope-Regular.ttf', 'Manrope', 'normal');
  
  // Adicionar fonte Bold
  pdf.addFileToVFS('Manrope-Bold.ttf', manropeBoldBase64);
  pdf.addFont('Manrope-Bold.ttf', 'Manrope', 'bold');
  
  // Definir Manrope como fonte padrão
  pdf.setFont('Manrope', 'normal');
  
  // ... resto do código ...
};
```

### 5.3 Substituir Helvetica por Manrope

**Buscar e substituir em todo o arquivo:**

```javascript
// Antes
pdf.setFont('helvetica', 'bold');
pdf.setFont('helvetica', 'normal');
pdf.setFont('helvetica', 'italic');

// Depois
pdf.setFont('Manrope', 'bold');
pdf.setFont('Manrope', 'normal');
pdf.setFont('Manrope', 'normal'); // Manrope não tem italic nativo
```

**Nota sobre Itálico:**
Se Manrope não tiver variante italic, use `'normal'` ou adicione `Manrope-Italic.ttf` se disponível.

---

## 🎨 Exemplo Completo de Uso

```javascript
// Cabeçalho
pdf.setFont('Manrope', 'bold');
pdf.setFontSize(14);
pdf.text('Relatório de Indicadores', x, y);

// Texto normal
pdf.setFont('Manrope', 'normal');
pdf.setFontSize(10);
pdf.text('Informações do projeto', x, y);

// Slogan (sem italic, use normal)
pdf.setFont('Manrope', 'normal');
pdf.setFontSize(8);
pdf.text('Atitude imediata. Resultados notáveis.', x, y);
```

---

## ⚠️ Considerações Importantes

### Tamanho do Arquivo

**Atenção:** Fontes em base64 são grandes!
- Manrope-Regular: ~150-200 KB
- Manrope-Bold: ~150-200 KB
- **Total**: ~300-400 KB adicionados ao bundle

**Impacto:**
- Aumenta o tamanho do arquivo JavaScript
- Pode afetar o tempo de carregamento inicial
- Considere usar code splitting se necessário

### Performance

- A conversão base64 é feita apenas uma vez (build time)
- O PDF usa a fonte em memória (runtime)
- Não há impacto significativo na geração do PDF

### Alternativas

Se o tamanho for um problema:

1. **Usar apenas Regular**: Remova Bold/Medium
2. **Lazy Loading**: Carregar fonte apenas quando exportar PDF
3. **Manter Helvetica**: Fonte padrão, sem overhead

---

## 🧪 Testar a Implementação

1. Execute o projeto: `npm run dev`
2. Acesse um projeto com indicadores
3. Clique em "Exportar PDF"
4. Abra o PDF gerado
5. Verifique se a fonte está correta:
   - Abra propriedades do PDF
   - Veja "Fontes" → deve aparecer "Manrope"

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@/fonts/manrope-base64'"

**Solução:** Execute o script de conversão primeiro:
```bash
node scripts/convert-font-to-base64.js
```

### Erro: "Font not found"

**Solução:** Verifique se:
1. O nome da fonte está correto: `'Manrope'` (case-sensitive)
2. O estilo está correto: `'normal'` ou `'bold'`
3. A fonte foi adicionada antes de usar

### PDF não mostra a fonte correta

**Solução:**
1. Limpe o cache do navegador
2. Reconstrua o projeto: `npm run build`
3. Verifique se o arquivo base64 foi gerado corretamente

### Arquivo base64 muito grande

**Solução:**
1. Use apenas as variantes necessárias (Regular + Bold)
2. Considere usar subset da fonte (apenas caracteres usados)
3. Avalie se vale a pena vs usar Helvetica

---

## 📊 Comparação: Helvetica vs Manrope

| Aspecto | Helvetica | Manrope |
|---------|-----------|---------|
| Tamanho | 0 KB (nativa) | ~300 KB |
| Carregamento | Instantâneo | +0.5s inicial |
| Compatibilidade | 100% | 100% (após conversão) |
| Visual | Profissional | Moderno |
| Manutenção | Zero | Baixa |

---

## ✅ Checklist Final

- [ ] Fontes TTF baixadas
- [ ] Arquivos em `public/fonts/`
- [ ] Script de conversão executado
- [ ] Arquivo `manrope-base64.js` gerado
- [ ] Import adicionado no componente
- [ ] Fontes registradas no PDF
- [ ] Helvetica substituída por Manrope
- [ ] PDF testado e funcionando
- [ ] Tamanho do bundle verificado

---

## 📚 Recursos Adicionais

- [jsPDF Custom Fonts](https://github.com/parallax/jsPDF#use-of-unicode-characters--utf-8)
- [Google Fonts - Manrope](https://fonts.google.com/specimen/Manrope)
- [Font Squirrel - Web Font Generator](https://www.fontsquirrel.com/tools/webfont-generator)

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Consulte esta documentação
3. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 13/11/2025  
**Autor:** Equipe Exxata Connect
