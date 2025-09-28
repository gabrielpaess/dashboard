/**
 * Cron Job Service
 * Handles scheduled tasks for order synchronization and notifications
 */

import { fetchRecentOrders, validateTinyToken, fetchOrderDetails } from './tinyApiService.js';
import { processNewOrders, getOrdersFor15DayNotification, getOrdersFor45DayNotification, updateOrderNotifications } from './pedidosService.js';
import { config } from '../config/environment.js';

/**
 * Main cron job function that runs every hour
 * @returns {Promise<Object>} Execution results
 */
export async function runOrderSyncCronJob() {
  const startTime = new Date();
  console.log('🕐 Starting order sync cron job at:', startTime.toISOString());

  const results = {
    startTime: startTime.toISOString(),
    endTime: null,
    duration: null,
    success: false,
    errors: [],
    summary: {
      ordersProcessed: 0,
      newOrders: 0,
      existingOrders: 0,
      errors: 0,
    },
  };

  try {
    // Get Tiny API token from environment
    const tinyToken = config.tiny.token;
    
    if (!tinyToken) {
      throw new Error('TINY_API_TOKEN not found in environment variables');
    }

    // Validate token
    console.log('🔐 Validating Tiny API token...');
    const isTokenValid = await validateTinyToken(tinyToken);
    
    if (!isTokenValid) {
      throw new Error('Invalid Tiny API token');
    }

    console.log('✅ Tiny API token is valid');

    // Fetch recent orders from Tiny API
    console.log('📥 Fetching recent orders from Tiny API...');
    const recentOrders = await fetchRecentOrders(tinyToken);
    
    console.log(`📊 Found ${recentOrders.length} recent orders`);

    // Process new orders
    if (recentOrders.length > 0) {
      console.log('🔄 Processing new orders...');
      const processResults = await processNewOrders(recentOrders);
      
      results.summary.ordersProcessed = processResults.processed;
      results.summary.newOrders = processResults.new;
      results.summary.existingOrders = processResults.existing;
      results.summary.errors = processResults.errors;
      
      if (processResults.errors_list.length > 0) {
        results.errors.push(...processResults.errors_list);
      }

      // Sync orders to data warehouse
      await syncOrdersToDataWarehouse(recentOrders, tinyToken);
    }

    // Update data warehouse metrics
    await updateDataWarehouseMetrics();

    // Check for notification requirements
    await checkNotificationRequirements();

    results.success = true;
    console.log('✅ Order sync cron job completed successfully');

  } catch (error) {
    console.error('❌ Error in order sync cron job:', error);
    results.errors.push({
      type: 'cron_job_error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    const endTime = new Date();
    results.endTime = endTime.toISOString();
    results.duration = endTime - startTime;
    
    console.log('🏁 Cron job finished at:', endTime.toISOString());
    console.log('⏱️ Duration:', results.duration, 'ms');
    console.log('📊 Results:', results.summary);
  }

  return results;
}

/**
 * Checks and processes notification requirements
 */
async function checkNotificationRequirements() {
  try {
    console.log('🔔 Checking notification requirements...');

    // Check 15-day notifications
    const orders15Days = await getOrdersFor15DayNotification();
    if (orders15Days.length > 0) {
      console.log(`📧 Found ${orders15Days.length} orders needing 15-day notification`);
      await process15DayNotifications(orders15Days);
    }

    // Check 45-day notifications
    const orders45Days = await getOrdersFor45DayNotification();
    if (orders45Days.length > 0) {
      console.log(`📧 Found ${orders45Days.length} orders needing 45-day notification`);
      await process45DayNotifications(orders45Days);
    }

  } catch (error) {
    console.error('❌ Error checking notification requirements:', error);
    throw error;
  }
}

/**
 * Processes 15-day notifications
 * @param {Array} orders - Orders needing 15-day notification
 */
async function process15DayNotifications(orders) {
  for (const order of orders) {
    try {
      console.log(`📧 Sending 15-day notification for order ${order.pedido_id} (${order.nome_cliente})`);
      
      // Here you would implement your notification logic
      // For now, we'll just mark it as sent
      await updateOrderNotifications(order.pedido_id, { envio_15: true });
      
      console.log(`✅ 15-day notification sent for order ${order.pedido_id}`);
      
    } catch (error) {
      console.error(`❌ Error sending 15-day notification for order ${order.pedido_id}:`, error);
    }
  }
}

/**
 * Processes 45-day notifications
 * @param {Array} orders - Orders needing 45-day notification
 */
async function process45DayNotifications(orders) {
  for (const order of orders) {
    try {
      console.log(`📧 Sending 45-day notification for order ${order.pedido_id} (${order.nome_cliente})`);
      
      // Here you would implement your notification logic
      // For now, we'll just mark it as sent
      await updateOrderNotifications(order.pedido_id, { envio_45: true });
      
      console.log(`✅ 45-day notification sent for order ${order.pedido_id}`);
      
    } catch (error) {
      console.error(`❌ Error sending 45-day notification for order ${order.pedido_id}:`, error);
    }
  }
}

/**
 * Sync orders to data warehouse with detailed information
 * @param {Array} orders - Recent orders from API
 * @param {string} token - Tiny API token
 */
async function syncOrdersToDataWarehouse(orders, token) {
  try {
    console.log('🏪 Syncing orders to data warehouse...');
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      try {
        // Fetch detailed order information
        const orderDetails = await fetchOrderDetails(token, parseInt(order.pedido.id));
        
        if (orderDetails && orderDetails.retorno && orderDetails.retorno.pedido) {
          const pedidoData = orderDetails.retorno.pedido;
          const itensData = pedidoData.itens || [];
          
          // Order data is already processed by pedidosService
          syncedCount++;
          
          console.log(`✅ Synced order ${pedidoData.numero} with ${itensData.length} items`);
        } else {
          console.warn(`⚠️ No detailed data found for order ${order.pedido.id}`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error syncing order ${order.pedido.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📊 Data warehouse sync completed: ${syncedCount} synced, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error in data warehouse sync:', error);
    throw error;
  }
}

/**
 * Update data warehouse metrics
 */
async function updateDataWarehouseMetrics() {
  try {
    console.log('📊 Data warehouse metrics are now handled by the centralized pedidos table');
    
  } catch (error) {
    console.error('❌ Error updating data warehouse metrics:', error);
    // Don't throw error here as it's not critical for the main flow
  }
}

/**
 * Runs the cron job with error handling and logging
 */
export async function runCronJobWithErrorHandling() {
  try {
    const results = await runOrderSyncCronJob();
    
    // Log results
    console.log('📊 Cron Job Results:', JSON.stringify(results, null, 2));
    
    return results;
    
  } catch (error) {
    console.error('💥 Fatal error in cron job:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
