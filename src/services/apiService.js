// Service para chamadas da API Tiny
class ApiService {
  constructor() {
    // Usar proxy do Vite em desenvolvimento, proxy da Vercel em produção
    this.baseUrl = import.meta.env.DEV 
      ? '/api/tiny/pedidos.pesquisa.php'  // Proxy do Vite
      : '/api/tiny/pedidos.pesquisa.php';  // Proxy da Vercel
    this.token = import.meta.env.VITE_TINY_API_TOKEN;
    
  }

  // Formatar data para API (DD/MM/YYYY) - Versão simplificada
  formatDateForAPI(dateString) {
    if (!dateString) return '';
    
    
    // Converter yyyy-mm-dd para dd/mm/yyyy sem usar Date()
    const [ano, mes, dia] = dateString.split('-');
    const result = `${dia}/${mes}/${ano}`;
    
    
    return result;
  }

  // Construir parâmetros da query
  buildQueryParams(params = {}) {
    
    const queryParams = new URLSearchParams({
      token: this.token,
      formato: 'json',
      ...params
    });
    
    
    return queryParams;
  }

  // Fazer requisição para API Tiny
  async fetchOrders(params = {}) {
    try {
      const queryParams = this.buildQueryParams(params);
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      

      // Verificar se o token existe antes de fazer a requisição
      if (!this.token) {
        throw new Error('Token da API Tiny não encontrado. Verifique se VITE_TINY_API_TOKEN está configurado na Vercel.');
      }

      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Adicionar mode: 'cors' para requisições cross-origin em produção
        mode: import.meta.env.DEV ? 'cors' : 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      

      if (!data || !data.retorno) {
        throw new Error('Resposta inválida da API do Tiny');
      }

      if (data.retorno.status === 'Erro') {
        const errorMessage = data.retorno.erros ? 
          data.retorno.erros.map(e => e.erro).join(', ') : 
          'Erro desconhecido da API do Tiny';
        throw new Error(`API Tiny retornou erro: ${errorMessage}`);
      }

      if (data.retorno.status !== 'OK') {
        throw new Error(`Status inesperado da API: ${data.retorno.status}`);
      }

      return data.retorno;
    } catch (error) {
      console.error('❌ ApiService - Erro na requisição:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        url: this.baseUrl,
        token: this.token ? 'EXISTS' : 'MISSING',
        isDev: import.meta.env.DEV
      });
      
      // Tratamento específico para erros de CORS
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`Erro de CORS ou rede: ${error.message}. Verifique se a API Tiny permite requisições do domínio da Vercel.`);
      }
      
      throw error;
    }
  }

  // Buscar pedidos com filtro de data
  async fetchOrdersByDate(startDate, endDate) {
    const params = {
      dataInicial: this.formatDateForAPI(startDate),
      dataFinal: this.formatDateForAPI(endDate)
    };


    return await this.fetchOrders(params);
  }

  // Buscar todos os pedidos (sem filtro)
  async fetchAllOrders() {
    return await this.fetchOrders();
  }

  // Buscar pedidos com paginação
  async fetchOrdersPaginated(params = {}, page = 1) {
    const paramsWithPage = { ...params, pagina: page };
    return await this.fetchOrders(paramsWithPage);
  }

  // Buscar todas as páginas de pedidos
  async fetchAllPages(params = {}) {
    
    let allPedidos = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      
      const response = await this.fetchOrdersPaginated(params, currentPage);
      
      if (response.pedidos && response.pedidos.length > 0) {
        allPedidos = [...allPedidos, ...response.pedidos];
      }

      totalPages = response.numero_paginas || 1;
      currentPage++;

    } while (currentPage <= totalPages);


    return {
      pedidos: allPedidos,
      total_paginas: totalPages,
      status: 'OK'
    };
  }
}

// Exportar instância singleton
export const apiService = new ApiService();
export default apiService;
