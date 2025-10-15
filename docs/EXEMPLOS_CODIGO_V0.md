# Exemplos de Código - Lógica V0

Este documento contém exemplos práticos de código extraídos do repositório V0 para referência durante a implementação.

---

## 📦 1. Criação de Projeto (Completo)

### Frontend - Modal de Novo Projeto

```javascript
// components/projects/new-project-modal.tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) return
  
  setIsLoading(true)
  console.log("[v0] Iniciando criação de projeto...")

  try {
    const supabase = createClient()

    // 1. Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error("Sessão inválida. Por favor, faça login novamente.")
    }

    console.log("[v0] Sessão válida. User ID:", session.user.id)

    // 2. Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("Perfil de usuário não encontrado.")
    }

    console.log("[v0] Perfil encontrado:", profile)

    // 3. Criar projeto
    console.log("[v0] Criando projeto com dados:", formData)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: formData.name.trim(),
        client: formData.client.trim() || null,
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        contract_value: formData.contract_value.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        sector: formData.sector || null,
        phase: formData.phase,
        status: formData.status,
        created_by: session.user.id,
        progress: 0,
      })
      .select()
      .single()

    if (projectError) {
      throw new Error(`Erro ao criar projeto: ${projectError.message}`)
    }

    console.log("[v0] Projeto criado com sucesso:", project)

    // 4. ✅ ADICIONAR CRIADOR COMO MEMBRO
    console.log("[v0] Adicionando criador como membro do projeto...")
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: session.user.id,
        role: "owner",
        added_by: session.user.id,
      })

    if (memberError) {
      console.error("[v0] Erro ao adicionar membro:", memberError)
      // ⚠️ Não falhar se não conseguir adicionar membro
      console.warn("[v0] Projeto criado mas falhou ao adicionar membro. Continuando...")
    } else {
      console.log("[v0] Criador adicionado como membro com sucesso")
    }

    // 5. Mostrar sucesso e redirecionar
    toast({
      title: "Projeto criado!",
      description: `O projeto "${project.name}" foi criado com sucesso.`,
    })

    console.log("[v0] Redirecionando para:", `/dashboard/projects/${project.id}`)
    router.push(`/dashboard/projects/${project.id}`)
    router.refresh()
    onClose()
    
  } catch (error) {
    console.error("[v0] Erro ao criar projeto:", error)
    toast({
      title: "Erro ao criar projeto",
      description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}
```

---

## 👥 2. Gerenciamento de Membros

### Adicionar Membro

```javascript
// components/projects/modals/add-member-modal.tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    console.log("[v0] Adicionando membro:", { email, role, projectId })

    // 1. Buscar usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado com este email",
        variant: "destructive",
      })
      return
    }

    // 2. Verificar se já é membro
    const { data: existing } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", profile.id)
      .single()

    if (existing) {
      toast({
        title: "Erro",
        description: "Este usuário já é membro do projeto",
        variant: "destructive",
      })
      return
    }

    // 3. Adicionar membro
    const { error: insertError } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: profile.id,
        role: role,
      })

    if (insertError) throw insertError

    toast({
      title: "Sucesso",
      description: "Membro adicionado com sucesso",
    })

    setEmail("")
    setRole("member")
    onOpenChange(false)
    onSuccess()
    
  } catch (error) {
    console.error("[v0] Erro ao adicionar membro:", error)
    toast({
      title: "Erro",
      description: "Erro ao adicionar membro",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}
```

### Remover Membro

```javascript
// components/projects/tabs/team-tab.tsx
const handleRemoveMember = async (memberId) => {
  if (!confirm("Tem certeza que deseja remover este membro?")) return

  try {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)

    if (error) throw error

    toast({
      title: "Sucesso",
      description: "Membro removido com sucesso",
    })

    onRefresh()
  } catch (error) {
    console.error("[v0] Erro ao remover membro:", error)
    toast({
      title: "Erro",
      description: "Erro ao remover membro",
      variant: "destructive",
    })
  }
}
```

### Listar Membros

```javascript
// app/dashboard/projects/[id]/page.tsx
// Carregar projeto com membros
const { data: project, error } = await supabase
  .from("projects")
  .select(`
    *,
    created_by_profile:profiles!projects_created_by_fkey(name, email),
    project_members(
      id,
      user_id,
      role,
      added_at,
      profiles:profiles!project_members_user_id_fkey(id, name, email, role)
    )
  `)
  .eq("id", params.id)
  .single()
```

---

## 📋 3. Gerenciamento de Atividades

### Criar Atividade

