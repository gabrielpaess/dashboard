/**
 * Serviço de Sincronização
 * Gerencia sincronização entre diferentes fontes de dados
 */

import { OrderRepository } from '../data/OrderRepository.js';
import { DataValidator } from '../utils/DataValidator.js';

export class SyncService {
  constructor(config = {}) {
    this.repository = new OrderRepository(config);
    this.isRunning = false;
    this.lastSync = null;
    this.syncHistory = [];
  }

  /**
   * Executar sincronização completa
   * @param {Object} options - Opções de sincronização
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async executeFullSync(options = {}) {
    if (this.isRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Iniciando sincronização completa');

      // Validar conexões
      const connections = await this.repository.validateConnections();
      if (!connections.data.tiny || !connections.data.supabase) {
        throw new Error('Conexões inválidas. Verifique as configurações das APIs.');
      }

      // Executar sincronização Tiny -> Supabase
      const syncResult = await this.repository.syncTinyToSupabase(options);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: true,
        data: syncResult.data,
        duration,
        timestamp: new Date().toISOString(),
        type: 'full_sync'
      };

      // Registrar no histórico
      this.syncHistory.push(result);
      this.lastSync = result;

      console.log(`✅ Sincronização completa concluída em ${duration}ms`);
      return result;

    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      
      const errorResult = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        type: 'full_sync'
      };

      this.syncHistory.push(errorResult);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Executar sincronização incremental
   * @param {Object} options - Opções de sincronização
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async executeIncrementalSync(options = {}) {
    if (this.isRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Iniciando sincronização incremental');

      // Usar data da última sincronização se disponível
      const sinceDate = options.since || this.lastSync?.timestamp;
      if (sinceDate) {
        options.dataInicial = this.formatDateForAPI(new Date(sinceDate));
      }

      // Executar sincronização
      const syncResult = await this.repository.syncTinyToSupabase(options);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: true,
        data: syncResult.data,
        duration,
        timestamp: new Date().toISOString(),
        type: 'incremental_sync',
        since: sinceDate
      };

      // Registrar no histórico
      this.syncHistory.push(result);
      this.lastSync = result;

      console.log(`✅ Sincronização incremental concluída em ${duration}ms`);
      return result;

    } catch (error) {
      console.error('❌ Erro na sincronização incremental:', error);
      
      const errorResult = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        type: 'incremental_sync'
      };

      this.syncHistory.push(errorResult);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Executar sincronização por período
   * @param {string} startDate - Data inicial
   * @param {string} endDate - Data final
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async executePeriodSync(startDate, endDate, options = {}) {
    if (this.isRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`🔄 Iniciando sincronização por período: ${startDate} - ${endDate}`);

      DataValidator.isValidDate(startDate, 'Data inicial');
      DataValidator.isValidDate(endDate, 'Data final');

      const syncOptions = {
        ...options,
        dataInicial: this.formatDateForAPI(new Date(startDate)),
        dataFinal: this.formatDateForAPI(new Date(endDate))
      };

      const syncResult = await this.repository.syncTinyToSupabase(syncOptions);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: true,
        data: syncResult.data,
        duration,
        timestamp: new Date().toISOString(),
        type: 'period_sync',
        period: { startDate, endDate }
      };

      // Registrar no histórico
      this.syncHistory.push(result);
      this.lastSync = result;

      console.log(`✅ Sincronização por período concluída em ${duration}ms`);
      return result;

    } catch (error) {
      console.error('❌ Erro na sincronização por período:', error);
      
      const errorResult = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        type: 'period_sync',
        period: { startDate, endDate }
      };

      this.syncHistory.push(errorResult);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Verificar status da sincronização
   * @returns {Object} Status atual
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      historyCount: this.syncHistory.length,
      nextSync: this.calculateNextSync(),
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Obter histórico de sincronizações
   * @param {number} limit - Limite de registros
   * @returns {Array} Histórico de sincronizações
   */
  getSyncHistory(limit = 10) {
    return this.syncHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * Limpar histórico de sincronizações
   * @param {number} keepLast - Manter últimos N registros
   */
  clearHistory(keepLast = 5) {
    if (this.syncHistory.length > keepLast) {
      this.syncHistory = this.syncHistory.slice(-keepLast);
    }
  }

  /**
   * Calcular próxima sincronização
   * @returns {Date|null} Data da próxima sincronização
   */
  calculateNextSync() {
    if (!this.lastSync) return null;
    
    const lastSyncTime = new Date(this.lastSync.timestamp);
    const nextSyncTime = new Date(lastSyncTime.getTime() + (30 * 60 * 1000)); // 30 minutos
    
    return nextSyncTime;
  }

  /**
   * Formatar data para API (DD/MM/YYYY)
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data formatada
   */
  formatDateForAPI(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Validar configurações de sincronização
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateSyncConfig() {
    try {
      const connections = await this.repository.validateConnections();
      
      return {
        success: true,
        data: {
          connections: connections.data,
          errors: connections.errors,
          repository: this.repository.getRepositoryStats()
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erro ao validar configurações:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de sincronização
   * @returns {Object} Estatísticas
   */
  getSyncStats() {
    const totalSyncs = this.syncHistory.length;
    const successfulSyncs = this.syncHistory.filter(s => s.success).length;
    const failedSyncs = totalSyncs - successfulSyncs;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs * 100).toFixed(2) : 0;

    const totalProcessed = this.syncHistory
      .filter(s => s.success && s.data)
      .reduce((sum, s) => sum + (s.data.processed || 0), 0);

    const totalNew = this.syncHistory
      .filter(s => s.success && s.data)
      .reduce((sum, s) => sum + (s.data.new || 0), 0);

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: `${successRate}%`,
      totalProcessed,
      totalNew,
      isRunning: this.isRunning,
      lastSync: this.lastSync?.timestamp,
      repository: this.repository.getRepositoryStats()
    };
  }
}
