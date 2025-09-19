/**
 * Serviço de Pedidos da API Tiny
 * Fornece métodos de alto nível para operações com pedidos
 */

import { TinyApiClient } from './TinyApiClient.js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import { DataValidator } from '../../utils/DataValidator.js';

export class TinyOrderService {
  constructor(config = {}) {
    this.client = new TinyApiClient(config);
  }

  /**
   * Buscar pedidos com filtros avançados
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Array de pedidos padronizados
   */
  async getOrders(filters = {}) {
    try {
      const response = await this.client.fetchOrders(filters);
      
      if (!response.success) {
        throw new Error('Falha ao buscar pedidos');
      }

      // Mapear pedidos para formato padronizado
      const mappedOrders = response.data.map(order => this.client.mapOrder(order));
      
      return {
        success: true,
        data: mappedOrders,
        pagination: response.pagination,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por período
   * @param {string} startDate - Data inicial (DD/MM/YYYY)
   * @param {string} endDate - Data final (DD/MM/YYYY)
   * @returns {Promise<Array>} Array de pedidos
   */
  async getOrdersByPeriod(startDate, endDate) {
    try {
      const response = await this.client.fetchOrdersByDate(startDate, endDate);
      
      if (!response.success) {
        throw new Error('Falha ao buscar pedidos por período');
      }

      const mappedOrders = response.data.map(order => this.client.mapOrder(order));
      
      return {
        success: true,
        data: mappedOrders,
        period: { startDate, endDate },
        metadata: response.metadata
      };
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos por período:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos em produção
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} Array de pedidos em produção
   */
  async getProductionOrders(options = {}) {
    const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
    
    const filters = {
      situacao: situacoesProducao,
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos recentes
   * @param {number} days - Número de dias (padrão: 7)
   * @returns {Promise<Array>} Array de pedidos recentes
   */
  async getRecentOrders(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const startDateStr = this.client.formatDateForAPI(startDate);
      const endDateStr = this.client.formatDateForAPI(endDate);
      
      return await this.getOrdersByPeriod(startDateStr, endDateStr);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos recentes:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por vendedor
   * @param {string} vendedor - Nome do vendedor
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} Array de pedidos do vendedor
   */
  async getOrdersByVendor(vendedor, options = {}) {
    DataValidator.isNotEmptyString(vendedor, 'Nome do vendedor');
    
    const filters = {
      nome_vendedor: vendedor,
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos por cliente
   * @param {string} cliente - Nome do cliente
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} Array de pedidos do cliente
   */
  async getOrdersByClient(cliente, options = {}) {
    DataValidator.isNotEmptyString(cliente, 'Nome do cliente');
    
    const filters = {
      nome_cliente: cliente,
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos por situação
   * @param {string|Array<string>} situacao - Situação(ões) do pedido
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} Array de pedidos
   */
  async getOrdersByStatus(situacao, options = {}) {
    const filters = {
      situacao: Array.isArray(situacao) ? situacao : [situacao],
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar detalhes completos de um pedido
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<Object>} Detalhes completos do pedido
   */
  async getOrderDetails(orderId) {
    try {
      const response = await this.client.fetchOrderDetails(orderId);
      
      if (!response.success) {
        throw new Error('Falha ao buscar detalhes do pedido');
      }

      return {
        success: true,
        data: response.data ? this.client.mapOrder(response.data) : null,
        metadata: response.metadata
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do pedido ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar detalhes de múltiplos pedidos
   * @param {Array<string|number>} orderIds - IDs dos pedidos
   * @returns {Promise<Array>} Array de detalhes dos pedidos
   */
  async getMultipleOrderDetails(orderIds) {
    try {
      const details = await this.client.fetchMultipleOrderDetails(orderIds);
      
      // Mapear detalhes para formato padronizado
      const mappedDetails = details
        .filter(detail => detail !== null)
        .map(detail => this.client.mapOrder(detail));
      
      return {
        success: true,
        data: mappedDetails,
        metadata: {
          api: 'tiny',
          operation: 'multiple_order_details',
          timestamp: new Date().toISOString(),
          requested: orderIds.length,
          retrieved: mappedDetails.length
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes de múltiplos pedidos:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os pedidos com paginação automática
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Array com todos os pedidos
   */
  async getAllOrders(options = {}) {
    try {
      const response = await this.client.fetchAllPages(options);
      
      if (!response.success) {
        throw new Error('Falha ao buscar todos os pedidos');
      }

      // Mapear pedidos para formato padronizado
      const mappedOrders = response.data.map(order => this.client.mapOrder(order));
      
      return {
        success: true,
        data: mappedOrders,
        pagination: response.pagination,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('❌ Erro ao buscar todos os pedidos:', error);
      throw error;
    }
  }

  /**
   * Calcular métricas de vendas
   * @param {Object} filters - Filtros para cálculo
   * @returns {Promise<Object>} Métricas de vendas
   */
  async getSalesMetrics(filters = {}) {
    try {
      const response = await this.getOrders(filters);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados para métricas');
      }

      const orders = response.data;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        success: true,
        data: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          period: filters.dataInicial && filters.dataFinal ? 
            `${filters.dataInicial} - ${filters.dataFinal}` : 'all'
        },
        metadata: {
          api: 'tiny',
          operation: 'sales_metrics',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao calcular métricas de vendas:', error);
      throw error;
    }
  }

  /**
   * Obter breakdown por situação
   * @param {Object} filters - Filtros para análise
   * @returns {Promise<Object>} Breakdown por situação
   */
  async getStatusBreakdown(filters = {}) {
    try {
      const response = await this.getOrders(filters);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados para breakdown');
      }

      const orders = response.data;
      const breakdown = {};

      orders.forEach(order => {
        const status = order.situacao || 'Não informado';
        if (!breakdown[status]) {
          breakdown[status] = {
            count: 0,
            totalValue: 0,
            orders: []
          };
        }
        
        breakdown[status].count++;
        breakdown[status].totalValue += order.valor_total || 0;
        breakdown[status].orders.push(order);
      });

      return {
        success: true,
        data: breakdown,
        metadata: {
          api: 'tiny',
          operation: 'status_breakdown',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao calcular breakdown por situação:', error);
      throw error;
    }
  }

  /**
   * Validar conexão com a API
   * @returns {Promise<boolean>} Se conexão é válida
   */
  async validateConnection() {
    try {
      return await this.client.validateToken();
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return false;
    }
  }

  /**
   * Buscar detalhes de um pedido específico
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async getOrderDetails(orderId) {
    try {
      const response = await this.client.fetchOrderDetails(orderId);
      
      if (!response.success) {
        throw new Error('Falha ao buscar detalhes do pedido');
      }

      return {
        success: true,
        data: response.data,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do pedido:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do serviço
   * @returns {Object} Estatísticas do serviço
   */
  getServiceStats() {
    return this.client.getApiStats();
  }
}
