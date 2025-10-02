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
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
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

  // Testar conexão com API
  testApiConnection: async () => {
    debug.log('Testando conexão com API...');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://168.231.90.41:3001';
      
      const response = await fetch(`${apiUrl}/api/health`);
      
      if (!response.ok) {
        debug.error('Erro na conexão com API:', response.statusText);
        return { success: false, error: response.statusText };
      }

      const data = await response.json();
      debug.success('Conexão com API OK', { data });
      return { success: true, data };
      
    } catch (error) {
      debug.error('Erro ao testar API:', error);
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
    
    // 5. Testar API
    await debug.testApiConnection();
    
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
