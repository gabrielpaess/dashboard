/**
 * Repositório Simples de Pedidos para Frontend
 * Versão que usa Supabase diretamente sem dependências complexas
 */

import { createClient } from '@supabase/supabase-js';

export class SimpleOrderRepository {
  constructor(config = {}) {
    // Configuração direta do Supabase - valores padrão para evitar erros
    const supabaseUrl = config.supabase?.url || 
      (typeof window !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) ||
      'https://jpkpifxctubvauwjvimd.supabase.co';
    
    const supabaseKey = config.supabase?.anonKey || 
      (typeof window !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20';
    
    console.log('🔧 SimpleOrderRepository: Configurando Supabase...', {
      url: supabaseUrl ? '✅' : '❌',
      key: supabaseKey ? '✅' : '❌'
    });
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Buscar pedidos do Supabase
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Resposta do Supabase
   */
  async getSupabaseOrders(filters = {}) {
    try {
      console.log('🔍 Buscando pedidos no Supabase...', filters);
      
      let query = this.supabase
        .from('pedidos')
        .select('*')
        .order('data_pedido', { ascending: false });

      // Aplicar filtros
      if (filters.situacao) {
        if (Array.isArray(filters.situacao)) {
          query = query.in('situacao', filters.situacao);
        } else {
          query = query.eq('situacao', filters.situacao);
        }
      }

      if (filters.dataInicial && filters.dataFinal) {
        query = query
          .gte('data_pedido', filters.dataInicial)
          .lte('data_pedido', filters.dataFinal);
      }

      if (filters.nomeVendedor) {
        query = query.ilike('nome_vendedor', `%${filters.nomeVendedor}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro no Supabase:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      console.log(`✅ Encontrados ${data?.length || 0} pedidos no Supabase`);
      
      return {
        success: true,
        data: data || [],
        total: data?.length || 0
      };

    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Validar conexão com Supabase
   * @returns {Promise<Object>} Status da conexão
   */
  async validateConnection() {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('id')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Conexão com Supabase OK'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter estatísticas do serviço
   * @returns {Object} Estatísticas
   */
  getServiceStats() {
    return {
      supabase: { status: 'connected' },
      tiny: { status: 'not_used_in_frontend' }
    };
  }
}
