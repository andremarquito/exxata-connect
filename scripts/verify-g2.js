import XLSX from 'xlsx';

const filePath = 'modelo_indicadores/g2_comparativo_faturamento_acumulado.xlsx';

console.log('🔍 Verificando arquivo:', filePath);

const wb = XLSX.readFile(filePath);

console.log('\n📋 Abas:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ABA: ${sheetName}`);
  console.log('='.repeat(60));
  
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws);
  
  console.log(`Total de registros: ${data.length}\n`);
  
  data.forEach((row, i) => {
    console.log(`Registro ${i + 1}:`, JSON.stringify(row, null, 2));
  });
});

console.log('\n✅ Verificação concluída!');
