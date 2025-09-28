import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // em milissegundos
  private readonly minDelay: number; // delay mínimo entre requisições

  constructor() {
    // Configurações para API Tiny - menos agressivo
    this.maxRequests = 20; // máximo 20 requisições
    this.timeWindow = 60000; // por minuto (60 segundos)
    this.minDelay = 1000; // 1 segundo entre requisições
  }

  /**
   * Verifica se pode fazer uma requisição e aguarda se necessário
   */
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove requisições antigas (fora da janela de tempo)
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.timeWindow
    );

    // Se atingiu o limite, aguarda
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = this.timeWindow - (now - oldestRequest) + 1000; // +1s de margem
      
      this.logger.warn(`Rate limit atingido. Aguardando ${Math.ceil(waitTime / 1000)}s...`);
      await this.delay(waitTime);
      
      // Limpa o histórico após aguardar
      this.requestTimes = [];
    }

    // Adiciona delay mínimo entre requisições
    if (this.requestTimes.length > 0) {
      const lastRequest = Math.max(...this.requestTimes);
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < this.minDelay) {
        const waitTime = this.minDelay - timeSinceLastRequest;
        this.logger.debug(`Aguardando ${waitTime}ms entre requisições...`);
        await this.delay(waitTime);
      }
    }

    // Registra esta requisição
    this.requestTimes.push(Date.now());
  }

  /**
   * Executa uma função com retry automático e rate limiting
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Aplica rate limiting antes de cada tentativa
        await this.waitForRateLimit();
        
        this.logger.debug(`Tentativa ${attempt}/${maxRetries}`);
        return await operation();
        
      } catch (error) {
        lastError = error as Error;
        
        // Verifica se é erro de rate limit ou timeout
        const isRateLimitError = this.isRateLimitError(error);
        const isTimeoutError = this.isTimeoutError(error);
        
        if (isRateLimitError || isTimeoutError) {
          if (attempt < maxRetries) {
            // Backoff exponencial com jitter
            const delay = this.calculateBackoffDelay(attempt, baseDelay);
            this.logger.warn(
              `Erro na tentativa ${attempt}/${maxRetries}: ${error.message}. ` +
              `Aguardando ${Math.ceil(delay / 1000)}s antes da próxima tentativa...`
            );
            
            await this.delay(delay);
            continue;
          }
        }
        
        // Se não é erro de rate limit/timeout, falha imediatamente
        if (!isRateLimitError && !isTimeoutError) {
          throw error;
        }
      }
    }

    throw new Error(
      `Operação falhou após ${maxRetries} tentativas. Último erro: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Verifica se o erro é relacionado a rate limiting
   */
  private isRateLimitError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const status = error.response?.status;
    
    return (
      status === 429 || // Too Many Requests
      status === 503 || // Service Unavailable
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      message.includes('limit exceeded')
    );
  }

  /**
   * Verifica se o erro é de timeout
   */
  private isTimeoutError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const code = error.code;
    
    return (
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      message.includes('timeout') ||
      message.includes('timed out')
    );
  }

  /**
   * Calcula delay com backoff exponencial e jitter
   */
  private calculateBackoffDelay(attempt: number, baseDelay: number): number {
    // Backoff exponencial: baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    
    // Adiciona jitter aleatório (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    
    // Limita o delay máximo a 30 segundos
    const maxDelay = 30000;
    const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.max(finalDelay, 1000); // Mínimo de 1 segundo
  }

  /**
   * Delay utilitário
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getStats() {
    const now = Date.now();
    const recentRequests = this.requestTimes.filter(
      time => now - time < this.timeWindow
    );
    
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      timeWindowMs: this.timeWindow,
      minDelayMs: this.minDelay,
      canMakeRequest: recentRequests.length < this.maxRequests
    };
  }

  /**
   * Reseta o rate limiter
   */
  reset() {
    this.requestTimes = [];
    this.logger.log('Rate limiter resetado');
  }
}
