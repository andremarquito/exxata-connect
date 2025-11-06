import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { validatePassword, getPasswordErrorMessage, PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // O Supabase agora detecta automaticamente os tokens na URL
    // devido à configuração detectSessionInUrl: true
    console.log('🔑 Página de reset de senha carregada');
    
    // Verificar se há uma sessão ativa (tokens foram detectados)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Sessão de reset detectada automaticamente');
      } else {
        console.warn('⚠️ Nenhuma sessão detectada - link pode estar expirado');
      }
    };
    
    checkSession();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setErrors({});
    
    // Validações
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Nova senha é obrigatória';
    } else {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        newErrors.password = getPasswordErrorMessage(validation.errors);
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Atualizando senha...');
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error.message);
        
        if (error.message?.includes('session_not_found')) {
          throw new Error('Link de recuperação expirado. Solicite um novo link.');
        } else if (error.message?.includes('same_password')) {
          throw new Error('A nova senha deve ser diferente da atual.');
        } else {
          throw new Error('Erro ao atualizar senha. Tente novamente.');
        }
      }

      console.log('✅ Senha atualizada com sucesso');
      setIsSuccess(true);
      toast.success('Senha alterada com sucesso!');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro no reset de senha:', error.message);
      toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-sky p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">
              Senha alterada!
            </CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Você será redirecionado para o login.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-exxata-red hover:bg-dark-red"
            >
              Ir para o login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-sky p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="text-2xl font-bold text-exxata-blue">
              Exxata <span className="text-exxata-red">Control</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Redefinir senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">A senha deve ter:</p>
              <ul className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req, index) => (
                  <li key={index}>• {req}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-exxata-red hover:bg-dark-red"
              disabled={isLoading}
            >
              {isLoading ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ResetPassword;
