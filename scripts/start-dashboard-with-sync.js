#!/usr/bin/env node

/**
 * Start Dashboard with Real-time Sync
 * Unified command to start the dashboard and real-time synchronization
 * 
 * Usage:
 *   node scripts/start-dashboard-with-sync.js
 *   npm run start:full
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { realtimeSyncService } from '../src/services/realtimeSyncService.js';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Dashboard with Real-time Sync...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Start the real-time sync service
async function startSyncService() {
  try {
    console.log('🔄 Starting real-time sync service...');
    await realtimeSyncService.start();
    console.log('✅ Real-time sync service started');
  } catch (error) {
    console.error('❌ Error starting sync service:', error);
    process.exit(1);
  }
}

// Start the Vite development server
function startViteServer() {
  console.log('🌐 Starting Vite development server...');
  
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe', // Mudado para pipe para capturar logs
    shell: true,
    cwd: process.cwd()
  });

  // Capturar logs do Vite
  viteProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Local:') || output.includes('Network:') || output.includes('ready')) {
      console.log(`[VITE] ${output}`);
    }
  });

  viteProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('error') || output.includes('Error')) {
      console.error(`[VITE ERROR] ${output}`);
    }
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Error starting Vite server:', error);
    process.exit(1);
  });

  viteProcess.on('exit', (code) => {
    console.log(`🛑 Vite server exited with code ${code}`);
    if (code !== 0) {
      process.exit(code);
    }
  });

  return viteProcess;
}

// Handle graceful shutdown
function setupGracefulShutdown(viteProcess) {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Stop sync service
    realtimeSyncService.stop();
    
    // Kill Vite process
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill('SIGTERM');
    }
    
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
    await startSyncService();
    
    // Start Vite server
    const viteProcess = startViteServer();
    
    // Setup graceful shutdown
    setupGracefulShutdown(viteProcess);
    
    // Aguardar um pouco para o Vite inicializar
    console.log('\n⏳ Aguardando Vite inicializar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Display status
    console.log('\n📊 Dashboard Status:');
    console.log('  🌐 Frontend: http://localhost:5173');
    console.log('  🔄 Sync: Running (every 15 minutes)');
    console.log('  📊 Stats:', realtimeSyncService.getStats());
    console.log('\n💡 Press Ctrl+C to stop both services');
    console.log('🔍 Verifique se o dashboard está acessível em http://localhost:5173');
    
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
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