```javascript
// components/projects/modals/add-activity-modal.tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const { error } = await supabase
      .from("project_activities")
      .insert({
        project_id: projectId,
        title,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        assigned_to: assignedTo || null,
        status,
        priority,
      })

    if (error) throw error

    toast({
      title: "Sucesso",
      description: "Atividade criada com sucesso",
    })

    // Limpar formulário
    setTitle("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setAssignedTo("")
    setStatus("pending")
    setPriority("medium")
    
    onOpenChange(false)
    onSuccess()
    
  } catch (error) {
    console.error("[v0] Erro ao criar atividade:", error)
    toast({
      title: "Erro",
      description: "Erro ao criar atividade",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}
```

### Listar Atividades

```javascript
// components/projects/tabs/activities-tab.tsx
return (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atividades</CardTitle>
            <CardDescription>Tarefas e atividades do projeto</CardDescription>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{activity.title}</h3>
                  {activity.description && (
                    <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    {activity.start_date && (
                      <span>{new Date(activity.start_date).toLocaleDateString("pt-BR")}</span>
                    )}
                    {activity.end_date && (
                      <>
                        <span>-</span>
                        <span>{new Date(activity.end_date).toLocaleDateString("pt-BR")}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={
                    activity.status === "completed" ? "secondary" :
                    activity.status === "in_progress" ? "default" : "outline"
                  }>
                    {activity.status}
                  </Badge>
                  <Badge variant="outline">{activity.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500">Nenhuma atividade cadastrada</p>
        )}
      </CardContent>
    </Card>

    <AddActivityModal
      open={showAddModal}
      onOpenChange={setShowAddModal}
      projectId={projectId}
      members={members}
      onSuccess={onRefresh}
    />
  </div>
)
```

---

## 📄 4. Gerenciamento de Documentos

### Upload de Documento

