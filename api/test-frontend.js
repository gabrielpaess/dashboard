/**
 * API Route para Testar Frontend
 * 
 * Este endpoint testa se o frontend consegue carregar dados do Supabase
 */

import { FrontendOrderRepository } from '../src/services/data/FrontendOrderRepository.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    console.log('🧪 Testando FrontendOrderRepository...');
    
    // Criar instância do repositório
    const repository = new FrontendOrderRepository({
      supabase: {
        url: process.env.VITE_SUPABASE_URL,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY
      }
    });
    
    // Testar busca de pedidos
    console.log('📡 Testando busca de pedidos...');
    const response = await repository.getSupabaseOrders({ limit: 5 });
    
    if (response.success) {
      console.log(`✅ FrontendOrderRepository funcionando - ${response.data?.length || 0} pedidos encontrados`);
      
      return res.status(200).json({
        success: true,
        message: 'FrontendOrderRepository funcionando corretamente',
        data: {
          pedidos: response.data?.length || 0,
          sample: response.data?.slice(0, 2) || [],
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log(`❌ FrontendOrderRepository com erro: ${response.error}`);
      
      return res.status(500).json({
        success: false,
        error: response.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do frontend:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
