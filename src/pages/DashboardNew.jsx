import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, DollarSign, Shield, Brain, Clock, CheckCircle, 
  FileText, User, MessageSquare, ArrowRight, TrendingUp, Users, 
  Target, Zap, Activity, BarChart3, Plus, X, GripVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/contexts/ProjectsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Projetos agora vêm do ProjectsContext

const recentActivities = [
  {
    id: 1,
    icon: FileText,
    title: "Novo documento adicionado",
    description: "'Contrato Aditivo 02.pdf' foi adicionado ao projeto 'Ferroviário Carajás'.",
    time: "2 horas atrás",
  },
  {
    id: 2,
    icon: User,
    title: "Novo membro na equipe",
    description: "Ana Oliveira foi adicionada ao projeto 'Saneamento Básico'.",
    time: "5 horas atrás",
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "Novo comentário",
    description: "Carlos Silva comentou na tarefa 'Revisão de Cláusulas'.",
    time: "Ontem",
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const { projects, userCanSeeProject } = useProjects();

  // Estado para cards personalizáveis
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // Projetos visíveis para o usuário atual
  const visibleProjects = useMemo(
    () => projects.filter((p) => userCanSeeProject(p)),
    [projects, userCanSeeProject]
  );

  // Métricas do topo
  const parseBRL = (val) => {
    if (val === null || val === undefined) return 0;
    // Se já é número (como vem do Supabase para campos NUMERIC), retornar direto
    if (typeof val === 'number' && Number.isFinite(val)) return val;

    let s = String(val).trim();
    // Remover símbolo e espaços
    s = s.replace(/R\$\s?/g, '').replace(/\s/g, '');

    // Caso BR: usa vírgula como decimal
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    }

    // Caso haja apenas pontos mas não representem decimal no final (ex: 15.000.000)
    if (s.includes('.') && !/\.\d{1,2}$/.test(s)) {
      s = s.replace(/\./g, '');
    }

    // Remover possíveis separadores de milhar em estilo EN
    s = s.replace(/,/g, '');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };
  const formatBRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const isActive = (p) => p.status === 'Em Andamento' || p.status === 'Planejamento';
  const activeProjects = useMemo(() => visibleProjects.filter(isActive), [visibleProjects]);
  const activeCount = activeProjects.length;
  const totalValueActive = useMemo(() => activeProjects.reduce((sum, p) => sum + parseBRL(p.contractValue), 0), [activeProjects]);
  
  // Cálculos para novos cards
  const totalValueDiscussion = useMemo(() => activeProjects.reduce((sum, p) => sum + Number(p.disputedAmount || 0), 0), [activeProjects]);
  const avgManHour = useMemo(() => {
    const validProjects = activeProjects.filter(p => p.hourlyRate && !isNaN(Number(p.hourlyRate)) && Number(p.hourlyRate) > 0);
    if (validProjects.length === 0) return 0;
    const total = validProjects.reduce((sum, p) => sum + Number(p.hourlyRate), 0);
    return total / validProjects.length;
  }, [activeProjects]);

  // Destaque do projeto (persistido por usuário)
  const [featuredId, setFeaturedId] = useState(null);
  useEffect(() => {
    const key = `exxata_featured_${user?.id ?? 'anon'}`;
    const saved = localStorage.getItem(key);
    if (saved && visibleProjects.length > 0) {
      // Tentar encontrar o projeto salvo (pode ser string UUID ou número)
      const foundProject = visibleProjects.find((p) => String(p.id) === saved);
      if (foundProject) {
        setFeaturedId(foundProject.id);
        return;
      }
    }
    setFeaturedId(visibleProjects[0]?.id ?? null);
  }, [user?.id, visibleProjects]);

  const featured = useMemo(
    () => visibleProjects.find((p) => p.id === featuredId) || visibleProjects[0] || null,
    [visibleProjects, featuredId]
  );

  const handleFeaturedChange = (value) => {
    // value vem como string do Select
    // Encontrar o projeto correspondente para pegar o ID no formato correto
    const selectedProject = visibleProjects.find((p) => String(p.id) === value);
    if (selectedProject) {
      setFeaturedId(selectedProject.id);
      const key = `exxata_featured_${user?.id ?? 'anon'}`;
      localStorage.setItem(key, String(selectedProject.id));
    }
  };

  const openNewProject = () => {
    window.dispatchEvent(new Event('open-new-project-modal'));
  };

  // Verificar se o usuário tem permissão para criar projetos
  const userRole = (user?.role || '').toLowerCase();
  const isClient = (userRole === 'client' || userRole === 'cliente');
  const isCollaborator = (userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant');
  const canCreateProject = !isClient && !isCollaborator;

  // Definição dos tipos de cards disponíveis
  const availableCardTypes = {
    activeProjects: {
      id: 'activeProjects',
      title: 'Projetos Ativos',
      description: 'Em desenvolvimento',
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-exxata',
      badge: 'Visíveis',
      badgeVariant: 'secondary',
      value: activeCount,
      format: 'number'
    },
    totalValue: {
      id: 'totalValue',
      title: 'Valor Total',
      description: 'Contratos ativos',
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      badge: 'Soma',
      badgeVariant: 'secondary',
      value: totalValueActive,
      format: 'currency'
    },
    discussionValue: {
      id: 'discussionValue',
      title: 'Valor em Discussão',
      description: 'Contratos em negociação',
      icon: TrendingUp,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      badge: 'Negociação',
      badgeVariant: 'secondary',
      value: totalValueDiscussion,
      format: 'currency'
    },
    avgManHour: {
      id: 'avgManHour',
      title: 'Média Homem Hora',
      description: 'Contratos ativos',
      icon: Clock,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'Média',
      badgeVariant: 'secondary',
      value: avgManHour,
      format: 'decimal'
    }
  };

  // Cards selecionados pelo usuário (persistidos no localStorage)
  const [selectedCards, setSelectedCards] = useState([]);
  
  useEffect(() => {
    const key = `exxata_dashboard_cards_${user?.id ?? 'anon'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedCards(parsed);
          return;
        }
      } catch {}
    }
    // Cards padrão
    setSelectedCards(['activeProjects', 'totalValue']);
  }, [user?.id]);

  const saveSelectedCards = (cards) => {
    setSelectedCards(cards);
    const key = `exxata_dashboard_cards_${user?.id ?? 'anon'}`;
    localStorage.setItem(key, JSON.stringify(cards));
  };

  // Funções de drag and drop para cards
  const onDragStartCard = (e, cardId) => {
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverCard = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropCard = (e, targetCardId) => {
    e.preventDefault();
    if (draggingCardId && draggingCardId !== targetCardId) {
      const newCards = [...selectedCards];
      const fromIndex = newCards.indexOf(draggingCardId);
      const toIndex = newCards.indexOf(targetCardId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        newCards.splice(fromIndex, 1);
        newCards.splice(toIndex, 0, draggingCardId);
        saveSelectedCards(newCards);
      }
    }
    setDraggingCardId(null);
    setDragOverCardId(null);
  };

  const addCard = (cardType) => {
    if (!selectedCards.includes(cardType)) {
      saveSelectedCards([...selectedCards, cardType]);
    }
    setShowAddCardModal(false);
  };

  const removeCard = (cardType) => {
    saveSelectedCards(selectedCards.filter(id => id !== cardType));
  };

  const formatCardValue = (value, format) => {
    switch (format) {
      case 'currency':
        return formatBRLCompact(value);
      case 'decimal':
        return value > 0 ? `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'US$ 0.00';
      case 'number':
      default:
        return value.toString();
    }
  };

  // Função para formatar valores grandes de forma compacta
  const formatBRLCompact = (value) => {
    if (value === 0) return 'R$ 0,00';
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000000) {
      // Bilhões
      const billions = (absValue / 1000000000).toFixed(1).replace('.', ',');
      return `${sign}R$ ${billions}B`;
    } else if (absValue >= 1000000) {
      // Milhões
      const millions = (absValue / 1000000).toFixed(1).replace('.', ',');
      return `${sign}R$ ${millions}M`;
    } else if (absValue >= 1000) {
      // Milhares
      const thousands = (absValue / 1000).toFixed(1).replace('.', ',');
      return `${sign}R$ ${thousands}K`;
    } else {
      // Valores menores que 1000
      return `${sign}R$ ${absValue.toFixed(2).replace('.', ',')}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-exxata to-slate-800 text-white py-16 px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Exxata <span className="text-exxata-red">Control</span>
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-slate-200">
              Gestão Inteligente de Projetos da Exxata
            </p>
            <p className="text-lg text-slate-300">
              Aplicando <strong>Inteligência Humana</strong> para prever, apoiar e resolver as incertezas do seu contrato.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-8 pb-8">
        {/* Métricas principais - Cards Personalizáveis */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {selectedCards.map((cardId) => {
            const cardData = availableCardTypes[cardId];
            if (!cardData) return null;
            
            const IconComponent = cardData.icon;
            
            return (
              <Card 
                key={cardId}
                className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group ${draggingCardId === cardId ? 'opacity-50' : ''} ${dragOverCardId === cardId ? 'ring-2 ring-blue-500' : ''}`}
                draggable
                onDragStart={(e) => onDragStartCard(e, cardId)}
                onDragOver={onDragOverCard}
                onDrop={(e) => onDropCard(e, cardId)}
                onDragEnter={() => setDragOverCardId(cardId)}
                onDragLeave={() => setDragOverCardId(null)}
              >
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${cardData.iconBg} rounded-xl`}>
                      <IconComponent className={`h-6 w-6 ${cardData.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cardData.badgeVariant} className="text-xs">{cardData.badge}</Badge>
                      <button
                        onClick={() => removeCard(cardId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        title="Remover card"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">{cardData.title}</p>
                    <p className="text-3xl font-bold text-blue-exxata" title={cardData.format === 'currency' ? formatBRL(cardData.value) : formatCardValue(cardData.value, cardData.format)}>{formatCardValue(cardData.value, cardData.format)}</p>
                    <p className="text-xs text-slate-500">{cardData.description}</p>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-slate-400 cursor-move" title="Arrastar para reordenar" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Botão para adicionar card */}
          <Card 
            className="bg-white/30 backdrop-blur-sm border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-lg cursor-pointer group h-auto"
            onClick={() => setShowAddCardModal(true)}
          >
            <CardContent className="p-3 flex items-center justify-center">
              <div className="text-center">
                <div className="p-1.5 bg-slate-50 group-hover:bg-slate-100 rounded-md mb-1 mx-auto w-fit transition-colors">
                  <Plus className="h-3 w-3 text-slate-400 group-hover:text-slate-500 transition-colors" />
                </div>
                <p className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors">Adicionar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal para adicionar cards */}
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-exxata">Adicionar Card</h3>
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-3">
                {Object.values(availableCardTypes)
                  .filter(card => !selectedCards.includes(card.id))
                  .map((card) => {
                    const IconComponent = card.icon;
                    return (
                      <button
                        key={card.id}
                        onClick={() => addCard(card.id)}
                        className="w-full p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${card.iconBg} rounded-lg`}>
                            <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{card.title}</p>
                            <p className="text-sm text-slate-500">{card.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                {Object.values(availableCardTypes).filter(card => !selectedCards.includes(card.id)).length === 0 && (
                  <p className="text-center text-slate-500 py-4">Todos os cards já foram adicionados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seção Principal - Projetos */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Projetos de Consultoria */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl font-bold text-blue-exxata mb-2">Projetos de Consultoria</CardTitle>
                  <CardDescription className="text-slate-600">
                    Destaque o progresso do projeto com a metodologia Exxata de Inteligência Humana
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {visibleProjects.length > 0 && (
                    <Select value={String(featured?.id ?? '')} onValueChange={handleFeaturedChange}>
                      <SelectTrigger className="w-[260px]">
                        <SelectValue placeholder="Selecionar projeto em destaque" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleProjects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {canCreateProject && (
                    <Button 
                      onClick={openNewProject} 
                      className="rounded-xl px-6 bg-exxata-red hover:bg-red-700 text-white"
                      title="Criar novo projeto"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Novo Projeto
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              {/* Projeto Principal Dinâmico */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 rounded-xl border border-slate-200">
                {featured ? (
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-exxata mb-1">
                        {featured.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3">{featured.client || '—'}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {featured.location || '—'}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {featured.contractValue || '—'}
                        </span>
                        {Array.isArray(featured.exxataActivities) && featured.exxataActivities.length > 0 ? (
                          <Badge className="bg-blue-100 text-blue-800 border-0">
                            {featured.exxataActivities[0]}
                            {featured.exxataActivities.length > 1 ? ` +${featured.exxataActivities.length - 1}` : ''}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-0">Sem serviço definido</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      {/* Avanço de Prazo */}
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">Avanço de Prazo</div>
                          <div className="text-xl font-bold text-blue-exxata">{featured.progress ?? 0}%</div>
                        </div>
                        <Clock className="h-5 w-5 text-slate-400" />
                      </div>
                      
                      {/* Avanço de Faturamento */}
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">Avanço de Faturamento</div>
                          <div className="text-xl font-bold text-green-600">{featured.billingProgress ?? 0}%</div>
                        </div>
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <Link to={`/projects/${featured.id}`} className="text-sm text-blue-exxata hover:underline inline-flex items-center">
                          Abrir Projeto
                          <span className="sr-only">Abrir</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-exxata mb-1">Nenhum projeto disponível</h3>
                      <p className="text-sm text-slate-600">
                        {canCreateProject 
                          ? 'Crie seu primeiro projeto para começar a gerenciar com a metodologia Exxata.'
                          : 'Aguarde a adição a um projeto pela equipe administrativa.'}
                      </p>
                    </div>
                    {canCreateProject && (
                      <Button 
                        onClick={openNewProject} 
                        className="rounded-xl px-6 bg-exxata-red hover:bg-red-700 text-white"
                        title="Criar novo projeto"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Criar Projeto
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Executivo */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-exxata flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {visibleProjects.length > 0 && featured ? (
                /* Análise Preditiva do Projeto */
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Análise Preditiva</span>
                  </div>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">
                    {featured?.aiPredictiveText || 'Com base na experiência Exxata, o projeto tem 85% de probabilidade de ser concluído dentro do prazo, com redução de 40% no risco de pleitos contratuais em obras de infraestrutura.'}
                  </p>
                </div>
              ) : (
                /* Mensagem quando não há projetos */
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Brain className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium mb-2">
                    Inteligência Humana Exxata
                  </p>
                  <p className="text-sm text-slate-500">
                    Inclua um projeto para ver as condutas sugeridas pela Exxata.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
