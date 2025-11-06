import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const ConfirmEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('E-mail não encontrado. Por favor, faça o cadastro novamente.');
      navigate('/signup');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setResendSuccess(true);
      toast.success('E-mail de confirmação reenviado com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar e-mail:', error);
      toast.error('Erro ao reenviar e-mail. Tente novamente mais tarde.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Confirme seu E-mail</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para:
          </CardDescription>
          {email && (
            <p className="text-sm font-medium text-gray-900">{email}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Próximos passos:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abra sua caixa de entrada</li>
                  <li>Procure por um e-mail do Exxata Control</li>
                  <li>Clique no link de confirmação</li>
                  <li>Faça login na plataforma</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  Não recebeu o e-mail?
                </p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Verifique sua pasta de spam ou lixo eletrônico</li>
                  <li>Aguarde alguns minutos (pode demorar até 5 minutos)</li>
                  <li>Verifique se o e-mail está correto</li>
                </ul>
              </div>
            </div>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  E-mail reenviado com sucesso! Verifique sua caixa de entrada.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? 'Reenviando...' : 'Reenviar E-mail de Confirmação'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Já confirmou seu e-mail?{' '}
            <Link
              to="/login"
              className="text-blue-exxata hover:text-blue-700 font-medium"
            >
              Fazer login
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link
              to="/signup"
              className="text-gray-600 hover:text-gray-900"
            >
              Voltar para cadastro
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
