/**
 * Sistema de Cache para APIs
 * Gerencia cache inteligente com TTL e estatísticas
 */

export class ApiCache {
  constructor(config = {}) {
    this.cache = new Map();
    this.ttl = config.ttl || 5 * 60 * 1000; // 5 minutos por padrão
    this.maxSize = config.maxSize || 1000; // Máximo de 1000 itens
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Obter item do cache
   * @param {string} key - Chave do item
   * @returns {any|null} Item do cache ou null se não encontrado/expirado
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Armazenar item no cache
   * @param {string} key - Chave do item
   * @param {any} data - Dados para armazenar
   * @param {number} customTtl - TTL personalizado (opcional)
   */
  set(key, data, customTtl = null) {
    // Verificar se precisa evictar itens
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const ttl = customTtl || this.ttl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.stats.sets++;
  }

  /**
   * Remover item do cache
   * @param {string} key - Chave do item
   * @returns {boolean} Se o item foi removido
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  /**
   * Verificar se item existe no cache
   * @param {string} key - Chave do item
   * @returns {boolean} Se o item existe e não expirou
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    return Date.now() - item.timestamp <= item.ttl;
  }

  /**
   * Obter tamanho do cache
   * @returns {number} Número de itens no cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Evictar item mais antigo
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Limpar itens expirados
   * @returns {number} Número de itens removidos
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removed++;
        this.stats.evictions++;
      }
    }

    return removed;
  }

  /**
   * Obter estatísticas do cache
   * @returns {Object} Estatísticas do cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      ttl: this.ttl,
      maxSize: this.maxSize
    };
  }

  /**
   * Obter chaves do cache
   * @returns {Array<string>} Array de chaves
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Obter itens do cache
   * @returns {Array} Array de itens
   */
  values() {
    return Array.from(this.cache.values());
  }

  /**
   * Verificar se cache está vazio
   * @returns {boolean} Se cache está vazio
   */
  isEmpty() {
    return this.cache.size === 0;
  }
}
