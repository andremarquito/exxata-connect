import type { SupabaseClient } from '@supabase/supabase-js';

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  administrator: 'Admin',
  manager: 'Gerente',
  gerente: 'Gerente',
  collaborator: 'Colaborador',
  colaborador: 'Colaborador',
  client: 'Cliente',
  cliente: 'Cliente',
  member: 'Membro',
  viewer: 'Visualizador',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  invited: 'Convidado',
  suspended: 'Suspenso',
  blocked: 'Bloqueado',
  archived: 'Arquivado',
  ativo: 'Ativo',
  inativo: 'Inativo',
  pendente: 'Pendente',
  convidado: 'Convidado',
  suspenso: 'Suspenso',
  bloqueado: 'Bloqueado',
  arquivado: 'Arquivado',
};

type Nullable<T> = T | null | undefined;

function toKey(value: Nullable<string>): string | null {
  if (!value) return null;
  return String(value).trim().toLowerCase() || null;
}

function titleCase(value: string | null): string {
  if (!value) return '';
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function enhanceProfile(profile: Record<string, any>) {
  const roleKey = toKey(profile.role);
  const statusSource = profile.status ?? profile.status_code ?? profile.statusCode;
  const statusKey = toKey(statusSource);

  return {
    ...profile,
    roleKey,
    statusCode: statusKey,
    roleLabel:
      (roleKey && ROLE_LABELS[roleKey]) ??
      (typeof profile.role === 'string' && profile.role.trim().length > 0
        ? profile.role
        : titleCase(roleKey ?? 'Colaborador')),
    statusLabel:
      (statusKey && STATUS_LABELS[statusKey]) ??
      (typeof statusSource === 'string' && statusSource.trim().length > 0
        ? statusSource
        : titleCase(statusKey ?? 'Ativo')),
  };
}

export async function loadTeam(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_all_profiles_secure');
  if (error) {
    if (
      error.code === 'PGRST116' ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('not found')
    ) {
      return [];
    }
    throw error;
  }

  return Array.isArray(data) ? data.map(enhanceProfile) : [];
}

export type LoadTeamResult = Awaited<ReturnType<typeof loadTeam>>;
export type TeamMember = LoadTeamResult extends (infer U)[] ? U : never;
