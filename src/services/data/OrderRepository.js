/**
 * Repositório de Pedidos
 * Centraliza operações de dados para pedidos
 */

import { TinyOrderService } from '../api/tiny/TinyOrderService.js';
import { SupabaseOrderService } from '../api/supabase/SupabaseOrderService.js';
import { DataValidator } from '../utils/DataValidator.js';

export class OrderRepository {
  constructor(config = {}) {
    this.tinyService = new TinyOrderService(config.tiny);
    this.supabaseService = new SupabaseOrderService(config.supabase);
  }

  /**
   * Buscar pedidos de todas as fontes
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta consolidada
   */
  async getOrders(filters = {}) {
    try {
      const [tinyResponse, supabaseResponse] = await Promise.allSettled([
        this.tinyService.getOrders(filters),
        this.supabaseService.getOrders(filters)
      ]);

      const results = {
        success: true,
        data: {
          tiny: tinyResponse.status === 'fulfilled' ? tinyResponse.value : null,
          supabase: supabaseResponse.status === 'fulfilled' ? supabaseResponse.value : null
        },
        errors: {
          tiny: tinyResponse.status === 'rejected' ? tinyResponse.reason : null,
          supabase: supabaseResponse.status === 'rejected' ? supabaseResponse.reason : null
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'repository'
        }
      };

      return results;
    } catch (error) {
      console.error('❌ Erro no repositório de pedidos:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos apenas do Tiny
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta do Tiny
   */
  async getTinyOrders(filters = {}) {
    try {
      return await this.tinyService.getOrders(filters);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do Tiny:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos apenas do Supabase
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta do Supabase
   */
  async getSupabaseOrders(filters = {}) {
    try {
      return await this.supabaseService.getOrders(filters);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do Supabase:', error);
      throw error;
    }
  }

  /**
   * Sincronizar pedidos do Tiny para Supabase
   * @param {Object} options - Opções de sincronização
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncTinyToSupabase(options = {}) {
    try {
      console.log('🔄 Iniciando sincronização Tiny -> Supabase');

      // Buscar pedidos do Tiny
      const tinyResponse = await this.tinyService.getAllOrders(options);
      
      if (!tinyResponse.success) {
        throw new Error('Falha ao buscar pedidos do Tiny');
      }

      const tinyOrders = tinyResponse.data;
      console.log(`📥 Encontrados ${tinyOrders.length} pedidos no Tiny`);

      // Sincronizar com Supabase
      const syncResponse = await this.supabaseService.processMultipleOrders(tinyOrders);
      
      console.log('✅ Sincronização concluída:', syncResponse);
      
      return {
        success: true,
        data: syncResponse,
        metadata: {
          source: 'tiny',
          target: 'supabase',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro na sincronização Tiny -> Supabase:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por período de todas as fontes
   * @param {string} startDate - Data inicial
   * @param {string} endDate - Data final
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta consolidada
   */
  async getOrdersByPeriod(startDate, endDate, options = {}) {
    try {
      const [tinyResponse, supabaseResponse] = await Promise.allSettled([
        this.tinyService.getOrdersByPeriod(startDate, endDate, options),
        this.supabaseService.getOrdersByPeriod(startDate, endDate, options)
      ]);

      return {
        success: true,
        data: {
          tiny: tinyResponse.status === 'fulfilled' ? tinyResponse.value : null,
          supabase: supabaseResponse.status === 'fulfilled' ? supabaseResponse.value : null
        },
        errors: {
          tiny: tinyResponse.status === 'rejected' ? tinyResponse.reason : null,
          supabase: supabaseResponse.status === 'rejected' ? supabaseResponse.reason : null
        },
        period: { startDate, endDate },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'repository'
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos por período:', error);
      throw error;
    }
  }

  /**
   * Calcular métricas consolidadas
   * @param {Object} filters - Filtros para cálculo
   * @returns {Promise<Object>} Métricas consolidadas
   */
  async getConsolidatedMetrics(filters = {}) {
    try {
      const [tinyMetrics, supabaseMetrics] = await Promise.allSettled([
        this.tinyService.getSalesMetrics(filters),
        this.supabaseService.getSalesMetrics(filters)
      ]);

      const metrics = {
        tiny: tinyMetrics.status === 'fulfilled' ? tinyMetrics.value : null,
        supabase: supabaseMetrics.status === 'fulfilled' ? supabaseMetrics.value : null
      };

      // Calcular métricas consolidadas
      const consolidated = this.calculateConsolidatedMetrics(metrics);

      return {
        success: true,
        data: {
          consolidated,
          sources: metrics
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'repository'
        }
      };
    } catch (error) {
      console.error('❌ Erro ao calcular métricas consolidadas:', error);
      throw error;
    }
  }

  /**
   * Calcular métricas consolidadas
   * @param {Object} metrics - Métricas das fontes
   * @returns {Object} Métricas consolidadas
   */
  calculateConsolidatedMetrics(metrics) {
    const tiny = metrics.tiny?.data || {};
    const supabase = metrics.supabase?.data || {};

    return {
      totalRevenue: (tiny.totalRevenue || 0) + (supabase.totalRevenue || 0),
      totalOrders: (tiny.totalOrders || 0) + (supabase.totalOrders || 0),
      averageOrderValue: this.calculateAverage([
        tiny.averageOrderValue || 0,
        supabase.averageOrderValue || 0
      ]),
      sources: {
        tiny: tiny.totalRevenue || 0,
        supabase: supabase.totalRevenue || 0
      }
    };
  }

  /**
   * Calcular média de valores
   * @param {Array<number>} values - Valores para calcular média
   * @returns {number} Média dos valores
   */
  calculateAverage(values) {
    const validValues = values.filter(v => v > 0);
    return validValues.length > 0 ? 
      validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
  }

  /**
   * Validar conexões
   * @returns {Promise<Object>} Status das conexões
   */
  async validateConnections() {
    try {
      const [tinyValid, supabaseValid] = await Promise.allSettled([
        this.tinyService.validateConnection(),
        this.supabaseService.validateConnection()
      ]);

      return {
        success: true,
        data: {
          tiny: tinyValid.status === 'fulfilled' ? tinyValid.value : false,
          supabase: supabaseValid.status === 'fulfilled' ? supabaseValid.value : false
        },
        errors: {
          tiny: tinyValid.status === 'rejected' ? tinyValid.reason : null,
          supabase: supabaseValid.status === 'rejected' ? supabaseValid.reason : null
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'repository'
        }
      };
    } catch (error) {
      console.error('❌ Erro ao validar conexões:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do repositório
   * @returns {Object} Estatísticas
   */
  getRepositoryStats() {
    return {
      tiny: this.tinyService.getServiceStats(),
      supabase: this.supabaseService.getServiceStats(),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'repository'
      }
    };
  }
}
