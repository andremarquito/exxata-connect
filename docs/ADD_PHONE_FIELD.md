# Adição do Campo Telefone

## Resumo

Campo "Telefone" adicionado em toda a aplicação para permitir que usuários cadastrem e editem seus números de telefone.

## 🗄️ Alterações no Banco de Dados

### Migração Aplicada
```sql
-- Arquivo: supabase/migrations/add_phone_to_profiles.sql

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN profiles.phone IS 'Número de telefone do usuário (formato livre)';
```

**Status**: ✅ Migração aplicada com sucesso no Supabase

### Schema Atualizado

```sql
-- Tabela profiles - Novos campos
phone  TEXT  -- Número de telefone (formato livre, opcional)
```

## 📝 Alterações nos Arquivos

### 1. Settings.jsx (Página de Configurações)

**Estado adicionado:**
```javascript
const [phone, setPhone] = useState('');
```

**Carregamento do perfil:**
```javascript
setPhone(data.phone || '');
```

**Atualização do perfil:**
```javascript
const { error } = await supabase
  .from('profiles')
  .update({
    name: name.trim(),
    empresa: empresa.trim(),
    phone: phone.trim(),  // ← Novo campo
    updated_at: new Date().toISOString()
  })
  .eq('id', user.id);
```

**Interface (Aba Perfil):**
```jsx
<div className="space-y-2">
  <Label htmlFor="phone">Telefone</Label>
  <Input 
    id="phone"
    type="tel"
    value={phone} 
    onChange={(e) => setPhone(e.target.value)}
    placeholder="(00) 00000-0000"
  />
  <p className="text-xs text-muted-foreground">
    Formato: (DDD) 00000-0000 ou (DDD) 0000-0000
  </p>
</div>
```

### 2. SignUp.jsx (Página de Criar Conta)

**Estado adicionado:**
```javascript
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  empresa: '',
  phone: '',  // ← Novo campo
  password: '',
  confirmPassword: ''
});
```

**Envio ao signup:**
```javascript
const result = await signup(formData.email, formData.password, {
  full_name: formData.fullName.trim(),
  empresa: formData.empresa.trim(),
  phone: formData.phone.trim()  // ← Novo campo
});
```

**Interface:**
```jsx
<div className="space-y-2">
  <Label htmlFor="phone">Telefone</Label>
  <Input
    id="phone"
    name="phone"
    type="tel"
    placeholder="(00) 00000-0000"
    value={formData.phone}
    onChange={handleChange}
  />
</div>
```

### 3. AuthContext.jsx (Contexto de Autenticação)

**Criação de perfil no signup:**
```javascript
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: data.user.id,
    email: email.trim().toLowerCase(),
    name: metadata.full_name || email.split('@')[0],
    empresa: metadata.empresa,
    phone: metadata.phone,  // ← Novo campo
    role: 'cliente',
    status: data.user.email_confirmed_at ? 'Ativo' : 'Pendente',
    invited_at: new Date().toISOString(),
  });
```

## 🎨 Características do Campo

### Formato
- **Tipo**: `tel` (HTML5 input type)
- **Formato sugerido**: `(DDD) 00000-0000` ou `(DDD) 0000-0000`
- **Validação**: Nenhuma (formato livre)
- **Obrigatoriedade**: Opcional

### Posicionamento

**Settings.jsx (Aba Perfil):**
1. Nome Completo
2. E-mail (somente leitura)
3. Empresa
4. **Telefone** ← Novo
5. Função (somente leitura)

**SignUp.jsx:**
1. Nome Completo
2. Empresa
3. **Telefone** ← Novo
4. E-mail
5. Senha
6. Confirmar Senha

## 🔒 Políticas RLS

O campo `phone` é protegido pelas mesmas políticas RLS existentes:

```sql
-- Usuários podem ver e atualizar seu próprio telefone
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver e atualizar telefones de todos
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    auth.email() IN ('admin@exxata.com', 'andre.marquito@exxata.com.br')
  );
```

