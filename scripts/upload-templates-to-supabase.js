import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://lrnpdyqcxstghzrujywf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role key para admin

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'indicator-templates';
const TEMPLATES_DIR = path.join(__dirname, '..', 'modelo_indicadores');

async function createBucketIfNotExists() {
  console.log('🪣 Verificando bucket...');
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError);
    return false;
  }
  
  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log('📦 Criando bucket:', BUCKET_NAME);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Bucket público para acesso direto
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]
    });
    
    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      return false;
    }
    
    console.log('✅ Bucket criado com sucesso');
  } else {
    console.log('✅ Bucket já existe');
  }
  
  return true;
}

async function uploadTemplate(filename) {
  const filePath = path.join(TEMPLATES_DIR, filename);
  
  // Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filename}`);
    return false;
  }
  
  // Ler arquivo
  const fileBuffer = fs.readFileSync(filePath);
  
  console.log(`📤 Uploading: ${filename} (${fileBuffer.length} bytes)`);
  
  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, fileBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true // Sobrescrever se já existir
    });
  
  if (error) {
    console.error(`❌ Erro ao fazer upload de ${filename}:`, error);
    return false;
  }
  
  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);
  
  console.log(`✅ Upload concluído: ${filename}`);
  console.log(`   URL: ${urlData.publicUrl}`);
  
  return true;
}

async function main() {
  console.log('🚀 Iniciando upload de modelos para Supabase Storage\n');
  
  // Criar bucket se não existir
  const bucketReady = await createBucketIfNotExists();
  if (!bucketReady) {
    console.error('❌ Não foi possível preparar o bucket');
    process.exit(1);
  }
  
  console.log('\n📁 Lendo diretório de modelos...');
  
  // Listar arquivos .xlsx
  const files = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
  
  console.log(`📋 Encontrados ${files.length} modelos:\n`);
  
  // Upload de cada arquivo
  let successCount = 0;
  for (const file of files) {
    const success = await uploadTemplate(file);
    if (success) successCount++;
    console.log(''); // Linha em branco
  }
  
  console.log(`\n✨ Upload concluído: ${successCount}/${files.length} arquivos`);
  
  // Listar URLs públicas
  console.log('\n📎 URLs públicas dos modelos:');
  for (const file of files) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(file);
    console.log(`   ${file}: ${data.publicUrl}`);
  }
}

main().catch(console.error);
