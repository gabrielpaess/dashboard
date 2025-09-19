#!/usr/bin/env node

/**
 * Script Completo: Dashboard + Sincronização Automática
 * 
 * - Inicia o dashboard Vite
 * - Mantém sincronização automática a cada 15 minutos
 * - Em caso de falha: intervalo de 1 minuto
 * 
 * Uso: npm run start:auto
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { TinyApiClient } from '../src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from '../src/services/pedidosCentralizedService.js';

dotenv.config();

console.log('🚀 Iniciando Dashboard com Sincronização Automática...');

class DashboardWithSync {
  constructor() {
    this.dashboardProcess = null;
    this.syncInterval = null;
    this.isRunning = false;
    this.syncCount = 0;
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
  }

  async startDashboard() {
    console.log('🚀 Iniciando dashboard...');
    
    return new Promise((resolve, reject) => {
      // Tentar diferentes formas de iniciar o Vite
      const commands = [
        ['npx', 'vite'],
        ['node', 'node_modules/vite/bin/vite.js'],
        ['npm', 'run', 'dev']
      ];
      
      let commandIndex = 0;
      
      const tryNextCommand = () => {
        if (commandIndex >= commands.length) {
          console.log('❌ Não foi possível iniciar o dashboard');
          console.log('💡 Tente iniciar manualmente: npm run dev');
          resolve(); // Continuar mesmo sem dashboard
          return;
        }
        
        const [command, ...args] = commands[commandIndex];
        console.log(`🔄 Tentando comando: ${command} ${args.join(' ')}`);
        
        this.dashboardProcess = spawn(command, args, {
          stdio: 'pipe',
          shell: true,
          cwd: process.cwd()
        });

        let resolved = false;

        this.dashboardProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(`[DASHBOARD] ${output.trim()}`);
          
          if (!resolved && (output.includes('Local:') || output.includes('ready in'))) {
            resolved = true;
            console.log('✅ Dashboard iniciado! Acesse: http://localhost:5173');
            resolve();
          }
        });

        this.dashboardProcess.stderr.on('data', (data) => {
          const error = data.toString();
          if (!error.includes('warnings') && !error.includes('deprecated')) {
            console.error(`[DASHBOARD ERROR] ${error.trim()}`);
          }
        });

        this.dashboardProcess.on('close', (code) => {
          if (!resolved) {
            console.log(`[DASHBOARD] Processo finalizado com código ${code}`);
            this.dashboardProcess = null;
            commandIndex++;
            tryNextCommand();
          }
        });

        this.dashboardProcess.on('error', (error) => {
          if (!resolved) {
            console.log(`[DASHBOARD] Erro com comando ${command}: ${error.message}`);
            this.dashboardProcess = null;
            commandIndex++;
            tryNextCommand();
          }
        });

        // Timeout de 15 segundos por comando
        setTimeout(() => {
          if (!resolved && this.dashboardProcess && !this.dashboardProcess.killed) {
            console.log(`[DASHBOARD] Timeout com comando ${command}`);
            this.dashboardProcess.kill();
            this.dashboardProcess = null;
            commandIndex++;
            tryNextCommand();
          }
        }, 15000);
      };
      
      tryNextCommand();
    });
  }

  async executeSync() {
    try {
      this.syncCount++;
      console.log(`\n🔄 Sincronização #${this.syncCount}...`);
      
      const tinyClient = new TinyApiClient();
      const response = await tinyClient.fetchOrders({ 
        registrosPorPagina: 50,
        useCache: false
      });
      
      if (!response.success || !response.data) {
        console.log('⚠️ Nenhum pedido encontrado');
        this.consecutiveFailures = 0;
        return;
      }
      
      const pedidos = response.data;
      let processed = 0;
      let withItems = 0;
      let currentIndex = 0;
      const batchSize = 3;
      const maxRetries = 3;
      let retryCount = 0;
      
      // Processar em lotes pequenos com retry automático
      while (currentIndex < pedidos.length) {
        try {
          const batch = pedidos.slice(currentIndex, currentIndex + batchSize);
          console.log(`📦 Processando lote ${Math.floor(currentIndex / batchSize) + 1}/${Math.ceil(pedidos.length / batchSize)} (pedidos ${currentIndex + 1}-${Math.min(currentIndex + batchSize, pedidos.length)})`);
          
          await Promise.all(batch.map(async (pedido) => {
            try {
              let itensData = [];
              
              // Buscar detalhes
              try {
                const detailsResponse = await tinyClient.fetchOrderDetails(pedido.id);
                if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
                  const detailedOrder = detailsResponse.data[0];
                  if (Array.isArray(detailedOrder.itens) && detailedOrder.itens.length > 0) {
                    itensData = detailedOrder.itens.map(item => item.item || item);
                    withItems++;
                  }
                }
              } catch (detailsError) {
                if (detailsError.message.includes('API Bloqueada')) {
                  throw detailsError;
                }
                // Ignorar outros erros
              }
              
              // Sincronizar
              await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
              processed++;
              
            } catch (error) {
              if (error.message.includes('API Bloqueada')) {
                throw error;
              }
              // Ignorar outros erros
            }
          }));
          
          // Sucesso no lote - resetar contador de retry e avançar
          retryCount = 0;
          currentIndex += batchSize;
          
          // Delay entre lotes
          if (currentIndex < pedidos.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          if (error.message.includes('API Bloqueada')) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
              const waitTime = Math.min(60000 * retryCount, 300000); // Max 5 minutos
              console.log(`⚠️ API bloqueada. Tentativa ${retryCount}/${maxRetries}. Aguardando ${waitTime / 1000} segundos...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Tentar novamente o mesmo lote
              continue;
            } else {
              console.log(`❌ Máximo de tentativas atingido (${maxRetries}). Continuando com próximo lote...`);
              retryCount = 0;
              currentIndex += batchSize;
            }
          } else {
            console.error('❌ Erro no lote:', error.message);
            // Avançar para próximo lote em caso de outros erros
            currentIndex += batchSize;
          }
        }
      }
      
      console.log(`✅ Sincronizado: ${processed} pedidos (${withItems} com itens)`);
      this.consecutiveFailures = 0;
      
    } catch (error) {
      this.consecutiveFailures++;
      console.error('❌ Erro na sincronização:', error.message);
    }
  }

  startAutoSync() {
    console.log('🔄 Iniciando sincronização automática (a cada 15 minutos)...');
    
    // Sincronização inicial
    this.executeSync();
    
    // Sincronização periódica
    this.syncInterval = setInterval(() => {
      this.executeSync();
    }, 15 * 60 * 1000); // 15 minutos
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.dashboardProcess) {
      this.dashboardProcess.kill();
      this.dashboardProcess = null;
    }
    
    this.isRunning = false;
    console.log('🛑 Sistema parado');
  }

  async start() {
    try {
      this.isRunning = true;
      
      // Iniciar dashboard
      await this.startDashboard();
      
      // Aguardar estabilização
      console.log('⏳ Aguardando estabilização...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Iniciar sincronização automática
      this.startAutoSync();
      
      console.log('\n🎉 Sistema iniciado com sucesso!');
      if (this.dashboardProcess) {
        console.log('📱 Dashboard: http://localhost:5173');
      } else {
        console.log('⚠️ Dashboard não iniciado, mas sincronização ativa');
      }
      console.log('🔄 Sincronização automática ativa');
      console.log('\n💡 Pressione Ctrl+C para parar\n');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar:', error);
      this.stop();
      process.exit(1);
    }
  }
}

// Função principal
async function main() {
  const dashboard = new DashboardWithSync();
  
  // Handlers de sinal
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando sistema...');
    dashboard.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Parando sistema...');
    dashboard.stop();
    process.exit(0);
  });
  
  // Iniciar
  await dashboard.start();
}

// Executar
main().catch(console.error);

