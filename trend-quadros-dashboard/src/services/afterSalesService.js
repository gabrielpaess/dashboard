/**
 * After Sales Service
 * Service for managing after-sales alerts and data via NestJS API
 */

import { nestjsApiClient } from './index.js';

/**
 * Gets orders that need after-sales follow-up (data_prevista + 15 days)
 * @returns {Promise<Array>} Array of orders needing follow-up
 */
export async function getAfterSalesAlerts() {
  try {
    console.log('📞 Fetching after-sales alerts from NestJS API...');

    // Get all orders from NestJS API
    const response = await nestjsApiClient.request('/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.success) {
      console.error('❌ Error fetching orders:', response.error);
      throw new Error(response.error);
    }

    const orders = response.data || [];
    console.log(`📊 Found ${orders.length} orders from API`);

    if (orders.length === 0) {
      return [];
    }

    // Filter orders that need after-sales follow-up (data_prevista + 15 days)
    const now = new Date();
    const alerts = [];

    for (const order of orders) {
      if (!order.data_prevista) continue;

      const expectedDate = new Date(order.data_prevista);
      const daysSinceExpected = Math.floor((now - expectedDate) / (1000 * 60 * 60 * 24));

      // Check if order needs 15-day follow-up
      if (daysSinceExpected >= 15 && daysSinceExpected < 45) {
        alerts.push({
          ...order,
          daysSinceExpected,
          alertType: '15day',
          priority: daysSinceExpected > 20 ? 'high' : 'medium'
        });
      }
      // Check if order needs 45-day follow-up
      else if (daysSinceExpected >= 45) {
        alerts.push({
          ...order,
          daysSinceExpected,
          alertType: '45day',
          priority: 'high'
        });
      }
    }

    console.log(`🚨 Found ${alerts.length} after-sales alerts`);
    return alerts;

  } catch (error) {
    console.error('❌ Error in getAfterSalesAlerts:', error);
    return [];
  }
}

/**
 * Mark order as contacted for 15-day follow-up
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export async function markAsContacted15Days(orderId) {
  try {
    console.log(`📞 Marking order ${orderId} as contacted (15 days)...`);

    // Update order via NestJS API
    const response = await nestjsApiClient.request(`/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contacted_15_days: true,
        contacted_15_days_date: new Date().toISOString()
      })
    });

    if (response.success) {
      console.log(`✅ Order ${orderId} marked as contacted (15 days)`);
      return true;
    } else {
      console.error(`❌ Error marking order ${orderId}:`, response.error);
      return false;
    }

  } catch (error) {
    console.error('❌ Error in markAsContacted15Days:', error);
    return false;
  }
}

/**
 * Mark order as contacted for 45-day follow-up
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export async function markAsContacted45Days(orderId) {
  try {
    console.log(`📞 Marking order ${orderId} as contacted (45 days)...`);

    // Update order via NestJS API
    const response = await nestjsApiClient.request(`/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contacted_45_days: true,
        contacted_45_days_date: new Date().toISOString()
      })
    });

    if (response.success) {
      console.log(`✅ Order ${orderId} marked as contacted (45 days)`);
      return true;
    } else {
      console.error(`❌ Error marking order ${orderId}:`, response.error);
      return false;
    }

  } catch (error) {
    console.error('❌ Error in markAsContacted45Days:', error);
    return false;
  }
}

/**
 * Get all contacts (simplified version using API)
 * @returns {Promise<Array>} Array of all contacts
 */
export async function getAllContacts() {
  try {
    console.log('📞 Fetching all contacts from NestJS API...');

    const response = await nestjsApiClient.request('/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.success) {
      console.error('❌ Error fetching contacts:', response.error);
      return [];
    }

    const orders = response.data || [];
    console.log(`📊 Found ${orders.length} contacts from API`);
    return orders;

  } catch (error) {
    console.error('❌ Error in getAllContacts:', error);
    return [];
  }
}

/**
 * Get contacts needing 15-day follow-up
 * @returns {Promise<Array>} Array of contacts needing 15-day follow-up
 */
export async function getContactsNeeding15Day() {
  const alerts = await getAfterSalesAlerts();
  return alerts.filter(alert => alert.alertType === '15day');
}

/**
 * Get contacts needing 45-day follow-up
 * @returns {Promise<Array>} Array of contacts needing 45-day follow-up
 */
export async function getContactsNeeding45Day() {
  const alerts = await getAfterSalesAlerts();
  return alerts.filter(alert => alert.alertType === '45day');
}

/**
 * Get fully contacted customers
 * @returns {Promise<Array>} Array of fully contacted customers
 */
export async function getFullyContactedCustomers() {
  try {
    console.log('📞 Fetching fully contacted customers from NestJS API...');

    const response = await nestjsApiClient.request('/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.success) {
      console.error('❌ Error fetching contacted customers:', response.error);
      return [];
    }

    const orders = response.data || [];
    const contacted = orders.filter(order => 
      order.contacted_15_days && order.contacted_45_days
    );

    console.log(`📊 Found ${contacted.length} fully contacted customers`);
    return contacted;

  } catch (error) {
    console.error('❌ Error in getFullyContactedCustomers:', error);
    return [];
  }
}