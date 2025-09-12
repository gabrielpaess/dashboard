#!/usr/bin/env node

/**
 * Run Migration Script
 * Executes SQL migrations on Supabase
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { config } from '../src/config/environment.js';
import { createClient } from '@supabase/supabase-js';

console.log('🔄 Running Migration...');
console.log('⏰ Current time:', new Date().toISOString());

async function runMigration() {
  try {
    const supabaseUrl = config.supabase.url;
    const supabaseServiceKey = config.supabase.serviceRoleKey;
    const supabaseAnonKey = config.supabase.anonKey;

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    console.log('🔗 Connected to Supabase');

    // Migration: Alter data_prevista from DATE to TEXT
    const migrationSQL = `
      -- Alter the data_prevista column from DATE to TEXT
      ALTER TABLE public.pedidos 
      ALTER COLUMN data_prevista TYPE TEXT;
      
      -- Update comment for the column
      COMMENT ON COLUMN public.pedidos.data_prevista IS 'Data prevista de entrega do pedido no formato DD/MM/YYYY conforme retornado pela API Tiny.';
    `;

    console.log('📝 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }

    console.log('✅ Migration executed successfully');
    console.log('📊 Migration result:', data);

  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });




