# Refatoração da Página de Configurações (Settings)

## Resumo das Alterações

A página `Settings.jsx` foi completamente refatorada para integrar corretamente com o Supabase e remover funcionalidades não implementadas.

## ❌ O Que Foi Removido

### 1. Dependências do Sistema Local
- ✅ Removido `useUsers` do `UsersContext`
- ✅ Removido `getUserByEmail` e `updateUser` (sistema local)
- ✅ Removida lógica de verificação de senha padrão via localStorage

### 2. Funcionalidades Não Implementadas
- ✅ **Aba de Notificações** - Removida completamente (não havia backend)
- ✅ **Preferências de Idioma/Timezone** - Removidas (não implementadas)
- ✅ **Card de Status de Senha** - Removido (dependia do sistema local)

### 3. Campos Hardcoded
- ✅ Empresa não é mais hardcoded como "Exxata Consultoria"
- ✅ Email agora vem do contexto de autenticação

## ✅ O Que Foi Implementado

### 1. Integração com Supabase

#### Carregamento de Perfil
```javascript
useEffect(() => {
  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfileData(data);
      setName(data.name || '');
      setEmpresa(data.empresa || '');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Fallback para dados do contexto
      setName(user?.name || '');
      setEmpresa(user?.empresa || '');
    }
  };

  loadProfile();
}, [user]);
```

#### Atualização de Perfil
```javascript
const handleSaveProfile = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  
  try {
    // Atualizar perfil no Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        empresa: empresa.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;

    toast.success('Perfil atualizado com sucesso!');
    
    // Recarregar dados do perfil
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) setProfileData(data);
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    toast.error('Erro ao atualizar perfil. Tente novamente.');
  } finally {
    setIsSaving(false);
  }
};
```

#### Alteração de Senha via Supabase Auth
```javascript
const handleChangePassword = async (e) => {
  e.preventDefault();
  
  // Validações...
  
  setIsSaving(true);

  try {
    // Verificar senha atual fazendo login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      throw new Error('Senha atual incorreta.');
    }

    // Atualizar senha no Supabase Auth
    const { error: updateError } = await updatePassword(newPassword);
    
    if (updateError) throw updateError;

    // Atualizar informações no perfil
    await supabase
      .from('profiles')
      .update({
        has_custom_password: true,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    toast.success('Senha alterada com sucesso!');
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
  } finally {
    setIsSaving(false);
  }
};
```

### 2. Interface Simplificada

#### Antes (3 abas)
- Perfil
- Segurança
- Notificações

#### Depois (2 abas)
- **Perfil** - Informações pessoais
- **Segurança** - Alteração de senha

### 3. Campos da Aba Perfil

| Campo | Editável | Fonte de Dados | Observação |
|-------|----------|----------------|------------|
| **Nome Completo** | ✅ Sim | `profiles.name` | Atualizado no Supabase |
| **E-mail** | ❌ Não | `auth.users.email` | Somente leitura, gerenciado pelo Supabase Auth |
| **Empresa** | ✅ Sim | `profiles.empresa` | Atualizado no Supabase |
| **Função** | ❌ Não | `profiles.role` | Somente leitura, definido por admin |

### 4. Campos da Aba Segurança

| Campo | Tipo | Validação |
|-------|------|-----------|
| **Senha Atual** | Password | Verificada via `signInWithPassword` |
| **Nova Senha** | Password | Mínimo 6 caracteres |
| **Confirmar Nova Senha** | Password | Deve coincidir com nova senha |

## 🔒 Políticas RLS Utilizadas

A página respeita as políticas RLS implementadas:

### SELECT (Visualização)
```sql
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### UPDATE (Atualização)
```sql
-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 📊 Campos do Schema Profiles Utilizados

```sql
-- Campos editáveis pelo usuário
name          TEXT          -- Nome completo
empresa       TEXT          -- Nome da empresa

-- Campos atualizados automaticamente
updated_at              TIMESTAMP  -- Data de atualização
password_changed_at     TIMESTAMP  -- Data da última alteração de senha
has_custom_password     BOOLEAN    -- Flag de senha personalizada

-- Campos somente leitura
id            UUID          -- ID do usuário (FK para auth.users)
email         TEXT          -- Email (sincronizado com auth.users)
role          TEXT          -- Função (definida por admin)
status        TEXT          -- Status da conta
```

## 🎨 Melhorias de UX

1. **Feedback Visual**
   - Toast notifications para sucesso/erro
   - Ícone de check quando salvo com sucesso
   - Estados de loading nos botões

2. **Validações**
   - Campos obrigatórios marcados
   - Validação de senha (mínimo 6 caracteres)
   - Confirmação de senha deve coincidir

3. **Informações Contextuais**
   - Mensagens explicativas em campos somente leitura
   - Data da última alteração de senha
   - Dicas de segurança para senha

4. **Mostrar/Esconder Senha**
   - Botões de toggle para todos os campos de senha
   - Ícones Eye/EyeOff para melhor UX

## 🧪 Como Testar

### Teste 1: Atualizar Perfil
1. Acesse **Configurações** > **Perfil**
2. Altere o **Nome** e/ou **Empresa**
3. Clique em **Salvar Alterações**
4. Verifique o toast de sucesso
5. Recarregue a página e confirme que os dados foram salvos

### Teste 2: Alterar Senha
1. Acesse **Configurações** > **Segurança**
2. Digite a **Senha Atual**
3. Digite a **Nova Senha** (mínimo 6 caracteres)
4. **Confirme a Nova Senha**
5. Clique em **Alterar Senha**
6. Faça logout e login com a nova senha

### Teste 3: Validações
1. Tente salvar perfil com nome vazio → Deve mostrar erro
2. Tente alterar senha com senhas diferentes → Deve mostrar erro
3. Tente alterar senha com menos de 6 caracteres → Deve mostrar erro
4. Tente alterar senha com senha atual incorreta → Deve mostrar erro

### Teste 4: Políticas RLS
1. Faça login com usuário A
2. Tente acessar o perfil via console:
   ```javascript
   // Deve funcionar (próprio perfil)
   await supabase.from('profiles').select('*').eq('id', userA.id)
   
   // Deve falhar (perfil de outro usuário)
   await supabase.from('profiles').select('*').eq('id', userB.id)
   ```

## 📝 Notas Importantes

1. **Email não pode ser alterado** - Gerenciado pelo Supabase Auth, requer processo específico
2. **Role não pode ser alterado** - Apenas admins podem alterar via painel de administração
3. **Senha verificada via login** - Garante que o usuário conhece a senha atual
4. **Cache do AuthContext** - Após atualizar perfil, o cache será atualizado no próximo login

## 🔄 Próximos Passos Recomendados

1. **Adicionar foto de perfil** - Upload de avatar para storage do Supabase
2. **Histórico de alterações** - Log de mudanças no perfil
3. **Autenticação de dois fatores** - Implementar 2FA via Supabase
4. **Notificações por email** - Avisar sobre alterações de senha
5. **Validação de senha forte** - Adicionar medidor de força da senha

## 📄 Arquivos Modificados

- ✅ `src/pages/Settings.jsx` - Refatoração completa
- ✅ `docs/SETTINGS_PAGE_REFACTOR.md` - Esta documentação

## 🔗 Referências

- [Supabase Auth - Update User](https://supabase.com/docs/reference/javascript/auth-updateuser)
- [Supabase Database - Update](https://supabase.com/docs/reference/javascript/update)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
