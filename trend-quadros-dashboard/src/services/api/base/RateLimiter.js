/**
 * Sistema de Rate Limiting
 * Controla a frequência de requisições para APIs
 */

export class RateLimiter {
  constructor(limit = { requests: 100, per: 'minute' }) {
    this.limit = limit;
    this.requests = [];
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      averageWaitTime: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Verificar se pode fazer requisição
   * @returns {Promise<void>} Promise que resolve quando pode fazer requisição
   */
  async checkLimit() {
    const now = Date.now();
    const windowMs = this.getWindowMs();
    
    // Limpar requisições antigas
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    // Verificar se excedeu o limite
    if (this.requests.length >= this.limit.requests) {
      const oldestRequest = this.requests[0];
      const waitTime = windowMs - (now - oldestRequest);
      
      this.stats.blockedRequests++;
      
      if (waitTime > 0) {
        console.log(`⏳ Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s...`);
        await this.delay(waitTime);
      }
    }
    
    // Adicionar requisição atual
    this.requests.push(now);
    this.stats.totalRequests++;
  }

  /**
   * Obter janela de tempo em milissegundos
   * @returns {number} Janela de tempo em ms
   */
  getWindowMs() {
    switch (this.limit.per) {
      case 'second':
        return 1000;
      case 'minute':
        return 60 * 1000;
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      default:
        return 60 * 1000; // Padrão: 1 minuto
    }
  }

  /**
   * Verificar se pode fazer requisição sem aguardar
   * @returns {boolean} Se pode fazer requisição imediatamente
   */
  canMakeRequest() {
    const now = Date.now();
    const windowMs = this.getWindowMs();
    
    // Limpar requisições antigas
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    return this.requests.length < this.limit.requests;
  }

  /**
   * Obter tempo até próxima requisição permitida
   * @returns {number} Tempo em milissegundos
   */
  getTimeUntilNextRequest() {
    if (this.canMakeRequest()) {
      return 0;
    }
    
    const now = Date.now();
    const windowMs = this.getWindowMs();
    const oldestRequest = this.requests[0];
    
    return windowMs - (now - oldestRequest);
  }

  /**
   * Obter número de requisições restantes na janela atual
   * @returns {number} Número de requisições restantes
   */
  getRemainingRequests() {
    const now = Date.now();
    const windowMs = this.getWindowMs();
    
    // Limpar requisições antigas
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    return Math.max(0, this.limit.requests - this.requests.length);
  }

  /**
   * Resetar contador de requisições
   */
  reset() {
    this.requests = [];
    this.stats.lastReset = Date.now();
  }

  /**
   * Obter estatísticas do rate limiter
   * @returns {Object} Estatísticas
   */
  getStats() {
    const now = Date.now();
    const windowMs = this.getWindowMs();
    
    // Limpar requisições antigas
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    const remaining = this.getRemainingRequests();
    const timeUntilNext = this.getTimeUntilNextRequest();
    
    return {
      ...this.stats,
      currentRequests: this.requests.length,
      remainingRequests: remaining,
      timeUntilNextRequest: timeUntilNext,
      limit: this.limit,
      windowMs: windowMs
    };
  }

  /**
   * Delay entre requisições
   * @param {number} ms - Milissegundos para aguardar
   * @returns {Promise} Promise que resolve após o delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurar novo limite
   * @param {Object} newLimit - Novo limite
   */
  setLimit(newLimit) {
    this.limit = { ...this.limit, ...newLimit };
    this.reset();
  }

  /**
   * Verificar se está no limite
   * @returns {boolean} Se está no limite
   */
  isAtLimit() {
    return !this.canMakeRequest();
  }

  /**
   * Obter percentual de uso do limite
   * @returns {number} Percentual de uso (0-100)
   */
  getUsagePercentage() {
    const now = Date.now();
    const windowMs = this.getWindowMs();
    
    // Limpar requisições antigas
    this.requests = this.requests.filter(time => now - time < windowMs);
    
    return (this.requests.length / this.limit.requests) * 100;
  }
}
