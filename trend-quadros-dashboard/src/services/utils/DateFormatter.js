/**
 * Utilitário Centralizado para Formatação de Datas
 * Padroniza formatação de datas em todo o sistema
 */

export class DateFormatter {
  /**
   * Formatar data para API (DD/MM/YYYY)
   * @param {string|Date} dateInput - Data de entrada
   * @returns {string} Data formatada para API
   */
  static formatForAPI(dateInput) {
    if (!dateInput) return '';
    
    try {
      const date = this.parseDate(dateInput);
      if (!date) return '';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data para API:', error);
      return '';
    }
  }

  /**
   * Formatar data para ISO (YYYY-MM-DD)
   * @param {string|Date} dateInput - Data de entrada
   * @returns {string} Data formatada para ISO
   */
  static formatToISO(dateInput) {
    if (!dateInput) return null;
    
    try {
      const date = this.parseDate(dateInput);
      if (!date) return null;
      
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Erro ao formatar data para ISO:', error);
      return null;
    }
  }

  /**
   * Formatar data para PT-BR (DD/MM/YYYY)
   * @param {string|Date} dateInput - Data de entrada
   * @returns {string} Data formatada para PT-BR
   */
  static formatToPTBR(dateInput) {
    if (!dateInput) return null;
    
    try {
      const dateString = String(dateInput);
      
      // Se já está no formato DD/MM/YYYY, retorna como está
      if (dateString.includes('/') && dateString.length === 10 && !dateString.startsWith('20')) {
        return dateString;
      }
      
      const date = this.parseDate(dateInput);
      if (!date) return null;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data para PT-BR:', error);
      return null;
    }
  }

  /**
   * Formatar data para exibição (DD/MM/YYYY HH:mm)
   * @param {string|Date} dateInput - Data de entrada
   * @returns {string} Data formatada para exibição
   */
  static formatForDisplay(dateInput) {
    if (!dateInput) return null;
    
    try {
      const date = this.parseDate(dateInput);
      if (!date) return null;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Erro ao formatar data para exibição:', error);
      return null;
    }
  }

  /**
   * Formatar data para timestamp
   * @param {string|Date} dateInput - Data de entrada
   * @returns {number} Timestamp
   */
  static formatToTimestamp(dateInput) {
    if (!dateInput) return null;
    
    try {
      const date = this.parseDate(dateInput);
      if (!date) return null;
      
      return date.getTime();
    } catch (error) {
      console.error('Erro ao formatar data para timestamp:', error);
      return null;
    }
  }

  /**
   * Parsear data de diferentes formatos
   * @param {string|Date} dateInput - Data de entrada
   * @returns {Date|null} Objeto Date ou null
   */
  static parseDate(dateInput) {
    if (!dateInput) return null;
    
    // Se já é um objeto Date
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    const dateString = String(dateInput);
    
    // Se está no formato YYYY-MM-DD
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
    }
    
    // Se está no formato YYYY/MM/DD (da API)
    if (dateString.includes('/') && dateString.length === 10 && dateString.startsWith('20')) {
      const [year, month, day] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
    }
    
    // Se está no formato DD/MM/YYYY
    if (dateString.includes('/') && dateString.length === 10 && !dateString.startsWith('20')) {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
    }
    
    // Tentar parsear como ISO
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    return null;
  }

  /**
   * Obter data atual no formato ISO
   * @returns {string} Data atual em ISO
   */
  static getCurrentDateISO() {
    return this.formatToISO(new Date());
  }

  /**
   * Obter data atual no formato PT-BR
   * @returns {string} Data atual em PT-BR
   */
  static getCurrentDatePTBR() {
    return this.formatToPTBR(new Date());
  }

  /**
   * Obter data de N dias atrás
   * @param {number} days - Número de dias
   * @returns {Date} Data de N dias atrás
   */
  static getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * Obter início da semana (segunda-feira)
   * @param {Date} date - Data de referência
   * @returns {Date} Início da semana
   */
  static getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar quando domingo
    return new Date(d.setDate(diff));
  }

  /**
   * Obter fim da semana (domingo)
   * @param {Date} date - Data de referência
   * @returns {Date} Fim da semana
   */
  static getWeekEnd(date = new Date()) {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Obter início do mês
   * @param {Date} date - Data de referência
   * @returns {Date} Início do mês
   */
  static getMonthStart(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Obter fim do mês
   * @param {Date} date - Data de referência
   * @returns {Date} Fim do mês
   */
  static getMonthEnd(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Calcular diferença em dias entre duas datas
   * @param {Date|string} date1 - Primeira data
   * @param {Date|string} date2 - Segunda data
   * @returns {number} Diferença em dias
   */
  static getDaysDifference(date1, date2) {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    
    if (!d1 || !d2) return 0;
    
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verificar se data é válida
   * @param {string|Date} dateInput - Data de entrada
   * @returns {boolean} Se data é válida
   */
  static isValidDate(dateInput) {
    if (!dateInput) return false;
    
    const date = this.parseDate(dateInput);
    return date !== null && !isNaN(date.getTime());
  }
}
