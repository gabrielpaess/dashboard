/**
 * Cliente Base de API
 * Fornece funcionalidades comuns para todos os clientes de API
 */

import { ApiCache } from './ApiCache.js';
import { RateLimiter } from './RateLimiter.js';
import { ApiError } from './ApiError.js';

export class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 3;
    this.cache = new ApiCache(config.cache || {});
    this.rateLimiter = new RateLimiter(config.rateLimit || { requests: 100, per: 'minute' });
    this.logger = config.logger || console;
  }

  /**
   * Fazer requisição para a API
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = {},
      data = null,
      useCache = true,
      cacheKey = null,
      retryCount = 0
    } = options;

    // Construir URL completa
    const url = this.buildURL(endpoint, params);
    
    // Verificar cache se habilitado
    if (useCache && method === 'GET') {
      const cacheKeyToUse = cacheKey || this.generateCacheKey(url, params);
      const cachedData = this.cache.get(cacheKeyToUse);
      if (cachedData) {
        this.logger.log(`📦 Cache hit for ${url}`);
        return cachedData;
      }
    }

    // Aplicar rate limiting
    await this.rateLimiter.checkLimit();

    // Preparar opções da requisição
    const requestOptions = {
      method,
      headers: this.headers,
      signal: this.createAbortSignal()
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      this.logger.log(`🌐 Making ${method} request to ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          url
        );
      }

      const responseData = await response.json();
      
      // Armazenar no cache se habilitado
      if (useCache && method === 'GET') {
        const cacheKeyToUse = cacheKey || this.generateCacheKey(url, params);
        this.cache.set(cacheKeyToUse, responseData);
      }

      this.logger.log(`✅ Successfully fetched data from ${url}`);
      return responseData;

    } catch (error) {
      // Retry automático em caso de erro
      if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
        this.logger.warn(`⚠️ Retrying request (${retryCount + 1}/${this.retryAttempts}): ${error.message}`);
        await this.delay(1000 * (retryCount + 1)); // Delay exponencial
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      this.logger.error(`❌ Request failed after ${retryCount + 1} attempts:`, {
        url,
        method,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Construir URL completa
   * @param {string} endpoint - Endpoint
   * @param {Object} params - Parâmetros da query
   * @returns {string} URL completa
   */
  buildURL(endpoint, params = {}) {
    // Construir URL corretamente
    let url;
    if (endpoint.startsWith('/')) {
      // Se endpoint começa com /, usar como path absoluto
      url = new URL(endpoint, this.baseURL);
    } else {
      // Se endpoint não começa com /, concatenar com baseURL
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/';
      url = new URL(endpoint, baseUrl);
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  /**
   * Gerar chave de cache
   * @param {string} url - URL da requisição
   * @param {Object} params - Parâmetros
   * @returns {string} Chave de cache
   */
  generateCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${url}?${sortedParams}`;
  }

  /**
   * Criar AbortSignal para timeout
   * @returns {AbortSignal} Signal para cancelar requisição
   */
  createAbortSignal() {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.timeout);
    return controller.signal;
  }

  /**
   * Verificar se deve tentar novamente
   * @param {Error} error - Erro ocorrido
   * @returns {boolean} Se deve tentar novamente
   */
  shouldRetry(error) {
    // Retry em erros de rede, timeout ou 5xx
    if (error.name === 'AbortError') return true;
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) return true;
    if (error instanceof ApiError && error.status >= 500) return true;
    
    return false;
  }

  /**
   * Delay entre tentativas
   * @param {number} ms - Milissegundos para aguardar
   * @returns {Promise} Promise que resolve após o delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpar cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.log('🧹 Cache cleared');
  }

  /**
   * Obter estatísticas do cache
   * @returns {Object} Estatísticas do cache
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Obter estatísticas do rate limiter
   * @returns {Object} Estatísticas do rate limiter
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }
}
