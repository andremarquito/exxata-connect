# Resumo Rápido: Adicionar Fonte Manrope ao PDF

## 🚀 Passos Rápidos

### 1. Baixar Fonte
```
https://fonts.google.com/specimen/Manrope
→ Download family
→ Extrair Manrope-Regular.ttf e Manrope-Bold.ttf
```

### 2. Colocar no Projeto
```
public/fonts/
  ├── Manrope-Regular.ttf
  └── Manrope-Bold.ttf
```

### 3. Converter para Base64
```bash
node scripts/convert-font-to-base64.js
```

### 4. Usar no Código

```javascript
// src/components/pdf/IndicatorsPDFExporter.jsx

// Import
import { manropeRegularBase64, manropeBoldBase64 } from '@/fonts/manrope-base64';

// No handleExport, após criar o PDF:
pdf.addFileToVFS('Manrope-Regular.ttf', manropeRegularBase64);
pdf.addFont('Manrope-Regular.ttf', 'Manrope', 'normal');

pdf.addFileToVFS('Manrope-Bold.ttf', manropeBoldBase64);
pdf.addFont('Manrope-Bold.ttf', 'Manrope', 'bold');

// Usar
pdf.setFont('Manrope', 'bold');
pdf.text('Texto em negrito', x, y);

pdf.setFont('Manrope', 'normal');
pdf.text('Texto normal', x, y);
```

### 5. Substituir Helvetica
Buscar e substituir em todo o arquivo:
- `'helvetica'` → `'Manrope'`
- `'italic'` → `'normal'` (Manrope não tem italic nativo)

---

## ⚠️ Importante

**Tamanho:** ~300 KB adicionados ao bundle  
**Alternativa:** Manter Helvetica (fonte padrão, sem overhead)

---

## 📝 Documentação Completa

Ver: `docs/ADICIONAR_FONTE_MANROPE_PDF.md`
