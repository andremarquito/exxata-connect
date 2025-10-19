import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface DeleteUserRequest {
  user_id: string;
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
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create client with user's auth to verify permissions
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

    const isAdmin = profile.role === "admin" || profile.role === "administrator";
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: DeleteUserRequest = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Não permitir que o admin delete a si mesmo
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Attempting to delete user: ${user_id}`);

    // Verificar se o usuário existe
    const { data: userToDelete, error: userCheckError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", user_id)
      .single();

    if (userCheckError || !userToDelete) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User to delete:`, userToDelete);

    // 1. Remover referências do usuário em outras tabelas (set NULL onde apropriado)
    // Atualizar campos created_by, updated_by, etc. para NULL
    const tablesToUpdate = [
      { table: 'projects', columns: ['created_by', 'updated_by'] },
      { table: 'project_files', columns: ['uploaded_by'] },
      { table: 'project_indicators', columns: ['created_by', 'updated_by'] },
      { table: 'project_members', columns: ['added_by'] },
      { table: 'project_conducts', columns: ['created_by'] },
      { table: 'profiles', columns: ['invited_by', 'password_reset_by'] }
    ];

    for (const { table, columns } of tablesToUpdate) {
      for (const column of columns) {
        const { error: updateError } = await supabaseAdmin
          .from(table)
          .update({ [column]: null })
          .eq(column, user_id);
        
        if (updateError) {
          console.error(`Error updating ${table}.${column}:`, updateError);
        } else {
          console.log(`Updated ${table}.${column} to NULL for user ${user_id}`);
        }
      }
    }

    // 2. Deletar o profile (isso vai cascatear para project_members.user_id)
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete user profile",
          details: profileDeleteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Profile deleted successfully: ${user_id}`);

    // 3. Deletar o usuário do auth (usando service role)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user_id
    );

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      // Mesmo se falhar, o profile já foi deletado, então consideramos sucesso parcial
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "User profile deleted but auth deletion failed",
          details: authDeleteError.message
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Auth user deleted successfully: ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userToDelete.email || userToDelete.name} deleted successfully`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