```javascript
// components/projects/modals/upload-document-modal.tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!file) return

  setLoading(true)

  try {
    // ⚠️ NOTA: V0 simula upload, em produção usar Supabase Storage
    const fileUrl = `https://example.com/documents/${file.name}`
    const fileSize = file.size

    const { error } = await supabase
      .from("project_documents")
      .insert({
        project_id: projectId,
        name: name || file.name,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: file.type,
      })

    if (error) throw error

    toast({
      title: "Sucesso",
      description: "Documento enviado com sucesso",
    })

    setName("")
    setFile(null)
    onOpenChange(false)
    onSuccess()
    
  } catch (error) {
    console.error("[v0] Erro ao enviar documento:", error)
    toast({
      title: "Erro",
      description: "Erro ao enviar documento",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}
```

### Upload Real com Supabase Storage

```javascript
// Versão melhorada para produção
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!file) return

  setLoading(true)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Upload para Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${projectId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 2. Registrar no banco de dados
    const { error: dbError } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        name: name || file.name,
        type: file.type,
        size: file.size,
        url: filePath,
        uploaded_by: user.id
      })

    if (dbError) throw dbError

    toast({
      title: "Sucesso",
      description: "Documento enviado com sucesso",
    })

    setName("")
    setFile(null)
    onOpenChange(false)
    onSuccess()
    
  } catch (error) {
    console.error("Erro ao enviar documento:", error)
    toast({
      title: "Erro",
      description: "Erro ao enviar documento",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}
```

### Deletar Documento

```javascript
// components/projects/tabs/documents-tab.tsx
const handleDelete = async (docId) => {
  if (!confirm("Tem certeza que deseja deletar este documento?")) return

  try {
    const { error } = await supabase
      .from("project_documents")
      .delete()
      .eq("id", docId)

    if (error) throw error

    toast({
      title: "Sucesso",
      description: "Documento deletado com sucesso",
    })

    onRefresh()
  } catch (error) {
    console.error("[v0] Erro ao deletar documento:", error)
    toast({
      title: "Erro",
      description: "Erro ao deletar documento",
      variant: "destructive",
    })
  }
}
```

---

## 📊 5. Campos JSONB - Condutas e Panorama

### Estrutura de Condutas (JSONB)

```javascript
// Estrutura do campo projects.conducts
const conducts = [
  {
    id: 101,
    text: "Revisar cláusula 5.2 do contrato para evitar ambiguidades",
    urgency: "Imediato",
    priority: "Alta"
  },
  {
    id: 102,
    text: "Agendar reunião com o time jurídico para análise de riscos",
    urgency: "Planejado",
    priority: "Média"
  }
]

// Salvar no Supabase
await supabase
  .from('projects')
  .update({ conducts: conducts })
  .eq('id', projectId)

// Carregar do Supabase
const { data: project } = await supabase
  .from('projects')
  .select('conducts')
  .eq('id', projectId)
  .single()

console.log(project.conducts) // Array de objetos
```

### Estrutura de Panorama (JSONB)

```javascript
// Estrutura do campo projects.panorama
const panorama = {
  tecnica: {
    status: "yellow", // 'green' | 'yellow' | 'red'
    items: [
      {
        id: 1001,
        text: "Revisões sucessivas de projetos em frentes específicas."
      }
    ]
  },
  fisica: {
    status: "green",
    items: []
  },
  economica: {
    status: "red",
    items: [
      {
        id: 1002,
        text: "Impacto financeiro por revisões e ACT 2024/2026."
      }
    ]
  }
}

// Salvar no Supabase
await supabase
  .from('projects')
  .update({ panorama: panorama })
  .eq('id', projectId)

// Exibir no componente
const getStatusColor = (status) => {
  switch (status) {
    case "green": return "bg-green-500"
    case "yellow": return "bg-yellow-500"
    case "red": return "bg-red-500"
    default: return "bg-slate-500"
  }
}

return (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Técnica</CardTitle>
        <div className={`h-4 w-4 rounded-full ${getStatusColor(panorama.tecnica.status)}`} />
      </div>
    </CardHeader>
    <CardContent>
      {panorama.tecnica.items.length > 0 ? (
        <ul className="space-y-2">
          {panorama.tecnica.items.map((item) => (
            <li key={item.id} className="text-sm text-slate-700">
              • {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Sem observações</p>
      )}
    </CardContent>
  </Card>
)
```

---

## 🔐 6. Políticas RLS - Funções Helper

### Verificar se Usuário é Membro

```sql
-- Função SQL
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.project_members 
    WHERE project_id = project_uuid 
    AND user_id = user_uuid
  );
END;
$$;

-- Usar em política RLS
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    projects.created_by = auth.uid() OR
    public.is_project_member(projects.id, auth.uid())
  );
```

### Verificar se Usuário é Criador

```sql
-- Função SQL
CREATE OR REPLACE FUNCTION public.is_project_creator(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.projects 
    WHERE id = project_uuid 
    AND created_by = user_uuid
  );
END;
$$;

-- Usar em política RLS
CREATE POLICY "Project creators can update projects"
  ON projects FOR UPDATE
  USING (public.is_project_creator(projects.id, auth.uid()));
```

---

## 🎯 7. Carregamento de Projeto Completo

### Server-Side (Next.js)

```javascript
// app/dashboard/projects/[id]/page.tsx
export default async function ProjectPage({ params }) {
  const supabase = createServerClient()

  // Carregar projeto com todas as relações
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      created_by_profile:profiles!projects_created_by_fkey(name, email),
      project_members(
        id,
        user_id,
        role,
        added_at,
        profiles:profiles!project_members_user_id_fkey(id, name, email, role)
      ),
      activities:project_activities(
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        start_date,
        end_date,
        progress,
        created_at,
        updated_at
      ),
      documents:project_documents(
        id,
        name,
        type,
        size,
        url,
        uploaded_by,
        uploaded_at,
        metadata
      ),
      indicators:project_indicators(
        id,
        name,
        type,
        data,
        config,
        display_order,
        created_at,
        updated_at
      )
    `)
    .eq("id", params.id)
    .single()

  if (error) {
    notFound()
  }

  return (
    <ProjectDetailsTabs
      project={project}
      members={project.project_members || []}
      documents={project.documents || []}
      activities={project.activities || []}
      indicators={project.indicators || []}
      user={user}
    />
  )
}
```

---

## 🧪 8. Testes e Validações

### Validação de Formulário

```javascript
// Validar formulário antes de submeter
const validateForm = () => {
  if (!formData.name.trim()) {
    toast({
      title: "Erro de validação",
      description: "O nome do projeto é obrigatório",
      variant: "destructive",
    })
    return false
  }

  if (formData.start_date && formData.end_date) {
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (endDate < startDate) {
      toast({
        title: "Erro de validação",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive",
      })
      return false
    }
  }

  return true
}
```

### Tratamento de Erros

```javascript
try {
  // Operação
  const { data, error } = await supabase.from('projects').insert({...})
  
  if (error) {
    // Tratar erros específicos do Supabase
    if (error.code === '23505') {
      throw new Error('Registro duplicado')
    } else if (error.code === '23503') {
      throw new Error('Referência inválida')
    } else {
      throw new Error(`Erro ao salvar: ${error.message}`)
    }
  }
  
  return data
  
} catch (error) {
  console.error('Erro:', error)
  
  // Mostrar mensagem amigável ao usuário
  toast({
    title: "Erro",
    description: error instanceof Error ? error.message : "Erro desconhecido",
    variant: "destructive",
  })
  
  throw error
}
```

---

## 📚 Referências

- Repositório V0: https://github.com/andremarquito/v0-exxata-connect-clone.git
- Documentação Supabase: https://supabase.com/docs
- Documentação Next.js: https://nextjs.org/docs
- Documentação React: https://react.dev

---

**Nota:** Todos os exemplos acima são extraídos ou adaptados do repositório V0. Use-os como referência para implementar a mesma lógica no sistema atual.
