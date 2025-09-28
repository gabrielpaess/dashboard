/**
 * Configuração Simplificada para Frontend
 * Apenas Supabase - não precisa da API Tiny
 */

export class FrontendApiConfig {
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
      supabase: {
        url: getEnvVar('VITE_SUPABASE_URL') || 'https://jpkpifxctubvauwjvimd.supabase.co',
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20'
      }
    };
  }

  /**
   * Obter configuração do Supabase
   * @returns {Object} Configuração do Supabase
   */
  getSupabaseConfig() {
    return this.config.supabase;
  }

  /**
   * Validar configurações
   * @returns {Object} Resultado da validação
   */
  validate() {
    const errors = [];
    const warnings = [];

    if (!this.config.supabase.url) {
      errors.push('VITE_SUPABASE_URL não configurada');
    }

    if (!this.config.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY não configurada');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
