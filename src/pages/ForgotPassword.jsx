import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setErrors({});
    
    // Validações básicas
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!email.includes('@')) {
      newErrors.email = 'E-mail inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Enviando email de reset para:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Erro ao enviar email de reset:', error.message);
        
        // Tratar diferentes tipos de erro
        if (error.message?.includes('User not found')) {
          throw new Error('E-mail não encontrado. Verifique se o e-mail está correto.');
        } else if (error.message?.includes('Email rate limit exceeded')) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        } else {
          throw new Error('Erro ao enviar e-mail. Tente novamente.');
        }
      }

      console.log('✅ Email de reset enviado com sucesso');
      setIsEmailSent(true);
      toast.success('E-mail de recuperação enviado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro no reset de senha:', error.message);
      toast.error(error.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-sky p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              E-mail enviado!
            </CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Verifique sua caixa de entrada</p>
              <p>• Verifique também a pasta de spam</p>
              <p>• O link expira em 1 hora</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              onClick={() => {
                setIsEmailSent(false);
                setEmail('');
              }}
              variant="outline"
              className="w-full"
            >
              Enviar novamente
            </Button>
            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
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
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail e enviaremos um link para redefinir sua senha
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                disabled={isLoading}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-exxata-red hover:bg-dark-red"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ForgotPassword;
