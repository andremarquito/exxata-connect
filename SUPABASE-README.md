# 🚀 Configuração do Supabase - Exxata Connect

## 📋 Passo a Passo Completo

### 1️⃣ **Executar Script SQL**

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor e execute o script
5. ✅ Aguarde a execução completar (pode demorar alguns minutos)

### 2️⃣ **Configurar Storage**

1. Vá em **Storage** no painel do Supabase
2. Verifique se o bucket `project-files` foi criado
3. Se não foi criado, crie manualmente:
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('project-files', 'project-files', false);
   ```

### 3️⃣ **Configurar Authentication**

1. Vá em **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000`
3. Configure **Redirect URLs**: 
   - `http://localhost:3000/**`
   - `https://seu-site-producao.netlify.app/**`
4. Habilite **Email confirmations** se necessário
5. Configure **Email templates** (opcional)

### 4️⃣ **Verificar Variáveis de Ambiente**

Certifique-se de que seu arquivo `.env` está assim:
```bash
# Configurações do Supabase
VITE_SUPABASE_URL=https://lrnpdyqcxstghzrujywf.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Configurações da aplicação
VITE_APP_NAME=Exxata Connect
VITE_APP_VERSION=1.0.0
```

### 5️⃣ **Testar Conexão**

Execute no console do navegador:
```javascript
// Teste básico de conexão
window.testSupabase && window.testSupabase();

// Ou teste manualmente
import { supabase } from './src/lib/supabase.js';
const { data, error } = await supabase.from('profiles').select('count');
console.log('Conexão:', error ? 'ERRO' : 'OK', data);
```

---

## 🔄 Migração de Dados

### **Opção 1: Migração Automática**

```javascript
// No console do navegador (F12)
import('./src/utils/dataMigration.js').then(migration => {
  migration.migrateAllData().then(result => {
    console.log('Resultado da migração:', result);
  });
});
```

### **Opção 2: Migração Manual**

1. **Exportar dados locais:**
```javascript
const users = JSON.parse(localStorage.getItem('exxata_users') || '[]');
const projects = JSON.parse(localStorage.getItem('exxata_projects') || '[]');
console.log('Usuários:', users.length);
console.log('Projetos:', projects.length);
```

2. **Verificar migração:**
```javascript
import('./src/utils/dataMigration.js').then(migration => {
  migration.verifyMigration();
});
```

---

## 📊 Estrutura do Banco

### **Tabelas Principais:**

1. **`profiles`** - Usuários da plataforma
2. **`projects`** - Projetos de consultoria
3. **`project_members`** - Membros dos projetos
4. **`activities`** - Atividades dos projetos
5. **`project_files`** - Arquivos dos projetos
6. **`project_indicators`** - Gráficos/indicadores
7. **`project_conducts`** - Condutas (Inteligência Humana)

### **Relacionamentos:**

```
profiles (1) ←→ (N) project_members (N) ←→ (1) projects
projects (1) ←→ (N) activities
projects (1) ←→ (N) project_files  
projects (1) ←→ (N) project_indicators
projects (1) ←→ (N) project_conducts
```

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

✅ **Profiles**: Usuários veem apenas seus dados, admins veem todos
✅ **Projects**: Acesso baseado em membros da equipe
✅ **Activities**: Acesso baseado no projeto
✅ **Files**: Acesso baseado no projeto + Storage policies
✅ **Indicators/Conducts**: Acesso baseado no projeto

### **Roles e Permissões:**

- **Admin/Administrador**: Acesso total
- **Manager/Gerente**: Acesso total (igual admin)
- **Collaborator/Consultor**: Ver e editar projetos
- **Client/Cliente**: Apenas visualização

---

## 🔧 Desenvolvimento

### **Serviços Disponíveis:**

1. **`profileService`** - Gerenciar usuários
2. **`projectService`** - Gerenciar projetos
3. **`activityService`** - Gerenciar atividades
4. **`fileService`** - Upload/download de arquivos
5. **`indicatorService`** - Gerenciar gráficos
6. **`conductService`** - Gerenciar condutas

### **Hooks Customizados:**

```javascript
import { useProjects, useProject, useActivities } from '@/hooks/useSupabaseData';

// Em qualquer componente
const { projects, loading, createProject } = useProjects();
const { project } = useProject(projectId);
const { activities, createActivity } = useActivities(projectId);
```

### **Exemplo de Uso:**

```javascript
// Criar projeto
const newProject = await projectService.createProject({
  name: 'Projeto Teste',
  client: 'Cliente ABC',
  start_date: '2025-01-01',
  end_date: '2025-12-31'
});

// Adicionar atividade
const activity = await activityService.createActivity(newProject.id, {
  title: 'Análise de Requisitos',
  start_date: '2025-01-01',
  end_date: '2025-01-15',
  assigned_to: 'João Silva',
  status: 'A Fazer'
});
```

---

## 🚨 Solução de Problemas

### **Erro: "relation does not exist"**
- ✅ Execute o script SQL completo
- ✅ Verifique se todas as tabelas foram criadas
- ✅ Confirme que está no projeto correto

### **Erro: "Row Level Security policy"**
- ✅ Verifique se o usuário está autenticado
- ✅ Confirme as políticas RLS
- ✅ Teste com usuário admin primeiro

### **Erro: "JWT expired"**
- ✅ Faça logout e login novamente
- ✅ Verifique se as URLs estão configuradas corretamente

### **Upload de arquivos falha**
- ✅ Verifique se o bucket `project-files` existe
- ✅ Confirme as políticas do Storage
- ✅ Teste com arquivo pequeno primeiro

---

## 📈 Próximos Passos

### **Desenvolvimento:**

1. 🔄 **Migrar contextos** para usar serviços Supabase
2. 🔄 **Atualizar componentes** para usar hooks customizados
3. 🔄 **Implementar autenticação** real via Supabase Auth
4. 🔄 **Configurar email** de convites
5. 🔄 **Deploy para produção**

### **Funcionalidades Futuras:**

- 📧 **Email notifications**
- 🔔 **Real-time updates**
- 📱 **PWA support**
- 📊 **Advanced analytics**
- 🤖 **AI integrations**

---

## 💡 Dicas Importantes

### **Performance:**
- Use `select()` específico ao invés de `select('*')`
- Implemente paginação para listas grandes
- Use índices nos campos de busca frequente

### **Segurança:**
- Nunca exponha a `service_role_key` no frontend
- Use apenas `anon_key` no cliente
- Sempre valide dados no servidor

### **Backup:**
- Configure backup automático no Supabase
- Exporte dados regularmente
- Teste restauração periodicamente

---

## 🆘 Suporte

### **Documentação:**
- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

### **Comunidade:**
- [Discord do Supabase](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**🎉 Agora seu Exxata Connect está pronto para usar o Supabase como backend!**
