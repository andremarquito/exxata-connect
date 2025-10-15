import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import IndicatorChart from './IndicatorChart';
import { indicatorService } from '@/services/supabaseService';
import { useProjects } from '@/contexts/ProjectsContext';

// Componente do Modal para Adicionar/Editar Indicador
const IndicatorModal = ({ project, indicator, onClose, onSave }) => {
  const [title, setTitle] = useState(indicator?.title || '');
  const [chartType, setChartType] = useState(indicator?.chart_type || 'bar');
  const [labels, setLabels] = useState(indicator?.labels?.join(', ') || '');
  const [datasets, setDatasets] = useState(indicator?.datasets || [{ name: '', values: '', color: '#8884d8' }]);

  const handleDatasetChange = (index, field, value) => {
    const newDatasets = [...datasets];
    newDatasets[index][field] = value;
    setDatasets(newDatasets);
  };

  const addDataset = () => {
    setDatasets([...datasets, { name: '', values: '', color: '#82ca9d' }]);
  };

  const removeDataset = (index) => {
    const newDatasets = datasets.filter((_, i) => i !== index);
    setDatasets(newDatasets);
  };

  const handleSave = async () => {
    const processedData = {
      title,
      chart_type: chartType,
      labels: labels.split(',').map(l => l.trim()),
      datasets: datasets.map(ds => ({
        ...ds,
        values: ds.values.split(',').map(v => parseFloat(v.trim()) || 0)
      })),
      options: {},
    };

    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader>
          <CardTitle>{indicator ? 'Editar Indicador' : 'Adicionar Indicador'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Gráfico</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="w-full p-2 border rounded">
              <option value="bar">Barra</option>
              <option value="bar-horizontal">Barra Horizontal</option>
              <option value="line">Linha</option>
              <option value="pie">Pizza</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rótulos (separados por vírgula)</label>
            <input value={labels} onChange={(e) => setLabels(e.target.value)} className="w-full p-2 border rounded" placeholder="Ex: Jan, Fev, Mar"/>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Conjunto de Dados</h3>
            {datasets.map((ds, index) => (
              <div key={index} className="p-3 border rounded space-y-2 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={ds.name} onChange={(e) => handleDatasetChange(index, 'name', e.target.value)} placeholder="Nome da Série" className="p-2 border rounded" />
                  <input value={ds.values} onChange={(e) => handleDatasetChange(index, 'values', e.target.value)} placeholder="Valores (ex: 10,20,30)" className="p-2 border rounded" />
                  <input type="color" value={ds.color} onChange={(e) => handleDatasetChange(index, 'color', e.target.value)} className="p-1 h-10 w-full border rounded" />
                </div>
                {datasets.length > 1 && (
                  <button onClick={() => removeDataset(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addDataset}>Adicionar Série</Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// Componente Principal da Aba de Indicadores
export default function IndicatorsTab({ project }) {
  const { refreshProjects } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);

  const indicators = project?.project_indicators || [];

  const openModal = (indicator = null) => {
    setEditingIndicator(indicator);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingIndicator(null);
    setIsModalOpen(false);
  };

  const handleSave = async (indicatorData) => {
    try {
      if (editingIndicator) {
        // Atualizar indicador existente
        await indicatorService.updateIndicator(editingIndicator.id, indicatorData);
      } else {
        // Criar novo indicador
        await indicatorService.createIndicator(project.id, indicatorData);
      }
      await refreshProjects(); // Atualiza a lista de projetos e seus dados
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
    }
  };

  const handleDelete = async (indicatorId) => {
    if (window.confirm('Tem certeza que deseja deletar este indicador?')) {
      try {
        await indicatorService.deleteIndicator(indicatorId);
        await refreshProjects();
      } catch (error) {
        console.error('Erro ao deletar indicador:', error);
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Indicadores</h2>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Indicador
        </Button>
      </div>

      {indicators.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum indicador cadastrado para este projeto.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {indicators.map(indicator => (
            <Card key={indicator.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{indicator.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openModal(indicator)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(indicator.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <IndicatorChart indicator={indicator} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <IndicatorModal 
          project={project} 
          indicator={editingIndicator} 
          onClose={closeModal} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}
