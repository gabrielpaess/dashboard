/**
 * API Route para Debug do Frontend
 * 
 * Este endpoint retorna informações de debug para o frontend
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
    console.log('🔍 Debug do Frontend...');
    
    // Verificar variáveis de ambiente
    const envVars = {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada',
      NODE_ENV: process.env.NODE_ENV || 'development',
      VERCEL: process.env.VERCEL ? '✅ Sim' : '❌ Não'
    };
    
    return res.status(200).json({
      success: true,
      message: 'Debug do Frontend',
      data: {
        environment: envVars,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'Unknown',
        url: req.url,
        method: req.method
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
