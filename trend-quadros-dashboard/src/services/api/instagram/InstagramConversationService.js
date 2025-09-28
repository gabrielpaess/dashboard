/**
 * Serviço de Conversas do Instagram
 * Fornece métodos de alto nível para operações com conversas do Instagram
 */

import { InstagramApiClient } from './InstagramApiClient.js';
import { ResponseMapper } from '../../utils/ResponseMapper.js';
import { DataValidator } from '../../utils/DataValidator.js';

export class InstagramConversationService {
  constructor(config = {}) {
    this.client = new InstagramApiClient(config);
  }

  /**
   * Buscar todas as conversas
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getConversations(options = {}) {
    try {
      const response = await this.client.fetchConversations(options);
      
      if (!response.success) {
        throw new Error('Falha ao buscar conversas');
      }

      // Mapear conversas para formato padronizado
      const mappedConversations = response.data.map(conversation => 
        this.client.mapConversation(conversation)
      );
      
      return {
        success: true,
        data: mappedConversations,
        pagination: response.pagination,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('❌ Erro no serviço de conversas:', error);
      throw error;
    }
  }

  /**
   * Buscar conversas recentes
   * @param {number} limit - Limite de conversas (padrão: 10)
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getRecentConversations(limit = 10) {
    try {
      DataValidator.isValidNumber(limit, 'Limite', 1, 100);

      return await this.getConversations({
        limit,
        order: 'updated_time'
      });
    } catch (error) {
      console.error('❌ Erro ao buscar conversas recentes:', error);
      throw error;
    }
  }

  /**
   * Buscar conversa específica
   * @param {string} conversationId - ID da conversa
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getConversation(conversationId) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');

      const response = await this.client.fetchConversations({
        limit: 1,
        filters: { id: conversationId }
      });

      if (!response.success || !response.data || response.data.length === 0) {
        throw new Error('Conversa não encontrada');
      }

      return {
        success: true,
        data: this.client.mapConversation(response.data[0]),
        metadata: response.metadata
      };
    } catch (error) {
      console.error(`❌ Erro ao buscar conversa ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   * @param {string} conversationId - ID da conversa
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getConversationMessages(conversationId, options = {}) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');

      const response = await this.client.fetchConversationMessages(conversationId, options);
      
      if (!response.success) {
        throw new Error('Falha ao buscar mensagens da conversa');
      }

      return {
        success: true,
        data: response.data,
        pagination: response.pagination,
        metadata: {
          ...response.metadata,
          conversationId
        }
      };
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

      const response = await this.client.sendMessage(conversationId, message, options);
      
      return response;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para conversa ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Buscar conversas com mensagens não lidas
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getUnreadConversations(options = {}) {
    try {
      const response = await this.getConversations({
        ...options,
        unread_only: true
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar conversas não lidas:', error);
      throw error;
    }
  }

  /**
   * Buscar conversas por período
   * @param {string} startDate - Data inicial (ISO)
   * @param {string} endDate - Data final (ISO)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async getConversationsByPeriod(startDate, endDate, options = {}) {
    try {
      DataValidator.isValidDate(startDate, 'Data inicial');
      DataValidator.isValidDate(endDate, 'Data final');

      const response = await this.getConversations({
        ...options,
        since: startDate,
        until: endDate
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar conversas por período:', error);
      throw error;
    }
  }

  /**
   * Buscar conversas com filtro de texto
   * @param {string} searchText - Texto para buscar
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta padronizada
   */
  async searchConversations(searchText, options = {}) {
    try {
      DataValidator.isNotEmptyString(searchText, 'Texto de busca');

      const response = await this.getConversations({
        ...options,
        q: searchText
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar conversas por texto:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas das conversas
   * @param {Object} options - Opções de análise
   * @returns {Promise<Object>} Estatísticas das conversas
   */
  async getConversationStats(options = {}) {
    try {
      const response = await this.getConversations(options);
      
      if (!response.success) {
        throw new Error('Falha ao buscar dados para estatísticas');
      }

      const conversations = response.data;
      const totalConversations = conversations.length;
      const totalMessages = conversations.reduce((sum, conv) => 
        sum + (conv.messages ? conv.messages.length : 0), 0
      );
      const averageMessagesPerConversation = totalConversations > 0 ? 
        totalMessages / totalConversations : 0;

      // Agrupar por participante
      const participants = {};
      conversations.forEach(conv => {
        if (conv.participants) {
          conv.participants.forEach(participant => {
            const id = participant.id;
            if (!participants[id]) {
              participants[id] = {
                id,
                name: participant.name || 'Usuário',
                conversationCount: 0,
                messageCount: 0
              };
            }
            participants[id].conversationCount++;
            participants[id].messageCount += conv.messages ? conv.messages.length : 0;
          });
        }
      });

      return {
        success: true,
        data: {
          totalConversations,
          totalMessages,
          averageMessagesPerConversation,
          participants: Object.values(participants),
          period: options.since && options.until ? 
            `${options.since} - ${options.until}` : 'all'
        },
        metadata: {
          api: 'instagram',
          operation: 'conversation_stats',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas das conversas:', error);
      throw error;
    }
  }

  /**
   * Marcar conversa como lida
   * @param {string} conversationId - ID da conversa
   * @returns {Promise<Object>} Resposta padronizada
   */
  async markAsRead(conversationId) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');

      // Nota: Instagram API não tem endpoint específico para marcar como lida
      // Esta é uma implementação conceitual
      return {
        success: true,
        data: { conversationId, read: true },
        metadata: {
          api: 'instagram',
          operation: 'mark_as_read',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Erro ao marcar conversa ${conversationId} como lida:`, error);
      throw error;
    }
  }

  /**
   * Arquivar conversa
   * @param {string} conversationId - ID da conversa
   * @returns {Promise<Object>} Resposta padronizada
   */
  async archiveConversation(conversationId) {
    try {
      DataValidator.isNotEmptyString(conversationId, 'ID da conversa');

      // Nota: Instagram API não tem endpoint específico para arquivar
      // Esta é uma implementação conceitual
      return {
        success: true,
        data: { conversationId, archived: true },
        metadata: {
          api: 'instagram',
          operation: 'archive_conversation',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Erro ao arquivar conversa ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Validar conexão com Instagram
   * @returns {Promise<boolean>} Se conexão é válida
   */
  async validateConnection() {
    try {
      return await this.client.validateToken();
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas do serviço
   * @returns {Object} Estatísticas do serviço
   */
  getServiceStats() {
    return this.client.getApiStats();
  }
}
