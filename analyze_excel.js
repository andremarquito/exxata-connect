import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const filePath = path.join(__dirname, 'modelo_indicadores', 'g1_prazo_decorrido.xlsx');
    console.log(`📂 Analisando arquivo: ${filePath}\n`);
    
    const wb = XLSX.readFile(filePath);
    
    console.log(`✅ Arquivo carregado com sucesso!`);
    console.log(`\n📋 Abas encontradas: ${wb.SheetNames.join(', ')}`);
    console.log(`   Total de abas: ${wb.SheetNames.length}\n`);
    
    // Verificar se tem as 3 abas necessárias
    const hasConfig = wb.SheetNames.includes('Configurações') || wb.SheetNames.includes('Configuracoes');
    const hasDados = wb.SheetNames.includes('Dados');
    const hasCores = wb.SheetNames.includes('Cores');
    
    console.log(`\n🔍 VALIDAÇÃO DO FORMATO:`);
    console.log(`   ${hasConfig ? '✅' : '❌'} Aba "Configurações" ou "Configuracoes"`);
    console.log(`   ${hasDados ? '✅' : '❌'} Aba "Dados"`);
    console.log(`   ${hasCores ? '✅' : '⚠️ '} Aba "Cores" (opcional)`);
    
    if (hasConfig && hasDados) {
        console.log(`\n✅ FORMATO CORRETO! O arquivo está no formato de 3 abas esperado.\n`);
    } else {
        console.log(`\n❌ FORMATO INCORRETO! O arquivo não está no formato esperado.\n`);
    }
    
    // Mostrar conteúdo de cada aba
    wb.SheetNames.forEach(sheetName => {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📄 ABA: "${sheetName}"`);
        console.log(`${'='.repeat(70)}`);
        
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        // Mostrar primeiras 15 linhas
        data.slice(0, 15).forEach((row, idx) => {
            const filteredRow = row.filter(cell => cell !== '');
            if (filteredRow.length > 0) {
                console.log(`Linha ${idx + 1}: [${filteredRow.map(c => `"${c}"`).join(', ')}]`);
            }
        });
        
        console.log(`\nTotal de linhas: ${data.length}`);
        console.log(`Total de colunas: ${data[0] ? data[0].length : 0}`);
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 ANÁLISE COMPLETA`);
    console.log(`${'='.repeat(70)}\n`);
    
} catch (error) {
    console.error(`❌ Erro ao analisar arquivo: ${error.message}`);
    process.exit(1);
}
