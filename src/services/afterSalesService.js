/**
 * After Sales Service
 * Service for managing after-sales alerts and data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';

// Create Supabase client for Node.js
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey
);

/**
 * Gets orders that need after-sales follow-up (data_prevista + 15 days)
 * @returns {Promise<Array>} Array of orders needing follow-up
 */
export async function getAfterSalesAlerts() {
  try {
    console.log('📞 Fetching after-sales alerts from Supabase...');

    // Get all orders with data_prevista
    const { data: orders, error } = await supabase
      .from('pedidos')
      .select('*')
      .not('data_prevista', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching after-sales orders:', error);
      throw error;
    }

    console.log(`📊 Found ${orders?.length || 0} orders with data_prevista`);

    if (!orders || orders.length === 0) {
      return [];
    }

    // Filter orders that need after-sales follow-up (data_prevista + 15 days)
    const now = new Date();
    const alerts = [];

    for (const order of orders) {
      try {
        // Parse data_prevista from ISO format (YYYY-MM-DD) or DD/MM/YYYY format
        let promisedDate;
        if (order.data_prevista.includes('-')) {
          // ISO format: 2025-07-03
          promisedDate = new Date(order.data_prevista);
        } else {
          // DD/MM/YYYY format
          const [day, month, year] = order.data_prevista.split('/');
          promisedDate = new Date(year, month - 1, day);
        }
        
        // Calculate after-sales date (data_prevista + 15 days)
        const afterSalesDate = new Date(promisedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        
        // Check if we should show alert (after-sales date has passed)
        const daysSinceAfterSales = Math.floor((now - afterSalesDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceAfterSales >= 0) {
          alerts.push({
            id: order.id,
            pedido_id: order.pedido_id,
            customer: order.nome_cliente,
            promisedDate: order.data_prevista,
            afterSalesDate: `${afterSalesDate.getDate().toString().padStart(2, '0')}/${(afterSalesDate.getMonth() + 1).toString().padStart(2, '0')}/${afterSalesDate.getFullYear()}`,
            daysSinceAfterSales: daysSinceAfterSales,
            envio_15: order.envio_15,
            envio_45: order.envio_45,
            created_at: order.created_at,
            updated_at: order.updated_at
          });
        }
      } catch (parseError) {
        console.warn(`⚠️ Could not parse date for order ${order.pedido_id}: ${order.data_prevista}`, parseError);
      }
    }

    // Sort by days since after-sales (most urgent first)
    alerts.sort((a, b) => b.daysSinceAfterSales - a.daysSinceAfterSales);

    console.log(`🚨 Found ${alerts.length} orders needing after-sales follow-up`);
    return alerts;

  } catch (error) {
    console.error('❌ Error in getAfterSalesAlerts:', error);
    throw error;
  }
}

/**
 * Marks an order as contacted for 15-day follow-up
 * @param {string} pedidoId - Order ID from Tiny API
 * @returns {Promise<boolean>} Success status
 */
export async function markAsContacted15Days(pedidoId) {
  try {
    console.log(`📞 Marking order ${pedidoId} as contacted for 15-day follow-up...`);

    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        envio_15: true,
        updated_at: new Date().toISOString()
      })
      .eq('pedido_id', pedidoId)
      .select();

    if (error) {
      console.error('❌ Error updating order:', error);
      throw error;
    }

    console.log('✅ Order marked as contacted for 15-day follow-up');
    return true;

  } catch (error) {
    console.error('❌ Error in markAsContacted15Days:', error);
    throw error;
  }
}

/**
 * Marks an order as contacted for 45-day follow-up
 * @param {string} pedidoId - Order ID from Tiny API
 * @returns {Promise<boolean>} Success status
 */
export async function markAsContacted45Days(pedidoId) {
  try {
    console.log(`📞 Marking order ${pedidoId} as contacted for 45-day follow-up...`);

    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        envio_45: true,
        updated_at: new Date().toISOString()
      })
      .eq('pedido_id', pedidoId)
      .select();

    if (error) {
      console.error('❌ Error updating order:', error);
      throw error;
    }

    console.log('✅ Order marked as contacted for 45-day follow-up');
    return true;

  } catch (error) {
    console.error('❌ Error in markAsContacted45Days:', error);
    throw error;
  }
}

/**
 * Gets orders that need 45-day follow-up (data_prevista + 45 days)
 * @returns {Promise<Array>} Array of orders needing 45-day follow-up
 */
