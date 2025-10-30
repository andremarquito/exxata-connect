# 📤 Upload Manual de Modelos - Guia Rápido

## ✅ Bucket Criado com Sucesso!

O bucket `indicator-templates` foi criado no Supabase Storage com as seguintes configurações:
- ✅ Público (acesso de leitura para todos)
- ✅ Limite de 5MB por arquivo
- ✅ Aceita arquivos .xlsx e .xls
- ✅ Políticas RLS configuradas

---

## 📋 Opção 1: Upload via Dashboard (MAIS FÁCIL)

### Passo 1: Acessar Storage
1. Acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/storage/buckets/indicator-templates
2. Faça login se necessário

### Passo 2: Fazer Upload dos Modelos
1. Clique no botão **"Upload file"** ou **"Upload files"**
2. Selecione TODOS os 14 arquivos da pasta `modelo_indicadores/`:
   - g1_prazo_decorrido.xlsx
   - g2_comparativo_faturamento_acumulado.xlsx
   - g3_alocacao_recursos.xlsx
   - g4_comparativo_faturamento_mes_combo.xlsx
   - g5_comparativo_mod_mes_combo.xlsx
   - g6_comparativo_mod_relevantes.xlsx
   - g7_comparativo_fat_mod.xlsx
   - g8_comparativo_moi_mes_combo.xlsx
   - g9_comparativo_moi_relevantes.xlsx
   - g10_comparativo_fat_moi.xlsx
   - g11_comparativo_fat_eqp.xlsx
   - g12_comparativo_eqp_mes_combo.xlsx
   - g13_comparativo_eqp_relevantes.xlsx
   - g14_comparativo_hh.xlsx

3. Aguarde o upload completar
4. ✅ Pronto! Os modelos estão disponíveis

### Passo 3: Verificar
Após o upload, você deve ver os 14 arquivos listados no bucket.

---

## 📋 Opção 2: Upload via Script (Requer Service Role Key)

Se você tiver a **Service Role Key** do Supabase:

### Passo 1: Obter Service Role Key
1. Acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/settings/api
2. Copie a **Service Role Key** (não é a anon key!)

### Passo 2: Adicionar ao .env
Abra o arquivo `.env` e adicione:
```bash
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Passo 3: Executar Script
```bash
npm run upload:templates
```

O script irá fazer upload de todos os 14 modelos automaticamente.

---

## 🔍 Verificar se Funcionou

Após o upload (via Dashboard ou Script), teste se os modelos estão acessíveis:

### Teste 1: Via Navegador
Abra esta URL no navegador:
```
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx
```

Se o download iniciar, está funcionando! ✅

### Teste 2: Via Console do Navegador
No site em produção, abra o console (F12) e execute:
```javascript
fetch('https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx')
  .then(r => console.log('Status:', r.status, r.ok ? '✅ OK' : '❌ Erro'))
```

Deve retornar: `Status: 200 ✅ OK`

---

## 🚀 Próximos Passos

Após fazer o upload dos modelos:

1. ✅ Código já está atualizado (busca do Supabase Storage)
2. ✅ Bucket criado e configurado
3. ✅ Políticas RLS aplicadas
4. 📤 **VOCÊ PRECISA**: Fazer upload dos 14 arquivos (via Dashboard ou Script)
5. 🚀 Fazer deploy do código atualizado
6. 🎉 Testar no site em produção

---

## 📎 URLs dos Modelos

Após o upload, os modelos estarão disponíveis em:

```
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g2_comparativo_faturamento_acumulado.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g3_alocacao_recursos.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g4_comparativo_faturamento_mes_combo.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g5_comparativo_mod_mes_combo.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g6_comparativo_mod_relevantes.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g7_comparativo_fat_mod.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g8_comparativo_moi_mes_combo.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g9_comparativo_moi_relevantes.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g10_comparativo_fat_moi.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g11_comparativo_fat_eqp.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g12_comparativo_eqp_mes_combo.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g13_comparativo_eqp_relevantes.xlsx
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g14_comparativo_hh.xlsx
```

---

## ❓ Dúvidas?

- **Não consigo acessar o Dashboard**: Verifique se está logado no Supabase
- **Upload falha**: Verifique se os arquivos são .xlsx válidos
- **Modelos não aparecem no site**: Limpe o cache do navegador (Ctrl+Shift+R)
- **Erro 404 ao acessar URL**: Verifique se o upload foi concluído com sucesso

---

## ✨ Resumo

1. ✅ **Bucket criado**: `indicator-templates`
2. ✅ **Código atualizado**: Busca do Supabase Storage
3. ✅ **Políticas configuradas**: Acesso público de leitura
4. 📤 **Ação necessária**: Upload dos 14 arquivos via Dashboard
5. 🚀 **Deploy**: Após upload, fazer deploy e testar

**Recomendação**: Use a **Opção 1 (Dashboard)** - é mais rápido e não requer Service Role Key!
