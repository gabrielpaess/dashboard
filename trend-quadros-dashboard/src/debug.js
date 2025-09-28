/**
 * Debug Helper para Dashboard
 * Adiciona logs detalhados para identificar problemas
 */

export const debug = {
  // Log com timestamp
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 DEBUG: ${message}`, data || '');
  },

  // Log de erro
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ERROR: ${message}`, error || '');
  },

  // Log de sucesso
  success: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ SUCCESS: ${message}`, data || '');
  },

  // Verificar variáveis de ambiente
  checkEnvVars: () => {
    debug.log('Verificando variáveis de ambiente...');
    
    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    };

    debug.log('Variáveis de ambiente:', envVars);
    
    return envVars;
  },

  // Verificar se está no browser
  checkBrowser: () => {
    debug.log('Verificando ambiente do browser...');
    
    const browserInfo = {
      isBrowser: typeof window !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      location: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };

    debug.log('Informações do browser:', browserInfo);
    
    return browserInfo;
  },

  // Verificar localStorage
  checkLocalStorage: () => {
    debug.log('Verificando localStorage...');
    
    if (typeof localStorage === 'undefined') {
      debug.error('localStorage não disponível');
      return null;
    }

    const storageData = {
      user: localStorage.getItem('user'),
      isAuthenticated: localStorage.getItem('isAuthenticated'),
      keys: Object.keys(localStorage)
    };

    debug.log('Dados do localStorage:', storageData);
    
    return storageData;
  },

  // Verificar se há erros no console
  checkConsoleErrors: () => {
    debug.log('Verificando erros no console...');
    
    // Interceptar erros
    const originalError = console.error;
    const errors = [];
    
    console.error = (...args) => {
      errors.push(args);
      originalError.apply(console, args);
    };

    // Restaurar após 5 segundos
    setTimeout(() => {
      console.error = originalError;
      if (errors.length > 0) {
        debug.error('Erros capturados:', errors);
      } else {
        debug.success('Nenhum erro capturado');
      }
    }, 5000);

    return errors;
  },

  // Testar conexão com Supabase
  testSupabaseConnection: async () => {
    debug.log('Testando conexão com Supabase...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jpkpifxctubvauwjvimd.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('id')
        .limit(1);

      if (error) {
        debug.error('Erro na conexão com Supabase:', error);
        return { success: false, error };
      }

      debug.success('Conexão com Supabase OK', { data });
      return { success: true, data };
      
    } catch (error) {
      debug.error('Erro ao testar Supabase:', error);
      return { success: false, error };
    }
  },

  // Executar todos os testes
  runAllTests: async () => {
    debug.log('=== INICIANDO TESTES DE DEBUG ===');
    
    // 1. Verificar ambiente
    debug.checkBrowser();
    
    // 2. Verificar variáveis de ambiente
    debug.checkEnvVars();
    
    // 3. Verificar localStorage
    debug.checkLocalStorage();
    
    // 4. Verificar erros no console
    debug.checkConsoleErrors();
    
    // 5. Testar Supabase
    await debug.testSupabaseConnection();
    
    debug.log('=== TESTES DE DEBUG CONCLUÍDOS ===');
  }
};

// Auto-executar testes se estiver no browser
if (typeof window !== 'undefined') {
  debug.log('Debug helper carregado');
  
  // Executar testes após 2 segundos
  setTimeout(() => {
    debug.runAllTests();
  }, 2000);
}
