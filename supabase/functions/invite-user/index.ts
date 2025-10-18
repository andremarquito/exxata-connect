// supabase/functions/invite-user/index.ts
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
    const { email, fullName, password, role, invitedBy, metadata, sendEmail, empresa } = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Generate password if not provided
    const defaultPassword = password || 'exxata123';

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: defaultPassword,
      user_metadata: {
        full_name: fullName || normalizedEmail.split('@')[0],
        ...metadata,
      },
      email_confirm: !sendEmail, // Auto-confirm if not sending email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create profile record (the trigger should handle this, but let's ensure it)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: normalizedEmail,
        name: fullName || normalizedEmail.split('@')[0],
        role: role || 'cliente',
        empresa: empresa,
        status: sendEmail ? 'Pendente' : 'Ativo',
        invited_by: invitedBy?.id,
        invited_by_role: invitedBy?.role,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // Don't fail the whole operation if profile creation fails
      console.warn('Profile creation failed, but user was created');
    }

    // Generate invite link if email confirmation is needed
    let inviteLink = null;
    if (sendEmail && !authData.user.email_confirmed_at) {
      // For Supabase, we can generate a magic link or use the confirmation URL
      inviteLink = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${authData.user.id}&type=signup`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: normalizedEmail,
        },
        password: defaultPassword,
        inviteLink,
        profile: profileData,
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
