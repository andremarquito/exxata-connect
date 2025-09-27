// Utilities to import Excel/CSV into indicator structure and to download an Excel template
// Uses SheetJS (xlsx)

import * as XLSX from 'xlsx';

export const DEFAULT_COLORS = [
  '#d51d07', // Exxata red
  '#09182b', // Exxata blue (dark)
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#ef4444',
  '#059669',
  '#3b82f6',
];

function normalizeNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && isFinite(v)) return v;
  let s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return 0;
  // remove thousand separators and convert comma decimal to dot
  // heuristics: if both . and , appear, assume . is thousands and , is decimal
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '');
    s = s.replace(/,/g, '.');
  } else if (s.includes(',')) {
    // treat comma as decimal if no dot
    s = s.replace(/,/g, '.');
  }
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

export async function readSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    return { name, data: aoa };
  });
  return { sheets };
}

export function transformSheetToIndicator({
  data,
  chartType, // 'bar' | 'bar-horizontal' | 'line' | 'pie'
  hasHeader = true,
  pieSeriesIndex = null, // numeric column index (>=1) for pie
  currentColorsMap = {}, // map name->color to preserve existing colors
  palette = DEFAULT_COLORS,
  previewRows = 10,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return { error: 'Planilha vazia.', preview: null };
  }
  const rows = data.map((r) => Array.isArray(r) ? r : [r]);
  const headerRow = hasHeader ? (rows[0] || []) : [];
  const body = hasHeader ? rows.slice(1) : rows;

  // Normalize trimming
  const trimmed = body.map((r) => r.map((c) => (typeof c === 'string' ? c.trim() : c)));

  // Drop completely empty rows
  const nonEmptyRows = trimmed.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmptyRows.length === 0) {
    return { error: 'Sem dados após remover linhas vazias.', preview: null };
  }

  // Determine labels (first column)
  const labels = nonEmptyRows.map((r) => String(r[0] ?? '').trim());

  // Determine series columns
  const colCount = Math.max(0, ...nonEmptyRows.map((r) => r.length));
  const seriesCols = [];
  for (let c = 1; c < colCount; c++) seriesCols.push(c);

  // Build headers for series
  const fallbackSeriesNames = seriesCols.map((_, i) => `Série ${i + 1}`);
  const headerSeriesNames = hasHeader ? seriesCols.map((c, i) => String(headerRow[c] ?? fallbackSeriesNames[i] ?? `Série ${i + 1}`)) : fallbackSeriesNames;

  // Identify numeric columns for Pie if needed
  const numericCandidates = seriesCols.filter((c) => nonEmptyRows.some((r) => String(r[c] ?? '').trim() !== ''));

  if (chartType === 'pie') {
    let selected = pieSeriesIndex;
    if (selected === null || selected === undefined) {
      // Pick first numeric candidate
      selected = numericCandidates.length ? numericCandidates[0] : null;
    }
    if (selected === null) {
      return { error: 'Nenhuma coluna numérica encontrada para Pizza.', preview: null };
    }
    const seriesName = headerSeriesNames[seriesCols.indexOf(selected)] || 'Série 1';
    const values = nonEmptyRows.map((r) => normalizeNumber(r[selected]));
    const dsColor = currentColorsMap[seriesName] || palette[0 % palette.length];
    const datasets = [{ name: seriesName, color: dsColor, values }];

    const preview = buildPreview({ headerRow, hasHeader, rows: nonEmptyRows, limit: previewRows });
    return { labels, datasets, preview, seriesNames: [seriesName], numericCandidates, usedSeriesIndex: selected };
  }

  // Bar / Line
  const datasets = seriesCols.map((c, idx) => {
    const name = headerSeriesNames[idx] || `Série ${idx + 1}`;
    const color = currentColorsMap[name] || palette[idx % palette.length];
    const values = nonEmptyRows.map((r) => normalizeNumber(r[c]));
    return { name, color, values };
  });

  const preview = buildPreview({ headerRow, hasHeader, rows: nonEmptyRows, limit: previewRows });
  return { labels, datasets, preview, seriesNames: headerSeriesNames };
}

function buildPreview({ headerRow, hasHeader, rows, limit }) {
  const headers = hasHeader ? headerRow : ['Label', ...Array.from({ length: Math.max(0, (rows[0]?.length || 1) - 1) }, (_, i) => `Série ${i + 1}`)];
  const sample = rows.slice(0, limit);
  return { headers, rows: sample };
}

export function downloadIndicatorTemplate(filename = 'modelo_indicadores.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Barras/Linha
  const aoa1 = [
    ['Label', 'Série 1', 'Série 2'],
    ['Jan', 10, 20],
    ['Fev', 20, 25],
    ['Mar', 15, 18],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(aoa1);
  XLSX.utils.book_append_sheet(wb, ws1, 'Barras_Linha');

  // Sheet 2: Pizza
  const aoa2 = [
    ['Categoria', 'Valor'],
    ['A', 40],
    ['B', 35],
    ['C', 25],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
  XLSX.utils.book_append_sheet(wb, ws2, 'Pizza');

  XLSX.writeFile(wb, filename);
}
