import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareWarning, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Por favor, digite uma mensagem');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            message: message.trim()
          }
        ]);

      if (error) throw error;

      setIsSuccess(true);
      setMessage('');
      toast.success('Feedback enviado com sucesso!');
      
      // Resetar estado de sucesso após 3 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Feedback</h1>
          <p className="text-slate-600 mt-2">
            Compartilhe suas sugestões, dúvidas ou relate problemas. Sua opinião é importante para nós!
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquareWarning className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Envie seu Feedback</CardTitle>
                <CardDescription>
                  Descreva sua experiência, sugestão ou problema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Feedback Enviado!
                </h3>
                <p className="text-slate-600 mb-6">
                  Obrigado por compartilhar sua opinião conosco.
                </p>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                >
                  Enviar Outro Feedback
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="message" 
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite aqui sua sugestão, dúvida ou relate um problema..."
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    {message.length} caracteres
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Enviando como: <span className="font-medium">{user?.name || user?.email}</span>
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Dicas para um bom feedback
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Seja específico sobre o que você gostou ou não gostou</li>
            <li>• Se reportar um problema, descreva os passos para reproduzi-lo</li>
            <li>• Inclua sugestões de melhoria quando possível</li>
            <li>• Mantenha um tom respeitoso e construtivo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
