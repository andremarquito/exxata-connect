import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, Mail, Bell, Lock, User, CreditCard, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('pt-br');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleChangePassword = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simular alteração de senha
    setTimeout(() => {
      console.log('Senha alterada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const toggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e preferências
        </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Altere sua senha. Certifique-se de que ela seja forte e única.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Alterar Senha'}
                  {saveSuccess && <Check className="h-4 w-4 ml-2" />}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores</CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Autenticação em Dois Fatores</h4>
                  <p className="text-sm text-muted-foreground">
                    Proteja sua conta com um aplicativo de autenticação
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
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
