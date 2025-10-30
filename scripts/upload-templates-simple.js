import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
config({ path: path.join(__dirname, '..', '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lrnpdyqcxstghzrujywf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Erro: Nenhuma chave do Supabase encontrada!');
  console.error('   Configure SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

console.log('🔑 Usando Supabase URL:', supabaseUrl);
console.log('🔑 Chave encontrada:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'indicator-templates';
const TEMPLATES_DIR = path.join(__dirname, '..', 'modelo_indicadores');

async function createBucketIfNotExists() {
  console.log('\n🪣 Verificando bucket...');
  
  try {
    // Tentar listar buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return false;
    }
    
    const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('📦 Criando bucket:', BUCKET_NAME);
      const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ]
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError.message);
        return false;
      }
      
      console.log('✅ Bucket criado com sucesso');
    } else {
      console.log('✅ Bucket já existe');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
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
  
  console.log(`\n📤 Uploading: ${filename} (${fileBuffer.length} bytes)`);
  
  try {
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true // Sobrescrever se já existir
      });
    
    if (error) {
      console.error(`❌ Erro ao fazer upload de ${filename}:`, error.message);
      return false;
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    
    console.log(`✅ Upload concluído: ${filename}`);
    console.log(`   URL: ${urlData.publicUrl}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado ao fazer upload de ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando upload de modelos para Supabase Storage');
  console.log('=' .repeat(60));
  
  // Criar bucket se não existir
  const bucketReady = await createBucketIfNotExists();
  if (!bucketReady) {
    console.error('\n❌ Não foi possível preparar o bucket');
    process.exit(1);
  }
  
  console.log('\n📁 Lendo diretório de modelos...');
  
  // Listar arquivos .xlsx (excluir arquivos temporários do Excel)
  const files = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$') && f.startsWith('g'));
  
  console.log(`📋 Encontrados ${files.length} modelos válidos (g1-g14)`);
  console.log('=' .repeat(60));
  
  // Upload de cada arquivo
  let successCount = 0;
  for (const file of files) {
    const success = await uploadTemplate(file);
    if (success) successCount++;
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`✨ Upload concluído: ${successCount}/${files.length} arquivos`);
  
  if (successCount > 0) {
    console.log('\n📎 URLs públicas dos modelos:');
    console.log('=' .repeat(60));
    for (const file of files) {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file);
      console.log(`${file}`);
      console.log(`  → ${data.publicUrl}\n`);
    }
    
    console.log('=' .repeat(60));
    console.log('✅ Todos os modelos estão prontos para uso!');
    console.log('🚀 Faça o deploy do código atualizado e teste no site.');
  } else {
    console.log('\n❌ Nenhum arquivo foi enviado com sucesso.');
  }
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
