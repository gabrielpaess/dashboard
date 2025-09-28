/**
 * Repositório de Pedidos para Frontend
 * Versão simplificada que só consome dados do Supabase
 * Não precisa do token da API Tiny
 */

import { SupabaseOrderService } from '../api/supabase/SupabaseOrderService.js';

export class FrontendOrderRepository {
  constructor(config = {}) {
    // Apenas Supabase - não precisa da API Tiny no frontend
    this.supabaseService = new SupabaseOrderService(config.supabase);
  }

  /**
   * Buscar pedidos do Supabase (único método usado no frontend)
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta do Supabase
   */
  async getSupabaseOrders(filters = {}) {
    try {
      return await this.supabaseService.getOrders(filters);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do Supabase:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Validar conexão com Supabase
   * @returns {Promise<Object>} Status da conexão
   */
  async validateConnection() {
    try {
      return await this.supabaseService.validateConnection();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter estatísticas do serviço
   * @returns {Object} Estatísticas
   */
  getServiceStats() {
    return {
      supabase: this.supabaseService.getServiceStats(),
      tiny: { status: 'not_used_in_frontend' }
    };
  }
}
