/**
 * API Service for Node.js scripts
 * Simplified version that works in Node.js environment
 */

import { config } from '../src/config/environment.js';

class ApiServiceNode {
  constructor() {
    this.baseUrl = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
    this.token = config.tiny.token;
  }

  // Fazer requisição para API Tiny
  async fetchOrders(params = {}) {
    try {
      const queryParams = this.buildQueryParams(params);
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      
      // Verificar se o token existe antes de fazer a requisição
      if (!this.token) {
        throw new Error('Token da API Tiny não encontrado. Verifique se VITE_TINY_API_TOKEN está configurado.');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if the response contains an error
      if (data.retorno && data.retorno.status === 'Erro') {
        // Check if it's just "no records found" - this is not an error
        const errorMessage = data.retorno.erros?.[0]?.erro || '';
        if (errorMessage.includes('Nenhum registro encontrado')) {
          console.log('ℹ️ Nenhum registro encontrado na API');
          return { pedidos: [] };
        }
        
        console.error('❌ API Error:', errorMessage);
        throw new Error(`API error: ${errorMessage}`);
      }

      return data.retorno || { pedidos: [] };
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
  }

  // Buscar todos os pedidos com paginação
  async fetchAllPages(params = {}) {
    try {
      console.log('🔍 Fetching all orders with pagination...');
      
      let allOrders = [];
      let currentPage = 1;
      const pageSize = 10; // Reduzir para 10 para evitar problemas com a API
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`📄 Fetching page ${currentPage}...`);
        
        const pageParams = {
          ...params,
          pagina: currentPage,
          registrosPorPagina: pageSize
        };

        const response = await this.fetchOrders(pageParams);
        const orders = response.pedidos || [];
        const totalPages = response.numero_paginas || 1;
        
        console.log(`   📊 Página ${currentPage}: ${orders.length} pedidos, Total de páginas: ${totalPages}`);
        
        // Sempre adicionar os pedidos da página atual
        allOrders = allOrders.concat(orders);
        
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
          
          // Pequeno delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Fetched ${allOrders.length} orders from ${currentPage - 1} pages`);
      return { pedidos: allOrders };
    } catch (error) {
      console.error('❌ Error fetching all pages:', error);
      throw error;
    }
  }

  // Construir parâmetros de query
  buildQueryParams(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Parâmetros obrigatórios
    queryParams.append('token', this.token);
    queryParams.append('formato', 'json');
    
    // Parâmetros opcionais
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    return queryParams;
  }

  // Buscar detalhes de um pedido específico
  async fetchOrderDetails(orderId) {
    try {
      console.log(`🔍 Fetching order details for ID: ${orderId} with POST method`);
      
      const formData = new FormData();
      formData.append('token', this.token);
      formData.append('id', orderId);
      formData.append('formato', 'json');

      const response = await fetch('https://api.tiny.com.br/api2/pedido.obter.php', {
        method: 'POST',
        body: formData
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
        throw new Error(`Tiny API error: ${errorMessage}`);
      }

      if (data.retorno.status !== 'OK') {
        throw new Error(`Status inesperado da API: ${data.retorno.status}`);
      }

      console.log(`✅ Successfully fetched order details for ID: ${orderId}`);
      return data.retorno;

    } catch (error) {
      console.error(`❌ Error fetching order details for ID ${orderId}:`, error.message);
      throw error;
    }
  }

  // Formatar data para API
  formatDateForAPI(date) {
    if (!date) return null;
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    if (typeof date === 'string') {
      // Se já está no formato YYYY-MM-DD
      if (date.includes('-')) {
        return date;
      }
      
      // Se está no formato DD/MM/YYYY
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return null;
  }
}

// Exportar instância singleton
export const apiServiceNode = new ApiServiceNode();
export default apiServiceNode;
