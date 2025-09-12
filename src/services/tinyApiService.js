/**
 * Tiny API Service
 * Handles communication with Tiny API for order data
 */

const TINY_API_BASE_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

/**
 * Fetches orders from Tiny API
 * @param {string} token - Tiny API token
 * @param {Object} options - Query options
 * @returns {Promise<Object>} API response with orders
 */
export async function fetchOrdersFromTiny(token, options = {}) {
  try {
    const url = new URL(TINY_API_BASE_URL);
    
    // Add default parameters
    url.searchParams.append('token', token);
    url.searchParams.append('formato', 'json');
    
    // Add custom parameters
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        url.searchParams.append(key, options[key]);
      }
    });

    console.log('🔍 Fetching orders from Tiny API:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tiny API Error:', response.status, response.statusText, errorText);
      throw new Error(`Tiny API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response contains an error
    if (data.retorno && data.retorno.status === 'Erro') {
      // Check if it's just "no records found" - this is not an error
      const errorMessage = data.retorno.erros?.[0]?.erro || '';
      if (errorMessage.includes('não retornou registros') || errorMessage.includes('no records')) {
        console.log('ℹ️ No records found in Tiny API - this is normal');
        return { retorno: { pedidos: [] } }; // Return empty result
      }
      
      console.error('❌ Tiny API returned error:', data.retorno.erros);
      throw new Error(`Tiny API error: ${errorMessage}`);
    }

    console.log('✅ Successfully fetched orders from Tiny API');
    return data;

  } catch (error) {
    console.error('❌ Error fetching orders from Tiny API:', error);
    throw error;
  }
}

/**
 * Fetches recent orders (last 7 days)
 * @param {string} token - Tiny API token
 * @returns {Promise<Array>} Array of recent orders
 */
export async function fetchRecentOrders(token) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Format dates as dd/mm/yyyy as required by Tiny API
  const formatDateToTiny = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const options = {
    dataInicial: formatDateToTiny(sevenDaysAgo), // dd/mm/yyyy format
    dataFinal: formatDateToTiny(new Date()), // dd/mm/yyyy format
  };

  const response = await fetchOrdersFromTiny(token, options);
  
  // Extract orders from response
  if (response.retorno && response.retorno.pedidos) {
    return response.retorno.pedidos;
  }
  
  return [];
}

/**
 * Fetches all orders with pagination
 * @param {string} token - Tiny API token
 * @param {number} page - Page number (starts from 1)
 * @param {number} limit - Number of orders per page
 * @returns {Promise<Object>} Paginated response with orders
 */
export async function fetchOrdersWithPagination(token, page = 1, limit = 100) {
  const options = {
    pagina: page,
    registrosPorPagina: limit,
    situacao: 'aberto',
  };

  return await fetchOrdersFromTiny(token, options);
}

/**
 * Fetches ALL orders from Tiny API with pagination
 * @param {string} token - Tiny API token
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of all orders
 */
export async function fetchAllOrders(token, options = {}) {
  try {
    console.log('📥 Fetching ALL orders from Tiny API...');
    
    let page = 1;
    const limit = options.limit || 100;
    let hasMorePages = true;
    let allOrders = [];
    let totalPages = null;

    while (hasMorePages) {
      console.log(`📄 Fetching page ${page}...`);
      
      const response = await fetchOrdersFromTiny(token, {
        pagina: page,
        registrosPorPagina: limit,
        // Get all orders, filtering will be done in processNewOrders
        ...options
      });

      if (response.retorno && response.retorno.pedidos) {
        const orders = response.retorno.pedidos;
        allOrders = allOrders.concat(orders);
        
        console.log(`✅ Page ${page}: Found ${orders.length} orders`);
        
        // Check if we have pagination info
        if (response.retorno.numero_paginas) {
          totalPages = response.retorno.numero_paginas;
          console.log(`📊 Total pages available: ${totalPages}`);
        }
        
        // Check if there are more pages
        if (orders.length < limit) {
          hasMorePages = false;
          console.log(`📄 Last page reached (${orders.length} < ${limit})`);
        } else if (totalPages && page >= totalPages) {
          hasMorePages = false;
          console.log(`📄 All pages fetched (${page}/${totalPages})`);
        } else {
          page++;
        }
      } else {
        console.log(`ℹ️ Page ${page}: No orders found`);
        hasMorePages = false;
      }

      // Safety limit to prevent infinite loops
      if (page > 200) {
        console.log('⚠️ Safety limit reached (200 pages), stopping...');
        break;
      }

      // Small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📊 Total orders fetched: ${allOrders.length} across ${page} pages`);
    return allOrders;

  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    throw error;
  }
}

