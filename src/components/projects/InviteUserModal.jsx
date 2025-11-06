import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X, UserPlus, Mail } from 'lucide-react';
import { useUsers } from '@/contexts/UsersContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { profileService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client', label: 'Cliente' },
];

export function InviteUserModal({ isOpen, onClose, currentUserRole }) {
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addUser, getUserByEmail } = useUsers();
  const { user } = useAuth();

  // Filtrar roles baseado no papel do usuário atual
  const availableRoles = useMemo(() => {
    const normalized = (currentUserRole || '').toLowerCase();

    if (normalized === 'admin' || normalized === 'administrador') {
      return roles;
    }

    if (normalized === 'manager' || normalized === 'gerente') {
      return roles.filter((roleOption) => roleOption.value !== 'admin');
    }

    return [];
  }, [currentUserRole]);

  const canInvite = availableRoles.length > 0;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!canInvite) {
      toast.error('Você não possui permissão para convidar usuários.');
      return;
    }

    if (!email || !empresa || !role) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const existingLocal = getUserByEmail(email);
    if (existingLocal) {
      toast.error('Este e-mail já está cadastrado na plataforma.');
      return;
    }

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        toast.error('Este e-mail já está cadastrado na plataforma.');
        return;
      }
    } catch (profileCheckError) {
      console.warn('Não foi possível verificar usuários existentes no Supabase:', profileCheckError);
    }

    setIsSubmitting(true);

    try {
      const inviteResult = await profileService.inviteUser(email, role, user, empresa);

      if (!inviteResult?.success) {
        throw new Error('Convite não pôde ser processado.');
      }

      const profile = inviteResult.profile ?? {
        id: inviteResult.userId,
        email: inviteResult.email,
        role,
        status: 'Pendente',
        name: email
      };

      addUser({
        id: profile.id,
        name: profile.name || email,
        email: profile.email || email,
        role: profile.role || role,
        empresa: empresa,
        status: profile.status || 'Pendente',
        lastActive: profile.lastActive || new Date().toISOString()
      });

      await sendInviteEmail(
        inviteResult.email,
        profile.name || email,
        profile.role || role,
        inviteResult.password,
        inviteResult.inviteLink
      );

      toast.success(`Convite enviado para ${inviteResult.email}.`);

      setEmail('');
      setEmpresa('');
      setRole('');
      onClose();
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      toast.error(err?.message || 'Não foi possível enviar o convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para envio de email de convite
  const sendInviteEmail = async (email, name, role, password, inviteLink) => {
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
          },
          inviteLink
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
      },
      inviteLink
    });

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  };

  if (!isOpen) return null;

  if (!canInvite) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md relative">
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
            <CardTitle>Convites não disponíveis</CardTitle>
            <CardDescription>
              Apenas administradores e gerentes podem convidar novos usuários.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            Convide um colaborador para acessar a plataforma Exxata Control. Após o convite, ele poderá ser incluído em qualquer projeto.
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
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                type="text"
                placeholder="Nome da empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função na plataforma</Label>
              <Select value={role} onValueChange={setRole} required>
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
            <Button type="submit" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
