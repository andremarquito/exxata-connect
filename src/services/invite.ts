import type { SupabaseClient } from '@supabase/supabase-js';

export async function inviteUser(
  supabase: SupabaseClient,
  email: string,
  fullName?: string
) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName ?? '' },
  });
  if (error) throw error;
  return data;
}

export type InviteUserResult = Awaited<ReturnType<typeof inviteUser>>;
