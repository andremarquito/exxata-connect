import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, Mail, User, Shield, MoreVertical, Trash2, Pencil, Download, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client', label: 'Cliente' },
];

const roleLabelMap = {
  admin: 'Admin',
  manager: 'Gerente',
  collaborator: 'Colaborador',
  client: 'Cliente',
};

const roleLabel = (r) => roleLabelMap[r] || r;

export function Team() {
  const { user } = useAuth();
  const { users, isLoading, addUser, updateUser, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // Verificar permissões do usuário
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isManager = userRole === 'manager' || userRole === 'gerente';
  const canManageTeam = user?.permissions?.includes('manage_team');
  const canExportData = isAdmin || isManager; // Apenas Admin e Gerente podem exportar
  const filteredMembers = (users || []).filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para exportar dados da equipe para Excel
  const exportTeamData = () => {
    if (!canExportData) {
      toast.error('Você não possui permissão para exportar dados.');
      return;
    }

    try {
      const exportData = [];

      // Cabeçalho com informações da exportação
      exportData.push(['DADOS DA EQUIPE EXXATA CONNECT', '']);
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
      const fileName = `Equipe_Exxata_Connect_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Fazer download do arquivo
      XLSX.writeFile(wb, fileName);

      toast.success('Dados da equipe exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleInviteMember = (e) => {
    e.preventDefault();
    try {
      const localPart = String(email).split('@')[0] || '';
      const name = localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') || email;
      addUser({ name, email, role: role || 'collaborator', status: 'Ativo' });
      toast.success('Convite registrado e usuário adicionado.');
      setEmail('');
      setRole('');
      setIsInviteModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível convidar o usuário.');
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleDeleteMember = (memberId) => {
    if (!canManageTeam) return;
    const ok = window.confirm('Remover este membro da base de usuários?');
    if (!ok) return;
    deleteUser(memberId);
    toast.success('Membro removido com sucesso.');
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
    <div className="space-y-6">
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
                <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                <span>Usuários do Supabase ({users?.filter(u => u.supabaseProfile).length || 0})</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Usuários locais ({users?.filter(u => !u.supabaseProfile).length || 0})</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Total: {users?.length || 0} usuários</span>
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
          {canManageTeam && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Membro
            </Button>
          )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar membros..."
                  className="w-full sm:w-64 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 5 : 4} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="text-muted-foreground">Carregando usuários...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 5 : 4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? 'Nenhum usuário encontrado com esse termo' : 'Nenhum usuário cadastrado'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        member.supabaseProfile ? 'bg-blue-100' : 'bg-muted'
                      }`}>
                        <User className={`h-5 w-5 ${
                          member.supabaseProfile ? 'text-blue-600' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{member.name}</p>
                          {member.supabaseProfile && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Supabase
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {isAdmin && member.supabaseProfile && (
                          <p className="text-xs text-blue-600">ID: {member.id}</p>
                        )}
                      </div>
                    </div>
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
                    {member.lastActive}
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

      {/* Modal de Convite */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Convidar Membro</CardTitle>
              <CardDescription>
                Envie um convite por e-mail para adicionar um novo membro à equipe.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleInviteMember}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
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
              </CardContent>
              <CardContent className="flex justify-end space-x-3 border-t pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Convite
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

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
              <Button onClick={() => {
                if (!editingMember) return;
                updateUser(editingMember.id, { role: editingMember.role, status: editingMember.status });
                toast.success('Membro atualizado com sucesso.');
                setEditingMember(null);
              }}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Team;
