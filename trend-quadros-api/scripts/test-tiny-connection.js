#!/usr/bin/env node

/**
 * Test Tiny API Connection
 * Tests the connection to Tiny API and validates the token
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

async function testTinyConnection() {
  console.log('🔍 Testing Tiny API Connection...');
  console.log(`📡 API URL: ${TINY_API_URL}`);
  console.log(`🔑 Token: ${TINY_API_TOKEN ? '***' + TINY_API_TOKEN.slice(-4) : 'NOT SET'}`);
  
  if (!TINY_API_TOKEN) {
    console.error('❌ TINY_API_TOKEN not found in environment variables');
    process.exit(1);
  }

  try {
    const url = new URL(TINY_API_URL);
    url.searchParams.append('token', TINY_API_TOKEN);
    url.searchParams.append('formato', 'json');
    url.searchParams.append('registrosPorPagina', '1');

    console.log('📤 Sending request to Tiny API...');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dashboard-API/1.0'
      },
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));

    if (data.retorno && data.retorno.status === 'Erro') {
      const errorMessage = data.retorno.erros?.[0]?.erro || 'Unknown error';
      console.error('❌ Tiny API Error:', errorMessage);
      
      if (errorMessage.includes('Token inválido') || errorMessage.includes('Invalid token')) {
        console.error('🔑 Token validation failed. Please check your TINY_API_TOKEN.');
        process.exit(1);
      }
      
      throw new Error(`Tiny API Error: ${errorMessage}`);
    }

    if (data.retorno && data.retorno.pedidos) {
      console.log('✅ Connection successful!');
      console.log(`📦 Found ${data.retorno.pedidos.length} orders in response`);
      console.log('🎉 Tiny API is working correctly!');
      
      if (data.retorno.pedidos.length > 0) {
        const sampleOrder = data.retorno.pedidos[0];
        console.log('📋 Sample Order Structure:');
        console.log(`   - ID: ${sampleOrder.pedido?.id || 'N/A'}`);
        console.log(`   - Number: ${sampleOrder.pedido?.numero || 'N/A'}`);
        console.log(`   - Customer: ${sampleOrder.pedido?.cliente?.nome || 'N/A'}`);
        console.log(`   - Status: ${sampleOrder.pedido?.situacao || 'N/A'}`);
        console.log(`   - Value: ${sampleOrder.pedido?.valor || 'N/A'}`);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📭 No orders found (this is normal for new accounts)');
      console.log('🎉 Tiny API is working correctly!');
    }

    return true;

  } catch (error) {
    console.error('💥 Connection failed:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network error: Unable to connect to Tiny API');
      console.error('   Please check your internet connection and firewall settings');
    }
    
    process.exit(1);
  }
}

// Run the test
testTinyConnection()
  .then(() => {
    console.log('\n🎯 Tiny API connection test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tiny API connection test failed:', error.message);
    process.exit(1);
  });
