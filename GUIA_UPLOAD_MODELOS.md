# 🚀 Guia Rápido: Upload de Modelos de Indicadores

## ❌ Problema Identificado

Ao tentar usar modelos de indicadores no site em produção, ocorre o erro:
```
Error: Invalid HTML: could not find <table>
```

**Causa**: Os arquivos Excel na pasta `/modelo_indicadores/` não são acessíveis em produção via `fetch()`.

**Solução**: Armazenar os modelos no **Supabase Storage**.

---

## ✅ Solução Implementada

### 1️⃣ Código Atualizado

O código em `src/pages/ProjectDetails.jsx` foi atualizado para buscar modelos do Supabase Storage:

```javascript
// ANTES (não funciona em produção)
const response = await fetch(`/modelo_indicadores/${filename}`);

// DEPOIS (funciona em produção)
const templateUrl = `${SUPABASE_URL}/storage/v1/object/public/indicator-templates/${filename}`;
const response = await fetch(templateUrl);
```

### 2️⃣ Script de Upload Criado

Foi criado o script `scripts/upload-templates-to-supabase.js` que:
- Cria o bucket `indicator-templates` no Supabase Storage
- Faz upload de todos os arquivos `.xlsx` da pasta `modelo_indicadores/`
- Gera URLs públicas para cada modelo

---

## 📋 Passo a Passo para Resolver

### **Passo 1: Obter Service Role Key**

1. Acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/settings/api
2. Copie a **Service Role Key** (não é a anon key!)
3. ⚠️ **IMPORTANTE**: Esta chave é secreta, nunca compartilhe ou commite no Git

### **Passo 2: Criar arquivo .env**

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```

2. Abra o arquivo `.env` e adicione sua Service Role Key:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
   ```

### **Passo 3: Executar Upload**

Execute o script de upload:

```bash
node scripts/upload-templates-to-supabase.js
```

**Saída esperada:**
```
🚀 Iniciando upload de modelos para Supabase Storage

🪣 Verificando bucket...
✅ Bucket criado com sucesso

📁 Lendo diretório de modelos...
📋 Encontrados 14 modelos:

📤 Uploading: g1_prazo_decorrido.xlsx (11363 bytes)
✅ Upload concluído: g1_prazo_decorrido.xlsx
   URL: https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx

...

✨ Upload concluído: 14/14 arquivos
```

### **Passo 4: Verificar no Supabase**

1. Acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/storage/buckets
2. Clique no bucket `indicator-templates`
3. Você deve ver todos os 14 arquivos `.xlsx`

### **Passo 5: Testar no Site**

1. Faça o deploy do código atualizado (já foi feito no commit anterior)
2. Acesse a aba "Indicadores" de um projeto
3. Clique em "Incluir gráfico"
4. Selecione um modelo
5. ✅ Deve funcionar sem erros!

---

## 🔍 Verificação Rápida

Para testar se um modelo está acessível, execute no console do navegador:

```javascript
fetch('https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx')
  .then(r => console.log('Status:', r.status, r.ok ? '✅ OK' : '❌ Erro'))
```

Se retornar `Status: 200 ✅ OK`, está funcionando!

---

## 📦 Modelos Disponíveis

Após o upload, os seguintes modelos estarão disponíveis:

1. **g1_prazo_decorrido.xlsx** - Prazo Decorrido (rosca)
2. **g2_comparativo_faturamento_acumulado.xlsx** - Faturamento Acumulado (barras)
3. **g3_alocacao_recursos.xlsx** - Alocação de Recursos (barras)
4. **g4_comparativo_faturamento_mes_combo.xlsx** - Faturamento Mensal (combo)
5. **g5_comparativo_mod_mes_combo.xlsx** - MOD Mensal (combo)
6. **g6_comparativo_mod_relevantes.xlsx** - MOD Relevantes (barras)
7. **g7_comparativo_fat_mod.xlsx** - Alocação MOD (barras)
8. **g8_comparativo_moi_mes_combo.xlsx** - MOI Mensal (combo)
9. **g9_comparativo_moi_relevantes.xlsx** - MOI Relevantes (barras)
10. **g10_comparativo_fat_moi.xlsx** - Alocação MOI (barras)
11. **g11_comparativo_fat_eqp.xlsx** - Alocação EQP (barras)
12. **g12_comparativo_eqp_mes_combo.xlsx** - Equipamentos Mensal (combo)
13. **g13_comparativo_eqp_relevantes.xlsx** - Equipamentos Relevantes (barras)
14. **g14_comparativo_hh.xlsx** - Homem-Hora (barras)

---

## 🔧 Adicionar Novo Modelo

Para adicionar um novo modelo no futuro:

1. Adicione o arquivo `.xlsx` na pasta `modelo_indicadores/`
2. Atualize os metadados em `src/components/projects/IndicatorTemplateSelector.jsx`
3. Execute novamente: `node scripts/upload-templates-to-supabase.js`
4. Faça commit e deploy

---

## ❓ Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrada"
- Verifique se o arquivo `.env` existe
- Verifique se a chave está correta no arquivo `.env`

### Erro: "Bucket already exists"
- Isso é normal! O script detecta e continua

### Erro ao fazer upload
- Verifique sua conexão com internet
- Verifique se a Service Role Key está correta
- Verifique se os arquivos existem na pasta `modelo_indicadores/`

### Modelos não aparecem no site
- Verifique se o upload foi concluído com sucesso
- Verifique se o código foi deployado (commit mais recente)
- Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Console do navegador (F12) para erros
2. Logs do script de upload
3. Dashboard do Supabase Storage

---

## ✨ Benefícios da Solução

- ✅ Funciona em produção
- ✅ Modelos acessíveis de qualquer lugar
- ✅ CDN do Supabase para performance
- ✅ Fácil atualização sem redeploy
- ✅ Controle de acesso se necessário
- ✅ Backup automático no Supabase
