#!/usr/bin/env node

/**
 * Database Migration Script
 * Executes SQL migrations in order
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// __dirname is already available in CommonJS

// Migration directory
const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Get all migration files
function getMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Execute in order
}

// Execute a single migration
async function executeMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📝 Executing migration: ${filename}`);
  
  try {
    await pool.query(sql);
    console.log(`✅ Migration ${filename} executed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error.message);
    return false;
  }
}

// Check if migrations table exists
async function checkMigrationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return true;
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    return false;
  }
}

// Check if migration was already executed
async function isMigrationExecuted(filename) {
  try {
    const result = await pool.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [filename]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Failed to check migration status:', error.message);
    return false;
  }
}

// Mark migration as executed
async function markMigrationExecuted(filename) {
  try {
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
  } catch (error) {
    console.error('❌ Failed to mark migration as executed:', error.message);
  }
}

// Main migration function
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Cannot connect to database:', error.message);
    process.exit(1);
  }
  
  // Check/create migrations table
  const tableCreated = await checkMigrationsTable();
  if (!tableCreated) {
    console.error('❌ Cannot create migrations table. Exiting.');
    process.exit(1);
  }
  
  // Get migration files
  const migrationFiles = getMigrationFiles();
  console.log(`📋 Found ${migrationFiles.length} migration files`);
  
  let successCount = 0;
  let skipCount = 0;
  
  // Execute each migration
  for (const filename of migrationFiles) {
    const alreadyExecuted = await isMigrationExecuted(filename);
    
    if (alreadyExecuted) {
      console.log(`⏭️  Skipping already executed migration: ${filename}`);
      skipCount++;
      continue;
    }
    
    const success = await executeMigration(filename);
    if (success) {
      await markMigrationExecuted(filename);
      successCount++;
    } else {
      console.error(`❌ Migration failed: ${filename}. Stopping execution.`);
      process.exit(1);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Executed: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`📋 Total: ${migrationFiles.length}`);
  
  if (successCount > 0 || skipCount > 0) {
    console.log('🎉 Migrations completed successfully!');
  } else {
    console.log('ℹ️  No migrations to execute.');
  }
}

// Run migrations
runMigrations()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    pool.end();
    process.exit(1);
  });