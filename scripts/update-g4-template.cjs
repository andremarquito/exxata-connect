const XLSX = require('xlsx');
const path = require('path');

// Criar workbook
const wb = XLSX.utils.book_new();

// ===== ABA 1: CONFIGURAÇÕES =====
const configData = [
  {
    'ID': 'G4',
    'Título': 'Comparativo Faturamento Mensal',
    'Tipo': 'combo',
    'Formato': 'Monetário'
  }
];

const wsConfig = XLSX.utils.json_to_sheet(configData);
XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações');

// ===== ABA 2: DADOS =====
// Dados com labels em português (meses abreviados)
const dadosData = [
  {
    'ID_Gráfico': 'G4',
    'Dataset': 'Contratado',
    'Jan': 150000,
    'Fev': 150000,
    'Mar': 150000,
    'Abr': 150000,
    'Mai': 150000,
    'Jun': 150000,
    'Jul': 150000,
    'Ago': 150000,
    'Set': 150000,
    'Out': 150000,
    'Nov': 150000,
    'Dez': 150000
  },
  {
    'ID_Gráfico': 'G4',
    'Dataset': 'Realizado',
    'Jan': 120000,
    'Fev': 135000,
    'Mar': 145000,
    'Abr': 140000,
    'Mai': 155000,
    'Jun': 160000,
    'Jul': 148000,
    'Ago': 152000,
    'Set': 158000,
    'Out': 162000,
    'Nov': 165000,
    'Dez': 170000
  }
];

const wsDados = XLSX.utils.json_to_sheet(dadosData);
XLSX.utils.book_append_sheet(wb, wsDados, 'Dados');

// ===== ABA 3: CORES =====
// Definir cores e tipos para gráfico combo
const coresData = [
  {
    'ID_Gráfico': 'G4',
    'Dataset': 'Contratado',
    'Cor': '#82ca9d',
    'Tipo': 'line'
  },
  {
    'ID_Gráfico': 'G4',
    'Dataset': 'Realizado',
    'Cor': '#8884d8',
    'Tipo': 'bar'
  }
];

const wsCores = XLSX.utils.json_to_sheet(coresData);
XLSX.utils.book_append_sheet(wb, wsCores, 'Cores');

// Salvar arquivo
const outputPath = path.join(__dirname, '..', 'modelo_indicadores', 'g4_comparativo_faturamento_mes_combo.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Arquivo g4_comparativo_faturamento_mes_combo.xlsx atualizado com sucesso!');
console.log('📋 Configuração:');
console.log('   - Tipo: combo (barra + linha)');
console.log('   - Formato: Monetário (BRL)');
console.log('   - Labels: Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez (PT-BR)');
console.log('🎨 Cores:');
console.log('   - Contratado: #82ca9d (verde) - linha');
console.log('   - Realizado: #8884d8 (azul) - barra');
console.log('📊 Dados:');
console.log('   - Contratado: R$ 150.000 (constante)');
console.log('   - Realizado: R$ 120.000 a R$ 170.000 (crescente)');
