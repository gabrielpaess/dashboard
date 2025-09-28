/**
 * Configuração de Build para Vercel
 * Este arquivo ajuda a configurar o build corretamente
 */

console.log('🔧 Configurando build para Vercel...');

// Verificar variáveis de ambiente
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️ Variáveis de ambiente faltando:', missingVars);
} else {
  console.log('✅ Todas as variáveis de ambiente necessárias estão configuradas');
}

// Configurações específicas para Vercel
const vercelConfig = {
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  installCommand: 'npm install',
  framework: 'vite',
  nodeVersion: '18.x'
};

console.log('🔧 Configuração Vercel:', vercelConfig);

export default vercelConfig;
