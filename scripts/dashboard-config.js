/**
 * Configurações do Dashboard com Sincronização
 */

export const DASHBOARD_CONFIG = {
  // Configurações do Dashboard
  PORT: 5173,
  HOST: 'localhost',
  
  // Configurações de Sincronização
  SYNC: {
    INTERVAL: 5 * 60 * 1000, // 5 minutos
    BATCH_SIZE: 5,
    MAX_RETRIES: 3,
    API_DELAY: 1000, // 1 segundo entre requisições
    TIMEOUT: 30000 // 30 segundos
  },
  
  // Configurações da API Tiny
  TINY_API: {
    MAX_PAGES: 10,
    RECORDS_PER_PAGE: 100,
    RATE_LIMIT_DELAY: 60000 // 1 minuto quando bloqueada
  },
  
  // Mensagens
  MESSAGES: {
    STARTING: '🚀 Iniciando Dashboard com Sincronização Automática',
    DASHBOARD_READY: '✅ Dashboard iniciado! Acesse: http://localhost:5173',
    SYNC_START: '🔄 Iniciando sincronização automática',
    SYNC_SUCCESS: '✅ Sincronização concluída',
    SYNC_ERROR: '❌ Erro na sincronização',
    API_BLOCKED: '⚠️ API bloqueada. Aguardando 1 minuto...',
    STOPPING: '🛑 Parando sistema...',
    STOPPED: '✅ Sistema parado completamente'
  }
};

export const SYNC_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  ERROR: 'error',
  BLOCKED: 'blocked'
};