/**
 * Fetches detailed order information by ID
 * @param {string} token - Tiny API token
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Detailed order information
 */
export async function fetchOrderDetails(token, orderId) {
  try {
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php';
    
    // Preparar dados para POST
    const formData = new FormData();
    formData.append('token', token);
    formData.append('id', orderId.toString());
    formData.append('formato', 'json');

    console.log(`🔍 Fetching order details for ID: ${orderId} with POST method`);

    // Adicionar timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tiny API Error (Order Details):', response.status, response.statusText, errorText);
      throw new Error(`Tiny API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response contains an error
    if (data.retorno && data.retorno.status === 'Erro') {
      const errorMessage = data.retorno.erros?.[0]?.erro || '';
      console.error('❌ Tiny API returned error (Order Details):', data.retorno.erros);
      throw new Error(`Tiny API error: ${errorMessage}`);
    }

    console.log(`✅ Successfully fetched order details for ID: ${orderId}`);
    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`⏰ Timeout fetching order details for ID ${orderId}`);
      throw new Error('Timeout: Request took too long');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`🌐 Network error fetching order details for ID ${orderId}:`, error.message);
      throw new Error('Network error: Unable to connect to API');
    } else {
      console.error(`❌ Error fetching order details for ID ${orderId}:`, error.message);
      throw error;
    }
  }
}

/**
 * Fetches detailed information for multiple orders
 * @param {string} token - Tiny API token
 * @param {Array<number>} orderIds - Array of order IDs
 * @returns {Promise<Array>} Array of detailed order information
 */
export async function fetchMultipleOrderDetails(token, orderIds) {
  try {
    console.log(`📥 Fetching details for ${orderIds.length} orders...`);
    
    const orderDetails = [];
    const batchSize = 5; // Process 5 orders at a time to avoid overwhelming the API
    
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}: orders ${i + 1}-${Math.min(i + batchSize, orderIds.length)}`);
      
      const batchPromises = batch.map(async (orderId) => {
        try {
          const details = await fetchOrderDetails(token, orderId);
          return details;
        } catch (error) {
          console.error(`❌ Failed to fetch details for order ${orderId}:`, error.message);
          return null; // Return null for failed requests
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      orderDetails.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < orderIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Successfully fetched details for ${orderDetails.length}/${orderIds.length} orders`);
    return orderDetails;
    
  } catch (error) {
    console.error('❌ Error fetching multiple order details:', error);
    throw error;
  }
}

/**
 * Test order details API with a simple request
 * @param {string} token - Tiny API token
 * @param {number} orderId - Order ID to test
 * @returns {Promise<Object>} Test result
 */
export async function testOrderDetailsAPI(token, orderId) {
  try {
    console.log(`🧪 Testing order details API for ID: ${orderId}`);
    
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php';
    
    // Test with POST method
    const formData = new FormData();
    formData.append('token', token);
    formData.append('id', orderId.toString());
    formData.append('formato', 'json');

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const responseText = await response.text();
    console.log(`📡 Raw response (${response.status}):`, responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log(`📊 Parsed response:`, data);
    
    return {
      success: true,
      data: data,
      status: response.status
    };

  } catch (error) {
    console.error(`❌ Test failed for order ${orderId}:`, error);
    return {
      success: false,
      error: error.message,
      orderId: orderId
    };
  }
}

/**
 * Validates Tiny API token
 * @param {string} token - Tiny API token
 * @returns {Promise<boolean>} True if token is valid
 */
export async function validateTinyToken(token) {
  try {
    await fetchOrdersFromTiny(token, { registrosPorPagina: 1 });
    return true;
  } catch (error) {
    console.error('❌ Invalid Tiny API token:', error.message);
    return false;
  }
}
