import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const formatValue = (value, format, opts = {}) => {
  // Coerce numeric strings to numbers before formatting
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  const { compact = false } = opts;

  if (format === 'currency') {
    const useCompact = compact || Math.abs(num) >= 1_000_000;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: useCompact ? 'compact' : 'standard',
      compactDisplay: 'short',
      minimumFractionDigits: useCompact ? 1 : 2,
      maximumFractionDigits: useCompact ? 1 : 2,
    }).format(num);
  }

  if (format === 'percentage') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);
  }

  // number padrão
  const useCompact = compact || Math.abs(num) >= 1_000_000;
  return new Intl.NumberFormat('pt-BR', {
    notation: useCompact ? 'compact' : 'standard',
    compactDisplay: 'short',
    minimumFractionDigits: useCompact ? 1 : 0,
    maximumFractionDigits: useCompact ? 1 : 2,
  }).format(num);
};

// Renderers para rótulos formatados nos gráficos
const renderBarLabelRight = (valueFormat) => (props) => {
  const { x, y, width, height, value } = props;
  const text = formatValue(value, valueFormat, { compact: true });
  return (
    <text x={x + width + 6} y={y + height / 2} fill="#6b7280" fontSize={12} dominantBaseline="central">
      {text}
    </text>
  );
};

const renderBarLabelTop = (valueFormat) => (props) => {
  const { x, y, width, value } = props;
  const text = formatValue(value, valueFormat, { compact: true });
  return (
    <text x={x + width / 2} y={y - 6} fill="#6b7280" fontSize={12} textAnchor="middle">
      {text}
    </text>
  );
};

const renderLineLabelTop = (valueFormat) => (props) => {
  const { x, y, value } = props;
  const text = formatValue(value, valueFormat, { compact: true });
  return (
    <text x={x} y={y - 8} fill="#6b7280" fontSize={12} textAnchor="middle">
      {text}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label, valueFormat }) => {
  if (active && payload && payload.length) {
    // For Pie charts, 'label' may be undefined; fallback to the slice name from payload
    const displayLabel = label ?? payload[0]?.payload?.name ?? payload[0]?.name ?? '';
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
        <p className="label font-bold">{displayLabel}</p>
        {payload.map((p, index) => (
          <p key={index} style={{ color: p.color }}>{`${p.name}: ${formatValue(p.value, valueFormat)}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, valueFormat }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const IndicatorChart = ({ indicator }) => {
  const { chart_type, labels, datasets, options } = indicator;
  const type = chart_type; // Mantém a variável 'type' para compatibilidade interna do componente
  const valueFormat = options?.valueFormat || 'number';
  const showDataLabels = options?.showDataLabels ?? true;

  const data = labels.map((label, index) => {
    const dataEntry = { name: label };
    datasets.forEach(dataset => {
      const raw = dataset.values?.[index];
      const num = typeof raw === 'number' ? raw : Number(raw);
      dataEntry[dataset.name] = Number.isFinite(num) ? num : 0;
    });
    return dataEntry;
  });

      if (type === 'bar-horizontal') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 60, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, (dataMax) => (typeof dataMax === 'number' ? dataMax * 1.1 : dataMax)]}
              tickFormatter={(v) => formatValue(v, valueFormat, { compact: true })}
            />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
            {datasets.map((dataset, index) => (
              <Bar key={index} dataKey={dataset.name} fill={dataset.color || '#8884d8'}>
                {showDataLabels && (
                  <LabelList dataKey={dataset.name} content={renderBarLabelRight(valueFormat)} />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, (dataMax) => (typeof dataMax === 'number' ? dataMax * 1.1 : dataMax)]}
              tickFormatter={(v) => formatValue(v, valueFormat, { compact: true })}
            />
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
            {datasets.map((dataset, index) => (
              <Bar key={index} dataKey={dataset.name} fill={dataset.color || '#8884d8'}>
                {showDataLabels && (
                  <LabelList dataKey={dataset.name} content={renderBarLabelTop(valueFormat)} />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, (dataMax) => (typeof dataMax === 'number' ? dataMax * 1.1 : dataMax)]}
              tickFormatter={(v) => formatValue(v, valueFormat, { compact: true })}
            />
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
            {datasets.map((dataset, index) => (
              <Line key={index} type="monotone" dataKey={dataset.name} stroke={dataset.color || '#8884d8'} activeDot={{ r: 8 }}>
                {showDataLabels && (
                  <LabelList dataKey={dataset.name} content={renderLineLabelTop(valueFormat)} />
                )}
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pie') {
    const pieData = labels.map((label, index) => ({
      name: label,
      value: datasets[0]?.values[index] || 0,
    }));

    // Usar cores individuais por fatia, ou cores padrão cíclicas
    const defaultColors = ['#d51d07', '#09182b', '#0ea5e9', '#f59e0b', '#10b981', '#6366f1'];
    const pieColors = datasets[0]?.colors || defaultColors;

    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showDataLabels ? ({ name, value, percent }) => {
                if (valueFormat === 'percentage') {
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }
                const valText = formatValue(value, valueFormat, { compact: true });
                return `${name} ${valText} (${(percent * 100).toFixed(0)}%)`;
              } : false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index] || defaultColors[index % defaultColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Adicionar outros tipos de gráficos aqui (linha, pizza, etc.)
  return <p>Tipo de gráfico não suportado: {type}</p>;
};

export default IndicatorChart;
