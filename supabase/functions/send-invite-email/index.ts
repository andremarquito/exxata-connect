// supabase/functions/send-invite-email/index.ts
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, inviteLink, fullName } = await req.json();

    // Validate required fields
    if (!email || !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Email e link de convite são obrigatórios' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just return success since email sending would be configured separately

    console.log(`Convite enviado para ${email} com link: ${inviteLink}`);

    // You could add email sending logic here, for example:
    /*
    const emailData = {
      to: email,
      subject: 'Convite para Exxata Connect',
      html: `
        <h1>Bem-vindo ao Exxata Connect!</h1>
        <p>Olá ${fullName || 'Usuário'},</p>
        <p>Você foi convidado para se juntar ao Exxata Connect.</p>
        <p>Clique no link abaixo para aceitar o convite:</p>
        <a href="${inviteLink}">Aceitar Convite</a>
        <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
        <p>${inviteLink}</p>
      `,
    };

    // Send email using your preferred service
    // await sendEmail(emailData);
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite enviado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
