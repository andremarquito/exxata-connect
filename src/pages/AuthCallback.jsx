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
          
          // Verificar se há dados pendentes para atualizar
          const pendingDataStr = localStorage.getItem('pending_profile_update');
          
          if (pendingDataStr) {
            try {
              const pendingData = JSON.parse(pendingDataStr);
              console.log('📝 Processando dados pendentes do perfil:', pendingData);
              
              // Atualizar perfil com empresa e telefone
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  empresa: pendingData.empresa || null,
                  phone: pendingData.phone || null,
                  status: 'Ativo', // Agora está ativo após confirmação
                  updated_at: new Date().toISOString()
                })
                .eq('id', pendingData.userId);

              if (updateError) {
                console.error('Erro ao atualizar perfil pendente:', updateError);
                toast.error('Conta confirmada, mas houve erro ao salvar dados adicionais.');
              } else {
                console.log('✅ Dados adicionais salvos com sucesso');
                toast.success('Conta confirmada e dados salvos com sucesso! Bem-vindo!');
              }
              
              // Limpar dados pendentes
              localStorage.removeItem('pending_profile_update');
            } catch (pendingError) {
              console.error('Erro ao processar dados pendentes:', pendingError);
              toast.success('Conta confirmada com sucesso! Bem-vindo!');
            }
          } else {
            toast.success('Conta confirmada com sucesso! Bem-vindo!');
          }
          
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
