#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps create and configure the .env file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log('🔧 Environment Setup Script');
console.log('📁 Project root:', projectRoot);
console.log('📄 .env path:', envPath);

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Read and display current content
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\n📋 Current .env content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  
  // Check for required variables
  const lines = content.split('\n');
  const hasTinyToken = lines.some(line => line.startsWith('TINY_API_TOKEN=') && line.split('=')[1] && line.split('=')[1].trim() !== '');
  const hasSupabaseUrl = lines.some(line => line.startsWith('SUPABASE_URL=') && line.split('=')[1] && line.split('=')[1].trim() !== '');
  
  console.log('\n🔍 Configuration Status:');
  console.log(`TINY_API_TOKEN: ${hasTinyToken ? '✅ Configured' : '❌ Missing or empty'}`);
  console.log(`SUPABASE_URL: ${hasSupabaseUrl ? '✅ Configured' : '❌ Missing or empty'}`);
  
  if (!hasTinyToken) {
    console.log('\n⚠️ TINY_API_TOKEN is missing or empty!');
    console.log('Please add your Tiny API token to the .env file.');
  }
  
} else {
  console.log('❌ .env file not found');
  console.log('📝 Creating .env file...');
  
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://jpkpifxctubvauwjvimd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20

# Supabase Database Configuration (for server-side operations)
SUPABASE_URL=https://jpkpifxctubvauwjvimd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Tiny API Configuration
TINY_API_TOKEN=your_tiny_api_token_here

# Cron Job Configuration
CRON_SCHEDULE=0 * * * *  # Every hour
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Edit the .env file and add your Tiny API token');
    console.log('2. Add your Supabase service role key (optional)');
    console.log('3. Run: npm run test:integration');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
}

console.log('\n🔗 Useful links:');
console.log('• Tiny API: https://api.tiny.com.br');
console.log('• Supabase: https://supabase.com');
console.log('• Documentation: CONFIGURACAO_ENV.md');


