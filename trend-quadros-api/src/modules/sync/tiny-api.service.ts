import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RateLimiterService } from '../../common/services/rate-limiter.service';

@Injectable()
export class TinyApiService {
  private readonly logger = new Logger(TinyApiService.name);
  private readonly baseUrl = 'https://api.tiny.com.br/api2';
  private readonly ordersUrl = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
  private readonly orderDetailsUrl = 'https://api.tiny.com.br/api2/pedido.obter.php';

  constructor(
    private configService: ConfigService,
    private rateLimiter: RateLimiterService
  ) {}

  private get token(): string {
    return this.configService.get<string>('TINY_API_TOKEN') || '';
  }

  /** Formato DD/MM/YYYY exigido pela API Tiny. */
  private formatDateToTiny(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Janela rolante de sincronização: dois meses atrás até hoje (regra de negócio).
   */
  private getRollingTwoMonthTinyDateRange(): { dataInicial: string; dataFinal: string } {
    const dataFinal = new Date();
    const dataInicial = new Date();
    dataInicial.setMonth(dataInicial.getMonth() - 2);
    return {
      dataInicial: this.formatDateToTiny(dataInicial),
      dataFinal: this.formatDateToTiny(dataFinal),
    };
  }

  async fetchOrders(options: any = {}) {
    return this.rateLimiter.executeWithRetry(async () => {
      const url = new URL(this.ordersUrl);
      
      // Add default parameters
      url.searchParams.append('token', this.token);
      url.searchParams.append('formato', 'json');
      
      // Add custom parameters
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          url.searchParams.append(key, options[key]);
        }
      });

      this.logger.log(`Fetching orders from Tiny API: ${url.toString()}`);

      const response = await axios.get(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000
      });

      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'Erro') {
          const errorMessage = response.data.retorno.erros?.[0]?.erro || '';
          if (errorMessage.includes('não retornou registros') || errorMessage.includes('no records')) {
            this.logger.log('No records found in Tiny API - this is normal');
            return { retorno: { pedidos: [] } };
          }
          
          this.logger.error(`Tiny API returned error: ${response.data.retorno.erros}`);
          throw new Error(`Tiny API error: ${errorMessage}`);
        }

        this.logger.log(`Successfully fetched ${response.data.retorno.pedidos?.length || 0} orders from Tiny API`);
        return response.data;
      }

      throw new Error('Invalid response from Tiny API');

    }, 3, 2000); // 3 tentativas, delay base de 2s
  }

  async fetchOrderDetails(orderId: string) {
    return this.rateLimiter.executeWithRetry(async () => {
      const params = new URLSearchParams({
        token: this.token,
        id: orderId.toString(),
        formato: 'json'
      });

      this.logger.debug(`Fetching order details for ID: ${orderId}`);

      const response = await axios.post(this.orderDetailsUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'Erro') {
          const errorMessage = response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido';
          throw new Error(`API Tiny retornou erro: ${errorMessage}`);
        }
        
        // Retornar o pedido completo com itens
        const pedido = response.data.retorno.pedido;
        this.logger.debug(`Order ${orderId} - Itens encontrados: ${pedido.itens?.length || 0}`);
        
        return {
          data: pedido
        };
      }

      throw new Error('Resposta inválida da API Tiny');
    }, 3, 2000); // 3 tentativas, delay base de 2s
  }

  async fetchRecentOrders() {
    const range = this.getRollingTwoMonthTinyDateRange();
    const options = {
      dataInicial: range.dataInicial,
      dataFinal: range.dataFinal,
      registrosPorPagina: 1000,
    };

    const response = await this.fetchOrders(options);
    
    if (response.retorno && response.retorno.pedidos) {
      return response.retorno.pedidos;
    }
    
    return [];
  }

  async fetchAllOrders() {
    return this.rateLimiter.executeWithRetry(async () => {
      const allOrders: any[] = [];
      let currentPage = 1;
      let totalPages = 1;
      let hasMorePages = true;

      this.logger.log('🔄 Starting paginated fetch of all orders...');

      while (hasMorePages) {
        const range = this.getRollingTwoMonthTinyDateRange();
        const options = {
          dataInicial: range.dataInicial,
          dataFinal: range.dataFinal,
          registrosPorPagina: 100, // Usar 100 para evitar timeouts
          pagina: currentPage,
        };

        this.logger.log(`📄 Fetching page ${currentPage}...`);

        const response = await this.fetchOrders(options);
        
        if (response.retorno && response.retorno.pedidos) {
          const orders = response.retorno.pedidos;
          allOrders.push(...orders);
          
          totalPages = response.retorno.numero_paginas || 1;
          this.logger.log(`📦 Page ${currentPage}: ${orders.length} orders (Total: ${allOrders.length})`);
          
          if (currentPage >= totalPages) {
            hasMorePages = false;
          } else {
            currentPage++;
            // Pequena pausa entre páginas para não sobrecarregar a API
            await this.delay(1000);
          }
        } else {
          this.logger.warn(`⚠️  No orders found on page ${currentPage}`);
          hasMorePages = false;
        }
      }

      this.logger.log(`✅ Paginated fetch completed: ${allOrders.length} total orders from ${currentPage} pages`);
      return allOrders;
    }, 3, 2000);
  }

  async validateToken() {
    try {
      await this.fetchOrders({ registrosPorPagina: 1 });
      return true;
    } catch (error) {
      this.logger.error('Token inválido:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Reseta o rate limiter
   */
  resetRateLimit() {
    this.rateLimiter.reset();
  }

  /**
   * Método auxiliar para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}