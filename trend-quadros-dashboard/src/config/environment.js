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

// Default values for development
const DEFAULT_VALUES = {
  VITE_SUPABASE_URL: 'https://jpkpifxctubvauwjvimd.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20',
  SUPABASE_URL: 'https://jpkpifxctubvauwjvimd.supabase.co',
  VITE_TINY_API_URL: 'https://api.tiny.com.br/api2',
  TINY_API_URL: 'https://api.tiny.com.br/api2',
  CRON_SCHEDULE: '0 * * * *',
};

/**
 * Environment configuration object
 */
export const config = {
  // Supabase Configuration
  supabase: {
    url: getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || DEFAULT_VALUES.SUPABASE_URL,
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_VALUES.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  
  // Tiny API Configuration
  tiny: {
    token: getEnvVar('TINY_API_TOKEN') || getEnvVar('VITE_TINY_API_TOKEN'),
    url: getEnvVar('TINY_API_URL') || getEnvVar('VITE_TINY_API_URL') || DEFAULT_VALUES.TINY_API_URL,
  },
  
  // Cron Job Configuration
  cron: {
    schedule: getEnvVar('CRON_SCHEDULE') || DEFAULT_VALUES.CRON_SCHEDULE,
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
  
  // Check for common configuration issues
  if (!config.supabase.url) {
    missing.push('SUPABASE_URL or VITE_SUPABASE_URL');
  }
  
  if (!config.supabase.anonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  
  if (!config.tiny.token) {
    missing.push('TINY_API_TOKEN or VITE_TINY_API_TOKEN');
  }
  
  if (!config.supabase.serviceRoleKey) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY not found - using anon key (less secure)');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

export default config;
