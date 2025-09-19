/**
 * Serviço de Pedidos do Supabase
 * Fornece métodos de alto nível para operações com pedidos no Supabase
 */

import { SupabaseClient } from './SupabaseClient.js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import { DataValidator } from '../../utils/DataValidator.js';
import { DateFormatter } from '../../utils/DateFormatter.js';

export class SupabaseOrderService {
  constructor(config = {}) {
    this.client = new SupabaseClient(config);
  }

  /**
   * Buscar pedidos com filtros
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getOrders(filters = {}) {
    try {
      const queryFilters = this.buildQueryFilters(filters);
      
      const response = await this.client.query('pedidos', {
        select: '*',
        filters: queryFilters,
        orderBy: { field: 'data_pedido', ascending: false },
        limit: filters.limit,
        offset: filters.offset
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do Supabase:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos por período
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getOrdersByPeriod(startDate, endDate, options = {}) {
    try {
      DataValidator.isValidDate(startDate, 'Data inicial');
      DataValidator.isValidDate(endDate, 'Data final');

      const filters = {
        data_pedido: {
          operator: 'gte',
          value: startDate
        },
        data_pedido_end: {
          operator: 'lte',
          value: endDate
        },
        ...options
      };

      return await this.getOrders(filters);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos por período:', error);
      throw error;
    }
  }

  /**
   * Buscar pedidos em produção
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getProductionOrders(options = {}) {
    const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
    
    const filters = {
      situacao: {
        operator: 'in',
        value: situacoesProducao
      },
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos por vendedor
   * @param {string} vendedor - Nome do vendedor
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getOrdersByVendor(vendedor, options = {}) {
    DataValidator.isNotEmptyString(vendedor, 'Nome do vendedor');
    
    const filters = {
      nome_vendedor: {
        operator: 'ilike',
        value: `%${vendedor}%`
      },
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos por cliente
   * @param {string} cliente - Nome do cliente
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getOrdersByClient(cliente, options = {}) {
    DataValidator.isNotEmptyString(cliente, 'Nome do cliente');
    
    const filters = {
      nome_cliente: {
        operator: 'ilike',
        value: `%${cliente}%`
      },
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Buscar pedidos por situação
   * @param {string|Array<string>} situacao - Situação(ões) do pedido
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getOrdersByStatus(situacao, options = {}) {
    const filters = {
      situacao: {
        operator: 'in',
        value: Array.isArray(situacao) ? situacao : [situacao]
      },
      ...options
    };

    return await this.getOrders(filters);
  }

  /**
   * Inserir novo pedido
   * @param {Object} orderData - Dados do pedido
   * @returns {Promise<Object>} Resposta padronizada
   */
  async insertOrder(orderData) {
    try {
      DataValidator.validateOrder(orderData);

      const processedOrder = this.processOrderData(orderData);
      
      const response = await this.client.insert('pedidos', processedOrder);
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao inserir pedido:', error);
      throw error;
    }
  }

