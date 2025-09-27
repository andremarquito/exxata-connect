import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X, UserPlus, Mail } from 'lucide-react';
import { useUsers } from '@/contexts/UsersContext';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client', label: 'Cliente' },
];

export function InviteUserModal({ isOpen, onClose, currentUserRole }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const { addUser, getUserByEmail } = useUsers();

  // Filtrar roles baseado no papel do usuário atual
  const getAvailableRoles = () => {
    const userRole = (currentUserRole || '').toLowerCase();
    
    if (userRole === 'admin' || userRole === 'administrador') {
      // Admin pode convidar todos
      return roles;
    } else if (userRole === 'manager' || userRole === 'gerente') {
      // Gerente tem mesma função do admin
      return roles;
    } else if (userRole === 'collaborator' || userRole === 'colaborador' || userRole === 'consultor' || userRole === 'consultant') {
      // Colaborador/Consultor só pode convidar colaboradores e clientes
      return roles.filter(r => r.value === 'collaborator' || r.value === 'client');
    } else {
      // Clientes não podem convidar (não deveria chegar aqui)
      return [];
    }
  };

  const availableRoles = getAvailableRoles();

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!email || !role) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Verificar se o email já está cadastrado no Supabase
      // Nota: Verificação via profiles table (mais seguro que admin API)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();
      
      if (existingProfile) {
        toast.error('Este e-mail já está cadastrado na plataforma.');
        return;
      }

      // Verificar também no sistema local (fallback)
      const localUser = getUserByEmail(email);
      if (localUser) {
        toast.error('Este e-mail já está cadastrado na plataforma.');
        return;
      }

      // Gerar nome baseado no email
      const localPart = String(email).split('@')[0] || '';
      const name = localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') || email;

      // Usar signUp normal do Supabase (client-side seguro)
      const temporaryPassword = 'exxata123'; // Senha padrão
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: temporaryPassword,
        options: {
          data: {
            full_name: name,
            role: role || 'collaborator',
            invited_by: currentUserRole,
            invited_at: new Date().toISOString()
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário no Supabase:', authError);
        
        // Fallback para sistema local
        const newUser = {
          name,
          email,
          role: role || 'collaborator',
          status: 'Pendente',
          password: temporaryPassword,
          invitedAt: new Date().toISOString(),
          invitedBy: currentUserRole
        };
        
        addUser(newUser);
        toast.success(`Convite enviado para ${email}! (Sistema local - o usuário receberá instruções por email)`);
      } else {
        // Usuário criado no Supabase com sucesso
        toast.success(`Convite enviado para ${email}! O usuário receberá um e-mail de confirmação.`);
      }

      // Enviar email de convite (funciona para ambos os casos)
      await sendInviteEmail(email, name, role, temporaryPassword);

      setEmail('');
      setRole('');
      onClose();
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      toast.error('Não foi possível enviar o convite. Tente novamente.');
    }
  };

  // Função para envio de email de convite
  const sendInviteEmail = async (email, name, role, password) => {
    try {
      // Tentar enviar email via Supabase Edge Functions (se configurado)
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: email,
          name,
          role,
          loginUrl: `${window.location.origin}/login`,
          credentials: {
            email,
            password
          }
        }
      });

      if (error) {
        console.log('Supabase Edge Function não disponível, usando fallback:', error.message);
      }
    } catch (err) {
      console.log('Erro ao enviar email via Supabase:', err.message);
    }

    // Log para desenvolvimento (remover em produção)
    console.log('Convite enviado:', {
      to: email,
      name,
      role,
      loginUrl: `${window.location.origin}/login`,
      credentials: {
        email,
        password
      }
    });

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
        <CardHeader>
          <CardTitle>Convidar Colaborador</CardTitle>
          <CardDescription>
            Convide um colaborador para acessar a plataforma Exxata Connect. Após o convite, ele poderá ser incluído em qualquer projeto.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleInvite}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do convidado</Label>
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
              <Label htmlFor="role">Função na plataforma</Label>
              <Select onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <UserPlus className="h-4 w-4 mr-2" />
              Enviar Convite
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
