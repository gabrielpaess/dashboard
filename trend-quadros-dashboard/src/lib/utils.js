import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Formata uma data para o formato brasileiro DD/MM/YYYY
 * @param {string|Date} date - Data em formato ISO (YYYY-MM-DD) ou objeto Date
 * @returns {string} Data formatada como DD/MM/YYYY
 */
export function formatDateToBR(date) {
  if (!date) return '';
  
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      // Se já está no formato DD/MM/YYYY, retorna como está
      if (date.includes('/')) {
        return date;
      }
      
      // Se está no formato YYYY-MM-DD, converte
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Tenta criar objeto Date
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Valida se é uma data válida
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

/**
 * Converte data do formato brasileiro DD/MM/YYYY para ISO YYYY-MM-DD
 * @param {string} dateBR - Data no formato DD/MM/YYYY
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function formatDateBRToISO(dateBR) {
  if (!dateBR || !dateBR.includes('/')) return '';
  
  try {
    const [day, month, year] = dateBR.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao converter data BR para ISO:', error);
    return '';
  }
}

/**
 * Converte data do formato ISO YYYY-MM-DD para brasileiro DD/MM/YYYY
 * @param {string} dateISO - Data no formato YYYY-MM-DD
 * @returns {string} Data no formato DD/MM/YYYY
 */
export function formatDateISOToBR(dateISO) {
  if (!dateISO || !dateISO.includes('-')) return '';
  
  try {
    const [year, month, day] = dateISO.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao converter data ISO para BR:', error);
    return '';
  }
}

/**
 * Valida se uma data está no formato brasileiro DD/MM/YYYY
 * @param {string} date - Data para validar
 * @returns {boolean} True se a data é válida
 */
export function isValidBRDate(date) {
  if (!date || typeof date !== 'string') return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(regex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return dateObj.getDate() === parseInt(day) &&
         dateObj.getMonth() === parseInt(month) - 1 &&
         dateObj.getFullYear() === parseInt(year);
}