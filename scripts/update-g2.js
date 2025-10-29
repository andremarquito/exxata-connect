/**
 * Script para atualizar o template g2_comparativo_faturamento_acumulado.xlsx
 * Gráfico de barras comparando valores de faturamento
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, '..', 'modelo_indicadores', 'g2_comparativo_faturamento_acumulado.xlsx');

console.log('📊 Criando template g2...');

// Criar workbook
const wb = XLSX.utils.book_new();

// ===== ABA 1: CONFIGURAÇÕES =====
console.log('\n📝 Processando Configurações...');
const configData = [{
  'ID': 'G1',
  'Título': 'Comparativo de Faturamento Acumulado',
  'Tipo': 'bar',
  'Formato': 'currency',
  'Tamanho': '1 coluna',
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

const dataData = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Valor do Contrato',
    'Faturamento': 58019300.71
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Contratado Acumulado',
    'Faturamento': 15653075.86
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Medido Acumulado',
    'Faturamento': 13653075.86
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Saldo',
    'Faturamento': 42366224.85
  }
];

const wsData = XLSX.utils.json_to_sheet(dataData);
wsData['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 25 }, // Dataset
  { wch: 18 }  // Faturamento
];
XLSX.utils.book_append_sheet(wb, wsData, 'Dados');

// ===== ABA 3: CORES =====
console.log('🎨 Processando Cores...');

const colorData = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Valor do Contrato',
    'Cor': '#d51d07'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Contratado Acumulado',
    'Cor': '#B2B2BB'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Medido Acumulado',
    'Cor': '#4284D7'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'Saldo',
    'Cor': '#C00000'
  }
];

const wsColors = XLSX.utils.json_to_sheet(colorData);
wsColors['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 25 }, // Dataset
  { wch: 10 }  // Cor
];
XLSX.utils.book_append_sheet(wb, wsColors, 'Cores');

// Salvar arquivo
console.log('\n💾 Salvando arquivo:', targetFile);
XLSX.writeFile(wb, targetFile);

console.log('\n✅ Template g2 atualizado com sucesso!');
console.log('\n📋 Estrutura criada:');
console.log('   - Aba Configurações: Tipo bar, formato currency');
console.log('   - Aba Dados: 4 datasets com 1 valor cada (Faturamento)');
console.log('   - Aba Cores: Cores personalizadas para cada dataset');
console.log('\n🎯 Datasets configurados:');
console.log('   - Valor do Contrato: R$ 58.019.300,71 (vermelho)');
console.log('   - Contratado Acumulado: R$ 15.653.075,86 (cinza)');
console.log('   - Medido Acumulado: R$ 13.653.075,86 (azul)');
console.log('   - Saldo: R$ 42.366.224,85 (vermelho escuro)');
console.log('\n💡 O modelo está pronto para ser importado!');
