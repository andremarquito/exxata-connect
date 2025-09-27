import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, CalendarDays, Users, FileText, MapPin, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/contexts/UsersContext';

export function NewProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [sector, setSector] = useState('');
  const [exxataActivities, setExxataActivities] = useState([]);
  // Novos campos para cards personalizáveis
  const [hourlyRate, setHourlyRate] = useState('');
  const [disputedAmount, setDisputedAmount] = useState('');
  const [contractSummary, setContractSummary] = useState('');
  const [billingProgress, setBillingProgress] = useState('');
  const { users } = useUsers();

  const filteredUsers = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    const base = Array.isArray(users) ? users : [];
    if (!q) return base;
    return base.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [teamSearch, users]);

  const addToTeam = (user) => {
    if (!selectedTeam.find(u => u.id === user.id)) {
      setSelectedTeam([...selectedTeam, user]);
    }
    setTeamSearch('');
  };

  const removeFromTeam = (id) => {
    setSelectedTeam(selectedTeam.filter(u => u.id !== id));
  };

  const formatCurrency = (value) => {
    try {
      const numeric = value.replace(/[^0-9]/g, '');
      const number = Number(numeric) / 100;
      return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch {
      return value;
    }
  };

  const handleContractValueChange = (e) => {
    const v = e.target.value;
    // Permite digitar livremente; formata ao sair do campo (onBlur)
    setContractValue(v);
  };

  const handleContractValueBlur = () => {
    if (!contractValue) return;
    const formatted = formatCurrency(contractValue);
    setContractValue(formatted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      contractValue,
      client,
      startDate,
      endDate,
      description,
      location,
      sector,
      exxataActivities,
      team: selectedTeam.map(u => ({ id: u.id, name: u.name, email: u.email })),
      // Novos campos
      hourlyRate,
      disputedAmount,
      contractSummary,
      billingProgress: Number(billingProgress) || 0,
    };
    if (onCreate) onCreate(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Novo Projeto</CardTitle>
              <CardDescription>Cadastre um novo projeto para gestão no Exxata Connect.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="space-y-6 py-4 px-6 overflow-y-auto flex-1">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do Projeto</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Ex.: Otimização Contratual - Linha Férrea" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="contractValue" placeholder="R$ 0,00" className="pl-10" value={contractValue} onChange={handleContractValueChange} onBlur={handleContractValueBlur} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente Final</Label>
                <Input id="client" placeholder="Ex.: VALE S.A." value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Início do Contrato</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fim do Contrato</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição do Projeto</Label>
                <div className="relative">
                  <textarea id="description" placeholder="Descreva brevemente o escopo e os objetivos do projeto" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-[100px] border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Localização</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="location" placeholder="Ex.: Parauapebas, PA" className="pl-10" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              {/* Setor de Atuação (seleção única) */}
              <div className="space-y-2">
                <Label>Setor de Atuação</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="Aeroportos">Aeroportos</SelectItem>
                    <SelectItem value="Condomínios, Edifícios Residenciais e Comerciais">Condomínios, Edifícios Residenciais e Comerciais</SelectItem>
                    <SelectItem value="Energia">Energia</SelectItem>
                    <SelectItem value="Ferrovias">Ferrovias</SelectItem>
                    <SelectItem value="Hospitais">Hospitais</SelectItem>
                    <SelectItem value="Hotéis">Hotéis</SelectItem>
                    <SelectItem value="Indústrias">Indústrias</SelectItem>
                    <SelectItem value="Instalações Petrolíferas e Petroquímicas">Instalações Petrolíferas e Petroquímicas</SelectItem>
                    <SelectItem value="Linhas de Transmissão">Linhas de Transmissão</SelectItem>
                    <SelectItem value="Metrôs">Metrôs</SelectItem>
                    <SelectItem value="Movimentações de Terra">Movimentações de Terra</SelectItem>
                    <SelectItem value="Oleodutos e Gasodutos">Oleodutos e Gasodutos</SelectItem>
                    <SelectItem value="Pontes e Viadutos">Pontes e Viadutos</SelectItem>
                    <SelectItem value="Portos">Portos</SelectItem>
                    <SelectItem value="Rodovias">Rodovias</SelectItem>
                    <SelectItem value="Saneamento">Saneamento</SelectItem>
                    <SelectItem value="Shopping Centers">Shopping Centers</SelectItem>
                    <SelectItem value="Túneis">Túneis</SelectItem>
                    <SelectItem value="Usinas Hidrelétricas Barragens">Usinas Hidrelétricas Barragens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Atuação Exxata (seleção múltipla) */}
              <div className="space-y-2 md:col-span-2">
                <Label>Atuação Exxata</Label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    'Administração Contratual Backoffice',
                    'Administração Contratual In Loco',
                    'Agente de Confiança',
                    'Assistência Técnica em Arbitragem',
                    'Assistência Técnica em Justiça',
                    'Negociações, Conciliações e Mediações',
                    'Apoio em Licitações e Concorrências',
                    'Laudos e Pareceres Técnicos',
                    'Optikon Exxata',
                  ].map((opt) => {
                    const selected = exxataActivities.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          setExxataActivities((prev) =>
                            prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
                          );
                        }}
                        className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                          selected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {exxataActivities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exxataActivities.map((act) => (
                      <span key={act} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-xs">
                        {act}
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-700"
                          onClick={() => setExxataActivities((prev) => prev.filter((o) => o !== act))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Equipe do Projeto */}
            <div className="space-y-2">
              <Label>Equipe do Projeto</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário pelo nome ou e-mail" className="pl-10" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} />
              </div>
              {filteredUsers.length > 0 && (
                <div className="border border-slate-200 rounded-md divide-y max-h-40 overflow-auto">
                  {filteredUsers.map(u => (
                    <button type="button" key={u.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between" onClick={() => addToTeam(u)}>
                      <span className="text-sm">{u.name} <span className="text-slate-400">• {u.email}</span></span>
                      <span className="text-xs text-exxata-red">Adicionar</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedTeam.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedTeam.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-xs">
                      {u.name}
                      <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => removeFromTeam(u.id)}>×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Novos campos para dashboard personalizado */}
              <div className="space-y-4 md:col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700">Campos Adicionais</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Valor do Homem-Hora</Label>
                    <Input 
                      id="hourlyRate" 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex.: 150.00" 
                      value={hourlyRate} 
                      onChange={(e) => setHourlyRate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disputedAmount">Valor em Discussão</Label>
                    <Input 
                      id="disputedAmount" 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex.: 50000.00" 
                      value={disputedAmount} 
                      onChange={(e) => setDisputedAmount(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractSummary">Título do Contrato</Label>
                    <Input 
                      id="contractSummary" 
                      placeholder="Ex.: CT - 684N" 
                      value={contractSummary} 
                      onChange={(e) => setContractSummary(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingProgress">Progresso em Faturamento (%)</Label>
                    <Input 
                      id="billingProgress" 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0" 
                      value={billingProgress} 
                      onChange={(e) => setBillingProgress(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Criar Projeto</Button>
            </div>
          </div>
        </form>
      </Card>
      <style>{`
        /* Custom scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}

export default NewProjectModal;
