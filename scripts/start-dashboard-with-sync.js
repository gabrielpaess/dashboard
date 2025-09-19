import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { TinyApiClient } from '../src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from '../src/services/pedidosCentralizedService.js';

// Carregar variáveis de ambiente
dotenv.config();

class DashboardManager {
  constructor() {
    this.dashboardProcess = null;
    this.syncInterval = null;
    this.isRunning = false;
    this.syncStats = {
      totalSyncs: 0,
      lastSync: null,
      errors: 0,
      lastError: null
    };
  }

  /**
   * Iniciar o dashboard
   */
  async startDashboard() {
    console.log('🚀 Iniciando dashboard...');
    
    return new Promise((resolve, reject) => {
      this.dashboardProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd()
      });

      this.dashboardProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[DASHBOARD] ${output.trim()}`);
        
        // Verificar se o dashboard está pronto
        if (output.includes('Local:') || output.includes('ready in')) {
          console.log('✅ Dashboard iniciado com sucesso!');
          resolve();
        }
      });

      this.dashboardProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[DASHBOARD ERROR] ${error.trim()}`);
      });

      this.dashboardProcess.on('close', (code) => {
        console.log(`[DASHBOARD] Processo finalizado com código ${code}`);
        this.dashboardProcess = null;
      });

      this.dashboardProcess.on('error', (error) => {
        console.error(`[DASHBOARD] Erro ao iniciar:`, error);
        reject(error);
      });

      // Timeout de 30 segundos para iniciar
      setTimeout(() => {
        if (this.dashboardProcess && !this.dashboardProcess.killed) {
          console.log('✅ Dashboard assumido como iniciado após timeout');
          resolve();
        }
      }, 30000);
    });
  }

  /**
   * Executar sincronização completa
   */
  async executeFullSync() {
    try {
      console.log('🔄 Iniciando sincronização completa...');
      const startTime = Date.now();
      
      const tinyClient = new TinyApiClient();
      let totalProcessed = 0;
      let totalWithItems = 0;
      let totalWithoutItems = 0;
      let currentPage = 1;
      let hasMorePages = true;
      let apiBlockedCount = 0;
      const maxApiBlocks = 3;

      while (hasMorePages && apiBlockedCount < maxApiBlocks) {
        try {
          console.log(`📄 Sincronizando página ${currentPage}...`);
          
          const response = await tinyClient.fetchOrders({ 
            pagina: currentPage,
            registrosPorPagina: 100,
            useCache: false
          });
          
          if (!response.success || !response.data || response.data.length === 0) {
            console.log(`⚠️ Nenhum pedido encontrado na página ${currentPage}`);
            hasMorePages = false;
            break;
          }
          
          const pedidos = response.data;
          console.log(`📦 Processando ${pedidos.length} pedidos da página ${currentPage}`);
          
          // Processar pedidos em lotes para evitar sobrecarga
          const batchSize = 5;
          for (let i = 0; i < pedidos.length; i += batchSize) {
            const batch = pedidos.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (pedido) => {
              try {
                // Buscar detalhes do pedido
                let itensData = [];
                try {
                  const detailsResponse = await tinyClient.fetchOrderDetails(pedido.id);
                  
                  if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
                    const detailedOrder = detailsResponse.data[0];
                    
                    if (Array.isArray(detailedOrder.itens) && detailedOrder.itens.length > 0) {
                      itensData = detailedOrder.itens.map(item => item.item || item);
                      totalWithItems++;
                    } else {
                      totalWithoutItems++;
                    }
                  } else {
                    totalWithoutItems++;
                  }
                } catch (detailsError) {
                  if (detailsError.message.includes('API Bloqueada')) {
                    throw detailsError; // Re-throw para ser capturado pelo catch externo
                  }
                  console.warn(`⚠️ Erro ao buscar detalhes do pedido ${pedido.numero}:`, detailsError.message);
                  totalWithoutItems++;
                }
                
                // Sincronizar pedido
                await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
                totalProcessed++;
                
              } catch (pedidoError) {
                console.error(`❌ Erro ao processar pedido ${pedido.numero}:`, pedidoError.message);
              }
            }));
            
            // Pequeno delay entre lotes
            if (i + batchSize < pedidos.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Verificar se há mais páginas
          const totalPages = response.pagination?.totalPages || 1;
          hasMorePages = currentPage < totalPages;
          
          if (hasMorePages) {
            currentPage++;
            console.log(`⏳ Aguardando 2 segundos antes da próxima página...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (pageError) {
          if (pageError.message.includes('API Bloqueada')) {
            apiBlockedCount++;
            console.log(`⚠️ API bloqueada (${apiBlockedCount}/${maxApiBlocks}). Aguardando 1 minuto...`);
            
            if (apiBlockedCount >= maxApiBlocks) {
              console.log(`❌ Máximo de bloqueios da API atingido. Parando sincronização.`);
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 60000));
            apiBlockedCount = 0;
          } else {
            console.error(`❌ Erro ao processar página ${currentPage}:`, pageError.message);
            hasMorePages = false;
          }
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Sincronização completa finalizada em ${duration}s`);
      console.log(`📊 Resumo: ${totalProcessed} pedidos processados (${totalWithItems} com itens, ${totalWithoutItems} sem itens)`);
      
      this.syncStats.totalSyncs++;
      this.syncStats.lastSync = new Date().toISOString();
      
      return {
        success: true,
        totalProcessed,
        totalWithItems,
        totalWithoutItems,
        duration: parseFloat(duration)
      };
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      this.syncStats.errors++;
      this.syncStats.lastError = new Date().toISOString();
      return { success: false, error: error.message };
    }
  }

  /**
   * Iniciar sincronização em tempo real
   */
  startRealtimeSync() {
    console.log('🔄 Iniciando sincronização em tempo real...');
    
    // Sincronização inicial
    this.executeFullSync().then(() => {
      console.log('✅ Sincronização inicial concluída');
    });
    
    // Configurar sincronização periódica
    this.syncInterval = setInterval(async () => {
      console.log('🔄 Executando sincronização periódica...');
      await this.executeFullSync();
    }, 5 * 60 * 1000); // A cada 5 minutos
    
    console.log('⏰ Sincronização automática configurada para executar a cada 5 minutos');
  }

  /**
   * Parar sincronização
   */
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Sincronização automática parada');
    }
  }

  /**
   * Parar dashboard
   */
  stopDashboard() {
    if (this.dashboardProcess) {
      this.dashboardProcess.kill();
      this.dashboardProcess = null;
      console.log('⏹️ Dashboard parado');
    }
  }

  /**
   * Parar tudo
   */
  stop() {
    this.stopSync();
    this.stopDashboard();
    this.isRunning = false;
    console.log('🛑 Sistema parado completamente');
  }

  /**
   * Mostrar status do sistema
   */
  showStatus() {
    console.log('\n📊 Status do Sistema:');
    console.log(`   Dashboard: ${this.dashboardProcess ? '🟢 Rodando' : '🔴 Parado'}`);
    console.log(`   Sincronização: ${this.syncInterval ? '🟢 Ativa' : '🔴 Parada'}`);
    console.log(`   Total de sincronizações: ${this.syncStats.totalSyncs}`);
    console.log(`   Última sincronização: ${this.syncStats.lastSync || 'Nunca'}`);
    console.log(`   Erros: ${this.syncStats.errors}`);
    console.log(`   Último erro: ${this.syncStats.lastError || 'Nenhum'}`);
  }

  /**
   * Iniciar sistema completo
   */
  async start() {
    try {
      console.log('🚀 Iniciando sistema completo do dashboard...');
      this.isRunning = true;
      
      // Iniciar dashboard
      await this.startDashboard();
      
      // Aguardar um pouco para o dashboard estabilizar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Iniciar sincronização em tempo real
      this.startRealtimeSync();
      
      console.log('\n🎉 Sistema iniciado com sucesso!');
      console.log('📱 Dashboard disponível em: http://localhost:5173');
      console.log('🔄 Sincronização automática ativa');
      console.log('\n💡 Comandos disponíveis:');
      console.log('   - Ctrl+C: Parar sistema');
      console.log('   - status: Mostrar status');
      console.log('   - sync: Executar sincronização manual');
      console.log('   - stop: Parar sistema');
      
      // Configurar handlers para comandos
      this.setupCommandHandlers();
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sistema:', error);
      this.stop();
      process.exit(1);
    }
  }

  /**
   * Configurar handlers de comandos
   */
  setupCommandHandlers() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data) => {
      const command = data.toString().trim().toLowerCase();
      
      switch (command) {
        case 'status':
          this.showStatus();
          break;
        case 'sync':
          console.log('🔄 Executando sincronização manual...');
          this.executeFullSync();
          break;
        case 'stop':
          console.log('🛑 Parando sistema...');
          this.stop();
          process.exit(0);
          break;
        case 'help':
          console.log('\n💡 Comandos disponíveis:');
          console.log('   status - Mostrar status do sistema');
          console.log('   sync   - Executar sincronização manual');
          console.log('   stop   - Parar sistema');
          console.log('   help   - Mostrar esta ajuda');
          break;
        default:
          if (command) {
            console.log('❓ Comando não reconhecido. Digite "help" para ver os comandos disponíveis.');
          }
      }
    });
  }
}

// Função principal
async function main() {
  const dashboardManager = new DashboardManager();
  
  // Configurar handlers de sinal para parada limpa
  process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de parada. Finalizando sistema...');
    dashboardManager.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término. Finalizando sistema...');
    dashboardManager.stop();
    process.exit(0);
  });
  
  // Iniciar sistema
  await dashboardManager.start();
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DashboardManager };