import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface UpdateUserProfileRequest {
  user_id: string;
  role?: string;
  status?: string;
  password?: string;
  password_reset_at?: string;
  password_reset_by?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário tem permissão (admin)
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = profile.role === "admin" || profile.role === "administrator" || profile.role === "manager" || profile.role === "gerente";
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin or Manager access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: UpdateUserProfileRequest = await req.json();
    const { user_id, role, status, password, password_reset_at, password_reset_by } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar role se fornecido
    if (role && !["admin", "administrator", "manager", "gerente", "collaborator", "colaborador", "consultor", "consultant", "client", "cliente"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar status se fornecido
    if (status && !["Ativo", "Pendente", "Inativo"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (password !== undefined) updateData.password = password;
    if (password_reset_at !== undefined) updateData.password_reset_at = password_reset_at;
    if (password_reset_by !== undefined) updateData.password_reset_by = password_reset_by;

    // Atualizar o profile
    const { data, error: updateError } = await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("id", user_id)
      .select();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: "Profile updated successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
