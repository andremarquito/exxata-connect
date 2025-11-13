import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, Clipboard, FileText, Users, Clock, 
  BarChart3, Shield, Brain, AlertCircle 
} from 'lucide-react';

const TABS_INFO = [
  { 
    key: 'overview', 
    title: 'Visão Geral', 
    icon: TrendingUp, 
    description: 'Resumo do projeto com dados principais',
    required: true // Aba obrigatória
  },
  { 
    key: 'onboarding', 
    title: 'Onboarding', 
    icon: Clipboard, 
    description: 'Documentação necessária para o projeto' 
  },
  { 
    key: 'documents', 
    title: 'Documentos', 
    icon: FileText, 
    description: 'Arquivos do cliente e da Exxata' 
  },
  { 
    key: 'team', 
    title: 'Equipe', 
    icon: Users, 
    description: 'Membros e permissões do projeto' 
  },
  { 
    key: 'activities', 
    title: 'Atividades', 
    icon: Clock, 
    description: 'Planejamento e andamento das atividades' 
  },
  { 
    key: 'indicators', 
    title: 'Indicadores', 
    icon: BarChart3, 
    description: 'Gráficos e métricas do projeto' 
  },
  { 
    key: 'panorama', 
    title: 'Panorama Atual', 
    icon: Shield, 
    description: 'Situação técnica, física e econômica' 
  },
  { 
    key: 'ai-insights', 
    title: 'Inteligência Humana', 
    icon: Brain, 
    description: 'Análises e percepções do time' 
  },
];

export default function TabsConfigDialog({ open, onOpenChange, currentConfig, onSave }) {
  const [config, setConfig] = useState(currentConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar config quando o modal abrir ou currentConfig mudar
  useEffect(() => {
    if (open) {
      console.log('📂 Modal aberto, config atual:', currentConfig);
      setConfig(currentConfig);
    }
  }, [open, currentConfig]);

  const handleToggle = (tabKey) => {
    console.log('🔄 Toggling tab:', tabKey, 'Current:', config[tabKey], 'New:', !config[tabKey]);
    setConfig(prev => ({
      ...prev,
      [tabKey]: !prev[tabKey]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração de abas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(currentConfig); // Resetar para configuração original
    onOpenChange(false);
  };

  const visibleCount = Object.values(config).filter(Boolean).length;

  console.log('🎨 Renderizando TabsConfigDialog, config:', config, 'visibleCount:', visibleCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Configurar Abas Visíveis</DialogTitle>
          <DialogDescription>
            Escolha quais abas serão exibidas neste projeto. As alterações afetam todos os usuários do projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          {/* Contador de abas visíveis */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-900">
              <strong>{visibleCount}</strong> de <strong>{TABS_INFO.length}</strong> abas visíveis
            </span>
          </div>

          {/* Lista de abas */}
          {TABS_INFO.map((tab) => {
            const Icon = tab.icon;
            const isEnabled = config[tab.key];
            const isRequired = tab.required;

            return (
              <div
                key={tab.key}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors relative ${
                  isEnabled 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isEnabled 
                      ? 'bg-exxata-red/10' 
                      : 'bg-gray-200'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isEnabled 
                        ? 'text-exxata-red' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${
                        isEnabled ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {tab.title}
                      </h4>
                      {isRequired && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Obrigatória
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isEnabled ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                </div>
                
                <div className="ml-4 flex items-center shrink-0">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => !isRequired && handleToggle(tab.key)}
                    disabled={isRequired || isSaving}
                    className="relative z-10"
                    style={{
                      backgroundColor: isEnabled ? '#d51d07' : '#d1d5db',
                      minWidth: '44px',
                      minHeight: '24px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-exxata-red hover:bg-red-700"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
