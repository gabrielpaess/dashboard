/**
 * Scheduler Service
 * Handles continuous scheduling of cron jobs
 */

import cron from 'node-cron';
import { runCronJobWithErrorHandling } from './cronJobService.js';

let cronJob = null;
let isRunning = false;

/**
 * Starts the scheduler with the specified cron pattern
 * @param {string} cronPattern - Cron pattern (default: every hour)
 */
export function startScheduler(cronPattern = '0 * * * *') {
  if (cronJob) {
    console.log('⚠️ Scheduler is already running');
    return;
  }

  console.log(`🕐 Starting scheduler with pattern: ${cronPattern}`);
  
  cronJob = cron.schedule(cronPattern, async () => {
    if (isRunning) {
      console.log('⏳ Previous cron job is still running, skipping this execution');
      return;
    }

    isRunning = true;
    console.log('🚀 Starting scheduled cron job...');
    
    try {
      const results = await runCronJobWithErrorHandling();
      console.log('✅ Scheduled cron job completed:', results.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('❌ Error in scheduled cron job:', error);
    } finally {
      isRunning = false;
    }
  }, {
    scheduled: false, // Don't start immediately
    timezone: 'America/Sao_Paulo' // Brazilian timezone
  });

  cronJob.start();
  console.log('✅ Scheduler started successfully');
}

/**
 * Stops the scheduler
 */
export function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob.destroy();
    cronJob = null;
    console.log('🛑 Scheduler stopped');
  } else {
    console.log('⚠️ No scheduler running');
  }
}

/**
 * Gets the current scheduler status
 * @returns {Object} Scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: !!cronJob,
    isJobExecuting: isRunning,
    nextExecution: cronJob ? cronJob.nextDate() : null,
  };
}

/**
 * Runs the cron job immediately (for testing)
 * @returns {Promise<Object>} Execution results
 */
export async function runJobNow() {
  if (isRunning) {
    throw new Error('Cron job is already running');
  }

  isRunning = true;
  
  try {
    console.log('🚀 Running cron job immediately...');
    const results = await runCronJobWithErrorHandling();
    console.log('✅ Immediate cron job completed:', results.success ? 'SUCCESS' : 'FAILED');
    return results;
  } finally {
    isRunning = false;
  }
}

/**
 * Validates a cron pattern
 * @param {string} pattern - Cron pattern to validate
 * @returns {boolean} True if pattern is valid
 */
export function validateCronPattern(pattern) {
  return cron.validate(pattern);
}

/**
 * Gets common cron patterns
 * @returns {Object} Common cron patterns
 */
export function getCommonCronPatterns() {
  return {
    everyMinute: '* * * * *',
    every5Minutes: '*/5 * * * *',
    every15Minutes: '*/15 * * * *',
    every30Minutes: '*/30 * * * *',
    everyHour: '0 * * * *',
    every2Hours: '0 */2 * * *',
    every6Hours: '0 */6 * * *',
    every12Hours: '0 */12 * * *',
    daily: '0 0 * * *',
    weekly: '0 0 * * 0',
    monthly: '0 0 1 * *',
  };
}


