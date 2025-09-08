// Service para chamadas da API Tiny
class ApiService {
  constructor() {
    // Usar proxy do Vite em desenvolvimento, API direta em produção
    this.baseUrl = import.meta.env.DEV 
      ? '/api/tiny/pedidos.pesquisa.php'  // Proxy do Vite
      : 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';  // API direta
    this.token = import.meta.env.VITE_TINY_API_TOKEN;
  }

  // Formatar data para API (DD/MM/YYYY) - Versão simplificada
  formatDateForAPI(dateString) {
    if (!dateString) return '';
    
    console.log('🔄 ApiService.formatDateForAPI - Convertendo data:', {
      input: dateString,
      inputType: typeof dateString
    });
    
    // Converter yyyy-mm-dd para dd/mm/yyyy sem usar Date()
    const [ano, mes, dia] = dateString.split('-');
    const result = `${dia}/${mes}/${ano}`;
    
    console.log('🔄 ApiService.formatDateForAPI - Resultado:', {
      result,
      input: dateString,
      conversao: `${ano}-${mes}-${dia} → ${result}`
    });
    
    return result;
  }

  // Construir parâmetros da query
  buildQueryParams(params = {}) {
    console.log('🔧 ApiService - Construindo parâmetros:', {
      paramsRecebidos: params,
      token: this.token.substring(0, 10) + '...',
      formato: 'json'
    });
    
    const queryParams = new URLSearchParams({
      token: this.token,
      formato: 'json',
      ...params
    });
    
    console.log('🔧 ApiService - Parâmetros finais:', {
      queryString: queryParams.toString(),
      temDataInicial: queryParams.has('dataInicial'),
      temDataFinal: queryParams.has('dataFinal'),
      dataInicial: queryParams.get('dataInicial'),
      dataFinal: queryParams.get('dataFinal')
    });
    
    return queryParams;
  }

  // Fazer requisição para API Tiny
  async fetchOrders(params = {}) {
    try {
      const queryParams = this.buildQueryParams(params);
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      
      console.log('🌐 ApiService - Fazendo requisição:', {
        url,
        params,
        token: this.token.substring(0, 10) + '...',
        tokenFromEnv: !!import.meta.env.VITE_TINY_API_TOKEN
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Remover mode: 'cors' para usar proxy
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📥 ApiService - Resposta recebida:', {
        status: data.retorno?.status,
        totalPedidos: data.retorno?.pedidos?.length || 0,
        pagina: data.retorno?.pagina,
        numeroPaginas: data.retorno?.numero_paginas
      });

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
      console.error('❌ ApiService - Erro na requisição:', error);
      throw error;
    }
  }

  // Buscar pedidos com filtro de data
  async fetchOrdersByDate(startDate, endDate) {
    const params = {
      dataInicial: this.formatDateForAPI(startDate),
      dataFinal: this.formatDateForAPI(endDate)
    };

    console.log('🔍 ApiService - Buscando pedidos por data:', {
      startDate,
      endDate,
      params
    });

    return await this.fetchOrders(params);
  }

  // Buscar todos os pedidos (sem filtro)
  async fetchAllOrders() {
    console.log('📊 ApiService - Buscando todos os pedidos');
    return await this.fetchOrders();
  }

  // Buscar pedidos com paginação
  async fetchOrdersPaginated(params = {}, page = 1) {
    const paramsWithPage = { ...params, pagina: page };
    return await this.fetchOrders(paramsWithPage);
  }

  // Buscar todas as páginas de pedidos
  async fetchAllPages(params = {}) {
    console.log('📚 ApiService - fetchAllPages chamado com parâmetros:', {
      params,
      temDataInicial: !!params.dataInicial,
      temDataFinal: !!params.dataFinal,
      dataInicial: params.dataInicial,
      dataFinal: params.dataFinal
    });
    
    let allPedidos = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`📄 ApiService - Buscando página ${currentPage}/${totalPages}`, {
        paramsParaPagina: { ...params, pagina: currentPage }
      });
      
      const response = await this.fetchOrdersPaginated(params, currentPage);
      
      if (response.pedidos && response.pedidos.length > 0) {
        allPedidos = [...allPedidos, ...response.pedidos];
        console.log(`📄 Página ${currentPage}: ${response.pedidos.length} pedidos encontrados`);
      }

      totalPages = response.numero_paginas || 1;
      currentPage++;

    } while (currentPage <= totalPages);

    console.log('✅ ApiService - Todas as páginas carregadas:', {
      totalPedidos: allPedidos.length,
      totalPaginas: totalPages,
      filtroAplicado: !!(params.dataInicial && params.dataFinal)
    });

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
