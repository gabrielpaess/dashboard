#!/usr/bin/env node

/**
 * Scheduler Starter Script
 * Starts the continuous scheduler for order synchronization
 * 
 * Usage:
 *   node scripts/start-scheduler.js
 *   npm run scheduler:start
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { startScheduler, getSchedulerStatus, getCommonCronPatterns } from '../src/services/schedulerService.js';

console.log('🚀 Starting Order Sync Scheduler...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Get cron pattern from environment or use default
const cronPattern = process.env.CRON_SCHEDULE || '0 * * * *'; // Every hour by default

console.log('📅 Cron pattern:', cronPattern);

// Validate cron pattern
const { validateCronPattern } = await import('../src/services/schedulerService.js');
if (!validateCronPattern(cronPattern)) {
  console.error('❌ Invalid cron pattern:', cronPattern);
  console.log('📋 Common patterns:', getCommonCronPatterns());
  process.exit(1);
}

// Start the scheduler
startScheduler(cronPattern);

// Log scheduler status
console.log('📊 Scheduler Status:', getSchedulerStatus());

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  const { stopScheduler } = await import('../src/services/schedulerService.js');
  stopScheduler();
  
  console.log('✅ Scheduler stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  
  const { stopScheduler } = await import('../src/services/schedulerService.js');
  stopScheduler();
  
  console.log('✅ Scheduler stopped');
  process.exit(0);
});

// Keep the process alive
console.log('🔄 Scheduler is running. Press Ctrl+C to stop.');
console.log('📊 Status will be logged every 5 minutes...');

// Log status every 5 minutes
setInterval(() => {
  const status = getSchedulerStatus();
  console.log('📊 Scheduler Status:', {
    isRunning: status.isRunning,
    isJobExecuting: status.isJobExecuting,
    nextExecution: status.nextExecution?.toISOString() || 'N/A',
    currentTime: new Date().toISOString(),
  });
}, 5 * 60 * 1000); // 5 minutes
