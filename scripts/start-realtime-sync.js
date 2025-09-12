#!/usr/bin/env node

/**
 * Start Real-time Sync Only
 * Runs only the real-time synchronization service
 * 
 * Usage:
 *   node scripts/start-realtime-sync.js
 *   npm run sync:realtime
 */

import dotenv from 'dotenv';
import { realtimeSyncService } from '../src/services/realtimeSyncService.js';

// Load environment variables
dotenv.config();

console.log('🔄 Starting Real-time Sync Service...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Handle graceful shutdown
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Stop sync service
    realtimeSyncService.stop();
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
}

// Main function
async function main() {
  try {
    // Start sync service
    await realtimeSyncService.start();
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Display status
    console.log('\n📊 Real-time Sync Status:');
    console.log('  🔄 Sync: Running (every 15 minutes)');
    console.log('  📊 Stats:', realtimeSyncService.getStats());
    console.log('\n💡 Press Ctrl+C to stop the service');
    
    // Display sync stats every 5 minutes
    setInterval(() => {
      const stats = realtimeSyncService.getStats();
      console.log('\n📊 Sync Stats:', {
        totalSyncs: stats.totalSyncs,
        newOrders: stats.newOrders,
        updatedOrders: stats.updatedOrders,
        errors: stats.errors,
        lastSync: stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never'
      });
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Keep the process alive
    setInterval(() => {
      // Just keep alive
    }, 1000);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
