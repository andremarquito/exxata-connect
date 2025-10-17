import type { SupabaseClient } from '@supabase/supabase-js';

export interface InviteUserOptions {
  fullName?: string;
  password?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  role?: string;
  invitedBy?: {
    id?: string;
    email?: string;
    role?: string;
  };
}

export interface InviteUserResponse {
  success: boolean;
  userId?: string;
  email: string;
  password: string | null;
  inviteLink?: string | null;
  profile?: Record<string, unknown> | null;
}

export async function inviteUser(
  supabase: SupabaseClient,
  email: string,
  {
    fullName,
    password,
    metadata,
    sendEmail,
    role,
    invitedBy
  }: InviteUserOptions = {}
): Promise<InviteUserResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const defaultPassword = password ?? 'exxata123';

  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      email: normalizedEmail,
      fullName,
      password: defaultPassword,
      role,
      invitedBy,
      metadata,
      sendEmail
    }
  });

  if (error) {
    throw error;
  }

  return {
    success: data?.success ?? false,
    userId: data?.user?.id,
    email: normalizedEmail,
    password: defaultPassword,
    inviteLink: data?.inviteLink ?? null,
    profile: data?.profile ?? null
  };
}

export type InviteUserResult = InviteUserResponse;
