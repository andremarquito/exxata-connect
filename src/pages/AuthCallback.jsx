import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro na confirmação:', error);
          toast.error('Erro ao confirmar conta. Tente novamente.');
          navigate('/login');
          return;
        }

        if (data.session) {
          console.log('✅ Conta confirmada com sucesso');
          toast.success('Conta confirmada com sucesso! Bem-vindo!');
          // O listener do AuthContext vai detectar a nova sessão automaticamente
          navigate('/');
        } else {
          console.log('Sessão não encontrada, redirecionando para login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        toast.error('Erro inesperado. Tente fazer login.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Confirmando Conta</CardTitle>
          <CardDescription className="text-center">
            Aguarde enquanto confirmamos sua conta...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-exxata"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
