/**
 * API Route para Testar Variáveis de Ambiente
 * 
 * Este endpoint testa se as variáveis de ambiente estão sendo carregadas corretamente
 */

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    console.log('🧪 Testando variáveis de ambiente...');
    
    // Verificar variáveis de ambiente
    const envVars = {
      // Tiny API
      VITE_TINY_API_TOKEN: process.env.VITE_TINY_API_TOKEN ? '✅ Configurada' : '❌ Não configurada',
      TINY_API_TOKEN: process.env.TINY_API_TOKEN ? '✅ Configurada' : '❌ Não configurada',
      VITE_TINY_API_URL: process.env.VITE_TINY_API_URL ? '✅ Configurada' : '❌ Não configurada',
      
      // Supabase
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      
      // Outras
      NODE_ENV: process.env.NODE_ENV || 'development',
      VERCEL: process.env.VERCEL ? '✅ Sim' : '❌ Não',
      VERCEL_URL: process.env.VERCEL_URL || 'Não definida'
    };
    
    // Verificar se as variáveis essenciais estão presentes
    const essentialVars = [
      'VITE_TINY_API_TOKEN',
      'VITE_SUPABASE_URL', 
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = essentialVars.filter(varName => !process.env[varName]);
    
    console.log('📊 Status das variáveis:', envVars);
    
    return res.status(200).json({
      success: true,
      message: 'Teste de variáveis de ambiente concluído',
      data: {
        environment: envVars,
        missing: missingVars,
        essentialVarsPresent: missingVars.length === 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de variáveis:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
