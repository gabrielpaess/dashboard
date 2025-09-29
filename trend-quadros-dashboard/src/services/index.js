/**
 * Índice Principal dos Serviços
 * Apenas API NestJS - Frontend Limpo
 */

// Clientes base
export { ApiClient } from './api/base/ApiClient.js';
export { ApiError } from './api/base/ApiError.js';
export { ApiCache } from './api/base/ApiCache.js';
export { RateLimiter } from './api/base/RateLimiter.js';

// Clientes NestJS (única fonte de dados)
export { NestjsApiClient } from './api/nestjs/NestjsApiClient.js';
export { NestjsDashboardService } from './api/nestjs/NestjsDashboardService.js';

// Utilitários
export { DateFormatter } from './utils/DateFormatter.js';
export { DataValidator } from './utils/DataValidator.js';
export { ResponseMapper } from './utils/ResponseMapper.js';

// Importar classes para criar instâncias
import { NestjsApiClient } from './api/nestjs/NestjsApiClient.js';
import { NestjsDashboardService } from './api/nestjs/NestjsDashboardService.js';

// Instâncias singleton para uso direto
export const nestjsApiClient = new NestjsApiClient();
export const nestjsDashboardService = new NestjsDashboardService();

// Função para validar conexão com API
export async function validateApiConnection() {
  try {
    const isOnline = await nestjsDashboardService.isOnline();
    return {
      success: isOnline,
      message: isOnline ? 'API NestJS conectada' : 'API NestJS offline',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro na conexão: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}