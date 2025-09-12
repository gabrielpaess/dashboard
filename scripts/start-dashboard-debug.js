#!/usr/bin/env node

/**
 * Start Dashboard with Real-time Sync (Debug Version)
 * Unified command to start the dashboard and real-time synchronization
 * 
 * Usage:
 *   node scripts/start-dashboard-debug.js
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { realtimeSyncService } from '../src/services/realtimeSyncService.js';
import { config } from '../src/config/environment.js';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Dashboard with Real-time Sync (Debug Mode)...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Verificar configuração
console.log('\n🔧 Verificando configuração...');
console.log(`  Supabase URL: ${config.supabase.url ? '✅' : '❌'}`);
console.log(`  Supabase Key: ${config.supabase.anonKey ? '✅' : '❌'}`);
console.log(`  Tiny Token: ${config.tiny.token ? '✅' : '❌'}`);

// Start the real-time sync service
async function startSyncService() {
  try {
    console.log('\n🔄 Starting real-time sync service...');
    await realtimeSyncService.start();
    console.log('✅ Real-time sync service started');
    
    // Mostrar stats iniciais
    const stats = realtimeSyncService.getStats();
    console.log('📊 Initial stats:', stats);
    
  } catch (error) {
    console.error('❌ Error starting sync service:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the Vite development server
function startViteServer() {
  console.log('\n🌐 Starting Vite development server...');
  
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe', // Mudado para pipe para capturar logs
    shell: true,
    cwd: process.cwd()
  });

  // Capturar logs do Vite
  viteProcess.stdout.on('data', (data) => {
    console.log(`[VITE] ${data.toString().trim()}`);
  });

  viteProcess.stderr.on('data', (data) => {
    console.error(`[VITE ERROR] ${data.toString().trim()}`);
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
    console.log('\n📋 Iniciando processo principal...');
    
    // Start sync service
    await startSyncService();
    
    // Aguardar um pouco para o sync inicial
    console.log('\n⏳ Aguardando sincronização inicial...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start Vite server
    const viteProcess = startViteServer();
    
    // Setup graceful shutdown
    setupGracefulShutdown(viteProcess);
    
    // Display status
    console.log('\n📊 Dashboard Status:');
    console.log('  🌐 Frontend: http://localhost:5173');
    console.log('  🔄 Sync: Running (every 15 minutes)');
    console.log('  📊 Stats:', realtimeSyncService.getStats());
    console.log('\n💡 Press Ctrl+C to stop both services');
    
    // Display sync stats every 2 minutes (debug)
    setInterval(() => {
      const stats = realtimeSyncService.getStats();
      console.log('\n📊 Sync Stats (Debug):', {
        totalSyncs: stats.totalSyncs,
        newOrders: stats.newOrders,
        updatedOrders: stats.updatedOrders,
        errors: stats.errors,
        lastSync: stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never',
        isRunning: stats.isRunning
      });
    }, 2 * 60 * 1000); // Every 2 minutes for debug
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main();