export async function get45DayAlerts() {
  try {
    console.log('📞 Fetching 45-day alerts from Supabase...');

    // Get all orders with data_prevista
    const { data: orders, error } = await supabase
      .from('pedidos')
      .select('*')
      .not('data_prevista', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching 45-day orders:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Filter orders that need 45-day follow-up
    const now = new Date();
    const alerts = [];

    for (const order of orders) {
      try {
        // Parse data_prevista from ISO format (YYYY-MM-DD) or DD/MM/YYYY format
        let promisedDate;
        if (order.data_prevista.includes('-')) {
          // ISO format: 2025-07-03
          promisedDate = new Date(order.data_prevista);
        } else {
          // DD/MM/YYYY format
          const [day, month, year] = order.data_prevista.split('/');
          promisedDate = new Date(year, month - 1, day);
        }
        
        // Calculate 45-day follow-up date
        const followUp45Date = new Date(promisedDate.getTime() + 45 * 24 * 60 * 60 * 1000);
        
        // Check if we should show alert (45-day date has passed and not already contacted)
        const daysSince45Day = Math.floor((now - followUp45Date) / (1000 * 60 * 60 * 24));
        
        if (daysSince45Day >= 0 && !order.envio_45) {
          alerts.push({
            id: order.id,
            pedido_id: order.pedido_id,
            customer: order.nome_cliente,
            promisedDate: order.data_prevista,
            followUp45Date: `${followUp45Date.getDate().toString().padStart(2, '0')}/${(followUp45Date.getMonth() + 1).toString().padStart(2, '0')}/${followUp45Date.getFullYear()}`,
            daysSince45Day: daysSince45Day,
            envio_15: order.envio_15,
            envio_45: order.envio_45,
            created_at: order.created_at,
            updated_at: order.updated_at
          });
        }
      } catch (parseError) {
        console.warn(`⚠️ Could not parse date for order ${order.pedido_id}: ${order.data_prevista}`, parseError);
      }
    }

    // Sort by days since 45-day follow-up (most urgent first)
    alerts.sort((a, b) => b.daysSince45Day - a.daysSince45Day);

    console.log(`🚨 Found ${alerts.length} orders needing 45-day follow-up`);
    return alerts;

  } catch (error) {
    console.error('❌ Error in get45DayAlerts:', error);
    throw error;
  }
}

/**
 * Gets all contacts from Supabase that have data_prevista + 15 days passed
 * @returns {Promise<Array>} Array of all contacts with after-sales eligibility
 */
export async function getAllContacts() {
  try {
    console.log('📞 Fetching all contacts from Supabase...');

    // Get all orders with data_prevista
    const { data: orders, error } = await supabase
      .from('pedidos')
      .select('*')
      .not('data_prevista', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching all contacts:', error);
      throw error;
    }

    console.log(`📊 Found ${orders?.length || 0} orders with data_prevista`);

    if (!orders || orders.length === 0) {
      return [];
    }

    // Filter orders that are eligible for after-sales (data_prevista + 15 days passed)
    const now = new Date();
    const contacts = [];

    for (const order of orders) {
      try {
        // Parse data_prevista from ISO format (YYYY-MM-DD) or DD/MM/YYYY format
        let promisedDate;
        if (order.data_prevista.includes('-')) {
          // ISO format: 2025-07-03
          promisedDate = new Date(order.data_prevista);
        } else {
          // DD/MM/YYYY format
          const [day, month, year] = order.data_prevista.split('/');
          promisedDate = new Date(year, month - 1, day);
        }
        
        // Calculate after-sales date (data_prevista + 15 days)
        const afterSalesDate = new Date(promisedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        
        // Check if contact is eligible for after-sales (15 days have passed)
        const daysSinceAfterSales = Math.floor((now - afterSalesDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceAfterSales >= 0) {
          contacts.push({
            id: order.id,
            pedido_id: order.pedido_id,
            customer: order.nome_cliente,
            promisedDate: order.data_prevista,
            afterSalesDate: `${afterSalesDate.getDate().toString().padStart(2, '0')}/${(afterSalesDate.getMonth() + 1).toString().padStart(2, '0')}/${afterSalesDate.getFullYear()}`,
            daysSinceAfterSales: daysSinceAfterSales,
            envio_15: order.envio_15,
            envio_45: order.envio_45,
            created_at: order.created_at,
            updated_at: order.updated_at
          });
        }
      } catch (parseError) {
        console.warn(`⚠️ Could not parse date for order ${order.pedido_id}: ${order.data_prevista}`, parseError);
      }
    }

    // Sort by days since after-sales (most recent first)
    contacts.sort((a, b) => b.daysSinceAfterSales - a.daysSinceAfterSales);

    console.log(`👥 Found ${contacts.length} contacts eligible for after-sales`);
    return contacts;

  } catch (error) {
    console.error('❌ Error in getAllContacts:', error);
    throw error;
  }
}

/**
 * Gets contacts that need 15-day follow-up (envio_15 is null)
 * @returns {Promise<Array>} Array of contacts needing 15-day follow-up
 */
export async function getContactsNeeding15Day() {
  try {
    const allContacts = await getAllContacts();
    return allContacts.filter(contact => contact.envio_15 === null || contact.envio_15 === false);
  } catch (error) {
    console.error('❌ Error in getContactsNeeding15Day:', error);
    throw error;
  }
}

/**
 * Gets contacts that need 45-day follow-up (envio_45 is null)
 * @returns {Promise<Array>} Array of contacts needing 45-day follow-up
 */
export async function getContactsNeeding45Day() {
  try {
    const allContacts = await getAllContacts();
    return allContacts.filter(contact => contact.envio_45 === null || contact.envio_45 === false);
  } catch (error) {
    console.error('❌ Error in getContactsNeeding45Day:', error);
    throw error;
  }
}

/**
 * Gets contacts that have been contacted for both 15 and 45 days (both true)
 * @returns {Promise<Array>} Array of fully contacted customers
 */
export async function getFullyContactedCustomers() {
  try {
    const allContacts = await getAllContacts();
    return allContacts.filter(contact => contact.envio_15 === true && contact.envio_45 === true);
  } catch (error) {
    console.error('❌ Error in getFullyContactedCustomers:', error);
    throw error;
  }
}
