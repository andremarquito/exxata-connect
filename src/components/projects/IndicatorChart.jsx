import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        {payload.map((p, index) => (
          <p key={index} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const IndicatorChart = ({ indicator }) => {
  const { chart_type, labels, datasets } = indicator;
  const type = chart_type; // Mantém a variável 'type' para compatibilidade interna do componente

  const data = labels.map((label, index) => {
    const dataEntry = { name: label };
    datasets.forEach(dataset => {
      dataEntry[dataset.name] = dataset.values[index];
    });
    return dataEntry;
  });

      if (type === 'bar-horizontal') {
    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {datasets.map((dataset, index) => (
              <Bar key={index} dataKey={dataset.name} fill={dataset.color || '#8884d8'}>
                <LabelList dataKey={dataset.name} position="right" />
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
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {datasets.map((dataset, index) => (
              <Bar key={index} dataKey={dataset.name} fill={dataset.color || '#8884d8'}>
                <LabelList dataKey={dataset.name} position="top" />
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
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {datasets.map((dataset, index) => (
              <Line key={index} type="monotone" dataKey={dataset.name} stroke={dataset.color || '#8884d8'} activeDot={{ r: 8 }} />
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
    const COLORS = ['#d51d07', '#09182b', '#0ea5e9', '#f59e0b', '#10b981', '#6366f1'];

    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Adicionar outros tipos de gráficos aqui (linha, pizza, etc.)
  return <p>Tipo de gráfico não suportado: {type}</p>;
};

export default IndicatorChart;
