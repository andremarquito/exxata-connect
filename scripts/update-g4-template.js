/**
 * Script para atualizar o template g4_comparativo_faturamento_mes_combo.xlsx
 * com configuração de eixo Y secundário
 * 
 * Execute: node scripts/update-g4-template.js
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '..', 'modelo_indicadores', 'g4_comparativo_faturamento_mes_combo.xlsx');

console.log('📊 Atualizando template g4 com eixo Y secundário...');
console.log('📁 Arquivo:', templatePath);

// Criar workbook
const wb = XLSX.utils.book_new();

// ===== ABA 1: CONFIGURAÇÕES =====
const configData = [{
  'ID': 'G1',
  'Título': 'Faturamento Mensal vs Acumulado',
  'Tipo': 'combo',
  'Formato': 'currency',
  'Tamanho': '2 colunas',
  'Ordem': 1
}];

const wsConfig = XLSX.utils.json_to_sheet(configData);
wsConfig['!cols'] = [
  { wch: 8 },  // ID
  { wch: 40 }, // Título
  { wch: 15 }, // Tipo
  { wch: 15 }, // Formato
  { wch: 12 }, // Tamanho
  { wch: 8 }   // Ordem
];
XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações');

// ===== ABA 2: DADOS =====
const dataData = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Mensal',
    'Jan': 150000,
    'Fev': 180000,
    'Mar': 165000,
    'Abr': 195000,
    'Mai': 210000,
    'Jun': 225000,
    'Jul': 240000,
    'Ago': 255000,
    'Set': 270000,
    'Out': 285000,
    'Nov': 300000,
    'Dez': 315000
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Acumulado',
    'Jan': 150000,
    'Fev': 330000,
    'Mar': 495000,
    'Abr': 690000,
    'Mai': 900000,
    'Jun': 1125000,
    'Jul': 1365000,
    'Ago': 1620000,
    'Set': 1890000,
    'Out': 2175000,
    'Nov': 2475000,
    'Dez': 2790000
  }
];

const wsData = XLSX.utils.json_to_sheet(dataData);
wsData['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 25 }, // Dataset
  { wch: 12 }, // Jan
  { wch: 12 }, // Fev
  { wch: 12 }, // Mar
  { wch: 12 }, // Abr
  { wch: 12 }, // Mai
  { wch: 12 }, // Jun
  { wch: 12 }, // Jul
  { wch: 12 }, // Ago
  { wch: 12 }, // Set
  { wch: 12 }, // Out
  { wch: 12 }, // Nov
  { wch: 12 }  // Dez
];
XLSX.utils.book_append_sheet(wb, wsData, 'Dados');

// ===== ABA 3: CORES =====
const colorData = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Mensal',
    'Cor': '#3b82f6',
    'Tipo': 'bar',
    'Eixo Y': 'Esquerdo',
    'Formato': 'currency'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Faturamento Acumulado',
    'Cor': '#10b981',
    'Tipo': 'line',
    'Eixo Y': 'Direito',
    'Formato': 'currency'
  }
];

const wsColors = XLSX.utils.json_to_sheet(colorData);
wsColors['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 25 }, // Dataset
  { wch: 10 }, // Cor
  { wch: 8 },  // Tipo
  { wch: 12 }, // Eixo Y
  { wch: 15 }  // Formato
];
XLSX.utils.book_append_sheet(wb, wsColors, 'Cores');

// ===== ABA 4: EIXOS =====
const axisData = [
  {
    'ID_Gráfico': 'G1',
    'Eixo': 'Esquerdo',
    'Mínimo': 0,
    'Máximo': 350000
  },
  {
    'ID_Gráfico': 'G1',
    'Eixo': 'Direito',
    'Mínimo': 0,
    'Máximo': 3000000
  }
];

const wsAxis = XLSX.utils.json_to_sheet(axisData);
wsAxis['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 12 }, // Eixo
  { wch: 12 }, // Mínimo
  { wch: 12 }  // Máximo
];
XLSX.utils.book_append_sheet(wb, wsAxis, 'Eixos');

// Salvar arquivo
XLSX.writeFile(wb, templatePath);

console.log('✅ Template g4 atualizado com sucesso!');
console.log('\n📋 Estrutura criada:');
console.log('   - Aba Configurações: Metadados do gráfico');
console.log('   - Aba Dados: Valores mensais e acumulados');
console.log('   - Aba Cores: Configuração de cores, tipos, eixos e formatos');
console.log('   - Aba Eixos: Limites min/max dos eixos Y');
console.log('\n🎯 Configuração aplicada:');
console.log('   - Faturamento Mensal: Barras, Eixo Esquerdo (0 - 350k)');
console.log('   - Faturamento Acumulado: Linha, Eixo Direito (0 - 3M)');
console.log('\n💡 O modelo está pronto para ser importado!');
