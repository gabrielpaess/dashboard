/**
 * Adaptador para Serviços Legados
 * Facilita a migração gradual dos serviços antigos para a nova arquitetura
 */

// Importação dinâmica para evitar dependência circular

export class LegacyServiceAdapter {
  constructor() {
    this.repository = null;
    this.sync = null;
  }

  async _getRepository() {
    if (!this.repository) {
      const { orderRepository } = await import('../index.js');
      this.repository = orderRepository;
    }
    return this.repository;
  }

  async _getSync() {
    if (!this.sync) {
      const { syncService } = await import('../index.js');
      this.sync = syncService;
    }
    return this.sync;
  }

  /**
   * Adaptar chamada do orderService.processOrderDataCentralized
   * @param {Object} dateFilter - Filtro de data
   * @returns {Promise<Object>} Dados processados no formato antigo
   */
  async processOrderDataCentralized(dateFilter = null) {
    try {
      const repository = await this._getRepository();
      const filters = dateFilter ? {
        dataInicial: dateFilter.startDate,
        dataFinal: dateFilter.endDate
      } : {};

      const response = await repository.getSupabaseOrders(filters);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados do Supabase');
      }

      const pedidos = response.data || [];
      
      // Calcular métricas no formato antigo
      const totalPedidos = pedidos.length;
      const totalRevenue = pedidos.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0);
      const averageOrderValue = totalPedidos > 0 ? totalRevenue / totalPedidos : 0;

      // Calcular breakdown por situação
      const breakdown = {};
      pedidos.forEach(pedido => {
        const situacao = pedido.situacao || 'Não informado';
        if (!breakdown[situacao]) {
          breakdown[situacao] = {
            count: 0,
            totalValue: 0,
            pedidos: []
          };
        }
        breakdown[situacao].count++;
        breakdown[situacao].totalValue += pedido.valor_total || 0;
        breakdown[situacao].pedidos.push(pedido);
      });

      // Calcular WIP (Work in Progress)
      const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
      const wipPedidos = pedidos.filter(p => situacoesProducao.includes(p.situacao));
      const wipTotal = wipPedidos.reduce((sum, pedido) => {
        if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
          return sum + pedido.itens_json.reduce((itemSum, item) => 
            itemSum + (parseFloat(item.item?.quantidade || 0)), 0);
        }
        return sum;
      }, 0);

      return {
        pedidos,
        totalPedidos,
        totalRevenue,
        averageOrderValue,
        breakdown,
        wip: {
          totalItens: wipTotal,
          totalPedidos: wipPedidos.length,
          pedidos: wipPedidos
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'legacy_adapter',
          filters: dateFilter
        }
      };
    } catch (error) {
      console.error('❌ Erro no adaptador legado:', error);
      throw error;
    }
  }

  /**
   * Adaptar chamada do apiService.fetchOrders
   * @param {Object} params - Parâmetros da API
   * @returns {Promise<Object>} Resposta no formato antigo
   */
  async fetchOrders(params = {}) {
    try {
      const repository = await this._getRepository();
      const response = await repository.getTinyOrders(params);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados do Tiny');
      }

      return {
        retorno: {
          pedidos: response.data || [],
          status: 'OK',
          numero_paginas: response.pagination?.totalPages || 1,
          total_registros: response.pagination?.totalRecords || 0
        }
      };
    } catch (error) {
      console.error('❌ Erro no adaptador de API:', error);
      throw error;
    }
  }

  /**
   * Adaptar chamada do apiService.fetchOrdersByDate
   * @param {string} startDate - Data inicial
   * @param {string} endDate - Data final
   * @returns {Promise<Object>} Resposta no formato antigo
   */
  async fetchOrdersByDate(startDate, endDate) {
    try {
      const repository = await this._getRepository();
      const response = await repository.getTinyOrders({
        dataInicial: startDate,
        dataFinal: endDate
      });
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados do Tiny');
      }

      return {
        retorno: {
          pedidos: response.data || [],
          status: 'OK',
          numero_paginas: response.pagination?.totalPages || 1,
          total_registros: response.pagination?.totalRecords || 0
        }
      };
    } catch (error) {
      console.error('❌ Erro no adaptador de data:', error);
      throw error;
    }
  }

  /**
   * Adaptar chamada do pedidosCentralizedService.getPedidos
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Array de pedidos
   */
  async getPedidos(filters = {}) {
    try {
      const repository = await this._getRepository();
      const response = await repository.getSupabaseOrders(filters);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados do Supabase');
      }

      return response.data || [];
    } catch (error) {
      console.error('❌ Erro no adaptador de pedidos:', error);
      throw error;
    }
  }

  /**
   * Adaptar chamada do pedidosCentralizedService.getMetricasVendas
   * @param {Object} filters - Filtros para métricas
   * @returns {Promise<Object>} Métricas de vendas
   */
  async getMetricasVendas(filters = {}) {
    try {
      const repository = await this._getRepository();
      const response = await repository.getConsolidatedMetrics(filters);
      
      if (!response.success) {
        throw new Error('Falha ao calcular métricas');
      }

      return response.data.consolidated;
    } catch (error) {
      console.error('❌ Erro no adaptador de métricas:', error);
      throw error;
    }
  }

  /**
   * Adaptar chamada do pedidosCentralizedService.getWIPTotal
   * @param {Object} filters - Filtros para WIP
   * @returns {Promise<Object>} Dados de WIP
   */
  async getWIPTotal(filters = {}) {
    try {
      const repository = await this._getRepository();
      const response = await repository.getSupabaseOrders({
        ...filters,
        situacao: ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado']
      });
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados de WIP');
      }

      const pedidos = response.data || [];
      let totalItens = 0;
      const itensDetalhados = [];

      pedidos.forEach(pedido => {
        if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
          pedido.itens_json.forEach(item => {
            const quantidade = parseFloat(item.item?.quantidade || 0);
            totalItens += quantidade;
            
            itensDetalhados.push({
              pedido_id: pedido.id,
              numero: pedido.numero,
              situacao: pedido.situacao,
              data_pedido: pedido.data_pedido_pt_br,
              descricao: item.item?.descricao || 'Item sem descrição',
              quantidade: quantidade
            });
          });
        }
      });

      return {
        totalItens,
        totalPedidos: pedidos.length,
        itensDetalhados,
        pedidos
      };
    } catch (error) {
      console.error('❌ Erro no adaptador de WIP:', error);
      throw error;
    }
  }

  /**
   * Executar sincronização (substitui realtimeSyncService)
   * @param {Object} options - Opções de sincronização
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async executeSync(options = {}) {
    try {
      const sync = await this._getSync();
      return await sync.executeFullSync(options);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do adaptador
   * @returns {Object} Estatísticas
   */
  async getStats() {
    const repository = await this._getRepository();
    const sync = await this._getSync();
    
    return {
      repository: repository.getRepositoryStats(),
      sync: sync.getSyncStats(),
      metadata: {
        timestamp: new Date().toISOString(),
        adapter: 'legacy'
      }
    };
  }
}

// Exportar instância singleton
export const legacyServiceAdapter = new LegacyServiceAdapter();
export default legacyServiceAdapter;