  /**
   * Atualizar pedido
   * @param {string|number} orderId - ID do pedido
   * @param {Object} updates - Atualizações
   * @returns {Promise<Object>} Resposta padronizada
   */
  async updateOrder(orderId, updates) {
    try {
      DataValidator.isValidId(orderId, 'ID do pedido');

      const processedUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const response = await this.client.update('pedidos', processedUpdates, {
        id: orderId
      });

      return response;
    } catch (error) {
      console.error(`❌ Erro ao atualizar pedido ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Deletar pedido
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<Object>} Resposta padronizada
   */
  async deleteOrder(orderId) {
    try {
      DataValidator.isValidId(orderId, 'ID do pedido');

      const response = await this.client.delete('pedidos', {
        id: orderId
      });

      return response;
    } catch (error) {
      console.error(`❌ Erro ao deletar pedido ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Upsert pedido (inserir ou atualizar)
   * @param {Object} orderData - Dados do pedido
   * @param {Object} options - Opções do upsert
   * @returns {Promise<Object>} Resposta padronizada
   */
  async upsertOrder(orderData, options = {}) {
    try {
      DataValidator.validateOrder(orderData);

      const processedOrder = this.processOrderData(orderData);
      
      const response = await this.client.upsert('pedidos', processedOrder, {
        onConflict: 'id',
        ...options
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao fazer upsert do pedido:', error);
      throw error;
    }
  }

  /**
   * Verificar se pedido existe
   * @param {string|number} orderId - ID do pedido
   * @returns {Promise<boolean>} Se pedido existe
   */
  async orderExists(orderId) {
    try {
      DataValidator.isValidId(orderId, 'ID do pedido');

      const response = await this.client.query('pedidos', {
        select: 'id',
        filters: {
          id: { value: orderId }
        },
        limit: 1
      });

      return response.data && response.data.length > 0;
    } catch (error) {
      console.error(`❌ Erro ao verificar existência do pedido ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Processar múltiplos pedidos
   * @param {Array} orders - Array de pedidos
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processMultipleOrders(orders) {
    try {
      const results = {
        processed: 0,
        new: 0,
        existing: 0,
        errors: 0,
        errors_list: [],
        filtered: 0
      };

      const excludedStatuses = ['Cancelado'];

      for (const order of orders) {
        try {
          results.processed++;
          
          // Verificar se deve filtrar
          if (excludedStatuses.includes(order.situacao)) {
            results.filtered++;
            continue;
          }

          const exists = await this.orderExists(order.id);
          
          if (exists) {
            // Atualizar pedido existente com dados corretos
            console.log(`🔄 Atualizando pedido existente ${order.id}...`);
            const processedOrder = this.processOrderData(order);
            await this.updateOrder(order.id, {
              nome_cliente: processedOrder.nome_cliente,
              situacao: processedOrder.situacao,
              valor_total: processedOrder.valor_total,
              nome_vendedor: processedOrder.nome_vendedor,
              data_prevista: processedOrder.data_prevista,
              updated_at: new Date().toISOString()
            });
            results.existing++;
          } else {
            // Para pedidos novos, buscar detalhes completos incluindo itens
            // Limitar a 5 pedidos por vez para evitar rate limiting
            if (results.new < 5) {
              const enrichedOrder = await this.enrichOrderWithDetails(order);
              await this.insertOrder(enrichedOrder);
              results.new++;
            } else {
              // Limite atingido - aguardar 2 minutos e tentar novamente
              console.log(`⏳ Limite de enriquecimento atingido. Aguardando 2 minutos para continuar...`);
              await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutos
              
              // Tentar enriquecer novamente
              try {
                const enrichedOrder = await this.enrichOrderWithDetails(order);
                await this.insertOrder(enrichedOrder);
                results.new++;
                console.log(`✅ Pedido ${order.id} enriquecido após espera`);
              } catch (error) {
                console.warn(`⚠️ Erro ao enriquecer pedido ${order.id} após espera: ${error.message}. Usando dados básicos.`);
                await this.insertOrder(order);
                results.new++;
              }
            }
          }

        } catch (error) {
          results.errors++;
          results.errors_list.push({
            order: order.id,
            error: error.message
          });
        }
      }

      return ResponseMapper.mapSyncResponse(results);
    } catch (error) {
      console.error('❌ Erro ao processar múltiplos pedidos:', error);
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

      return ResponseMapper.mapMetricsResponse({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        period: filters.dataInicial && filters.dataFinal ? 
          `${filters.dataInicial} - ${filters.dataFinal}` : 'all',
        source: 'supabase'
      });
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
          api: 'supabase',
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
   * Construir filtros de query
   * @param {Object} filters - Filtros de entrada
   * @returns {Object} Filtros formatados
   */
  buildQueryFilters(filters) {
    const queryFilters = {};

    if (filters.situacao) {
      queryFilters.situacao = {
        operator: 'in',
        value: Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao]
      };
    }

    if (filters.dataInicial) {
      queryFilters.data_pedido_gte = {
        operator: 'gte',
        value: filters.dataInicial
      };
    }

    if (filters.dataFinal) {
      queryFilters.data_pedido_lte = {
        operator: 'lte',
        value: filters.dataFinal
      };
    }

    if (filters.nomeCliente) {
      queryFilters.nome_cliente = {
        operator: 'ilike',
        value: `%${filters.nomeCliente}%`
      };
    }

    if (filters.nomeVendedor) {
      queryFilters.nome_vendedor = {
        operator: 'ilike',
        value: `%${filters.nomeVendedor}%`
      };
    }

    return queryFilters;
  }

  /**
   * Processar dados do pedido
   * @param {Object} orderData - Dados brutos do pedido
   * @returns {Object} Dados processados
   */
  processOrderData(orderData) {
    return {
      id: orderData.id?.toString(),
      pedido_id: orderData.id?.toString(),
      numero: orderData.numero,
      nome_cliente: orderData.nome || orderData.cliente?.nome || 'Cliente não informado',
      data_pedido: DateFormatter.formatToISO(orderData.data_pedido),
      data_pedido_pt_br: DateFormatter.formatToPTBR(orderData.data_pedido),
      data_prevista: orderData.data_prevista ? DateFormatter.formatToISO(orderData.data_prevista) : null,
      situacao: orderData.situacao || 'Não informado',
      valor_total: this.extractValorTotal(orderData),
      nome_vendedor: orderData.nome_vendedor || 'Não informado',
      itens_json: Array.isArray(orderData.itens) ? orderData.itens : [],
      envio_15: this.calculateEnvio15(orderData.data_pedido, orderData.data_prevista),
      envio_45: this.calculateEnvio45(orderData.data_pedido, orderData.data_prevista),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Extrair valor total do pedido
   * @param {Object} pedidoData - Dados do pedido
   * @returns {number} Valor total
   */
  extractValorTotal(pedidoData) {
    const possibleFields = [
      pedidoData.valor,
      pedidoData.total_pedido,
      pedidoData.valor_total,
      pedidoData.total,
      pedidoData.valor_pedido
    ];
    
    for (const field of possibleFields) {
      if (field !== undefined && field !== null && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    
    return 0;
  }

  /**
   * Calcular se pedido tem envio em 15 dias
   * @param {string} dataPedido - Data do pedido
   * @param {string} dataPrevista - Data prevista
   * @returns {boolean} Se tem envio em 15 dias
   */
  calculateEnvio15(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    const diffDays = DateFormatter.getDaysDifference(dataPedido, dataPrevista);
    return diffDays <= 15;
  }

  /**
   * Calcular se pedido tem envio em 45 dias
   * @param {string} dataPedido - Data do pedido
   * @param {string} dataPrevista - Data prevista
   * @returns {boolean} Se tem envio em 45 dias
   */
  calculateEnvio45(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    const diffDays = DateFormatter.getDaysDifference(dataPedido, dataPrevista);
    return diffDays <= 45;
  }

  /**
   * Validar conexão com Supabase
   * @returns {Promise<boolean>} Se conexão é válida
   */
  async validateConnection() {
    try {
      return await this.client.validateConnection();
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return false;
    }
  }

  /**
   * Enriquecer pedido com detalhes completos (incluindo itens)
   * @param {Object} order - Pedido básico
   * @returns {Promise<Object>} Pedido enriquecido
   */
  async enrichOrderWithDetails(order) {
    try {
      // Importar TinyApiClient diretamente para usar a configuração correta
      const { TinyApiClient } = await import('../tiny/TinyApiClient.js');
      const tinyClient = new TinyApiClient();
      
      console.log(`🔍 Enriquecendo pedido ${order.id} com detalhes completos...`);
      
      // Adicionar delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar detalhes completos do pedido
      const detailsResponse = await tinyClient.fetchOrderDetails(order.id);
      
      if (detailsResponse.success && detailsResponse.data.length > 0) {
        const detailedOrder = detailsResponse.data[0];
        
        // Extrair itens corretamente da estrutura aninhada
        const itens = Array.isArray(detailedOrder.itens) 
          ? detailedOrder.itens.map(item => item.item || item)
          : [];
        
        // Combinar dados básicos com detalhes completos
        return {
          ...order,
          nome_cliente: detailedOrder.nome || detailedOrder.cliente?.nome || order.nome_cliente,
          itens_json: itens,
          itens: itens,
          observacoes: detailedOrder.obs || detailedOrder.observacoes || order.observacoes,
          // Manter outros campos importantes
          data_pedido: detailedOrder.data_pedido || order.data_pedido,
          data_prevista: detailedOrder.data_prevista || order.data_prevista,
          situacao: detailedOrder.situacao || order.situacao,
          valor_total: detailedOrder.valor_total || order.valor_total,
          nome_vendedor: detailedOrder.nome_vendedor || order.nome_vendedor
        };
      } else {
        console.warn(`⚠️ Não foi possível obter detalhes para o pedido ${order.id}, usando dados básicos`);
        return order;
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao enriquecer pedido ${order.id}: ${error.message}. Usando dados básicos.`);
      // Em caso de erro (incluindo rate limiting), retornar o pedido original
      return order;
    }
  }

  /**
   * Obter estatísticas do serviço
   * @returns {Object} Estatísticas do serviço
   */
  getServiceStats() {
    return this.client.getConnectionStats();
  }
}
