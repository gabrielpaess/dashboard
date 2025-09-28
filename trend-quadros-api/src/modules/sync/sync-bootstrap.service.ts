import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContinuousSyncService } from './continuous-sync.service';
import { SyncService } from './sync.service';

@Injectable()
export class SyncBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SyncBootstrapService.name);

  constructor(
    private continuousSyncService: ContinuousSyncService,
    private syncService: SyncService,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const autoStart = this.configService.get<string>('AUTO_START_SYNC') !== 'false';
    const runInitialSync = this.configService.get<string>('RUN_INITIAL_SYNC') !== 'false';

    if (autoStart) {
      this.logger.log(`🚀 Auto-starting sync services (${isDevelopment ? 'development' : 'production'} mode)`);
      
      // Pequeno delay para garantir que todos os serviços estejam prontos
      setTimeout(async () => {
        try {
          // Executar sincronização inicial completa se habilitada
          if (runInitialSync) {
            this.logger.log('🔄 Executando sincronização inicial completa...');
            await this.executeInitialSync();
          }
          
          // Iniciar sincronização contínua
          this.continuousSyncService.startContinuousSync();
        } catch (error) {
          this.logger.error('❌ Erro na inicialização da sincronização:', error.message);
        }
      }, 5000);
    } else {
      this.logger.log('⏸️  Auto-start disabled. Use /sync/start to start manually.');
    }
  }

  private async executeInitialSync() {
    try {
      this.logger.log('🔄 Iniciando sincronização inicial completa...');
      
      // Executar sincronização completa usando o serviço existente
      const result = await this.syncService.executeFullSync();
      
      if (result.success) {
        this.logger.log(`✅ Sincronização inicial concluída: ${result.data.new} novos, ${result.data.updated} atualizados, ${result.data.errors} erros`);
      } else {
        this.logger.error('❌ Falha na sincronização inicial');
      }
    } catch (error) {
      this.logger.error('❌ Erro na sincronização inicial:', error.message);
    }
  }
}
