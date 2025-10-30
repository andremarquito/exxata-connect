# Upload de Modelos de Indicadores para Supabase Storage

Este documento explica como fazer upload dos modelos de indicadores para o Supabase Storage.

## Por que usar Supabase Storage?

Em produção, os arquivos na pasta `/modelo_indicadores/` não são acessíveis via `fetch()`. A solução é armazenar os modelos no **Supabase Storage**, que fornece:

- ✅ URLs públicas acessíveis de qualquer lugar
- ✅ CDN para performance
- ✅ Controle de acesso
- ✅ Fácil atualização sem redeploy

## Pré-requisitos

1. **Service Role Key do Supabase**: Obtenha em https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/settings/api
2. **Node.js** instalado
3. **Dependências** instaladas: `npm install`

## Como fazer upload

### 1. Configurar variável de ambiente

Crie um arquivo `.env` na raiz do projeto (se não existir) e adicione:

```bash
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

⚠️ **IMPORTANTE**: Nunca commite a Service Role Key no Git!

### 2. Executar script de upload

```bash
node scripts/upload-templates-to-supabase.js
```

O script irá:
1. Criar o bucket `indicator-templates` (se não existir)
2. Fazer upload de todos os arquivos `.xlsx` da pasta `modelo_indicadores/`
3. Exibir as URLs públicas de cada modelo

### 3. Verificar no Supabase Dashboard

Acesse: https://supabase.com/dashboard/project/lrnpdyqcxstghzrujywf/storage/buckets/indicator-templates

Você deve ver todos os arquivos `.xlsx` listados.

## Estrutura do Bucket

- **Nome**: `indicator-templates`
- **Tipo**: Público
- **Limite de tamanho**: 5MB por arquivo
- **Tipos permitidos**: `.xlsx`, `.xls`

## URLs dos Modelos

Após o upload, os modelos estarão disponíveis em:

```
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/{filename}
```

Exemplo:
```
https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx
```

## Atualizar Modelos

Para atualizar um modelo existente:

1. Substitua o arquivo na pasta `modelo_indicadores/`
2. Execute novamente o script de upload
3. O arquivo será sobrescrito automaticamente (opção `upsert: true`)

## Adicionar Novo Modelo

1. Adicione o arquivo `.xlsx` na pasta `modelo_indicadores/`
2. Atualize os metadados em `src/components/projects/IndicatorTemplateSelector.jsx`:

```javascript
const TEMPLATE_METADATA = {
  // ... modelos existentes
  'novo_modelo.xlsx': {
    name: 'Nome do Modelo',
    description: 'Descrição do modelo',
    type: 'bar', // bar, line, pie, doughnut, combo
    category: 'Categoria', // Faturamento, MOD, MOI, etc.
    icon: IconComponent,
    color: 'blue'
  }
};
```

3. Execute o script de upload

## Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrada"

Certifique-se de que o arquivo `.env` existe e contém a chave correta.

### Erro: "Bucket already exists"

Isso é normal. O script detecta que o bucket já existe e continua com o upload.

### Erro: "Invalid HTML: could not find <table>"

Este erro ocorre quando o código tenta buscar da pasta local. Certifique-se de que:
1. O bucket foi criado
2. Os arquivos foram enviados
3. O código em `ProjectDetails.jsx` está usando a URL do Supabase Storage

### Verificar se modelo foi enviado

Execute no console do navegador:

```javascript
fetch('https://lrnpdyqcxstghzrujywf.supabase.co/storage/v1/object/public/indicator-templates/g1_prazo_decorrido.xlsx')
  .then(r => console.log('Status:', r.status, r.ok))
```

Se retornar `Status: 200 true`, o arquivo está acessível.

## Segurança

- ✅ Bucket é público (necessário para acesso direto)
- ✅ Apenas arquivos Excel são permitidos
- ✅ Limite de 5MB por arquivo
- ✅ Service Role Key nunca é exposta no frontend

## Manutenção

- **Backup**: Mantenha os arquivos originais na pasta `modelo_indicadores/`
- **Versionamento**: Considere adicionar data/versão ao nome do arquivo para histórico
- **Limpeza**: Remova modelos antigos do bucket se não forem mais usados
