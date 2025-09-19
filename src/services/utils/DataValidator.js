/**
 * Utilitário Centralizado para Validação de Dados
 * Padroniza validação de dados em todo o sistema
 */

export class DataValidator {
  /**
   * Validar se valor não é nulo ou indefinido
   * @param {any} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se valor é válido
   */
  static isNotNullOrUndefined(value, fieldName = 'Campo') {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} não pode ser nulo ou indefinido`);
    }
    return true;
  }

  /**
   * Validar se string não está vazia
   * @param {string} value - String a ser validada
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se string é válida
   */
  static isNotEmptyString(value, fieldName = 'Campo') {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${fieldName} não pode estar vazio`);
    }
    return true;
  }

  /**
   * Validar se número é válido
   * @param {any} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @param {number} min - Valor mínimo (opcional)
   * @param {number} max - Valor máximo (opcional)
   * @returns {boolean} Se número é válido
   */
  static isValidNumber(value, fieldName = 'Campo', min = null, max = null) {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      throw new Error(`${fieldName} deve ser um número válido`);
    }
    
    if (min !== null && num < min) {
      throw new Error(`${fieldName} deve ser maior ou igual a ${min}`);
    }
    
    if (max !== null && num > max) {
      throw new Error(`${fieldName} deve ser menor ou igual a ${max}`);
    }
    
    return true;
  }

  /**
   * Validar se email é válido
   * @param {string} email - Email a ser validado
   * @returns {boolean} Se email é válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      throw new Error('Email deve ter um formato válido');
    }
    
    return true;
  }

  /**
   * Validar se data é válida
   * @param {string|Date} date - Data a ser validada
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se data é válida
   */
  static isValidDate(date, fieldName = 'Data') {
    if (!date) {
      throw new Error(`${fieldName} é obrigatória`);
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error(`${fieldName} deve ser uma data válida`);
    }
    
    return true;
  }

  /**
   * Validar se array não está vazio
   * @param {Array} array - Array a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se array é válido
   */
  static isNotEmptyArray(array, fieldName = 'Lista') {
    if (!Array.isArray(array)) {
      throw new Error(`${fieldName} deve ser um array`);
    }
    
    if (array.length === 0) {
      throw new Error(`${fieldName} não pode estar vazia`);
    }
    
    return true;
  }

  /**
   * Validar se objeto tem propriedades obrigatórias
   * @param {Object} obj - Objeto a ser validado
   * @param {Array<string>} requiredFields - Campos obrigatórios
   * @returns {boolean} Se objeto é válido
   */
  static hasRequiredFields(obj, requiredFields) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Objeto deve ser válido');
    }
    
    const missingFields = requiredFields.filter(field => 
      !(field in obj) || obj[field] === null || obj[field] === undefined
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Validar se string tem tamanho mínimo
   * @param {string} value - String a ser validada
   * @param {number} minLength - Tamanho mínimo
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se string é válida
   */
  static hasMinLength(value, minLength, fieldName = 'Campo') {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} deve ser uma string`);
    }
    
    if (value.length < minLength) {
      throw new Error(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
    }
    
    return true;
  }

  /**
   * Validar se string tem tamanho máximo
   * @param {string} value - String a ser validada
   * @param {number} maxLength - Tamanho máximo
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se string é válida
   */
  static hasMaxLength(value, maxLength, fieldName = 'Campo') {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} deve ser uma string`);
    }
    
    if (value.length > maxLength) {
      throw new Error(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
    }
    
    return true;
  }

  /**
   * Validar se valor está em lista de opções
   * @param {any} value - Valor a ser validado
   * @param {Array} options - Lista de opções válidas
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se valor é válido
   */
  static isInOptions(value, options, fieldName = 'Campo') {
    if (!options.includes(value)) {
      throw new Error(`${fieldName} deve ser um dos valores: ${options.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Validar se URL é válida
   * @param {string} url - URL a ser validada
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se URL é válida
   */
  static isValidURL(url, fieldName = 'URL') {
    try {
      new URL(url);
      return true;
    } catch (error) {
      throw new Error(`${fieldName} deve ser uma URL válida`);
    }
  }

  /**
   * Validar se token de API é válido
   * @param {string} token - Token a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se token é válido
   */
  static isValidApiToken(token, fieldName = 'Token') {
    if (!token || typeof token !== 'string') {
      throw new Error(`${fieldName} é obrigatório`);
    }
    
    if (token.trim().length < 10) {
      throw new Error(`${fieldName} deve ter pelo menos 10 caracteres`);
    }
    
    return true;
  }

  /**
   * Validar se ID é válido
   * @param {any} id - ID a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se ID é válido
   */
  static isValidId(id, fieldName = 'ID') {
    if (!id) {
      throw new Error(`${fieldName} é obrigatório`);
    }
    
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      throw new Error(`${fieldName} deve ser um número positivo`);
    }
    
    return true;
  }

  /**
   * Validar se valor monetário é válido
   * @param {any} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo para erro
   * @returns {boolean} Se valor é válido
   */
  static isValidMonetaryValue(value, fieldName = 'Valor') {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      throw new Error(`${fieldName} deve ser um número válido`);
    }
    
    if (numValue < 0) {
      throw new Error(`${fieldName} não pode ser negativo`);
    }
    
    return true;
  }

  /**
   * Validar objeto de pedido
   * @param {Object} order - Objeto de pedido
   * @returns {boolean} Se pedido é válido
   */
  static validateOrder(order) {
    this.hasRequiredFields(order, ['id', 'numero', 'nome_cliente']);
    this.isValidId(order.id, 'ID do pedido');
    this.isNotEmptyString(order.numero, 'Número do pedido');
    this.isNotEmptyString(order.nome_cliente, 'Nome do cliente');
    
    if (order.valor_total !== undefined) {
      this.isValidMonetaryValue(order.valor_total, 'Valor total');
    }
    
    return true;
  }

  /**
   * Validar objeto de configuração de API
   * @param {Object} config - Configuração da API
   * @returns {boolean} Se configuração é válida
   */
  static validateApiConfig(config) {
    this.hasRequiredFields(config, ['baseURL']);
    this.isValidURL(config.baseURL, 'Base URL');
    
    if (config.token) {
      this.isValidApiToken(config.token, 'Token');
    }
    
    if (config.timeout) {
      this.isValidNumber(config.timeout, 'Timeout', 1000, 60000);
    }
    
    return true;
  }
}
