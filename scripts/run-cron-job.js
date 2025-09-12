#!/usr/bin/env node

/**
 * Cron Job Runner Script
 * Executes the order synchronization cron job
 * 
 * Usage:
 *   node scripts/run-cron-job.js
 *   npm run cron:run
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { runCronJobWithErrorHandling } from '../src/services/cronJobService.js';

console.log('🚀 Starting Cron Job Runner...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Run the cron job
runCronJobWithErrorHandling()
  .then((results) => {
    console.log('✅ Cron job completed');
    console.log('📊 Final results:', JSON.stringify(results, null, 2));
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Fatal error in cron job runner:', error);
    process.exit(1);
  });
