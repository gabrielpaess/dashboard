/**
 * Cliente API para NestJS
 * Fornece métodos para consumir a API NestJS do backend
 */

export class NestjsApiClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3001';
    this.timeout = config.timeout || 10000;
  }

  /**
   * Fazer requisição HTTP
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        metadata: {
          status: response.status,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Erro na requisição para ${endpoint}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * GET request
   * @param {string} endpoint - Endpoint da API
   * @param {Object} params - Parâmetros da query
   * @returns {Promise<Object>} Resposta da API
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(fullEndpoint, { method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados para enviar
   * @returns {Promise<Object>} Resposta da API
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados para enviar
   * @returns {Promise<Object>} Resposta da API
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - Endpoint da API
   * @returns {Promise<Object>} Resposta da API
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ===== DASHBOARD ENDPOINTS =====

  /**
   * Obter dados de overview do dashboard
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de overview
   */
  async getOverview(filters = {}) {
    return this.get('/dashboard/overview', filters);
  }

  /**
   * Obter dados de vendas
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de vendas
   */
  async getSales(filters = {}) {
    return this.get('/dashboard/sales', filters);
  }

  /**
   * Obter dados de produção
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de produção
   */
  async getProduction(filters = {}) {
    return this.get('/dashboard/production', filters);
  }

  /**
   * Obter dados de pós-venda
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de pós-venda
   */
  async getAfterSales(filters = {}) {
    return this.get('/dashboard/after-sales', filters);
  }

  // ===== ORDERS ENDPOINTS =====

  /**
   * Listar pedidos
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrders(filters = {}) {
    return this.get('/orders', filters);
  }

  /**
   * Obter pedido por ID
   * @param {string|number} id - ID do pedido
   * @returns {Promise<Object>} Dados do pedido
   */
  async getOrder(id) {
    return this.get(`/orders/${id}`);
  }

  /**
   * Criar novo pedido
   * @param {Object} orderData - Dados do pedido
   * @returns {Promise<Object>} Pedido criado
   */
  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  /**
   * Atualizar pedido
   * @param {string|number} id - ID do pedido
   * @param {Object} updates - Atualizações
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrder(id, updates) {
    return this.put(`/orders/${id}`, updates);
  }

  /**
   * Deletar pedido
   * @param {string|number} id - ID do pedido
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteOrder(id) {
    return this.delete(`/orders/${id}`);
  }

  /**
   * Obter pedidos para notificação de 15 dias
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrdersFor15DayNotification() {
    return this.get('/orders/notifications/15-day');
  }

  /**
   * Obter pedidos para notificação de 45 dias
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrdersFor45DayNotification() {
    return this.get('/orders/notifications/45-day');
  }

  /**
   * Atualizar notificações do pedido
   * @param {string|number} id - ID do pedido
   * @param {Object} notifications - Dados das notificações
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrderNotifications(id, notifications) {
    return this.put(`/orders/${id}/notifications`, notifications);
  }

  /**
   * Obter estatísticas do dashboard
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Estatísticas
   */
  async getDashboardStats(filters = {}) {
    return this.get('/orders/stats/dashboard', filters);
  }

  // ===== SYNC ENDPOINTS =====

  /**
   * Obter status da sincronização
   * @returns {Promise<Object>} Status da sincronização
   */
  async getSyncStatus() {
    return this.get('/sync/status');
  }

  /**
   * Obter estatísticas de sincronização
   * @returns {Promise<Object>} Estatísticas de sincronização
   */
  async getSyncStats() {
    return this.get('/sync/stats');
  }

  /**
   * Iniciar sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async startSync() {
    return this.post('/sync/start');
  }

  /**
   * Parar sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async stopSync() {
    return this.post('/sync/stop');
  }

  /**
   * Executar sincronização manual
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeSync() {
    return this.post('/sync/execute');
  }

  /**
   * Executar sincronização completa
   * @param {Object} options - Opções da sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeFullSync(options = {}) {
    return this.post('/sync/full', options);
  }

  /**
   * Executar sincronização incremental
   * @param {Object} options - Opções da sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeIncrementalSync(options = {}) {
    return this.post('/sync/incremental', options);
  }

  /**
   * Testar conexão com Tiny API
   * @returns {Promise<Object>} Resultado do teste
   */
  async testTinyApi() {
    return this.get('/sync/test-tiny');
  }

  /**
   * Resetar rate limiter
   * @returns {Promise<Object>} Resultado da operação
   */
  async resetRateLimit() {
    return this.post('/sync/reset-rate-limit');
  }

  // ===== UTILITY METHODS =====

  /**
   * Verificar se a API está online
   * @returns {Promise<boolean>} Se a API está online
   */
  async isOnline() {
    try {
      const response = await this.get('/sync/status');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter informações da API
   * @returns {Promise<Object>} Informações da API
   */
  async getApiInfo() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      online: await this.isOnline(),
      timestamp: new Date().toISOString()
    };
  }
}

// Instância padrão
export const nestjsApiClient = new NestjsApiClient();

export default NestjsApiClient;
