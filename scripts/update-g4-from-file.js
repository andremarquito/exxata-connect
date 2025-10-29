/**
 * Script para atualizar o template g4 com base no arquivo fornecido
 * Ajusta para formato combo, moeda (R$), e acumulados no eixo direito
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, '..', 'modelo_indicadores', 'Comparativo_de_Faturamento_Acumulado_2025-10-29 (1).xlsx');
const targetFile = path.join(__dirname, '..', 'modelo_indicadores', 'g4_comparativo_faturamento_mes_combo.xlsx');

console.log('📖 Lendo arquivo fonte:', sourceFile);

// Ler arquivo fonte
const wbSource = XLSX.readFile(sourceFile);

// Criar novo workbook
const wb = XLSX.utils.book_new();

// ===== ABA 1: CONFIGURAÇÕES =====
console.log('\n📝 Processando Configurações...');
const configData = [{
  'ID': 'G1',
  'Título': 'Comparativo de Faturamento Acumulado',
  'Tipo': 'combo',
  'Formato': 'currency',
  'Tamanho': '2 colunas',
  'Ordem': 1
}];

const wsConfig = XLSX.utils.json_to_sheet(configData);
wsConfig['!cols'] = [
  { wch: 8 },  // ID
  { wch: 45 }, // Título
  { wch: 15 }, // Tipo
  { wch: 15 }, // Formato
  { wch: 12 }, // Tamanho
  { wch: 8 }   // Ordem
];
XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações');

// ===== ABA 2: DADOS =====
console.log('📊 Processando Dados...');

// Ler dados do arquivo fonte
const wsSourceData = wbSource.Sheets['Dados'];
const sourceDataRaw = XLSX.utils.sheet_to_json(wsSourceData, { header: 1 });

// Extrair cabeçalhos (datas) - converter números de série do Excel para texto
const headers = sourceDataRaw[0].slice(2); // Pular ID_Gráfico e Dataset
const dateLabels = headers.map(h => {
  if (typeof h === 'number') {
    // Converter número de série do Excel para data
    const date = XLSX.SSF.parse_date_code(h);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return monthNames[date.m - 1];
  }
  return h;
});

console.log('📅 Rótulos extraídos:', dateLabels);

// Processar datasets
const dataData = [];
for (let i = 1; i < sourceDataRaw.length; i++) {
  const row = sourceDataRaw[i];
  const datasetName = row[1];
  const values = row.slice(2);
  
  const dataRow = {
    'ID_Gráfico': 'G1',
    'Dataset': datasetName
  };
  
  dateLabels.forEach((label, idx) => {
    dataRow[label] = values[idx] || 0;
  });
  
  dataData.push(dataRow);
  console.log(`  ✓ Dataset: ${datasetName}`);
}

const wsData = XLSX.utils.json_to_sheet(dataData);
const dataColWidths = [
  { wch: 12 }, // ID_Gráfico
  { wch: 30 }, // Dataset
  ...dateLabels.map(() => ({ wch: 15 }))
];
wsData['!cols'] = dataColWidths;
XLSX.utils.book_append_sheet(wb, wsData, 'Dados');

// ===== ABA 3: CORES =====
console.log('🎨 Processando Cores...');

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

const wsColors = XLSX.utils.json_to_sheet(colorData);
wsColors['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 35 }, // Dataset
  { wch: 10 }, // Cor
  { wch: 8 },  // Tipo
  { wch: 12 }, // Eixo Y
  { wch: 15 }  // Formato
];
XLSX.utils.book_append_sheet(wb, wsColors, 'Cores');

// ===== ABA 4: EIXOS =====
console.log('📏 Processando Eixos...');

// Calcular limites baseados nos dados
const allValues = dataData.flatMap(row => 
  dateLabels.map(label => parseFloat(row[label]) || 0)
);

const leftValues = dataData
  .filter(row => !row.Dataset.includes('Acumulado'))
  .flatMap(row => dateLabels.map(label => parseFloat(row[label]) || 0));

const rightValues = dataData
  .filter(row => row.Dataset.includes('Acumulado'))
  .flatMap(row => dateLabels.map(label => parseFloat(row[label]) || 0));

const maxLeft = Math.max(...leftValues);
const maxRight = Math.max(...rightValues);

// Arredondar para cima para valores "bonitos"
const roundUp = (num) => {
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / magnitude) * magnitude;
};

const axisData = [
  {
    'ID_Gráfico': 'G1',
    'Eixo': 'Esquerdo',
    'Mínimo': 0,
    'Máximo': roundUp(maxLeft * 1.1)
  },
  {
    'ID_Gráfico': 'G1',
    'Eixo': 'Direito',
    'Mínimo': 0,
    'Máximo': roundUp(maxRight * 1.1)
  }
];

console.log(`  Eixo Esquerdo: 0 - ${axisData[0].Máximo.toLocaleString('pt-BR')}`);
console.log(`  Eixo Direito: 0 - ${axisData[1].Máximo.toLocaleString('pt-BR')}`);

const wsAxis = XLSX.utils.json_to_sheet(axisData);
wsAxis['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 12 }, // Eixo
  { wch: 12 }, // Mínimo
  { wch: 12 }  // Máximo
];
XLSX.utils.book_append_sheet(wb, wsAxis, 'Eixos');

// Salvar arquivo
console.log('\n💾 Salvando arquivo:', targetFile);
XLSX.writeFile(wb, targetFile);

console.log('\n✅ Template g4 atualizado com sucesso!');
console.log('\n📋 Estrutura criada:');
console.log('   - Aba Configurações: Tipo combo, formato currency');
console.log('   - Aba Dados: 4 datasets com', dateLabels.length, 'meses');
console.log('   - Aba Cores: Configuração de cores, tipos, eixos e formatos');
console.log('   - Aba Eixos: Limites automáticos calculados');
console.log('\n🎯 Datasets configurados:');
console.log('   - Faturamento Contratado: Barras vermelhas, Eixo Esquerdo');
console.log('   - Faturamento Real: Barras azuis, Eixo Esquerdo');
console.log('   - Faturamento Contratado Acumulado: Linha vermelha, Eixo Direito');
console.log('   - Faturamento Real Acumulado: Linha azul, Eixo Direito');
console.log('\n💡 O modelo está pronto para ser importado!');
