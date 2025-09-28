/**
 * Utilitário Centralizado para Mapeamento de Respostas
 * Padroniza mapeamento de respostas de diferentes APIs
 */

export class ResponseMapper {
  /**
   * Mapear resposta da API Tiny
   * @param {Object} response - Resposta da API Tiny
   * @returns {Object} Resposta padronizada
   */
  static mapTinyResponse(response) {
    if (!response || !response.retorno) {
      throw new Error('Resposta inválida da API Tiny');
    }

    const { retorno } = response;

    if (retorno.status === 'Erro') {
      const errorMessage = retorno.erros ? 
        retorno.erros.map(e => e.erro).join(', ') : 
        'Erro desconhecido da API do Tiny';
      throw new Error(`API Tiny retornou erro: ${errorMessage}`);
    }

    if (retorno.status !== 'OK') {
      throw new Error(`Status inesperado da API: ${retorno.status}`);
    }

    // Extrair dados dos pedidos
    let pedidos = [];
    
    if (retorno.pedidos) {
      // Para pedidos.pesquisa.php - array de pedidos
      pedidos = retorno.pedidos.map(item => item.pedido || item);
    } else if (retorno.pedido) {
      // Para pedido.obter.php - único pedido
      pedidos = [retorno.pedido];
    }

    return {
      success: true,
      data: pedidos,
      pagination: {
        currentPage: retorno.pagina || 1,
        totalPages: retorno.numero_paginas || 1,
        totalRecords: retorno.total_registros || (pedidos.length > 0 ? 1 : 0)
      },
      metadata: {
        api: 'tiny',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Mapear resposta do Supabase
   * @param {Object} response - Resposta do Supabase
   * @param {string} operation - Operação realizada
   * @returns {Object} Resposta padronizada
   */
  static mapSupabaseResponse(response, operation = 'query') {
    if (response.error) {
      throw new Error(`Erro do Supabase: ${response.error.message}`);
    }

    return {
      success: true,
      data: response.data || [],
      count: response.count || 0,
      metadata: {
        api: 'supabase',
        operation,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Mapear resposta da API Instagram
   * @param {Object} response - Resposta da API Instagram
   * @returns {Object} Resposta padronizada
   */
  static mapInstagramResponse(response) {
    if (response.error) {
      throw new Error(`Erro da API Instagram: ${response.error.message}`);
    }

    return {
      success: true,
      data: response.data || [],
      pagination: response.paging ? {
        next: response.paging.next,
        previous: response.paging.previous
      } : null,
      metadata: {
        api: 'instagram',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Mapear pedido da API Tiny para formato padronizado
   * @param {Object} tinyOrder - Pedido da API Tiny
   * @returns {Object} Pedido padronizado
   */
  static mapTinyOrder(tinyOrder) {
    // Extrair itens da estrutura aninhada
    const itens = Array.isArray(tinyOrder.itens) 
      ? tinyOrder.itens.map(item => item.item || item)
      : [];

    return {
      id: tinyOrder.id?.toString(),
      numero: tinyOrder.numero,
      nome_cliente: tinyOrder.nome || tinyOrder.cliente?.nome || 'Cliente não informado',
      data_pedido: tinyOrder.data_pedido,
      data_prevista: tinyOrder.data_prevista,
      situacao: tinyOrder.situacao || 'Não informado',
      valor_total: this.extractValorTotal(tinyOrder),
      nome_vendedor: tinyOrder.nome_vendedor || 'Não informado',
      itens: itens,
      itens_json: itens,
      observacoes: tinyOrder.obs || tinyOrder.observacoes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Mapear conversa do Instagram para formato padronizado
   * @param {Object} instagramConversation - Conversa do Instagram
   * @returns {Object} Conversa padronizada
   */
  static mapInstagramConversation(instagramConversation) {
    return {
      id: instagramConversation.id,
      participants: instagramConversation.participants?.data || [],
      messages: instagramConversation.messages?.data || [],
      updated_time: instagramConversation.updated_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Extrair valor total do pedido
   * @param {Object} pedidoData - Dados do pedido
   * @returns {number} Valor total
   */
  static extractValorTotal(pedidoData) {
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
   * Mapear erro para formato padronizado
   * @param {Error} error - Erro original
   * @param {string} context - Contexto do erro
   * @returns {Object} Erro padronizado
   */
  static mapError(error, context = 'API') {
    return {
      success: false,
      error: {
        message: error.message,
        name: error.name,
        context,
        timestamp: new Date().toISOString(),
        stack: error.stack
      }
    };
  }

  /**
   * Mapear resposta de paginação
   * @param {Object} paginationData - Dados de paginação
   * @returns {Object} Paginação padronizada
   */
  static mapPagination(paginationData) {
    return {
      currentPage: paginationData.pagina || paginationData.page || 1,
      totalPages: paginationData.numero_paginas || paginationData.total_pages || 1,
      totalRecords: paginationData.total_registros || paginationData.total_records || 0,
      recordsPerPage: paginationData.registros_por_pagina || paginationData.per_page || 100,
      hasNextPage: paginationData.has_next_page || false,
      hasPreviousPage: paginationData.has_previous_page || false
    };
  }

  /**
   * Mapear resposta de sincronização
   * @param {Object} syncData - Dados de sincronização
   * @returns {Object} Resposta de sincronização padronizada
   */
  static mapSyncResponse(syncData) {
    return {
      success: true,
      processed: syncData.processed || 0,
      new: syncData.new || 0,
      existing: syncData.existing || 0,
      errors: syncData.errors || 0,
      errors_list: syncData.errors_list || [],
      filtered: syncData.filtered || 0,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: syncData.duration || 0
      }
    };
  }

  /**
   * Mapear resposta de métricas
   * @param {Object} metricsData - Dados de métricas
   * @returns {Object} Métricas padronizadas
   */
  static mapMetricsResponse(metricsData) {
    return {
      success: true,
      metrics: {
        totalRevenue: metricsData.totalRevenue || 0,
        totalOrders: metricsData.totalOrders || 0,
        averageOrderValue: metricsData.averageOrderValue || 0,
        period: metricsData.period || 'unknown'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: metricsData.source || 'unknown'
      }
    };
  }

  /**
   * Mapear resposta de validação
   * @param {Object} validationData - Dados de validação
   * @returns {Object} Resposta de validação padronizada
   */
  static mapValidationResponse(validationData) {
    return {
      success: validationData.isValid || false,
      errors: validationData.errors || [],
      warnings: validationData.warnings || [],
      metadata: {
        timestamp: new Date().toISOString(),
        validatedFields: validationData.validatedFields || []
      }
    };
  }
}
