#!/usr/bin/env node

/**
 * Complete Setup Script
 * Sets up the entire backend environment with Docker, database, and tests
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting complete backend setup...\n');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📝 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkDocker() {
  console.log('🐳 Checking Docker installation...');
  
  try {
    await runCommand('docker', ['--version']);
    await runCommand('docker-compose', ['--version']);
    console.log('✅ Docker is installed and ready');
    return true;
  } catch (error) {
    console.error('❌ Docker is not installed or not running');
    console.error('   Please install Docker Desktop and try again');
    return false;
  }
}

async function startDockerServices() {
  console.log('🐳 Starting Docker services...');
  
  try {
    await runCommand('docker-compose', ['up', '-d']);
    console.log('✅ Docker services started');
    
    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start Docker services:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🗄️  Running database migrations...');
  
  try {
    await runCommand('npm', ['run', 'migrate']);
    console.log('✅ Database migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Database migrations failed:', error.message);
    return false;
  }
}

async function testTinyConnection() {
  console.log('🔍 Testing Tiny API connection...');
  
  try {
    await runCommand('npm', ['run', 'test:tiny']);
    console.log('✅ Tiny API connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Tiny API connection test failed:', error.message);
    return false;
  }
}

async function testSyncProcess() {
  console.log('🔄 Testing sync process...');
  
  try {
    await runCommand('npm', ['run', 'test:sync']);
    console.log('✅ Sync process test passed');
    return true;
  } catch (error) {
    console.error('❌ Sync process test failed:', error.message);
    return false;
  }
}

async function startBackend() {
  console.log('🚀 Starting backend server...');
  
  try {
    // Start in background
    const server = spawn('npm', ['run', 'start:dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Backend server started');
    console.log('📊 API Documentation: http://localhost:3001/api/docs');
    console.log('🏥 Health Check: http://localhost:3001/health');
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start backend server:', error.message);
    return null;
  }
}

async function runCompleteSetup() {
  try {
    // Step 1: Check Docker
    const dockerReady = await checkDocker();
    if (!dockerReady) {
      process.exit(1);
    }
    
    // Step 2: Start Docker services
    const servicesStarted = await startDockerServices();
    if (!servicesStarted) {
      process.exit(1);
    }
    
    // Step 3: Run migrations
    const migrationsCompleted = await runMigrations();
    if (!migrationsCompleted) {
      process.exit(1);
    }
    
    // Step 4: Test Tiny API
    const tinyConnected = await testTinyConnection();
    if (!tinyConnected) {
      console.log('⚠️  Tiny API test failed, but continuing with setup...');
    }
    
    // Step 5: Test sync process
    const syncWorking = await testSyncProcess();
    if (!syncWorking) {
      console.log('⚠️  Sync test failed, but continuing with setup...');
    }
    
    // Step 6: Start backend
    const server = await startBackend();
    if (!server) {
      process.exit(1);
    }
    
    console.log('\n🎉 Complete setup finished successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Docker services: Running');
    console.log('✅ Database: Migrated and ready');
    console.log('✅ Tiny API: ' + (tinyConnected ? 'Connected' : 'Failed'));
    console.log('✅ Sync process: ' + (syncWorking ? 'Working' : 'Failed'));
    console.log('✅ Backend server: Running');
    
    console.log('\n🔗 Available endpoints:');
    console.log('   📊 API Docs: http://localhost:3001/api/docs');
    console.log('   🏥 Health: http://localhost:3001/health');
    console.log('   🔐 Auth: http://localhost:3001/api/auth');
    console.log('   📦 Orders: http://localhost:3001/api/orders');
    console.log('   🔄 Sync: http://localhost:3001/api/sync');
    console.log('   📊 Dashboard: http://localhost:3001/api/dashboard');
    
    console.log('\n👤 Default users:');
    console.log('   Admin: admin@pontoquadros.com / admin123');
    console.log('   Vendas: vendas@pontoquadros.com / vendas123');
    console.log('   Dev: dev@pontoquadros.com / dev123');
    console.log('   Produção: producao@pontoquadros.com / prod123');
    console.log('   Pós-venda: pos@pontoquadros.com / pos123');
    
    console.log('\n🛠️  Useful commands:');
    console.log('   npm run docker:logs    # View Docker logs');
    console.log('   npm run docker:down    # Stop Docker services');
    console.log('   npm run test:tiny      # Test Tiny API');
    console.log('   npm run test:sync      # Test sync process');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      if (server) {
        server.kill();
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the complete setup
runCompleteSetup();
