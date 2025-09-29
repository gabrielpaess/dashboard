/**
 * Environment Configuration
 * Centralized environment variable handling for both frontend and backend
 */

import dotenv from 'dotenv';

// Load environment variables if running in Node.js
if (typeof process !== 'undefined' && process.env && !process.env.NODE_ENV) {
  dotenv.config();
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value or fallback
 */
function getEnvVar(key, fallback = '') {
  // Try process.env first (Node.js/backend)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Try import.meta.env (Vite/frontend)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  return fallback;
}

// Default values for production API
const DEFAULT_VALUES = {
  VITE_API_URL: 'http://168.231.90.41:3001',
  VITE_API_BASE_URL: 'http://168.231.90.41:3001/api',
};

/**
 * Environment configuration object
 */
export const config = {
  // API Configuration
  api: {
    url: getEnvVar('VITE_API_URL') || DEFAULT_VALUES.VITE_API_URL,
    baseUrl: getEnvVar('VITE_API_BASE_URL') || DEFAULT_VALUES.VITE_API_BASE_URL,
  },
  
  // Environment
  isDev: getEnvVar('NODE_ENV', 'development') === 'development',
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
};

/**
 * Validate required environment variables
 * @param {Array} requiredVars - Array of required variable names
 * @returns {Object} Validation result
 */
export function validateEnvironment(requiredVars = []) {
  const missing = [];
  const warnings = [];
  
  for (const varName of requiredVars) {
    const value = getEnvVar(varName);
    if (!value) {
      missing.push(varName);
    }
  }
  
  // Check for API configuration
  if (!config.api.url) {
    missing.push('VITE_API_URL');
  }
  
  if (!config.api.baseUrl) {
    missing.push('VITE_API_BASE_URL');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

export default config;
