/**
 * Índice Principal dos Serviços
 * Centraliza todas as exportações dos serviços
 */

// Configuração
export { apiConfig } from './config/ApiConfig.js';

// Clientes base
export { ApiClient } from './api/base/ApiClient.js';
export { ApiError } from './api/base/ApiError.js';
export { ApiCache } from './api/base/ApiCache.js';
export { RateLimiter } from './api/base/RateLimiter.js';

// Clientes específicos (removidos TinyApiClient e TinyOrderService do frontend)
// export { TinyApiClient } from './api/tiny/TinyApiClient.js';
// export { TinyOrderService } from './api/tiny/TinyOrderService.js';

export { SupabaseClient } from './api/supabase/SupabaseClient.js';
export { SupabaseOrderService } from './api/supabase/SupabaseOrderService.js';

export { InstagramApiClient } from './api/instagram/InstagramApiClient.js';
export { InstagramConversationService } from './api/instagram/InstagramConversationService.js';

// Repositórios
export { OrderRepository } from './data/OrderRepository.js';
export { FrontendOrderRepository } from './data/FrontendOrderRepository.js';
export { SimpleOrderRepository } from './data/SimpleOrderRepository.js';

// Serviços de sincronização
export { SyncService } from './sync/SyncService.js';

// Utilitários
export { DateFormatter } from './utils/DateFormatter.js';
export { DataValidator } from './utils/DataValidator.js';
export { ResponseMapper } from './utils/ResponseMapper.js';

// Migração
export { legacyServiceAdapter } from './migration/LegacyServiceAdapter.js';
export { MigrationHelper, runMigration } from './migration/migrate.js';

// Instâncias prontas para uso
import { apiConfig } from './config/ApiConfig.js';
// import { TinyOrderService } from './api/tiny/TinyOrderService.js'; // Removido do frontend
import { SupabaseOrderService } from './api/supabase/SupabaseOrderService.js';
import { InstagramConversationService } from './api/instagram/InstagramConversationService.js';
import { OrderRepository } from './data/OrderRepository.js';
import { FrontendOrderRepository } from './data/FrontendOrderRepository.js';
import { SimpleOrderRepository } from './data/SimpleOrderRepository.js';
import { SyncService } from './sync/SyncService.js';

// Instâncias singleton para uso direto
// export const tinyOrderService = new TinyOrderService(apiConfig.getTinyConfig()); // Removido do frontend
export const supabaseOrderService = new SupabaseOrderService(apiConfig.getSupabaseConfig());
export const instagramConversationService = new InstagramConversationService(apiConfig.getInstagramConfig());
// Usar SimpleOrderRepository no frontend (versão mais simples e confiável)
// Não usar apiConfig para evitar dependências da API Tiny
export const orderRepository = new SimpleOrderRepository({
  supabase: {
    url: 'https://jpkpifxctubvauwjvimd.supabase.co', // Hardcoded para garantir funcionamento
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20' // Hardcoded para garantir funcionamento
  }
});
// export const syncService = new SyncService({ // Removido do frontend
//   tiny: apiConfig.getTinyConfig(),
//   supabase: apiConfig.getSupabaseConfig()
// });

// Função para obter instâncias com configuração customizada
export function createServices(customConfig = {}) {
  const config = {
    tiny: { ...apiConfig.getTinyConfig(), ...customConfig.tiny },
    supabase: { ...apiConfig.getSupabaseConfig(), ...customConfig.supabase },
    instagram: { ...apiConfig.getInstagramConfig(), ...customConfig.instagram }
  };

  return {
    // tinyOrderService: new TinyOrderService(config.tiny), // Removido do frontend
    supabaseOrderService: new SupabaseOrderService(config.supabase),
    instagramConversationService: new InstagramConversationService(config.instagram),
    orderRepository: new OrderRepository(config),
    // syncService: new SyncService(config) // Removido do frontend
  };
}

// Função para validar todas as configurações
export async function validateAllConnections() {
  const services = createServices();
  
  const [tinyValid, supabaseValid, instagramValid] = await Promise.allSettled([
    services.tinyOrderService.validateConnection(),
    services.supabaseOrderService.validateConnection(),
    services.instagramConversationService.validateConnection()
  ]);

  return {
    tiny: tinyValid.status === 'fulfilled' ? tinyValid.value : false,
    supabase: supabaseValid.status === 'fulfilled' ? supabaseValid.value : false,
    instagram: instagramValid.status === 'fulfilled' ? instagramValid.value : false,
    errors: {
      tiny: tinyValid.status === 'rejected' ? tinyValid.reason : null,
      supabase: supabaseValid.status === 'rejected' ? supabaseValid.reason : null,
      instagram: instagramValid.status === 'rejected' ? instagramValid.reason : null
    }
  };
}
