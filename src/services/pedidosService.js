/**
 * Pedidos Service
 * Handles database operations for orders in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';

// Create Supabase client with service role key for server-side operations
const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceRoleKey;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Using anon key for database operations.');
}

const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

/**
 * Inserts a new order into the database
 * @param {Object} order - Order data from Tiny API
 * @returns {Promise<Object>} Inserted order data
 */
export async function insertOrder(order) {
  try {
    // Keep data_prevista in original DD/MM/YYYY format as string
    let dataPrevista = null;
    if (order.data_prevista) {
      // Keep the original format DD/MM/YYYY as string
      dataPrevista = order.data_prevista;
    }

    const orderData = {
      pedido_id: order.id?.toString(),
      nome_cliente: order.cliente?.nome || order.nome || 'Cliente não informado',
      data_prevista: dataPrevista,
      envio_15: false,
      envio_45: false,
    };

    console.log('💾 Inserting order:', orderData);

    const { data, error } = await supabase
      .from('pedidos')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting order:', error);
      throw error;
    }

    console.log('✅ Order inserted successfully:', data);
    return data;

  } catch (error) {
    console.error('❌ Error in insertOrder:', error);
    throw error;
  }
}

/**
 * Checks if an order exists in the database
 * @param {string} pedidoId - Order ID from Tiny API
 * @returns {Promise<boolean>} True if order exists
 */
export async function orderExists(pedidoId) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id')
      .eq('pedido_id', pedidoId.toString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking if order exists:', error);
      throw error;
    }

    return !!data;

  } catch (error) {
    console.error('❌ Error in orderExists:', error);
    throw error;
  }
}

/**
 * Gets all orders from the database
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of orders
 */
export async function getAllOrders(options = {}) {
  try {
    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('❌ Error in getAllOrders:', error);
    throw error;
  }
}

/**
 * Updates notification status for an order
 * @param {string} pedidoId - Order ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated order data
 */
export async function updateOrderNotifications(pedidoId, updates) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('pedido_id', pedidoId.toString())
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order notifications:', error);
      throw error;
    }

    console.log('✅ Order notifications updated:', data);
    return data;

  } catch (error) {
    console.error('❌ Error in updateOrderNotifications:', error);
    throw error;
  }
}

/**
 * Gets orders that need 15-day notification
 * @returns {Promise<Array>} Orders needing 15-day notification
 */
export async function getOrdersFor15DayNotification() {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('envio_15', false)
      .lte('created_at', fifteenDaysAgo.toISOString());

    if (error) {
      console.error('❌ Error fetching orders for 15-day notification:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('❌ Error in getOrdersFor15DayNotification:', error);
    throw error;
  }
}

/**
 * Gets orders that need 45-day notification
 * @returns {Promise<Array>} Orders needing 45-day notification
 */
export async function getOrdersFor45DayNotification() {
  try {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('envio_45', false)
      .lte('created_at', fortyFiveDaysAgo.toISOString());

    if (error) {
      console.error('❌ Error fetching orders for 45-day notification:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('❌ Error in getOrdersFor45DayNotification:', error);
    throw error;
  }
}

/**
 * Processes new orders from Tiny API and saves them to database
 * @param {Array} orders - Orders from Tiny API
 * @returns {Promise<Object>} Processing results
 */
export async function processNewOrders(orders) {
  const results = {
    processed: 0,
    new: 0,
    existing: 0,
    errors: 0,
    errors_list: [],
    filtered: 0, // Count of filtered orders
  };

  // Define statuses to exclude (only Cancelado)
  const excludedStatuses = ['Cancelado'];

  for (const order of orders) {
    try {
      results.processed++;
      
      // Handle different API response structures
      let pedidoData = order;
      let pedidoId = order.id?.toString();
      let clienteNome = order.cliente?.nome || order.nome;
      let situacao = order.situacao;
      
      // If order is wrapped in a 'pedido' object (Tiny API structure)
      if (order.pedido) {
        pedidoData = order.pedido;
        pedidoId = order.pedido.id?.toString();
        clienteNome = order.pedido.nome;
        situacao = order.pedido.situacao;
      }
      
      if (!pedidoId) {
        console.warn('⚠️ Order without ID skipped:', order);
        continue;
      }

      // Filter out orders with excluded statuses
      if (excludedStatuses.includes(situacao)) {
        results.filtered++;
        console.log(`🚫 Order ${pedidoId} filtered out (situacao: ${situacao})`);
        continue;
      }

      const exists = await orderExists(pedidoId);
      
      if (exists) {
        results.existing++;
        console.log(`📋 Order ${pedidoId} already exists, skipping`);
      } else {
        // Create order object with correct structure
        const orderToInsert = {
          id: pedidoId,
          cliente: {
            nome: clienteNome
          },
          nome: clienteNome,
          data_prevista: pedidoData.data_prevista,
          situacao: situacao
        };
        
        await insertOrder(orderToInsert);
        results.new++;
        console.log(`✅ New order ${pedidoId} saved (${clienteNome}) - Status: ${situacao}`);
      }

    } catch (error) {
      results.errors++;
      results.errors_list.push({
        order: order.id || order.pedido?.id,
        error: error.message,
      });
      console.error(`❌ Error processing order ${order.id || order.pedido?.id}:`, error);
    }
  }

  console.log('📊 Processing results:', results);
  return results;
}
