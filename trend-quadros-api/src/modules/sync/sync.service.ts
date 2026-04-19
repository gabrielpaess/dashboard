import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../../database/entities/pedido.entity';
import { TinyApiService } from './tiny-api.service';
import { RateLimiterService } from '../../common/services/rate-limiter.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isRunning = false;
  private lastSync: any = null;
  private syncStats = {
    totalSyncs: 0,
    newOrders: 0,
    updatedOrders: 0,
    errors: 0,
    lastError: null as { message: string; timestamp: string } | null
  };

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    private tinyApiService: TinyApiService,
    private rateLimiter: RateLimiterService
  ) {}

  async executeFullSync(options: any = {}) {
    if (this.isRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando sincronização completa');

      const isValidToken = await this.tinyApiService.validateToken();
      if (!isValidToken) {
        throw new Error('Token da API Tiny inválido');
      }

      const orders = await this.tinyApiService.fetchAllOrders();
      this.logger.log(`Encontrados ${orders.length} pedidos na API Tiny`);

      if (orders.length === 0) {
        this.logger.log('Nenhum pedido encontrado para sincronizar');
        return {
          success: true,
          data: {
            processed: 0,
            new: 0,
            updated: 0,
            errors: 0,
            duration: Date.now() - startTime
          }
        };
      }

      const results = await this.processOrdersBatch(orders);

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.syncStats.totalSyncs++;
      this.syncStats.newOrders += results.new;
      this.syncStats.updatedOrders += results.updated;
      this.syncStats.errors += results.errors;

      this.lastSync = {
        timestamp: new Date().toISOString(),
        duration,
        results
      };

      this.logger.log(`Sincronização completa concluída em ${duration}ms`);
      this.logger.log(`Resultados: ${results.new} novos, ${results.updated} atualizados, ${results.errors} erros`);

      return {
        success: true,
        data: {
          ...results,
          duration,
          timestamp: this.lastSync.timestamp
        }
      };

    } catch (error) {
      this.logger.error('Erro na sincronização completa:', error);
      this.syncStats.errors++;
      this.syncStats.lastError = {
        message: error.message,
        timestamp: new Date().toISOString()
      };
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async executeIncrementalSync(options: any = {}) {
    if (this.isRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log(
        'Iniciando sincronização incremental (janela Tiny: 2 meses até hoje)',
      );

      const orders = await this.tinyApiService.fetchRecentOrders();
      this.logger.log(`Encontrados ${orders.length} pedidos recentes`);

      if (orders.length === 0) {
        this.logger.log('Nenhum pedido recente encontrado');
        return {
          success: true,
          data: {
            processed: 0,
            new: 0,
            updated: 0,
            errors: 0,
            duration: Date.now() - startTime
          }
        };
      }

      const results = await this.processOrdersBatch(orders);

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.syncStats.totalSyncs++;
      this.syncStats.newOrders += results.new;
      this.syncStats.updatedOrders += results.updated;
      this.syncStats.errors += results.errors;

      this.lastSync = {
        timestamp: new Date().toISOString(),
        duration,
        results
      };

      this.logger.log(`Sincronização incremental concluída em ${duration}ms`);

      return {
        success: true,
        data: {
          ...results,
          duration,
          timestamp: this.lastSync.timestamp
        }
      };

    } catch (error) {
      this.logger.error('Erro na sincronização incremental:', error);
      this.syncStats.errors++;
      this.syncStats.lastError = {
        message: error.message,
        timestamp: new Date().toISOString()
      };
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async processOrdersBatch(orders: any[]) {
    const results = {
      processed: 0,
      new: 0,
      updated: 0,
      errors: 0,
      errors_list: [] as Array<{ order: any; error: string }>
    };

    const batchSize = 5;
    const maxRetries = 3;

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      let retryCount = 0;
      let batchProcessed = false;

      while (!batchProcessed && retryCount <= maxRetries) {
        try {
          this.logger.log(`Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)}`);

          await Promise.all(batch.map(async (order) => {
            try {
              results.processed++;

              const pedidoData = order.pedido || order;
              const pedidoId = pedidoData.id?.toString();

              if (!pedidoId) {
                this.logger.warn('Order without ID skipped:', order);
                return;
              }

              if (pedidoData.situacao === 'Cancelado') {
                this.logger.log(`Order ${pedidoId} filtered out (situacao: Cancelado)`);
                return;
              }

              // Buscar detalhes completos do pedido (incluindo itens) com retry
              const orderDetails = await this.rateLimiter.executeWithRetry(
                () => this.tinyApiService.fetchOrderDetails(pedidoId),
                3, // 3 tentativas
                2000 // delay base de 2s
              );
              const fullOrderData = orderDetails.data || pedidoData;

              const exists = await this.pedidoRepository.findOne({
                where: { pedido_id: pedidoId }
              });

              const orderData = this.formatOrderData(fullOrderData);

              if (exists) {
                Object.assign(exists, orderData);
                await this.pedidoRepository.save(exists);
                results.updated++;
                this.logger.log(`Order ${pedidoId} updated`);
              } else {
                const pedido = this.pedidoRepository.create({
                  ...orderData,
                  data_pedido: orderData.data_pedido || undefined,
                  data_pedido_pt_br: orderData.data_pedido_pt_br || undefined,
                  data_prevista: orderData.data_prevista || undefined
                });
                await this.pedidoRepository.save(pedido);
                results.new++;
                this.logger.log(`New order ${pedidoId} inserted`);
              }

            } catch (error) {
              this.logger.error(`Error processing order ${order.id || order.pedido?.id}:`, error);
              results.errors++;
              results.errors_list.push({
                order: order.id || order.pedido?.id,
                error: error.message
              });
            }
          }));

          batchProcessed = true;
          retryCount = 0;

          if (i + batchSize < orders.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          if (error.message.includes('API Bloqueada')) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
              const waitTime = Math.min(60000 * retryCount, 300000);
              this.logger.warn(`API bloqueada. Tentativa ${retryCount}/${maxRetries}. Aguardando ${waitTime / 1000} segundos...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              this.logger.error(`Máximo de tentativas atingido (${maxRetries}). Pulando lote...`);
              batchProcessed = true;
              results.errors += batch.length;
            }
          } else {
            this.logger.error('Erro no lote:', error.message);
            batchProcessed = true;
            results.errors += batch.length;
          }
        }
      }
    }

    return results;
  }

  private formatOrderData(pedidoData: any) {
    const dataPedidoISO = this.formatDateToISO(pedidoData.data_pedido);
    const dataPrevistaISO = pedidoData.data_prevista ? this.formatDateToISO(pedidoData.data_prevista) : null;
    
    // Mapear itens corretamente baseado no ResponseMapper original
    const itens = this.mapItens(pedidoData.itens);
    
    return {
      pedido_id: pedidoData.id?.toString(),
      numero: pedidoData.numero,
      nome_cliente: pedidoData.nome || pedidoData.cliente?.nome || 'Cliente não informado',
      data_pedido: dataPedidoISO ? new Date(dataPedidoISO) : null,
      data_pedido_pt_br: this.formatDateToPTBR(pedidoData.data_pedido),
      data_prevista: pedidoData.data_prevista || null,
      situacao: pedidoData.situacao || 'Não informado',
      valor_total: this.extractValorTotal(pedidoData),
      nome_vendedor: pedidoData.nome_vendedor || 'Não informado',
      itens_json: itens,
      envio_15: this.calculateEnvio15(pedidoData.data_pedido, pedidoData.data_prevista),
      envio_45: this.calculateEnvio45(pedidoData.data_pedido, pedidoData.data_prevista)
    };
  }

  private mapItens(itens: any[]): any[] {
    if (!Array.isArray(itens)) {
      return [];
    }

    // Mapear itens da estrutura aninhada da API Tiny
    return itens.map(item => {
      // A API Tiny pode retornar itens em duas estruturas:
      // 1. item.item (estrutura aninhada)
      // 2. item (estrutura direta)
      const itemData = item.item || item;

      return {
        id: itemData.id_produto?.toString() || itemData.id?.toString() || null,
        codigo: itemData.codigo || null,
        descricao: itemData.descricao || 'Item sem descrição',
        quantidade: parseFloat(itemData.quantidade || 0),
        valor_unitario: parseFloat(itemData.valor_unitario || 0),
        valor_total: parseFloat(itemData.valor_total || 0),
        unidade: itemData.unidade || 'UN',
        observacoes: itemData.observacoes || null,
        // Campos adicionais que podem estar presentes
        produto: itemData.produto || null,
        categoria: itemData.categoria || null,
        peso: parseFloat(itemData.peso || 0),
        altura: parseFloat(itemData.altura || 0),
        largura: parseFloat(itemData.largura || 0),
        comprimento: parseFloat(itemData.comprimento || 0)
      };
    });
  }

  private extractValorTotal(pedidoData: any): number {
    const possibleFields = [
      pedidoData.valor,
      pedidoData.total_pedido,
      pedidoData.valor_total,
      pedidoData.total,
      pedidoData.valor_pedido
    ];
    
    for (const field of possibleFields) {
      if (field !== undefined && field !== null && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    
    return 0;
  }

  private formatDateToISO(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('-')) {
        return dateString;
      }
      
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Erro ao formatar data para ISO:', dateString, error);
      return null;
    }
  }

  private formatDateToPTBR(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      if (dateString.includes('/')) {
        return dateString;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Erro ao formatar data para PT-BR:', dateString, error);
      return null;
    }
  }

  private calculateEnvio15(dataPedido: string, dataPrevista: string): boolean {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate.getTime() - pedidoDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 15;
    } catch (error) {
      this.logger.error('Erro ao calcular envio 15:', error);
      return false;
    }
  }

  private calculateEnvio45(dataPedido: string, dataPrevista: string): boolean {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate.getTime() - pedidoDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 45;
    } catch (error) {
      this.logger.error('Erro ao calcular envio 45:', error);
      return false;
    }
  }

  private createLocalDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      return null;
    } catch (error) {
      this.logger.error('Erro ao criar data local:', dateString, error);
      return null;
    }
  }

  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      stats: this.syncStats
    };
  }

  getSyncStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSync: this.lastSync?.timestamp
    };
  }
}
