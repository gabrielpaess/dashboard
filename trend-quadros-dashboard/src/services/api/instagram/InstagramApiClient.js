/**
 * Cliente Específico para API Instagram
 * Estende ApiClient base com funcionalidades específicas do Instagram
 */

import { ApiClient } from '../base/ApiClient.js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import { DataValidator } from '../../utils/DataValidator.js';

export class InstagramApiClient extends ApiClient {
  constructor(config = {}) {
    const instagramConfig = {
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000,
      retryAttempts: 3,
      rateLimit: {
        requests: 200,
        per: 'hour'
      },
      cache: {
        ttl: 10 * 60 * 1000, // 10 minutos para Instagram
        maxSize: 200
      },
      ...config
    };

    super(instagramConfig);
    
    // Função para obter variável de ambiente (funciona no browser e Node.js)
    const getEnvVar = (key) => {
      if (typeof window !== 'undefined' && import.meta?.env) {
        return import.meta.env[key];
      } else if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
      }
      return undefined;
    };
    
    this.accessToken = config.accessToken || getEnvVar('VITE_INSTAGRAM_ACCESS_TOKEN');
    this.appId = config.appId || getEnvVar('VITE_INSTAGRAM_APP_ID');
    this.appSecret = config.appSecret || getEnvVar('VITE_INSTAGRAM_APP_SECRET');
    
    if (!this.accessToken) {
      console.warn('⚠️ Token de acesso do Instagram não encontrado. Instagram não estará disponível.');
    }
  }

  /**
   * Fazer requisição para API Instagram
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async request(endpoint, options = {}) {
    const { params = {}, ...restOptions } = options;
    
    // Adicionar access token aos parâmetros
    const paramsWithToken = {
      access_token: this.accessToken,
      ...params
    };

    return super.request(endpoint, {
      ...restOptions,
      params: paramsWithToken
    });
  }

  /**
   * Buscar conversas do Instagram
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchConversations(params = {}) {
    try {
      const response = await this.request('/me/conversations', {
        method: 'GET',
        params: {
          fields: 'id,participants,updated_time,messages{id,message,from,created_time}',
          limit: params.limit || 25,
          ...params
        },
        useCache: true,
        cacheKey: `conversations_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error('❌ Erro ao buscar conversas do Instagram:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   * @param {string} conversationId - ID da conversa
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchConversationMessages(conversationId, params = {}) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');

      const response = await this.request(`/${conversationId}/messages`, {
        method: 'GET',
        params: {
          fields: 'id,message,from,created_time,attachments',
          limit: params.limit || 50,
          ...params
        },
        useCache: true,
        cacheKey: `messages_${conversationId}_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar mensagens da conversa ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensagem para conversa
   * @param {string} conversationId - ID da conversa
   * @param {string} message - Mensagem a ser enviada
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async sendMessage(conversationId, message, options = {}) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');
      DataValidator.isNotEmptyString(message, 'Mensagem');

      const response = await this.request(`/${conversationId}/messages`, {
        method: 'POST',
        data: {
          message: message,
          ...options
        },
        useCache: false
      });

      return {
        success: true,
        data: response,
        metadata: {
          api: 'instagram',
          operation: 'send_message',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para conversa ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar informações do perfil
   * @param {string} userId - ID do usuário (opcional, padrão: me)
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchProfile(userId = 'me') {
    try {
      const response = await this.request(`/${userId}`, {
        method: 'GET',
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count'
        },
        useCache: true,
        cacheKey: `profile_${userId}`
      });

      return {
        success: true,
        data: response,
        metadata: {
          api: 'instagram',
          operation: 'fetch_profile',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar perfil ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar mídias do perfil
   * @param {string} userId - ID do usuário (opcional, padrão: me)
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchMedia(userId = 'me', params = {}) {
    try {
      const response = await this.request(`/${userId}/media`, {
        method: 'GET',
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
          limit: params.limit || 25,
          ...params
        },
        useCache: true,
        cacheKey: `media_${userId}_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar mídias do usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar comentários de uma mídia
   * @param {string} mediaId - ID da mídia
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchMediaComments(mediaId, params = {}) {
    try {
      DataValidator.isNotEmptyString(mediaId, 'ID da mídia');

      const response = await this.request(`/${mediaId}/comments`, {
        method: 'GET',
        params: {
          fields: 'id,text,from,like_count,created_time,replies',
          limit: params.limit || 25,
          ...params
        },
        useCache: true,
        cacheKey: `comments_${mediaId}_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar comentários da mídia ${mediaId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar insights do perfil
   * @param {string} userId - ID do usuário (opcional, padrão: me)
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async fetchInsights(userId = 'me', params = {}) {
    try {
      const response = await this.request(`/${userId}/insights`, {
        method: 'GET',
        params: {
          metric: params.metrics || 'impressions,reach,profile_views,website_clicks',
          period: params.period || 'day',
          since: params.since,
          until: params.until,
          ...params
        },
        useCache: true,
        cacheKey: `insights_${userId}_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar insights do usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar hashtags relacionadas
   * @param {string} hashtag - Hashtag a ser pesquisada
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async searchHashtags(hashtag, params = {}) {
    try {
      DataValidator.isNotEmptyString(hashtag, 'Hashtag');

      const response = await this.request('/ig_hashtag_search', {
        method: 'GET',
        params: {
          q: hashtag,
          user_id: params.userId || 'me',
          ...params
        },
        useCache: true,
        cacheKey: `hashtags_${hashtag}_${JSON.stringify(params)}`
      });

      return ResponseMapper.mapInstagramResponse(response);
    } catch (error) {
      console.error(`❌ Erro ao buscar hashtags para ${hashtag}:`, error);
      throw error;
    }
  }

  /**
   * Validar token de acesso
   * @returns {Promise<boolean>} Se token é válido
   */
  async validateToken() {
    try {
      await this.fetchProfile();
      return true;
    } catch (error) {
      console.error('❌ Token inválido do Instagram:', error.message);
      return false;
    }
  }

  /**
   * Obter informações do token
   * @returns {Promise<Object>} Informações do token
   */
  async getTokenInfo() {
    try {
      const response = await this.request('/debug_token', {
        method: 'GET',
        params: {
          input_token: this.accessToken
        }
      });

      return {
        success: true,
        data: response.data,
        metadata: {
          api: 'instagram',
          operation: 'token_info',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações do token:', error);
      throw error;
    }
  }

  /**
   * Mapear conversa do Instagram para formato padronizado
   * @param {Object} instagramConversation - Conversa do Instagram
   * @returns {Object} Conversa padronizada
   */
  mapConversation(instagramConversation) {
    return ResponseMapper.mapInstagramConversation(instagramConversation);
  }

  /**
   * Obter estatísticas da API
   * @returns {Object} Estatísticas
   */
  getApiStats() {
    return {
      cache: this.getCacheStats(),
      rateLimit: this.getRateLimitStats(),
      accessToken: this.accessToken ? 'CONFIGURED' : 'MISSING',
      appId: this.appId ? 'CONFIGURED' : 'MISSING',
      appSecret: this.appSecret ? 'CONFIGURED' : 'MISSING'
    };
  }
}
