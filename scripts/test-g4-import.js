/**
 * Script para testar a lógica de importação do g4
 * Simula o processamento da aba Cores
 */

// Simular dados da aba Cores do g4
const colorData = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Contratado',
    'Cor': '#d51d07',
    'Tipo': 'bar',
    'Eixo Y': 'Esquerdo',
    'Formato': 'currency'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Real',
    'Cor': '#4284D7',
    'Tipo': 'bar',
    'Eixo Y': 'Esquerdo',
    'Formato': 'currency'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Contratado Acumulado',
    'Cor': '#d51d07',
    'Tipo': 'line',
    'Eixo Y': 'Direito',
    'Formato': 'currency'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Real Acumulado',
    'Cor': '#4284d7',
    'Tipo': 'line',
    'Eixo Y': 'Direito',
    'Formato': 'currency'
  }
];

console.log('🧪 Testando lógica de importação do g4\n');

colorData.forEach((row, index) => {
  console.log(`\n📊 Dataset ${index + 1}: ${row.Dataset}`);
  
  const chartType = row['Tipo'] || row['tipo'] || row['type'];
  const yAxisId = row['Eixo Y'] || row['eixo_y'] || row['yAxisId'];
  const formato = row['Formato'] || row['formato'] || row['format'];
  
  // Processar tipo
  const processedChartType = chartType ? (chartType.toLowerCase() === 'line' ? 'line' : 'bar') : 'bar';
  console.log(`   Tipo: ${chartType} → ${processedChartType}`);
  
  // Processar eixo Y
  let processedYAxisId = 'left';
  if (yAxisId) {
    processedYAxisId = yAxisId.toLowerCase().includes('direito') || yAxisId.toLowerCase().includes('right') ? 'right' : 'left';
  }
  console.log(`   Eixo Y: "${yAxisId}" → ${processedYAxisId}`);
  
  // Processar formato
  let processedFormat = null;
  if (formato) {
    const formatoLower = String(formato).toLowerCase().trim();
    console.log(`   Formato (lower): "${formatoLower}"`);
    
    if (formatoLower.includes('usd') || formatoLower.includes('dólar') || formatoLower.includes('dolar')) {
      processedFormat = 'currency-usd';
    } else if (formatoLower === 'currency' || formatoLower.includes('brl') || formatoLower.includes('r$') || formatoLower.includes('monetário') || formatoLower.includes('monetario')) {
      processedFormat = 'currency';
    } else if (formatoLower === 'percentage' || formatoLower.includes('percent') || formatoLower.includes('%')) {
      processedFormat = 'percentage';
    } else if (formatoLower === 'number' || formatoLower.includes('numérico') || formatoLower.includes('numerico')) {
      processedFormat = 'number';
    }
    console.log(`   Formato: "${formato}" → ${processedFormat}`);
  }
  
  // Resultado final
  console.log(`   ✅ Resultado:`);
  console.log(`      chartType: ${processedChartType}`);
  console.log(`      yAxisId: ${processedYAxisId}`);
  console.log(`      valueFormat: ${processedFormat}`);
});

console.log('\n\n✅ Teste concluído!');
console.log('\n📋 Resumo esperado:');
console.log('   - Faturamento Contratado: bar, left, currency');
console.log('   - Faturamento Real: bar, left, currency');
console.log('   - Faturamento Contratado Acumulado: line, right, currency');
console.log('   - Faturamento Real Acumulado: line, right, currency');
