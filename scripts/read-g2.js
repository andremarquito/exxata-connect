import XLSX from 'xlsx';

const filePath = 'modelo_indicadores/g2_comparativo_faturamento_acumulado.xlsx';

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
  
  // Mostrar todas as linhas
  data.forEach((row, i) => {
    console.log(`Linha ${i}:`, JSON.stringify(row));
  });
});
