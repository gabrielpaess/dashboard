/**
 * Cliente Específico para Supabase
 * Estende ApiClient base com funcionalidades específicas do Supabase
 */

import { ApiClient } from '../base/ApiClient.js';
import { createClient } from '@supabase/supabase-js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import { DataValidator } from '../../utils/DataValidator.js';

export class SupabaseClient extends ApiClient {
  constructor(config = {}) {
    // Valores hardcoded para garantir funcionamento
    const supabaseUrl = config.url || 'https://jpkpifxctubvauwjvimd.supabase.co';
    const supabaseKey = config.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20';
    
    console.log('🔧 SupabaseClient: Configurando Supabase...', {
      url: supabaseUrl ? '✅' : '❌',
      key: supabaseKey ? '✅' : '❌'
    });
    
    const supabaseConfig = {
      baseURL: supabaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseKey
      },
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: {
        requests: 200,
        per: 'minute'
      },
      cache: {
        ttl: 2 * 60 * 1000, // 2 minutos para Supabase
        maxSize: 1000
      },
      ...config
    };

    super(supabaseConfig);
    
    // Configurar cliente Supabase
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.serviceRoleKey = config.serviceRoleKey || getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY');
  }

  /**
   * Executar query no Supabase
   * @param {string} table - Nome da tabela
   * @param {Object} options - Opções da query
   * @returns {Promise<Object>} Resposta padronizada
   */
  async query(table, options = {}) {
    try {
      const {
        select = '*',
        filters = {},
        orderBy = null,
        limit = null,
        offset = null,
        useCache = true
      } = options;

      let query = this.supabase.from(table).select(select);

      // Aplicar filtros
      Object.keys(filters).forEach(key => {
        const filter = filters[key];
        if (filter.operator && filter.value !== undefined) {
          // Remover sufixos dos nomes dos campos para filtros de data
          const fieldName = key.replace(/_gte$|_lte$/, '');
          query = query[filter.operator](fieldName, filter.value);
        } else if (filter.value !== undefined) {
          query = query.eq(key, filter.value);
        }
      });

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.field, { ascending: orderBy.ascending !== false });
      }

      // Aplicar paginação
      if (limit) {
        if (offset) {
          query = query.range(offset, offset + limit - 1);
        } else {
          query = query.limit(limit);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data, count }, 'query');
    } catch (error) {
      console.error(`❌ Erro na query do Supabase (${table}):`, error);
      throw error;
    }
  }

  /**
   * Inserir dados no Supabase
   * @param {string} table - Nome da tabela
   * @param {Object|Array} data - Dados para inserir
   * @returns {Promise<Object>} Resposta padronizada
   */
  async insert(table, data) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw new Error(`Erro ao inserir no Supabase: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data: result }, 'insert');
    } catch (error) {
      console.error(`❌ Erro ao inserir no Supabase (${table}):`, error);
      throw error;
    }
  }

  /**
   * Atualizar dados no Supabase
   * @param {string} table - Nome da tabela
   * @param {Object} data - Dados para atualizar
   * @param {Object} filters - Filtros para identificar registros
   * @returns {Promise<Object>} Resposta padronizada
   */
  async update(table, data, filters = {}) {
    try {
      let query = this.supabase.from(table).update(data);

      // Aplicar filtros
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });

      const { data: result, error } = await query.select();

      if (error) {
        throw new Error(`Erro ao atualizar no Supabase: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data: result }, 'update');
    } catch (error) {
      console.error(`❌ Erro ao atualizar no Supabase (${table}):`, error);
      throw error;
    }
  }

  /**
   * Deletar dados do Supabase
   * @param {string} table - Nome da tabela
   * @param {Object} filters - Filtros para identificar registros
   * @returns {Promise<Object>} Resposta padronizada
   */
  async delete(table, filters = {}) {
    try {
      let query = this.supabase.from(table).delete();

      // Aplicar filtros
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });

      const { data: result, error } = await query.select();

      if (error) {
        throw new Error(`Erro ao deletar no Supabase: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data: result }, 'delete');
    } catch (error) {
      console.error(`❌ Erro ao deletar no Supabase (${table}):`, error);
      throw error;
    }
  }

  /**
   * Upsert dados no Supabase
   * @param {string} table - Nome da tabela
   * @param {Object|Array} data - Dados para upsert
   * @param {Object} options - Opções do upsert
   * @returns {Promise<Object>} Resposta padronizada
   */
  async upsert(table, data, options = {}) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .upsert(data, options)
        .select();

      if (error) {
        throw new Error(`Erro ao fazer upsert no Supabase: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data: result }, 'upsert');
    } catch (error) {
      console.error(`❌ Erro ao fazer upsert no Supabase (${table}):`, error);
      throw error;
    }
  }

  /**
   * Executar função RPC do Supabase
   * @param {string} functionName - Nome da função
   * @param {Object} params - Parâmetros da função
   * @returns {Promise<Object>} Resposta padronizada
   */
  async rpc(functionName, params = {}) {
    try {
      const { data, error } = await this.supabase.rpc(functionName, params);

      if (error) {
        throw new Error(`Erro na função RPC: ${error.message}`);
      }

      return ResponseMapper.mapSupabaseResponse({ data }, 'rpc');
    } catch (error) {
      console.error(`❌ Erro na função RPC ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Obter cliente Supabase para operações avançadas
   * @returns {Object} Cliente Supabase
   */
  getSupabaseClient() {
    return this.supabase;
  }

  /**
   * Verificar conexão com Supabase
   * @returns {Promise<boolean>} Se conexão é válida
   */
  async validateConnection() {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ Erro ao validar conexão com Supabase:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas da conexão
   * @returns {Object} Estatísticas
   */
  getConnectionStats() {
    return {
      cache: this.getCacheStats(),
      rateLimit: this.getRateLimitStats(),
      url: this.baseURL ? 'CONFIGURED' : 'MISSING',
      anonKey: this.headers.apikey ? 'CONFIGURED' : 'MISSING',
      serviceRoleKey: this.serviceRoleKey ? 'CONFIGURED' : 'MISSING'
    };
  }
}