## 🧪 Como Testar

### Teste 1: Criar Nova Conta com Telefone
1. Acesse a página de **Criar Conta**
2. Preencha todos os campos incluindo o **Telefone**
3. Clique em **Criar Conta**
4. Verifique no Supabase se o telefone foi salvo:
   ```sql
   SELECT name, email, phone FROM profiles WHERE email = 'teste@exemplo.com';
   ```

### Teste 2: Atualizar Telefone em Configurações
1. Faça login na aplicação
2. Acesse **Configurações** > **Perfil**
3. Altere o campo **Telefone**
4. Clique em **Salvar Alterações**
5. Recarregue a página e confirme que o telefone foi atualizado

### Teste 3: Telefone Opcional no Cadastro
1. Acesse a página de **Criar Conta**
2. Preencha todos os campos **exceto** o telefone
3. Clique em **Criar Conta**
4. Verifique que a conta foi criada com sucesso (telefone = null)

### Teste 4: Formatos Diferentes
Teste que o campo aceita diferentes formatos:
- `(11) 98765-4321`
- `11987654321`
- `+55 11 98765-4321`
- `(11) 3456-7890`

## 📊 Consultas Úteis

### Ver todos os telefones cadastrados
```sql
SELECT 
  name,
  email,
  phone,
  empresa
FROM profiles
WHERE phone IS NOT NULL
ORDER BY created_at DESC;
```

### Contar usuários com telefone
```sql
SELECT 
  COUNT(*) FILTER (WHERE phone IS NOT NULL) as com_telefone,
  COUNT(*) FILTER (WHERE phone IS NULL) as sem_telefone,
  COUNT(*) as total
FROM profiles;
```

### Atualizar telefone de um usuário específico (admin)
```sql
UPDATE profiles
SET phone = '(11) 98765-4321'
WHERE email = 'usuario@exemplo.com';
```

## 🔄 Melhorias Futuras Recomendadas

### 1. Validação de Formato
Adicionar validação para garantir formato brasileiro:
```javascript
const validatePhone = (phone) => {
  // Remover caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Validar se tem 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }
  
  return true;
};
```

### 2. Máscara Automática
Implementar máscara para formatação automática:
```javascript
const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 10) {
    // (11) 3456-7890
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    // (11) 98765-4321
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};
```

### 3. Verificação de Telefone
Implementar sistema de verificação via SMS:
- Enviar código de verificação
- Campo `phone_verified` (boolean)
- Campo `phone_verified_at` (timestamp)

### 4. Notificações por SMS
Usar telefone para enviar notificações importantes:
- Alteração de senha
- Login de novo dispositivo
- Atividades críticas no projeto

### 5. WhatsApp Integration
Adicionar botão para contato direto via WhatsApp:
```jsx
{phone && (
  <a 
    href={`https://wa.me/55${phone.replace(/\D/g, '')}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    Contatar via WhatsApp
  </a>
)}
```

## 📄 Arquivos Modificados

- ✅ `supabase/migrations/add_phone_to_profiles.sql` - Migração do banco
- ✅ `src/pages/Settings.jsx` - Campo na aba Perfil
- ✅ `src/pages/SignUp.jsx` - Campo no cadastro
- ✅ `src/contexts/AuthContext.jsx` - Salvar phone no signup
- ✅ `docs/ADD_PHONE_FIELD.md` - Esta documentação

## 🎯 Status

- ✅ Migração aplicada no Supabase
- ✅ Campo adicionado em Settings.jsx
- ✅ Campo adicionado em SignUp.jsx
- ✅ AuthContext atualizado
- ✅ Documentação criada
- ⏳ Validação de formato (futuro)
- ⏳ Máscara automática (futuro)
- ⏳ Verificação por SMS (futuro)

## 🔗 Referências

- [HTML5 Input Type Tel](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel)
- [Supabase Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [React Hook Form - Phone Validation](https://react-hook-form.com/get-started#Applyvalidation)
