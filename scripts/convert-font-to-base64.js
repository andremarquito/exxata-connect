/**
 * Script para converter fonte TTF para base64 para uso no jsPDF
 * 
 * Uso:
 * 1. Coloque o arquivo Manrope-Regular.ttf em public/
 * 2. Execute: node scripts/convert-font-to-base64.js
 * 3. O arquivo src/fonts/manrope-base64.js será gerado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos
const fontsDir = path.join(__dirname, '../public');
const outputDir = path.join(__dirname, '../src/fonts');
const outputFile = path.join(outputDir, 'manrope-base64.js');

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fontes para converter
const fonts = [
  { file: 'Manrope-Regular.ttf', name: 'manropeRegular' },
  { file: 'Manrope-Bold.ttf', name: 'manropeBold' },
  { file: 'Manrope-Medium.ttf', name: 'manropeMedium' }
];

let output = '/**\n * Fontes Manrope em formato base64 para jsPDF\n * Gerado automaticamente - NÃO EDITAR MANUALMENTE\n */\n\n';

fonts.forEach(font => {
  const fontPath = path.join(fontsDir, font.file);
  
  if (fs.existsSync(fontPath)) {
    console.log(`Convertendo ${font.file}...`);
    const fontBuffer = fs.readFileSync(fontPath);
    const base64Font = fontBuffer.toString('base64');
    
    output += `export const ${font.name}Base64 = '${base64Font}';\n\n`;
    console.log(`✓ ${font.file} convertido com sucesso!`);
  } else {
    console.log(`⚠ ${font.file} não encontrado, pulando...`);
  }
});

// Salvar arquivo
fs.writeFileSync(outputFile, output);
console.log(`\n✓ Arquivo gerado: ${outputFile}`);
console.log('\nPróximos passos:');
console.log('1. Importe as fontes no seu componente');
console.log('2. Use pdf.addFileToVFS() e pdf.addFont()');
console.log('3. Use pdf.setFont("Manrope", "normal")');
