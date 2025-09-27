import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus, Mail, User, Shield, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const teamMembers = [
  {
    id: 1,
    name: "Carlos Silva",
    email: "carlos.silva@exxata.com",
    role: "Admin",
    status: "Ativo",
    lastActive: "Hoje, 09:42"
  },
  {
    id: 2,
    name: "Ana Oliveira",
    email: "ana.oliveira@exxata.com",
    role: "Gerente",
    status: "Ativo",
    lastActive: "Ontem, 15:30"
  },
  {
    id: 3,
    name: "Pedro Santos",
    email: "pedro.santos@exxata.com",
    role: "Colaborador",
    status: "Ativo",
    lastActive: "Ontem, 11:15"
  },
  {
    id: 4,
    name: "Juliana Costa",
    email: "juliana.costa@exxata.com",
    role: "Cliente",
    status: "Inativo",
    lastActive: "2 dias atrás"
  },
];

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client', label: 'Cliente' },
];

export function Team() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  const canManageTeam = user?.permissions?.includes('manage_team');
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = (e) => {
    e.preventDefault();
    // Lógica para enviar convite
    console.log('Convite enviado para:', { email, role });
    setEmail('');
    setRole('');
    setIsInviteModalOpen(false);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleDeleteMember = (memberId) => {
    // Lógica para remover membro
    console.log('Remover membro:', memberId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipe</h2>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe e suas permissões
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
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
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'Admin' ? 'default' : 'outline'}>
                      {member.role}
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
              ))}
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
                <Select value={editingMember.role.toLowerCase()}>
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
                <Select value={editingMember.status === 'Ativo' ? 'active' : 'inactive'}>
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
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Team;
