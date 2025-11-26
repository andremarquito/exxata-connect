import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, User, Shield, MoreVertical, Trash2, Pencil, Download, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client', label: 'Cliente' },
];

const roleLabelMap = {
  admin: 'Admin',
  administrador: 'Admin',
  manager: 'Gerente',
  gerente: 'Gerente',
  collaborator: 'Colaborador',
  colaborador: 'Colaborador',
  client: 'Cliente',
  cliente: 'Cliente',
};

const roleLabel = (r) => roleLabelMap[r] || r;

export function Team() {
  const { user } = useAuth();
  const { users, isLoading, addUser, updateUser, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmpresa, setSearchEmpresa] = useState('');
  const [searchCargo, setSearchCargo] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkRole, setBulkRole] = useState('');

  // Verificar permissões do usuário
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const canManageTeam = user?.permissions?.includes('manage_team');
  const canExportData = isAdmin || isManager; // Apenas Admin e Gerente podem exportar
  
  // Função de ordenação
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para obter valor de ordenação
  const getSortValue = (member, key) => {
    switch(key) {
      case 'name':
        return member.name?.toLowerCase() || '';
      case 'empresa':
        return member.empresa?.toLowerCase() || '';
      case 'cargo':
        return member.cargo?.toLowerCase() || '';
      case 'role':
        return roleLabel(member.role)?.toLowerCase() || '';
      case 'status':
        return member.status?.toLowerCase() || '';
      case 'lastActive':
        return member.lastActive ? new Date(member.lastActive).getTime() : 0;
      default:
        return '';
    }
  };

  // Mapeamento de roles (inglês -> português e vice-versa)
  const roleMapping = {
    'admin': ['admin', 'administrador'],
    'manager': ['manager', 'gerente'],
    'collaborator': ['collaborator', 'colaborador'],
    'client': ['client', 'cliente'],
  };

  // Filtrar e ordenar membros
  const filteredMembers = (users || [])
    .filter(member => {
      const matchesName = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmpresa = !searchEmpresa || 
                             (member.empresa && member.empresa.toLowerCase().includes(searchEmpresa.toLowerCase()));
      const matchesCargo = !searchCargo || 
                           (member.cargo && member.cargo.toLowerCase().includes(searchCargo.toLowerCase()));
      
      // Verificar se o role do membro corresponde ao filtro (aceita PT e EN)
      const matchesRole = !filterRole || filterRole === 'all' || 
                          (roleMapping[filterRole] && roleMapping[filterRole].includes(member.role?.toLowerCase()));
      
      return matchesName && matchesEmpresa && matchesCargo && matchesRole;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Funções de seleção
  const toggleSelectMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  // Ação em massa - Alterar função
  const handleBulkRoleChange = () => {
    if (!bulkRole || selectedMembers.length === 0) {
      toast.error('Selecione uma função e pelo menos um membro.');
      return;
    }
    setShowBulkModal(true);
  };

  const confirmBulkRoleChange = async () => {
    if (bulkConfirmText.toLowerCase() !== 'exxata') {
      toast.error('Digite "exxata" para confirmar a ação.');
      return;
    }

    try {
      // Atualizar cada membro selecionado
      const updatePromises = selectedMembers.map(memberId => 
        updateUser(memberId, { role: bulkRole })
      );
      
      await Promise.all(updatePromises);
      
      toast.success(`Função de ${selectedMembers.length} membro(s) atualizada com sucesso!`);
      setSelectedMembers([]);
      setShowBulkActions(false);
      setBulkRole('');
      setShowBulkModal(false);
      setBulkConfirmText('');
    } catch (error) {
      console.error('Erro ao atualizar membros:', error);
      toast.error('Erro ao atualizar membros. Tente novamente.');
    }
  };

  // Componente de cabeçalho de coluna com ordenação
  const SortableHeader = ({ label, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = sortConfig.direction;

    return (
      <TableHead 
        className="cursor-pointer select-none hover:bg-gray-50"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {isSorted ? (
            direction === 'asc' ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-30" />
          )}
        </div>
      </TableHead>
    );
  };

  // Função para exportar dados da equipe para Excel
  const exportTeamData = () => {
    if (!canExportData) {
      toast.error('Você não possui permissão para exportar dados.');
      return;
    }

    try {
      const exportData = [];

      // Cabeçalho com informações da exportação
      exportData.push(['DADOS DA EQUIPE EXXATA CONTROL', '']);
      exportData.push(['Data de Exportação', new Date().toLocaleDateString('pt-BR')]);
      exportData.push(['Hora de Exportação', new Date().toLocaleTimeString('pt-BR')]);
      exportData.push(['Exportado por', user?.name || user?.email || 'Usuário']);
      exportData.push(['Total de Membros', users.length]);
      exportData.push(['']); // Linha em branco

      // Cabeçalhos das colunas
      exportData.push([
        'ID',
        'Nome',
        'E-mail',
        'Empresa',
        'Cargo',
        'Telefone',
        'Função',
        'Status',
        'Data de Convite',
        'Convidado por',
        'Último Acesso',
        'Senha Padrão',
        'Último Reset',
        'Reset por'
      ]);

      // Dados dos usuários
      users.forEach(member => {
        const invitedAt = member.invitedAt 
          ? new Date(member.invitedAt).toLocaleDateString('pt-BR')
          : 'N/A';
        
        const lastActive = member.lastActive 
          ? new Date(member.lastActive).toLocaleDateString('pt-BR') + ' ' + 
            new Date(member.lastActive).toLocaleTimeString('pt-BR')
          : 'Nunca';

        const hasDefaultPassword = member.password === 'exxata123' || member.status === 'Pendente';
        
        const passwordResetAt = member.passwordResetAt 
          ? new Date(member.passwordResetAt).toLocaleDateString('pt-BR')
          : 'Nunca';

        exportData.push([
          member.id || 'N/A',
          member.name || 'N/A',
          member.email || 'N/A',
          member.empresa || 'N/A',
          member.cargo || 'N/A',
          member.phone || 'N/A',
          roleLabel(member.role) || 'N/A',
          member.status || 'N/A',
          invitedAt,
          member.invitedBy || 'Sistema',
          lastActive,
          hasDefaultPassword ? 'Sim (exxata123)' : 'Personalizada',
          passwordResetAt,
          member.passwordResetBy || 'N/A'
        ]);
      });

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Definir larguras das colunas
      ws['!cols'] = [
        { wch: 8 },  // ID
        { wch: 20 }, // Nome
        { wch: 25 }, // E-mail
        { wch: 20 }, // Empresa
        { wch: 18 }, // Cargo
        { wch: 15 }, // Telefone
        { wch: 15 }, // Função
        { wch: 12 }, // Status
        { wch: 15 }, // Data de Convite
        { wch: 15 }, // Convidado por
        { wch: 20 }, // Último Acesso
        { wch: 18 }, // Senha Padrão
        { wch: 15 }, // Último Reset
        { wch: 15 }  // Reset por
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Equipe');

      // Gerar nome do arquivo
      const fileName = `Equipe_Exxata_Control_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Fazer download do arquivo
      XLSX.writeFile(wb, fileName);

      toast.success('Dados da equipe exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleDeleteMember = (memberId) => {
    if (!canManageTeam) return;
    const member = users.find(u => u.id === memberId);
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDeleteMember = async () => {
    if (deleteConfirmText.toLowerCase() !== 'exxata') {
      toast.error('Digite "exxata" para confirmar a exclusão.');
      return;
    }

    try {
      await deleteUser(memberToDelete.id);
      toast.success('Membro removido com sucesso.');
      setShowDeleteModal(false);
      setMemberToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      toast.error(`Erro ao excluir membro: ${error.message}`);
    }
  };

  // Função para resetar senha do usuário (apenas Admin)
  const handleResetPassword = (member) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem resetar senhas.');
      return;
    }

    // Verificar se não é o próprio usuário logado
    if (member.id === user.id) {
      toast.error('Você não pode resetar sua própria senha.');
      return;
    }

    const confirmMessage = `⚠️ AÇÃO IRREVERSÍVEL ⚠️\n\nVocê está prestes a resetar a senha de:\n• Nome: ${member.name}\n• E-mail: ${member.email}\n\nA senha será alterada para: "exxata123"\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza que deseja continuar?`;
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    try {
      // Atualizar usuário com senha padrão
      updateUser(member.id, {
        password: 'exxata123',
        status: 'Pendente', // Forçar novo primeiro login
        passwordResetAt: new Date().toISOString(),
        passwordResetBy: user?.name || user?.email || 'Admin'
      });

      toast.success(`Senha de ${member.name} foi resetada para "exxata123". O usuário precisará fazer login novamente.`);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho da página com melhor espaçamento e contraste */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Equipe
            </h2>
            <p className="text-gray-600 text-lg">
              {isAdmin ? 'Visualize e gerencie todos os usuários cadastrados no sistema' : 'Gerencie os membros da equipe e suas permissões'}
            </p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Total de usuários: {users?.length || 0}</span>
              </div>
            </div>
          </div>
        <div className="flex gap-2">
          {canExportData && (
            <Button
              variant="outline"
              onClick={exportTeamData}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Barra de ações em massa */}
            {selectedMembers.length > 0 && canManageTeam && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">
                      {selectedMembers.length} selecionado(s)
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMembers([])}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Limpar seleção
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={bulkRole} onValueChange={setBulkRole}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Selecionar função..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkRoleChange}
                      disabled={!bulkRole}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Alterar Função
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Barra de busca */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full sm:w-64 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por empresa..."
                  className="w-full sm:w-64 pl-8"
                  value={searchEmpresa}
                  onChange={(e) => setSearchEmpresa(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por cargo..."
                  className="w-full sm:w-64 pl-8"
                  value={searchCargo}
                  onChange={(e) => setSearchCargo(e.target.value)}
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por função..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canManageTeam && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <SortableHeader label="Membro" sortKey="name" />
                <SortableHeader label="Empresa" sortKey="empresa" />
                <SortableHeader label="Cargo" sortKey="cargo" />
                <SortableHeader label="Função" sortKey="role" />
                <SortableHeader label="Status" sortKey="status" />
                <SortableHeader label="Último acesso" sortKey="lastActive" />
                {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 8 : 7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="text-muted-foreground">Carregando usuários...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 8 : 7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? 'Nenhum usuário encontrado com esse termo' : 'Nenhum usuário cadastrado'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                <TableRow key={member.id} className={selectedMembers.includes(member.id) ? 'bg-blue-50' : ''}>
                  {canManageTeam && (
                    <TableCell>
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleSelectMember(member.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {isAdmin && (
                          <p className="text-xs text-blue-600">ID: {member.id}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.empresa || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.cargo || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                      {roleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        member.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      {member.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.lastActive 
                      ? new Date(member.lastActive).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) + ' ' + 
                        new Date(member.lastActive).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Nunca'}
                  </TableCell>
                  {canManageTeam && (
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        {isAdmin && member.id !== user.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleResetPassword(member)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Resetar senha para 'exxata123'"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Resetar Senha</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Membro</CardTitle>
              <CardDescription>
                Atualize as informações do membro da equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingMember.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={editingMember.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={editingMember.role} onValueChange={(v) => setEditingMember({ ...editingMember, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editingMember.status === 'Ativo' ? 'active' : 'inactive'}
                  onValueChange={(v) => setEditingMember({ ...editingMember, status: v === 'active' ? 'Ativo' : 'Inativo' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardContent className="flex justify-end space-x-3 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingMember(null)}
              >
                Cancelar
              </Button>
              <Button onClick={async () => {
                if (!editingMember) return;
                try {
                  await updateUser(editingMember.id, { role: editingMember.role, status: editingMember.status });
                  toast.success('Membro atualizado com sucesso.');
                  setEditingMember(null);
                } catch (error) {
                  console.error('Erro ao atualizar membro:', error);
                  toast.error(`Erro ao atualizar membro: ${error.message}`);
                }
              }}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Confirmar Exclusão</CardTitle>
              <CardDescription>
                Esta ação é irreversível e excluirá permanentemente o usuário do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900">Você está prestes a excluir:</p>
                <p className="text-sm text-red-700 mt-1">• Nome: <strong>{memberToDelete.name}</strong></p>
                <p className="text-sm text-red-700">• E-mail: <strong>{memberToDelete.email}</strong></p>
              </div>
              <div className="space-y-2">
                <Label>Digite <strong>"exxata"</strong> para confirmar:</Label>
                <Input
                  type="text"
                  placeholder="Digite exxata"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="border-red-300 focus:border-red-500"
                />
              </div>
            </CardContent>
            <CardContent className="flex justify-end space-x-3 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                  setDeleteConfirmText('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDeleteMember}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteConfirmText.toLowerCase() !== 'exxata'}
              >
                Excluir Usuário
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Ação em Massa */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-orange-600">⚠️ Confirmar Ação em Massa</CardTitle>
              <CardDescription>
                Você está prestes a alterar a função de múltiplos usuários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-900">Detalhes da ação:</p>
                <p className="text-sm text-orange-700 mt-1">• Quantidade: <strong>{selectedMembers.length} membro(s)</strong></p>
                <p className="text-sm text-orange-700">• Nova função: <strong>{roleLabel(bulkRole)}</strong></p>
              </div>
              <div className="space-y-2">
                <Label>Digite <strong>"exxata"</strong> para confirmar:</Label>
                <Input
                  type="text"
                  placeholder="Digite exxata"
                  value={bulkConfirmText}
                  onChange={(e) => setBulkConfirmText(e.target.value)}
                  className="border-orange-300 focus:border-orange-500"
                />
              </div>
            </CardContent>
            <CardContent className="flex justify-end space-x-3 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkConfirmText('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmBulkRoleChange}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={bulkConfirmText.toLowerCase() !== 'exxata'}
              >
                Confirmar Alteração
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Team;
