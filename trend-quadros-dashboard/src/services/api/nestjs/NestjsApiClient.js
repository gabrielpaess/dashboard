/**
 * Cliente API para NestJS
 * Fornece métodos para consumir a API NestJS do backend
 */

export class NestjsApiClient {
  constructor(config = {}) {
    // Usar configuração fornecida, variável de ambiente ou API de produção
    this.baseURL = config.baseURL || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
      'http://168.231.90.41:3001'; // API de produção como padrão
    this.timeout = config.timeout || 10000;
    
    console.log(`🔗 NestjsApiClient configurado para: ${this.baseURL}`);
    console.log(`🌐 Ambiente: ${this.baseURL.includes('localhost') ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
  }

  /**
   * Obter token de autenticação do localStorage
   * @returns {string|null} Token JWT ou null
   */
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Fazer requisição HTTP
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Adicionar token de autenticação se disponível
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🌐 Fazendo requisição para: ${url}`);
    if (token) {
      console.log(`🔐 Com token de autenticação`);
    } else {
      console.log(`⚠️  Sem token de autenticação`);
    }

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Resposta recebida: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error(`❌ Erro HTTP ${response.status}:`, errorData);
          
          // Extrair mensagem de erro da resposta da API
          if (errorData.message) {
            if (Array.isArray(errorData.message)) {
              // Se for array de validação, pegar a primeira mensagem
              errorMessage = errorData.message[0];
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, usar o texto da resposta
          const errorText = await response.text();
          console.error(`❌ Erro HTTP ${response.status}:`, errorText);
          errorMessage = errorText || errorMessage;
        }
        
        // Se for 401, token pode estar inválido
        if (response.status === 401) {
          console.log(`🔐 Token inválido ou expirado, removendo do localStorage`);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Dados recebidos:`, data);
      
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
      
      // Verificar se é erro de conectividade
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Erro de conectividade: Não foi possível conectar à API',
          data: null,
          isConnectivityError: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        data: null,
        isConnectivityError: false
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
    return this.get('/api/dashboard/overview', filters);
  }

  /**
   * Obter dados de vendas
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de vendas
   */
  async getSales(filters = {}) {
    return this.get('/api/dashboard/sales', filters);
  }

  /**
   * Obter dados de produção
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de produção
   */
  async getProduction(filters = {}) {
    return this.get('/api/dashboard/production', filters);
  }

  /**
   * Obter dados de pós-venda
   * @param {Object} filters - Filtros de data
   * @returns {Promise<Object>} Dados de pós-venda
   */
  async getAfterSales(filters = {}) {
    return this.get('/api/dashboard/after-sales', filters);
  }

  // ===== ORDERS ENDPOINTS =====

  /**
   * Listar pedidos
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrders(filters = {}) {
    return this.get('/api/orders', filters);
  }

  /**
   * Obter pedido por ID
   * @param {string|number} id - ID do pedido
   * @returns {Promise<Object>} Dados do pedido
   */
  async getOrder(id) {
    return this.get(`/api/orders/${id}`);
  }

  /**
   * Criar novo pedido
   * @param {Object} orderData - Dados do pedido
   * @returns {Promise<Object>} Pedido criado
   */
  async createOrder(orderData) {
    return this.post('/api/orders', orderData);
  }

  /**
   * Atualizar pedido
   * @param {string|number} id - ID do pedido
   * @param {Object} updates - Atualizações
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrder(id, updates) {
    return this.put(`/api/orders/${id}`, updates);
  }

  /**
   * Deletar pedido
   * @param {string|number} id - ID do pedido
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteOrder(id) {
    return this.delete(`/api/orders/${id}`);
  }

  /**
   * Obter pedidos para notificação de 15 dias
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrdersFor15DayNotification() {
    return this.get('/api/orders/notifications/15-day');
  }

  /**
   * Obter pedidos para notificação de 45 dias
   * @returns {Promise<Object>} Lista de pedidos
   */
  async getOrdersFor45DayNotification() {
    return this.get('/api/orders/notifications/45-day');
  }

  /**
   * Atualizar notificações do pedido
   * @param {string|number} id - ID do pedido
   * @param {Object} notifications - Dados das notificações
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrderNotifications(id, notifications) {
    return this.put(`/api/orders/${id}/notifications`, notifications);
  }

  /**
   * Obter estatísticas do dashboard
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Estatísticas
   */
  async getDashboardStats(filters = {}) {
    return this.get('/api/orders/stats/dashboard', filters);
  }

  // ===== SYNC ENDPOINTS =====

  /**
   * Obter status da sincronização
   * @returns {Promise<Object>} Status da sincronização
   */
  async getSyncStatus() {
    return this.get('/api/sync/status');
  }

  /**
   * Obter estatísticas de sincronização
   * @returns {Promise<Object>} Estatísticas de sincronização
   */
  async getSyncStats() {
    return this.get('/api/sync/stats');
  }

  /**
   * Iniciar sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async startSync() {
    return this.post('/api/sync/start');
  }

  /**
   * Parar sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async stopSync() {
    return this.post('/api/sync/stop');
  }

  /**
   * Executar sincronização manual
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeSync() {
    return this.post('/api/sync/execute');
  }

  /**
   * Executar sincronização completa
   * @param {Object} options - Opções da sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeFullSync(options = {}) {
    return this.post('/api/sync/full', options);
  }

  /**
   * Executar sincronização incremental
   * @param {Object} options - Opções da sincronização
   * @returns {Promise<Object>} Resultado da operação
   */
  async executeIncrementalSync(options = {}) {
    return this.post('/api/sync/incremental', options);
  }

  /**
   * Testar conexão com Tiny API
   * @returns {Promise<Object>} Resultado do teste
   */
  async testTinyApi() {
    return this.get('/api/sync/test-tiny');
  }

  /**
   * Resetar rate limiter
   * @returns {Promise<Object>} Resultado da operação
   */
  async resetRateLimit() {
    return this.post('/api/sync/reset-rate-limit');
  }

  // ===== AUTH METHODS =====

  /**
   * Fazer login
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Resultado do login
   */
  async login(email, password) {
    const response = await this.post('/api/auth/login', { email, password });
    
    if (response.success && response.data && response.data.access_token) {
      // Salvar token no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      console.log('✅ Login realizado com sucesso');
    }
    
    return response;
  }

  /**
   * Fazer logout
   */
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    console.log('🚪 Logout realizado');
  }

  /**
   * Verificar se está autenticado
   * @returns {boolean} Se está autenticado
   */
  isAuthenticated() {
    const token = this.getAuthToken();
    return !!token;
  }

  /**
   * Obter usuário atual
   * @returns {Object|null} Dados do usuário ou null
   */
  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // ===== UTILITY METHODS =====

  /**
   * Verificar se a API está online
   * @returns {Promise<boolean>} Se a API está online
   */
  async isOnline() {
    try {
      const response = await this.get('/api/sync/status');
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
      authenticated: this.isAuthenticated(),
      timestamp: new Date().toISOString()
    };
  }
}

export default NestjsApiClient;
