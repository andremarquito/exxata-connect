import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Certifique-se de definir VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  )
}

// Criar cliente do Supabase com configurações simplificadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Função para verificar conexão com Supabase
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('_health_check').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não encontrada (normal)
      throw error
    }
    console.log('✅ Conexão com Supabase estabelecida com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message)
    return false
  }
}

// Função para obter informações da sessão atual
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Erro ao obter sessão:', error.message)
    return null
  }
}

// Função para obter usuário atual
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error.message)
    return null
  }
}

export default supabase
