import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, LineChart, Line, PieChart, Pie, Cell, ComposedChart } from 'recharts';

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

  if (format === 'currency-usd') {
    const useCompact = compact || Math.abs(num) >= 1_000_000;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

const CustomTooltip = ({ active, payload, label, valueFormat, datasets }) => {
  if (active && payload && payload.length) {
    // For Pie charts, 'label' may be undefined; fallback to the slice name from payload
    const displayLabel = label ?? payload[0]?.payload?.name ?? payload[0]?.name ?? '';
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
        <p className="label font-bold">{displayLabel}</p>
        {payload.map((p, index) => {
          // Para gráficos combo, buscar o formato específico do dataset
          let format = valueFormat;
          if (datasets && Array.isArray(datasets)) {
            const dataset = datasets.find(ds => ds.name === p.name || ds.name === p.dataKey);
            if (dataset && dataset.valueFormat) {
              format = dataset.valueFormat;
            }
          }
          return (
            <p key={index} style={{ color: p.color }}>{`${p.name}: ${formatValue(p.value, format)}`}</p>
          );
        })}
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
      // Para gráficos de linha/combo: manter null para interromper a linha
      // Para outros tipos: converter null para 0
      if (raw === null || raw === undefined) {
        if (type === 'line' || type === 'combo') {
          dataEntry[dataset.name] = null; // Mantém null para interromper linha
        } else {
          dataEntry[dataset.name] = 0; // Converte para 0 em barras/pizza
        }
      } else {
        const num = typeof raw === 'number' ? raw : Number(raw);
        dataEntry[dataset.name] = Number.isFinite(num) ? num : 0;
      }
    });
    return dataEntry;
  });

  // Para gráficos de linha/combo: remover pontos finais onde todos os datasets são 0 ou null
  // Isso evita que apareçam pontos em 0 no final (dados futuros)
  const filteredData = (type === 'line' || type === 'combo') 
    ? (() => {
        // Encontrar o último índice com valor real (não-zero e não-null) para cada dataset
        const lastRealIndex = {};
        datasets.forEach(ds => {
          for (let i = data.length - 1; i >= 0; i--) {
            const val = data[i][ds.name];
            if (val !== null && val !== undefined && val !== 0) {
              lastRealIndex[ds.name] = i;
              break;
            }
          }
        });
        
        // Filtrar: manter pontos até o último valor real de cada dataset
        return data.filter((entry, index) => {
          return datasets.some(ds => {
            const lastIdx = lastRealIndex[ds.name];
            return lastIdx !== undefined && index <= lastIdx;
          });
        });
      })()
    : data;

      if (type === 'bar-horizontal') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 60, left: 60, bottom: 5 }}>
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
          <BarChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
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
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, (dataMax) => (typeof dataMax === 'number' ? dataMax * 1.1 : dataMax)]}
              tickFormatter={(v) => formatValue(v, valueFormat, { compact: true })}
            />
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
            {datasets.map((dataset, index) => (
              <Line 
                key={index} 
                type="monotone" 
                dataKey={dataset.name} 
                stroke={dataset.color || '#8884d8'} 
                activeDot={{ r: 8 }}
                connectNulls={false}
              >
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

  if (type === 'combo') {
    // Verificar se há datasets com eixos diferentes
    const hasLeftAxis = datasets.some(ds => !ds.yAxisId || ds.yAxisId === 'left');
    const hasRightAxis = datasets.some(ds => ds.yAxisId === 'right');
    
    // Obter formatos e limites por eixo
    const leftFormat = datasets.find(ds => !ds.yAxisId || ds.yAxisId === 'left')?.valueFormat || valueFormat;
    const rightFormat = datasets.find(ds => ds.yAxisId === 'right')?.valueFormat || valueFormat;
    
    // Obter limites configurados
    const leftAxisConfig = options?.leftAxis || {};
    const rightAxisConfig = options?.rightAxis || {};
    
    // Função para calcular domínio do eixo
    const getDomain = (axisConfig, defaultFormat) => {
      const min = axisConfig.min !== undefined && axisConfig.min !== null && axisConfig.min !== '' 
        ? Number(axisConfig.min) 
        : 0;
      const max = axisConfig.max !== undefined && axisConfig.max !== null && axisConfig.max !== '' 
        ? Number(axisConfig.max) 
        : 'auto';
      
      if (max === 'auto') {
        return [min, (dataMax) => (typeof dataMax === 'number' ? dataMax * 1.1 : dataMax)];
      }
      return [min, max];
    };

    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={filteredData} margin={{ top: 20, right: hasRightAxis ? 80 : 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            
            {/* Eixo Y Esquerdo */}
            {hasLeftAxis && (
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={getDomain(leftAxisConfig, leftFormat)}
                tickFormatter={(v) => formatValue(v, leftFormat, { compact: true })}
                label={leftAxisConfig.title ? { value: leftAxisConfig.title, angle: -90, position: 'insideLeft', offset: -50, style: { textAnchor: 'middle' } } : undefined}
              />
            )}
            
            {/* Eixo Y Direito */}
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={getDomain(rightAxisConfig, rightFormat)}
                tickFormatter={(v) => formatValue(v, rightFormat, { compact: true })}
                label={rightAxisConfig.title ? { value: rightAxisConfig.title, angle: 90, position: 'insideRight', offset: -50, style: { textAnchor: 'middle' } } : undefined}
              />
            )}
            
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} datasets={datasets} />} />
            <Legend content={<CustomLegend valueFormat={valueFormat} />} />
            
            {datasets.map((dataset, index) => {
              const axisId = dataset.yAxisId || 'left';
              const dsFormat = dataset.valueFormat || (axisId === 'right' ? rightFormat : leftFormat);
              
              // Renderizar como linha se chartType for 'line', caso contrário como barra
              if (dataset.chartType === 'line') {
                return (
                  <Line 
                    key={index} 
                    yAxisId={axisId}
                    type="monotone" 
                    dataKey={dataset.name} 
                    stroke={dataset.color || '#8884d8'} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    connectNulls={false}
                  >
                    {showDataLabels && (
                      <LabelList dataKey={dataset.name} content={renderLineLabelTop(dsFormat)} />
                    )}
                  </Line>
                );
              }
              return (
                <Bar 
                  key={index} 
                  yAxisId={axisId}
                  dataKey={dataset.name} 
                  fill={dataset.color || '#8884d8'}
                >
                  {showDataLabels && (
                    <LabelList dataKey={dataset.name} content={renderBarLabelTop(dsFormat)} />
                  )}
                </Bar>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pie' || type === 'doughnut') {
    const pieData = labels.map((label, index) => {
      const rawValue = datasets[0]?.values[index];
      // Converter string para número
      const numValue = typeof rawValue === 'string' ? parseFloat(rawValue) : (rawValue || 0);
      return {
        name: label,
        value: Number.isFinite(numValue) ? numValue : 0,
      };
    });

    // Verificar se há valores válidos
    const hasValidData = pieData.some(d => d.value && d.value > 0);

    // Usar cores individuais por fatia, ou cores padrão cíclicas
    const defaultColors = ['#d51d07', '#09182b', '#0ea5e9', '#f59e0b', '#10b981', '#6366f1'];
    const pieColors = datasets[0]?.colors || defaultColors;

    // Para rosca (doughnut), definir innerRadius
    const innerRadius = type === 'doughnut' ? 50 : 0;

    // Se não há dados válidos, mostrar mensagem
    if (!hasValidData) {
      return (
        <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-gray-500">Nenhum dado disponível para exibir</p>
        </div>
      );
    }

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
              innerRadius={innerRadius}
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
