/**
 * Cliente Específico para API Tiny
 * Estende ApiClient base com funcionalidades específicas da Tiny
 */

import { ApiClient } from '../base/ApiClient.js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente se estiver no Node.js
if (typeof process !== 'undefined' && process.env && !process.env.NODE_ENV) {
  dotenv.config();
}
import { DataValidator } from '../../utils/DataValidator.js';

export class TinyApiClient extends ApiClient {
  constructor(config = {}) {
    const tinyConfig = {
      baseURL: 'https://api.tiny.com.br/api2',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000, // 15 segundos para API Tiny
      retryAttempts: 3,
      rateLimit: {
        requests: 100,
        per: 'minute'
      },
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutos
        maxSize: 500
      },
      ...config
    };

    super(tinyConfig);
    
    // Função para obter variáveis de ambiente em browser e Node.js
    const getEnvVar = (key) => {
      if (typeof window !== 'undefined' && import.meta?.env) {
        return import.meta.env[key];
      } else if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
      }
      return undefined;
    };
    
    this.token = config.token || getEnvVar('VITE_TINY_API_TOKEN');
    
    if (!this.token) {
      throw new Error('Token da API Tiny não encontrado. Verifique se VITE_TINY_API_TOKEN está configurado.');
    }
  }

  /**
   * Buscar pedidos com filtros
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchOrders(params = {}) {
    try {
      const queryParams = {
        token: this.token,
        formato: 'json',
        ...params
      };

      const response = await this.request('pedidos.pesquisa.php', {
        method: 'GET',
        params: queryParams,
        useCache: true,
        cacheKey: `orders_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapTinyResponse(response);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos da Tiny:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por data
   * @param {string} startDate - Data inicial (DD/MM/YYYY)
   * @param {string} endDate - Data final (DD/MM/YYYY)
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchOrdersByDate(startDate, endDate) {
    DataValidator.isValidDate(startDate, 'Data inicial');
    DataValidator.isValidDate(endDate, 'Data final');

    return await this.fetchOrders({
      dataInicial: startDate,
      dataFinal: endDate
    });
  }

  /**
   * Buscar todos os pedidos
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchAllOrders(options = {}) {
    const params = {
      situacao: options.situacao || 'aberto',
      registrosPorPagina: options.limit || 100,
      ...options
    };

    return await this.fetchOrders(params);
  }

  /**
   * Buscar pedidos com paginação
   * @param {Object} params - Parâmetros de busca
   * @param {number} page - Página atual
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchOrdersPaginated(params = {}, page = 1) {
    DataValidator.isValidNumber(page, 'Página', 1);

    const paramsWithPage = {
      ...params,
      pagina: page
    };

    return await this.fetchOrders(paramsWithPage);
  }

  /**
   * Buscar todas as páginas de pedidos
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchAllPages(params = {}) {
    try {
      let allPedidos = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await this.fetchOrdersPaginated(params, currentPage);
        
        if (response.data && response.data.length > 0) {
          allPedidos = [...allPedidos, ...response.data];
        }

        totalPages = response.pagination.totalPages;
        currentPage++;

        // Delay entre páginas para respeitar rate limiting
        if (currentPage <= totalPages) {
          await this.delay(500);
        }

      } while (currentPage <= totalPages);

      return {
        success: true,
        data: allPedidos,
        pagination: {
          currentPage: 1,
          totalPages,
          totalRecords: allPedidos.length
        },
        metadata: {
          api: 'tiny',
          timestamp: new Date().toISOString(),
          allPages: true
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar todas as páginas:', error);
      throw error;
    }
  }

  /**
   * Buscar detalhes de um pedido específico
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async fetchOrderDetails(orderId) {
    try {
      DataValidator.isValidId(orderId, 'ID do pedido');

      const formData = new FormData();
      formData.append('token', this.token);
      formData.append('id', orderId.toString());
      formData.append('formato', 'json');

      const response = await fetch(`${this.baseURL}/pedido.obter.php`, {
        method: 'POST',
        body: formData,
        signal: this.createAbortSignal()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.retorno && data.retorno.status === 'Erro') {
        const errorMessage = data.retorno.erros?.[0]?.erro || 'Erro desconhecido';
        throw new Error(`API Tiny retornou erro: ${errorMessage}`);
      }

      return {
        success: true,
        data: data.retorno?.pedido || null,
        metadata: {
          api: 'tiny',
          operation: 'order_details',
          timestamp: new Date().toISOString()
        }
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
  async fetchMultipleOrderDetails(orderIds) {
    try {
      DataValidator.isNotEmptyArray(orderIds, 'Lista de IDs');

      const orderDetails = [];
      const batchSize = 5; // Processar 5 pedidos por vez
      
      for (let i = 0; i < orderIds.length; i += batchSize) {
        const batch = orderIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (orderId) => {
          try {
            const details = await this.fetchOrderDetails(orderId);
            return details.data;
          } catch (error) {
            console.error(`❌ Falha ao buscar detalhes do pedido ${orderId}:`, error.message);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        orderDetails.push(...batchResults.filter(result => result !== null));
        
        // Delay entre lotes
        if (i + batchSize < orderIds.length) {
          await this.delay(2000);
        }
      }
      
      return orderDetails;
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes de múltiplos pedidos:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos recentes (últimos 7 dias)
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchRecentOrders() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const startDate = this.formatDateForAPI(sevenDaysAgo);
    const endDate = this.formatDateForAPI(new Date());
    
    return await this.fetchOrdersByDate(startDate, endDate);
  }

  /**
   * Validar token da API
   * @returns {Promise<boolean>} Se token é válido
   */
  async validateToken() {
    try {
      await this.fetchOrders({ registrosPorPagina: 1 });
      return true;
    } catch (error) {
      console.error('❌ Token inválido:', error.message);
      return false;
    }
  }

  /**
   * Formatar data para API Tiny (DD/MM/YYYY)
   * @param {Date|string} date - Data a ser formatada
   * @returns {string} Data formatada
   */
  formatDateForAPI(date) {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Buscar detalhes de um pedido específico
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async fetchOrderDetails(orderId) {
    try {
      console.log(`🔍 Buscando detalhes do pedido ID: ${orderId}`);

      // Usar query parameters conforme documentação da API
      const response = await this.request('pedido.obter.php', {
        method: 'GET',
        params: {
          token: this.token,
          id: orderId.toString(),
          formato: 'json'
        },
        useCache: true,
        cacheKey: `order_details_${orderId}`
      });

      return ResponseMapper.mapTinyResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do pedido ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Mapear pedido da Tiny para formato padronizado
   * @param {Object} tinyOrder - Pedido da API Tiny
   * @returns {Object} Pedido padronizado
   */
  mapOrder(tinyOrder) {
    return ResponseMapper.mapTinyOrder(tinyOrder);
  }

  /**
   * Obter estatísticas da API
   * @returns {Object} Estatísticas
   */
  getApiStats() {
    return {
      cache: this.getCacheStats(),
      rateLimit: this.getRateLimitStats(),
      token: this.token ? 'CONFIGURED' : 'MISSING'
    };
  }
}
