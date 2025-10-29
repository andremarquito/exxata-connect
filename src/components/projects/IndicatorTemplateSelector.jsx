import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BarChart3, PieChart, LineChart, TrendingUp, Users, DollarSign, Clock, X, Check } from 'lucide-react';

// Metadados dos modelos disponíveis
const TEMPLATE_METADATA = {
  'g1_prazo_decorrido.xlsx': {
    name: 'Prazo Decorrido',
    description: 'Gráfico de rosca mostrando percentual de prazo decorrido vs restante',
    type: 'doughnut',
    category: 'Prazo',
    icon: Clock,
    color: 'blue'
  },
  'g2_comparativo_faturamento_acumulado.xlsx': {
    name: 'Faturamento Acumulado',
    description: 'Comparativo entre valor do contrato, contratado, medido e saldo',
    type: 'bar',
    category: 'Faturamento',
    icon: DollarSign,
    color: 'green'
  },
  'g3_alocacao_recursos.xlsx': {
    name: 'Alocação de Recursos',
    description: 'Distribuição de recursos alocados no projeto',
    type: 'bar',
    category: 'Recursos',
    icon: Users,
    color: 'purple'
  },
  'g4_comparativo_faturamento_mes_combo.xlsx': {
    name: 'Faturamento Mensal (Combo)',
    description: 'Comparativo mensal de faturamento com barras e linhas',
    type: 'combo',
    category: 'Faturamento',
    icon: TrendingUp,
    color: 'green'
  },
  'g5_comparativo_mod_mes_combo.xlsx': {
    name: 'MOD Mensal (Combo)',
    description: 'Comparativo mensal de Mão de Obra Direta',
    type: 'combo',
    category: 'MOD',
    icon: TrendingUp,
    color: 'orange'
  },
  'g6_comparativo_mod_relevantes.xlsx': {
    name: 'MOD - Itens Relevantes',
    description: 'Comparativo dos itens mais relevantes de MOD',
    type: 'bar',
    category: 'MOD',
    icon: BarChart3,
    color: 'orange'
  },
  'g7_comparativo_fat_mod.xlsx': {
    name: 'Alocação Estimada de MOD',
    description: 'Comparativo entre faturamento e contratado de mão de obra direta',
    type: 'bar',
    category: 'Comparativo',
    icon: BarChart3,
    color: 'blue'
  },
  'g8_comparativo_moi_mes_combo.xlsx': {
    name: 'MOI Mensal (Combo)',
    description: 'Comparativo mensal de Mão de Obra Indireta',
    type: 'combo',
    category: 'MOI',
    icon: TrendingUp,
    color: 'red'
  },
  'g9_comparativo_moi_relevantes.xlsx': {
    name: 'MOI - Itens Relevantes',
    description: 'Comparativo dos itens mais relevantes de MOI',
    type: 'bar',
    category: 'MOI',
    icon: BarChart3,
    color: 'red'
  },
  'g10_comparativo_fat_moi.xlsx': {
    name: 'Alocação Estimada de MOI',
    description: 'Comparativo entre faturamento e contratado de mão de obra indireta',
    type: 'bar',
    category: 'Comparativo',
    icon: BarChart3,
    color: 'blue'
  },
  'g11_comparativo_fat_eqp.xlsx': {
    name: 'Alocação Estimada de EQP',
    description: 'Comparativo entre faturamento e contratado de equipamentos',
    type: 'bar',
    category: 'Comparativo',
    icon: BarChart3,
    color: 'blue'
  },
  'g12_comparativo_eqp_mes_combo.xlsx': {
    name: 'Equipamentos Mensal (Combo)',
    description: 'Comparativo mensal de custos com equipamentos',
    type: 'combo',
    category: 'Equipamentos',
    icon: TrendingUp,
    color: 'indigo'
  },
  'g13_comparativo_eqp_relevantes.xlsx': {
    name: 'Equipamentos - Itens Relevantes',
    description: 'Comparativo dos equipamentos mais relevantes',
    type: 'bar',
    category: 'Equipamentos',
    icon: BarChart3,
    color: 'indigo'
  },
  'g14_comparativo_hh.xlsx': {
    name: 'Homem-Hora',
    description: 'Comparativo de horas trabalhadas',
    type: 'bar',
    category: 'Recursos',
    icon: Clock,
    color: 'purple'
  }
};

const CATEGORIES = ['Todos', 'Faturamento', 'MOD', 'MOI', 'Equipamentos', 'Recursos', 'Prazo', 'Comparativo'];

const IndicatorTemplateSelector = ({ onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = Object.entries(TEMPLATE_METADATA);
  
  const filteredTemplates = selectedCategory === 'Todos' 
    ? templates 
    : templates.filter(([_, meta]) => meta.category === selectedCategory);

  const handleSelectTemplate = (filename) => {
    setSelectedTemplate(filename);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Faturamento': 'bg-green-100 text-green-700 border-green-200',
      'MOD': 'bg-orange-100 text-orange-700 border-orange-200',
      'MOI': 'bg-red-100 text-red-700 border-red-200',
      'Equipamentos': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Recursos': 'bg-purple-100 text-purple-700 border-purple-200',
      'Prazo': 'bg-blue-100 text-blue-700 border-blue-200',
      'Comparativo': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'bar': BarChart3,
      'line': LineChart,
      'pie': PieChart,
      'doughnut': PieChart,
      'combo': TrendingUp
    };
    return icons[type] || FileText;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Selecionar Modelo de Indicador</h2>
            <p className="text-sm text-slate-600 mt-1">Escolha um modelo pré-configurado para começar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(([filename, meta]) => {
              const Icon = meta.icon;
              const TypeIcon = getTypeIcon(meta.type);
              const isSelected = selectedTemplate === filename;

              return (
                <Card
                  key={filename}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 shadow-lg' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectTemplate(filename)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isSelected ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </div>
                      {isSelected && (
                        <div className="bg-blue-600 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base mt-3">{meta.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {meta.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(meta.category)}>
                        {meta.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <TypeIcon className="h-3 w-3" />
                        <span className="capitalize">{meta.type}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum modelo encontrado nesta categoria</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {selectedTemplate ? (
              <span className="font-medium text-slate-900">
                Modelo selecionado: {TEMPLATE_METADATA[selectedTemplate]?.name}
              </span>
            ) : (
              <span>Selecione um modelo para continuar</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedTemplate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Usar Modelo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorTemplateSelector;
