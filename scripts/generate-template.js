import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar workbook
const wb = XLSX.utils.book_new();

// ===== ABA 1: CONFIGURAÇÕES =====
const config = [
  {
    'ID': 'G1',
    'Título': 'Resumo Histogramas no Período',
    'Tipo': 'bar',
    'Formato': 'Numérico'
  },
  {
    'ID': 'G2',
    'Título': 'Evolução de Vendas Mensais',
    'Tipo': 'line',
    'Formato': 'Monetário'
  },
  {
    'ID': 'G3',
    'Título': 'Distribuição por Setor',
    'Tipo': 'pie',
    'Formato': 'Percentual'
  }
];

const wsConfig = XLSX.utils.json_to_sheet(config);
wsConfig['!cols'] = [
  { wch: 8 },  // ID
  { wch: 40 }, // Título
  { wch: 15 }, // Tipo
  { wch: 15 }  // Formato
];
XLSX.utils.book_append_sheet(wb, wsConfig, 'Configurações');

// ===== ABA 2: DADOS =====
const dados = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'MOI',
    'Contratado': 2963,
    'Real': 4011,
    'EQUIPAMENTO': 5855
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'MOD',
    'Contratado': 9951,
    'Real': 10419,
    'EQUIPAMENTO': 5855
  },
  {
    'ID_Gráfico': 'G2',
    'Dataset': 'Vendas',
    'Jan': 100000,
    'Fev': 150000,
    'Mar': 200000,
    'Abr': 180000
  },
  {
    'ID_Gráfico': 'G2',
    'Dataset': 'Custos',
    'Jan': 50000,
    'Fev': 80000,
    'Mar': 120000,
    'Abr': 100000
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor A',
    'Participação': 45.5
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor B',
    'Participação': 30.2
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor C',
    'Participação': 24.3
  }
];

const wsDados = XLSX.utils.json_to_sheet(dados);
wsDados['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 20 }, // Dataset
  { wch: 15 }, // Valores
  { wch: 15 },
  { wch: 15 },
  { wch: 15 }
];
XLSX.utils.book_append_sheet(wb, wsDados, 'Dados');

// ===== ABA 3: CORES =====
const cores = [
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'MOI',
    'Cor': '#4284D7'
  },
  {
    'ID_Gráfico': 'G1',
    'Dataset': 'MOD',
    'Cor': '#D51D07'
  },
  {
    'ID_Gráfico': 'G2',
    'Dataset': 'Vendas',
    'Cor': '#82ca9d'
  },
  {
    'ID_Gráfico': 'G2',
    'Dataset': 'Custos',
    'Cor': '#ffc658'
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor A',
    'Cor': '#4ade80'
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor B',
    'Cor': '#facc15'
  },
  {
    'ID_Gráfico': 'G3',
    'Dataset': 'Setor C',
    'Cor': '#f87171'
  }
];

const wsCores = XLSX.utils.json_to_sheet(cores);
wsCores['!cols'] = [
  { wch: 12 }, // ID_Gráfico
  { wch: 20 }, // Dataset
  { wch: 15 }  // Cor
];
XLSX.utils.book_append_sheet(wb, wsCores, 'Cores');

// Salvar arquivo
const outputPath = path.join(__dirname, '..', 'docs', 'Template_Indicadores_Exemplo.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Template criado com sucesso:', outputPath);
