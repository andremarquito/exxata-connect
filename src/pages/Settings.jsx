import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, Mail, Bell, Lock, User, CreditCard, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { toast } from 'react-hot-toast';

export function Settings() {
  const { user } = useAuth();
  const { updateUser, getUserByEmail } = useUsers();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [language, setLanguage] = useState('pt-br');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Verificar se usuário tem senha padrão
  const currentUserData = getUserByEmail(user?.email);
  const hasDefaultPassword = currentUserData?.password === 'exxata123' || currentUserData?.status === 'Pendente';

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simular salvamento
    setTimeout(() => {
      console.log('Perfil atualizado:', { name, email });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword === 'exxata123') {
      toast.error('Por segurança, não é possível usar a senha padrão "exxata123".');
      return;
    }

    setIsSaving(true);

    try {
      // Verificar senha atual
      const userData = getUserByEmail(user?.email);
      if (!userData) {
        throw new Error('Usuário não encontrado.');
      }

      // Validar senha atual
      const expectedCurrentPassword = userData.password || 'exxata123';
      if (currentPassword !== expectedCurrentPassword) {
        throw new Error('Senha atual incorreta.');
      }

      // Atualizar senha no contexto de usuários
      updateUser(userData.id, {
        password: newPassword,
        status: 'Ativo', // Garantir que status seja ativo
        passwordChangedAt: new Date().toISOString(),
        hasCustomPassword: true // Flag para indicar senha personalizada
      });

      // TODO: Integração com Supabase
      // await supabase.auth.updateUser({ password: newPassword });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSaving(false);
      
      toast.success('Senha alterada com sucesso! Sua senha personalizada será mantida até que um administrador a resete.');
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setIsSaving(false);
      toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  const toggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página com melhor espaçamento e contraste */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Configurações
          </h2>
          <p className="text-gray-600 text-lg">
            Gerencie as configurações da sua conta e preferências
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil e endereço de e-mail.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value="Exxata Consultoria" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input value={user?.role || 'Admin'} disabled />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  {saveSuccess && <Check className="h-4 w-4 ml-2" />}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Configure suas preferências de idioma e região.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                    <SelectItem value="en-us">English (US)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select defaultValue="-03:00">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-03:00">(GMT-03:00) Brasília</SelectItem>
                    <SelectItem value="-04:00">(GMT-04:00) Manaus</SelectItem>
                    <SelectItem value="-05:00">(GMT-05:00) Rio Branco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Salvar Preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Card de Status da Senha */}
          <Card className={hasDefaultPassword ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${hasDefaultPassword ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                <div>
                  <h4 className="font-medium">
                    {hasDefaultPassword ? 'Senha Padrão em Uso' : 'Senha Personalizada'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {hasDefaultPassword 
                      ? 'Você está usando a senha padrão "exxata123". Recomendamos alterar para maior segurança.'
                      : 'Você possui uma senha personalizada. Ela será mantida até que um administrador a resete.'
                    }
                  </p>
                  {currentUserData?.passwordChangedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última alteração: {new Date(currentUserData.passwordChangedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Altere sua senha. Certifique-se de que ela seja forte e única.
                {hasDefaultPassword && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    ⚠️ Você está usando a senha padrão. Recomendamos alterar para uma senha personalizada.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={hasDefaultPassword ? "Digite: exxata123" : "Digite sua senha atual"}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres (não use 'exxata123')"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sua senha personalizada será mantida até que um administrador a resete.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a nova senha novamente"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Alterando Senha...' : 'Alterar Senha'}
                </Button>
              </CardFooter>
            </form>
          </Card>

        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Escolha como você gostaria de receber notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Por E-mail</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Atividades da Conta</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações sobre atividades importantes na sua conta
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={() => toggleNotification('email')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Atualizações de Projetos</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações sobre os projetos que você está seguindo
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={() => toggleNotification('email')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notificações por Push</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mensagens Diretas</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações quando receber mensagens diretas
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={() => toggleNotification('push')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lembretes de Tarefas</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes sobre tarefas pendentes
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={() => toggleNotification('push')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Comunicações de Marketing</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Novidades e Atualizações</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba e-mails sobre novos recursos e atualizações
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.marketing}
                      onCheckedChange={() => toggleNotification('marketing')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dicas e Tutoriais</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba dicas úteis para aproveitar ao máximo a plataforma
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.marketing}
                      onCheckedChange={() => toggleNotification('marketing')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Salvar Preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
