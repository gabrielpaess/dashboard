#!/usr/bin/env node

/**
 * Initial Sync Script
 * Fetches ALL orders from Tiny API and stores them in the database
 * 
 * Usage:
 *   node scripts/initial-sync.js
 *   npm run sync:initial
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { config } from '../src/config/environment.js';
import { fetchAllOrders, validateTinyToken } from '../src/services/tinyApiService.js';
import { processNewOrders } from '../src/services/pedidosService.js';

console.log('🚀 Starting Initial Sync...');
console.log('⏰ Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

async function initialSync() {
  const results = {
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    success: false,
    totalPages: 0,
    totalOrders: 0,
    newOrders: 0,
    existingOrders: 0,
    errors: 0,
    errors_list: []
  };

  try {
    const tinyToken = config.tiny.token;
    
    if (!tinyToken) {
      throw new Error('TINY_API_TOKEN not found in environment variables');
    }

    console.log('🔐 Validating Tiny API token...');
    const isValid = await validateTinyToken(tinyToken);
    
    if (!isValid) {
      throw new Error('Invalid Tiny API token');
    }

    console.log('✅ Tiny API token is valid');

    // Fetch ALL orders with pagination (no situacao filter to get ALL orders)
    const allOrders = await fetchAllOrders(tinyToken, { 
      limit: 1000,
      // Remove situacao filter to get ALL orders (aberto + faturado + cancelado)
    });
    
    results.totalOrders = allOrders.length;
    console.log(`📊 Total orders found: ${allOrders.length}`);

    if (allOrders.length > 0) {
      console.log('🔄 Processing all orders...');
      const processResults = await processNewOrders(allOrders);
      
      results.newOrders = processResults.new;
      results.existingOrders = processResults.existing;
      results.errors = processResults.errors;
      results.errors_list = processResults.errors_list || [];
      
      console.log('📊 Processing results:');
      console.log(`  ✅ New orders: ${processResults.new}`);
      console.log(`  📋 Existing orders: ${processResults.existing}`);
      console.log(`  🚫 Filtered orders: ${processResults.filtered || 0}`);
      console.log(`  ❌ Errors: ${processResults.errors}`);
      
      if (processResults.errors_list.length > 0) {
        console.log('⚠️ Errors details:', processResults.errors_list);
      }
    } else {
      console.log('ℹ️ No orders found in Tiny API');
    }

    results.success = true;
    console.log('✅ Initial sync completed successfully');

  } catch (error) {
    console.error('❌ Error in initial sync:', error);
    results.errors_list.push({
      type: 'initial_sync_error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    const endTime = new Date();
    results.endTime = endTime.toISOString();
    results.duration = endTime - new Date(results.startTime);
    
    console.log('🏁 Initial sync finished at:', endTime.toISOString());
    console.log('⏱️ Duration:', results.duration, 'ms');
    console.log('📊 Final results:', JSON.stringify(results, null, 2));
  }

  return results;
}

// Run the initial sync
initialSync()
  .then((results) => {
    console.log('✅ Initial sync completed');
    console.log('📊 Final results:', JSON.stringify(results, null, 2));
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Fatal error in initial sync:', error);
    process.exit(1);
  });
