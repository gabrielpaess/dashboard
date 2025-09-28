/**
 * Serviço de Dashboard para NestJS API
 * Fornece métodos de alto nível para operações de dashboard
 */

import { NestjsApiClient } from './NestjsApiClient.js';

export class NestjsDashboardService {
  constructor(config = {}) {
    this.client = new NestjsApiClient(config);
  }

  /**
   * Obter dados de overview do dashboard
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de overview
   */
  async getOverview(filters = {}) {
    try {
      const response = await this.client.getOverview(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao obter dados de overview');
      }

      // Mapear dados para o formato esperado pelo frontend
      const data = response.data;
      
      return {
        success: true,
        data: {
          totalPedidos: data.totalPedidos || 0,
          pedidosAtivos: data.pedidosAtivos || 0,
          receitaTotal: data.receitaTotal || 0,
          ticketMedio: data.ticketMedio || 0,
          breakdown: data.breakdown || {},
          recentOrders: data.recentOrders || [],
          productionData: data.productionData || {},
          developmentData: data.developmentData || {},
          orders: data.orders || []
        },
        metadata: {
          api: 'nestjs',
          operation: 'overview',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter overview:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obter dados de vendas
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de vendas
   */
  async getSales(filters = {}) {
    try {
      const response = await this.client.getSales(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao obter dados de vendas');
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'nestjs',
          operation: 'sales',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados de vendas:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obter dados de produção
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de produção
   */
  async getProduction(filters = {}) {
    try {
      const response = await this.client.getProduction(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao obter dados de produção');
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'nestjs',
          operation: 'production',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados de produção:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obter dados de pós-venda
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de pós-venda
   */
  async getAfterSales(filters = {}) {
    try {
      const response = await this.client.getAfterSales(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao obter dados de pós-venda');
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'nestjs',
          operation: 'after-sales',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados de pós-venda:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obter todos os dados do dashboard
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Todos os dados do dashboard
   */
  async getAllDashboardData(filters = {}) {
    try {
      const [overview, sales, production, afterSales] = await Promise.all([
        this.getOverview(filters),
        this.getSales(filters),
        this.getProduction(filters),
        this.getAfterSales(filters)
      ]);

      return {
        success: true,
        data: {
          overview: overview.data,
          sales: sales.data,
          production: production.data,
          afterSales: afterSales.data
        },
        metadata: {
          api: 'nestjs',
          operation: 'all-dashboard-data',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter todos os dados do dashboard:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obter status da sincronização
   * @returns {Promise<Object>} Status da sincronização
   */
  async getSyncStatus() {
    try {
      const response = await this.client.getSyncStatus();
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao obter status da sincronização');
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'nestjs',
          operation: 'sync-status',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter status da sincronização:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Executar sincronização manual
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async executeSync() {
    try {
      const response = await this.client.executeSync();
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao executar sincronização');
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'nestjs',
          operation: 'execute-sync',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao executar sincronização:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Verificar se a API está online
   * @returns {Promise<boolean>} Se a API está online
   */
  async isOnline() {
    return await this.client.isOnline();
  }

  /**
   * Obter informações da API
   * @returns {Promise<Object>} Informações da API
   */
  async getApiInfo() {
    return await this.client.getApiInfo();
  }
}

// Instância padrão
export const nestjsDashboardService = new NestjsDashboardService();

export default NestjsDashboardService;
