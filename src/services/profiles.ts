const roleLabel: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gerente',
  collaborator: 'Colaborador',
  client: 'Cliente',
  member: 'Membro',
  viewer: 'Visualizador',
};

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  invited: 'Convidado',
  suspended: 'Suspenso',
  blocked: 'Bloqueado',
};

export async function loadTeam(supabase: any) {
  const { data, error } = await supabase.rpc('get_all_profiles_secure');
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    roleLabel: roleLabel[p.role] ?? p.role,
    statusLabel: statusLabel[p.status] ?? p.status,
  }));
}

export type LoadTeamResult = Awaited<ReturnType<typeof loadTeam>>;
export type TeamMember = LoadTeamResult extends (infer U)[] ? U : never;
