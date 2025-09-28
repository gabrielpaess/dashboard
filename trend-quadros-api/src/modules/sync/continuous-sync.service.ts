import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../../database/entities/pedido.entity';
import { TinyApiService } from './tiny-api.service';
import { RateLimiterService } from '../../common/services/rate-limiter.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContinuousSyncService {
  private readonly logger = new Logger(ContinuousSyncService.name);
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly syncIntervalMs: number;

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    private tinyApiService: TinyApiService,
    private rateLimiter: RateLimiterService,
    private configService: ConfigService
  ) {
    // Configuração baseada no ambiente e variáveis de ambiente
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const customInterval = this.configService.get<string>('SYNC_INTERVAL_MINUTES');
    
    if (customInterval) {
      // Usar intervalo customizado se fornecido
      this.syncIntervalMs = parseInt(customInterval) * 60 * 1000;
      this.logger.log(`Continuous sync configured: ${customInterval} minutes (custom)`);
    } else {
      // Configuração padrão baseada no ambiente
      this.syncIntervalMs = isDevelopment ? 60000 : 15 * 60 * 1000; // 1 min em dev, 15 min em prod
      this.logger.log(`Continuous sync configured: ${isDevelopment ? '1 minute' : '15 minutes'} interval`);
    }
  }

  /**
   * Inicia a sincronização contínua
   */
  startContinuousSync() {
    if (this.isRunning) {
      this.logger.warn('Continuous sync is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('🚀 Starting continuous sync service...');

    // Executa imediatamente
    this.executeSync();

    // Configura o intervalo
    this.syncInterval = setInterval(() => {
      this.executeSync();
    }, this.syncIntervalMs);

    this.logger.log(`✅ Continuous sync started with ${this.syncIntervalMs / 1000}s interval`);
  }

  /**
   * Para a sincronização contínua
   */
  stopContinuousSync() {
    if (!this.isRunning) {
      this.logger.warn('Continuous sync is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.logger.log('🛑 Continuous sync stopped');
  }

  /**
   * Executa uma sincronização completa
   */
  async executeSync() {
    if (!this.isRunning) {
      return;
    }

    const startTime = Date.now();
    this.logger.log('🔄 Starting continuous sync execution...');

    try {
      // 1. Buscar todos os pedidos da API Tiny
      const orders = await this.tinyApiService.fetchAllOrders();
      this.logger.log(`📦 Found ${orders.length} orders from Tiny API`);

      if (orders.length === 0) {
        this.logger.log('ℹ️  No orders found, skipping sync');
        return;
      }

      // 2. Processar pedidos em lotes
      const batchSize = 10;
      let processed = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        
        this.logger.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)} (${batch.length} orders)`);

        const batchResults = await this.processBatch(batch);
        processed += batchResults.processed;
        updated += batchResults.updated;
        errors += batchResults.errors;

        // Pequena pausa entre lotes para não sobrecarregar a API
        if (i + batchSize < orders.length) {
          await this.delay(2000);
        }
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      this.logger.log(`✅ Continuous sync completed: ${processed} processed, ${updated} updated, ${errors} errors in ${duration}s`);

    } catch (error) {
      this.logger.error('❌ Continuous sync failed:', error.message);
    }
  }

  /**
   * Processa um lote de pedidos
   */
  private async processBatch(orders: any[]) {
    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        const result = await this.processOrder(order);
        if (result) {
          processed++;
          if (result.updated) {
            updated++;
          }
        }
      } catch (error) {
        this.logger.error(`❌ Error processing order ${order.id || order.pedido?.id}:`, error.message);
        errors++;
      }
    }

    return { processed, updated, errors };
  }

  /**
   * Processa um pedido individual
   */
  private async processOrder(order: any) {
    const pedidoData = order.pedido || order;
    const pedidoId = pedidoData.id?.toString();

    if (!pedidoId) {
      this.logger.warn('Order without ID skipped:', order);
      return null;
    }

    // Filtrar pedidos cancelados
    if (pedidoData.situacao === 'Cancelado') {
      this.logger.debug(`Order ${pedidoId} filtered out (situacao: Cancelado)`);
      return null;
    }

    try {
      // Buscar detalhes completos do pedido com retry
      const orderDetails = await this.rateLimiter.executeWithRetry(
        () => this.tinyApiService.fetchOrderDetails(pedidoId),
        3, // 3 tentativas
        2000 // delay base de 2s
      );

      const fullOrderData = orderDetails.data || pedidoData;
      
      // Debug: verificar se tem itens
      this.logger.debug(`Order ${pedidoId} - Itens encontrados: ${fullOrderData.itens?.length || 0}`);
      if (fullOrderData.itens && fullOrderData.itens.length > 0) {
        this.logger.debug(`Order ${pedidoId} - Primeiro item:`, JSON.stringify(fullOrderData.itens[0], null, 2));
      }

      // Verificar se o pedido existe no banco
      const existingOrder = await this.pedidoRepository.findOne({
        where: { pedido_id: pedidoId }
      });

      // Formatar dados do pedido
      const orderData = this.formatOrderData(fullOrderData);

      if (existingOrder) {
        // Verificar se houve mudanças significativas
        const hasChanges = this.hasSignificantChanges(existingOrder, orderData);
        
        if (hasChanges) {
          // Atualizar pedido existente
          Object.assign(existingOrder, orderData);
          await this.pedidoRepository.save(existingOrder);
          
          this.logger.log(`🔄 Updated order ${pedidoId} - ${orderData.nome_cliente}`);
          return { updated: true };
        } else {
          this.logger.debug(`Order ${pedidoId} - no significant changes`);
          return { updated: false };
        }
      } else {
        // Inserir novo pedido
        const newOrder = this.pedidoRepository.create({
          ...orderData,
          data_pedido: orderData.data_pedido || undefined,
          data_pedido_pt_br: orderData.data_pedido_pt_br || undefined,
          data_prevista: orderData.data_prevista || undefined
        });
        
        await this.pedidoRepository.save(newOrder);
        this.logger.log(`➕ New order ${pedidoId} - ${orderData.nome_cliente}`);
        return { updated: true };
      }

    } catch (error) {
      this.logger.error(`Error processing order ${pedidoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Verifica se houve mudanças significativas no pedido
   */
  private hasSignificantChanges(existing: Pedido, newData: any): boolean {
    const fieldsToCheck = [
      'situacao',
      'data_prevista',
      'valor_total',
      'nome_vendedor',
      'itens_json'
    ];

    for (const field of fieldsToCheck) {
      if (existing[field] !== newData[field]) {
        this.logger.debug(`Field ${field} changed: ${existing[field]} -> ${newData[field]}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Formata os dados do pedido
   */
  private formatOrderData(pedidoData: any) {
    const dataPedidoISO = this.formatDateToISO(pedidoData.data_pedido);
    const dataPrevistaISO = pedidoData.data_prevista ? this.formatDateToISO(pedidoData.data_prevista) : null;

    // Mapear itens corretamente
    const itens = this.mapItens(pedidoData.itens || []);

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

  /**
   * Mapeia os itens do pedido
   */
  private mapItens(itens: any[]): any[] {
    if (!Array.isArray(itens)) {
      return [];
    }

    return itens.map(item => {
      const itemData = item.item || item;
      
      // Calcular valor_total se não estiver presente
      const quantidade = parseFloat(itemData.quantidade || 0);
      const valorUnitario = parseFloat(itemData.valor_unitario || 0);
      const valorTotal = itemData.valor_total ? 
        parseFloat(itemData.valor_total) : 
        (quantidade * valorUnitario);

      return {
        id: itemData.id_produto?.toString() || itemData.id?.toString() || null,
        codigo: itemData.codigo || null,
        descricao: itemData.descricao || 'Item sem descrição',
        quantidade: quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
        unidade: itemData.unidade || 'UN',
        observacoes: itemData.observacoes || null,
        produto: itemData.produto || null,
        categoria: itemData.categoria || null,
        peso: parseFloat(itemData.peso || 0),
        altura: parseFloat(itemData.altura || 0),
        largura: parseFloat(itemData.largura || 0),
        comprimento: parseFloat(itemData.comprimento || 0)
      };
    });
  }

  /**
   * Formata data para ISO
   */
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
      return null;
    }
  }

  /**
   * Formata data para PT-BR
   */
  private formatDateToPTBR(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrai valor total do pedido
   */
  private extractValorTotal(pedidoData: any): number {
    // Priorizar o campo 'valor' que é retornado pela API Tiny
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

  /**
   * Calcula envio 15 dias
   */
  private calculateEnvio15(dataPedido: string, dataPrevista: string): boolean {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = new Date(dataPedido);
      const previstaDate = new Date(dataPrevista);
      const diffDays = (previstaDate.getTime() - pedidoDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return diffDays <= 15;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcula envio 45 dias
   */
  private calculateEnvio45(dataPedido: string, dataPrevista: string): boolean {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = new Date(dataPedido);
      const previstaDate = new Date(dataPrevista);
      const diffDays = (previstaDate.getTime() - pedidoDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return diffDays <= 45;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delay utilitário
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém status da sincronização
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.syncIntervalMs,
      intervalMinutes: Math.round(this.syncIntervalMs / 60000)
    };
  }
}
