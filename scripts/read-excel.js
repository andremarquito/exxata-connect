import XLSX from 'xlsx';

const filePath = 'modelo_indicadores/Comparativo_de_Faturamento_Acumulado_2025-10-29 (1).xlsx';

console.log('📖 Lendo arquivo:', filePath);

const wb = XLSX.readFile(filePath);

console.log('\n📋 Abas encontradas:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ABA: ${sheetName}`);
  console.log('='.repeat(60));
  
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  console.log(`Total de linhas: ${data.length}\n`);
  
  // Mostrar primeiras 15 linhas
  data.slice(0, 15).forEach((row, i) => {
    console.log(`Linha ${i}:`, JSON.stringify(row));
  });
  
  if (data.length > 15) {
    console.log(`\n... (${data.length - 15} linhas restantes)`);
  }
});
