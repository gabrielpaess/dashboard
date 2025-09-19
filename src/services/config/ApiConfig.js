/**
 * Configuração Centralizada das APIs
 * Gerencia configurações de todas as APIs do sistema
 */

export class ApiConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Carregar configurações do ambiente
   * @returns {Object} Configurações carregadas
   */
  loadConfig() {
    // Função para obter variável de ambiente (funciona no browser e Node.js)
    const getEnvVar = (key) => {
      if (typeof window !== 'undefined' && import.meta?.env) {
        // Browser com Vite
        return import.meta.env[key];
      } else if (typeof process !== 'undefined' && process.env) {
        // Node.js
        return process.env[key];
      }
      return undefined;
    };

    return {
      tiny: {
        token: getEnvVar('VITE_TINY_API_TOKEN'),
        baseURL: 'https://api.tiny.com.br/api2',
        timeout: 15000,
        retryAttempts: 3,
        rateLimit: {
          requests: 100,
          per: 'minute'
        },
        cache: {
          ttl: 5 * 60 * 1000, // 5 minutos
          maxSize: 500
        }
      },
      supabase: {
        url: getEnvVar('VITE_SUPABASE_URL'),
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        serviceRoleKey: getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY'),
        timeout: 10000,
        retryAttempts: 3,
        rateLimit: {
          requests: 200,
          per: 'minute'
        },
        cache: {
          ttl: 2 * 60 * 1000, // 2 minutos
          maxSize: 1000
        }
      },
      instagram: {
        accessToken: getEnvVar('VITE_INSTAGRAM_ACCESS_TOKEN'),
        appId: getEnvVar('VITE_INSTAGRAM_APP_ID'),
        appSecret: getEnvVar('VITE_INSTAGRAM_APP_SECRET'),
        baseURL: 'https://graph.facebook.com/v18.0',
        timeout: 15000,
        retryAttempts: 3,
        rateLimit: {
          requests: 200,
          per: 'hour'
        },
        cache: {
          ttl: 10 * 60 * 1000, // 10 minutos
          maxSize: 200
        }
      },
      sync: {
        interval: 30 * 60 * 1000, // 30 minutos
        batchSize: 100,
        retryAttempts: 3,
        maxHistory: 50
      }
    };
  }

  /**
   * Obter configuração de uma API específica
   * @param {string} apiName - Nome da API
   * @returns {Object} Configuração da API
   */
  getApiConfig(apiName) {
    const config = this.config[apiName];
    if (!config) {
      throw new Error(`Configuração da API '${apiName}' não encontrada`);
    }
    return config;
  }

  /**
   * Obter configuração do Tiny
   * @returns {Object} Configuração do Tiny
   */
  getTinyConfig() {
    return this.getApiConfig('tiny');
  }

  /**
   * Obter configuração do Supabase
   * @returns {Object} Configuração do Supabase
   */
  getSupabaseConfig() {
    return this.getApiConfig('supabase');
  }

  /**
   * Obter configuração do Instagram
   * @returns {Object} Configuração do Instagram
   */
  getInstagramConfig() {
    return this.getApiConfig('instagram');
  }

  /**
   * Obter configuração de sincronização
   * @returns {Object} Configuração de sincronização
   */
  getSyncConfig() {
    return this.config.sync;
  }

  /**
   * Validar configurações
   * @returns {Object} Resultado da validação
   */
  validateConfig() {
    const errors = [];
    const warnings = [];

    // Validar Tiny
    if (!this.config.tiny.token) {
      errors.push('VITE_TINY_API_TOKEN não configurado');
    }

    // Validar Supabase
    if (!this.config.supabase.url) {
      errors.push('VITE_SUPABASE_URL não configurado');
    }
    if (!this.config.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY não configurado');
    }
    if (!this.config.supabase.serviceRoleKey) {
      warnings.push('VITE_SUPABASE_SERVICE_ROLE_KEY não configurado (usando anon key)');
    }

    // Validar Instagram
    if (!this.config.instagram.accessToken) {
      warnings.push('VITE_INSTAGRAM_ACCESS_TOKEN não configurado (Instagram não disponível)');
    }
    if (!this.config.instagram.appId) {
      warnings.push('VITE_INSTAGRAM_APP_ID não configurado');
    }
    if (!this.config.instagram.appSecret) {
      warnings.push('VITE_INSTAGRAM_APP_SECRET não configurado');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obter configuração completa
   * @returns {Object} Configuração completa
   */
  getFullConfig() {
    return {
      ...this.config,
      validation: this.validateConfig()
    };
  }

  /**
   * Atualizar configuração
   * @param {string} apiName - Nome da API
   * @param {Object} newConfig - Nova configuração
   */
  updateApiConfig(apiName, newConfig) {
    if (!this.config[apiName]) {
      throw new Error(`API '${apiName}' não encontrada`);
    }
    
    this.config[apiName] = {
      ...this.config[apiName],
      ...newConfig
    };
  }

  /**
   * Obter configuração para desenvolvimento
   * @returns {Object} Configuração de desenvolvimento
   */
  getDevConfig() {
    return {
      ...this.config,
      tiny: {
        ...this.config.tiny,
        timeout: 30000, // 30 segundos em dev
        retryAttempts: 5
      },
      supabase: {
        ...this.config.supabase,
        timeout: 15000 // 15 segundos em dev
      },
      instagram: {
        ...this.config.instagram,
        timeout: 30000 // 30 segundos em dev
      }
    };
  }

  /**
   * Obter configuração para produção
   * @returns {Object} Configuração de produção
   */
  getProdConfig() {
    return {
      ...this.config,
      tiny: {
        ...this.config.tiny,
        timeout: 10000, // 10 segundos em prod
        retryAttempts: 2
      },
      supabase: {
        ...this.config.supabase,
        timeout: 8000 // 8 segundos em prod
      },
      instagram: {
        ...this.config.instagram,
        timeout: 10000 // 10 segundos em prod
      }
    };
  }
}

// Exportar instância singleton
export const apiConfig = new ApiConfig();
export default apiConfig;
