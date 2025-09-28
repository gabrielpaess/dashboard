/**
 * Classe de Erro Personalizada para APIs
 * Fornece informações estruturadas sobre erros de API
 */

export class ApiError extends Error {
  constructor(message, status = null, statusText = null, url = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Converter erro para objeto serializável
   * @returns {Object} Objeto com informações do erro
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      url: this.url,
      timestamp: this.timestamp,
      originalError: this.originalError?.message || null
    };
  }

  /**
   * Verificar se é erro de autenticação
   * @returns {boolean} Se é erro de autenticação
   */
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Verificar se é erro de rate limiting
   * @returns {boolean} Se é erro de rate limiting
   */
  isRateLimitError() {
    return this.status === 429;
  }

  /**
   * Verificar se é erro de servidor
   * @returns {boolean} Se é erro de servidor
   */
  isServerError() {
    return this.status >= 500;
  }

  /**
   * Verificar se é erro de cliente
   * @returns {boolean} Se é erro de cliente
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Obter mensagem amigável do erro
   * @returns {string} Mensagem amigável
   */
  getFriendlyMessage() {
    if (this.isAuthError()) {
      return 'Erro de autenticação. Verifique suas credenciais.';
    }
    
    if (this.isRateLimitError()) {
      return 'Muitas requisições. Tente novamente em alguns minutos.';
    }
    
    if (this.isServerError()) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    if (this.isClientError()) {
      return 'Erro na requisição. Verifique os dados enviados.';
    }
    
    return this.message;
  }
}
