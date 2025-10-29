import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { validatePassword, getPasswordErrorMessage, PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SignUpForm = () => {
  // Estado do formulário em duas etapas
  const [step, setStep] = useState(1); // 1 = dados básicos, 2 = dados adicionais
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    empresa: '',
    cargo: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null); // Armazena ID do usuário criado
  const [hasSession, setHasSession] = useState(false); // Indica se há sessão ativa
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Validação e submissão da Etapa 1 (dados básicos)
  const handleStep1Submit = async (e) => {
    e.preventDefault();

    // Validações da etapa 1
    if (!formData.fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }

    // Validar complexidade da senha
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      toast.error(getPasswordErrorMessage(validation.errors));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      // Criar conta no Supabase (apenas dados básicos)
      const result = await signup(formData.email, formData.password, {
        full_name: formData.fullName.trim()
      });

      if (result.success && result.data?.user) {
        setUserId(result.data.user.id);
        // Verificar se há sessão disponível (email auto-confirmado)
        setHasSession(!!result.data.session);
        toast.success('Conta criada! Complete seu cadastro.');
        // Avançar para etapa 2
        setStep(2);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão da Etapa 2 (dados adicionais)
  const handleStep2Submit = async (e) => {
    e.preventDefault();

    // Validações da etapa 2
    if (!formData.empresa.trim()) {
      toast.error('Empresa é obrigatória');
      return;
    }

    if (!formData.cargo.trim()) {
      toast.error('Cargo é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      // Estratégia: Atualizar perfil diretamente se houver sessão,
      // ou salvar no localStorage para atualizar após confirmação de email
      
      if (hasSession) {
        // Caso 1: Há sessão (email auto-confirmado) - atualizar diretamente
        console.log('✅ Sessão disponível, atualizando perfil diretamente');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            empresa: formData.empresa.trim() || null,
            cargo: formData.cargo.trim() || null,
            phone: formData.phone.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Erro ao atualizar perfil:', updateError);
          throw new Error('Erro ao salvar informações adicionais');
        }

        toast.success('Cadastro completo com sucesso!');
        await supabase.auth.signOut();
        navigate('/login');
      } else {
        // Caso 2: Sem sessão (aguardando confirmação) - salvar temporariamente
        console.log('ℹ️ Sem sessão, salvando dados para atualização posterior');
        
        // Salvar dados temporários no localStorage para atualizar após confirmação
        const pendingProfileData = {
          userId,
          email: formData.email,
          empresa: formData.empresa.trim(),
          cargo: formData.cargo.trim(),
          phone: formData.phone.trim(),
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('pending_profile_update', JSON.stringify(pendingProfileData));
        
        toast.success(
          'Cadastro iniciado! Enviamos um e-mail de confirmação. Após confirmar, seus dados serão salvos.',
          { duration: 6000 }
        );
        
        navigate('/confirm-email', { 
          state: { 
            email: formData.email,
            hasPendingData: true 
          } 
        });
      }
    } catch (error) {
      console.error('Erro ao completar cadastro:', error);
      toast.error(error.message || 'Erro ao completar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voltar para etapa 1
  const handleBackToStep1 = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            {step === 1 
              ? 'Digite suas informações básicas para criar uma conta'
              : 'Complete seu cadastro com informações adicionais'
            }
          </CardDescription>
          {/* Indicador de progresso */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 1 ? 'bg-blue-exxata text-white' : 'bg-green-500 text-white'
            }`}>
              {step === 1 ? '1' : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div className="w-12 h-1 bg-gray-300">
              <div className={`h-full transition-all duration-300 ${
                step === 2 ? 'w-full bg-blue-exxata' : 'w-0'
              }`} />
            </div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 2 ? 'bg-blue-exxata text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </CardHeader>

        {/* ETAPA 1: Dados Básicos */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">A senha deve ter:</p>
                  <ul className="space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite novamente sua senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10"
                    required
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

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : (
                  <>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-blue-exxata hover:text-blue-700 font-medium"
                >
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {/* ETAPA 2: Dados Adicionais */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  ✓ Conta criada com sucesso! Complete as informações abaixo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  name="empresa"
                  type="text"
                  placeholder="Nome da empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Input
                  id="cargo"
                  name="cargo"
                  type="text"
                  placeholder="Seu cargo na empresa"
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: (DDD) 00000-0000 ou (DDD) 0000-0000
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-xs text-gray-600 text-center">
                Ao cadastrar você concorda com os{' '}
                <Link to="/politica-privacidade" className="text-blue-exxata hover:text-blue-700 underline">
                  termos e condições da plataforma
                </Link>.
              </div>
              
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToStep1}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Finalizando...' : 'Finalizar Cadastro'}
                </Button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SignUpForm;
