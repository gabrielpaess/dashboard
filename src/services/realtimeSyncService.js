/**
 * Real-time Sync Service
 * Handles continuous synchronization with Tiny API and Supabase
 * Monitors for new orders and changes every 15 minutes
 */

import { fetchOrdersFromTiny, fetchOrderDetails } from './tinyApiService.js';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';

class RealtimeSyncService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastSyncTime = null;
    this.syncStats = {
      totalSyncs: 0,
      newOrders: 0,
      updatedOrders: 0,
      errors: 0,
      lastError: null
    };
    
    // Create Supabase client
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey || config.supabase.anonKey
    );
  }

  /**
   * Start the real-time sync service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Sync service is already running');
      return;
    }

    console.log('🚀 Starting Real-time Sync Service...');
    this.isRunning = true;

    // Initial sync
    await this.performSync();

    // Set up interval for continuous monitoring (15 minutes)
    this.intervalId = setInterval(async () => {
      await this.performSync();
    }, 15 * 60 * 1000); // 15 minutes

    console.log('✅ Real-time Sync Service started (monitoring every 15 minutes)');
  }

  /**
   * Stop the real-time sync service
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Sync service is not running');
      return;
    }

    console.log('🛑 Stopping Real-time Sync Service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Real-time Sync Service stopped');
  }

  /**
   * Perform a complete sync operation
   */
  async performSync() {
    const startTime = new Date();
    console.log(`\n🔄 Starting sync at ${startTime.toISOString()}`);

    try {
      const token = config.tiny.token;
      if (!token) {
        throw new Error('TINY_API_TOKEN not found');
      }

      // Get recent orders (last 30 days to ensure we catch all updates)
      const recentOrders = await this.fetchRecentOrders(token);
      console.log(`📊 Found ${recentOrders.length} recent orders`);

      if (recentOrders.length === 0) {
        console.log('ℹ️ No recent orders to process');
        this.lastSyncTime = startTime;
        return;
      }

      // Process each order with detailed information
      const results = await this.processOrdersWithDetails(recentOrders, token);
      
      // Update stats
      this.syncStats.totalSyncs++;
      this.syncStats.newOrders += results.newOrders;
      this.syncStats.updatedOrders += results.updatedOrders;
      this.syncStats.errors += results.errors;

      console.log(`✅ Sync completed: ${results.newOrders} new, ${results.updatedOrders} updated, ${results.skipped} skipped, ${results.errors} errors`);
      this.lastSyncTime = startTime;

    } catch (error) {
      console.error('❌ Sync error:', error);
      this.syncStats.errors++;
      this.syncStats.lastError = {
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch recent orders from Tiny API
   */
  async fetchRecentOrders(token) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Format dates as dd/mm/yyyy as required by Tiny API
    const formatDateToTiny = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const options = {
      dataInicial: formatDateToTiny(thirtyDaysAgo), // dd/mm/yyyy format
      dataFinal: formatDateToTiny(new Date()), // dd/mm/yyyy format
      registrosPorPagina: 1000 // Get more orders per request
    };

    const response = await fetchOrdersFromTiny(token, options);
    
    if (response.retorno && response.retorno.pedidos) {
      return response.retorno.pedidos;
    }
    
    return [];
  }

  /**
   * Process orders with detailed information including items
   */
  async processOrdersWithDetails(orders, token) {
    const results = {
      newOrders: 0,
      updatedOrders: 0,
      errors: 0,
      processed: 0,
      skipped: 0
    };

    console.log(`🔄 Processing ${orders.length} orders with detailed information...`);

    // First, get all existing order IDs from Supabase for comparison
    const existingOrderIds = await this.getExistingOrderIds();
    console.log(`📊 Found ${existingOrderIds.size} existing orders in Supabase`);

    // Process orders in batches with retry logic
    const batchSize = 3;
    const maxRetries = 3;
    
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      let retryCount = 0;
      let batchProcessed = false;
      
      while (!batchProcessed && retryCount <= maxRetries) {
        try {
          console.log(`📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)} (pedidos ${i + 1}-${Math.min(i + batchSize, orders.length)})`);
          
          await Promise.all(batch.map(async (order) => {
            try {
              results.processed++;
              
              // Extract order data from API response
              const pedidoData = order.pedido || order;
              const pedidoId = pedidoData.id?.toString();
              
              if (!pedidoId) {
                console.warn('⚠️ Order without ID skipped:', order);
                results.skipped++;
                return;
              }

              // Skip cancelled orders
              if (pedidoData.situacao === 'Cancelado') {
                console.log(`🚫 Order ${pedidoId} filtered out (situacao: Cancelado)`);
                results.skipped++;
                return;
              }

              // Check if order already exists in Supabase
              if (existingOrderIds.has(pedidoId)) {
                console.log(`📋 Order ${pedidoId} already exists in Supabase, checking for updates...`);
                
                // Fetch detailed information to compare with existing data
                const orderDetails = await fetchOrderDetails(token, parseInt(pedidoId));
                
                if (!orderDetails || !orderDetails.retorno || !orderDetails.retorno.pedido) {
                  console.warn(`⚠️ No detailed data found for existing order ${pedidoId}`);
                  results.skipped++;
                  return;
                }

                const detailedPedido = orderDetails.retorno.pedido;
                const itensData = detailedPedido.itens || [];

                // Check if order needs update by comparing with existing data
                const needsUpdate = await this.checkOrderNeedsUpdate(pedidoId, detailedPedido);
                
                if (needsUpdate) {
                  console.log(`🔄 Order ${pedidoId} needs update, updating...`);
                  await this.updateOrderInSupabase(detailedPedido, itensData);
                  results.updatedOrders++;
                  console.log(`✅ Order ${pedidoId} updated successfully`);
                } else {
                  console.log(`✅ Order ${pedidoId} is up to date, skipping`);
                  results.skipped++;
                }
                
                return;
              }

              // This is a new order, fetch detailed information including items
              console.log(`🆕 New order ${pedidoId} found, fetching details...`);
              const orderDetails = await fetchOrderDetails(token, parseInt(pedidoId));
              
              if (!orderDetails || !orderDetails.retorno || !orderDetails.retorno.pedido) {
                console.warn(`⚠️ No detailed data found for order ${pedidoId}`);
                results.errors++;
                return;
              }

              const detailedPedido = orderDetails.retorno.pedido;
              const itensData = detailedPedido.itens || [];

              // Create new order with correct field mapping
              await this.createOrderInSupabase(detailedPedido, itensData);
              results.newOrders++;
              console.log(`✅ New order ${pedidoId} created with ${itensData.length} items`);

            } catch (error) {
              if (error.message.includes('API Bloqueada')) {
                throw error; // Re-throw to trigger batch retry
              }
              console.error(`❌ Error processing order ${order.pedido?.id || order.id}:`, error.message);
              results.errors++;
            }
          }));
          
          // Sucesso no lote
          batchProcessed = true;
          retryCount = 0;
          
          // Small delay between batches
          if (i + batchSize < orders.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          if (error.message.includes('API Bloqueada')) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
              const waitTime = Math.min(60000 * retryCount, 300000); // Max 5 minutos
              console.log(`⚠️ API bloqueada no lote. Tentativa ${retryCount}/${maxRetries}. Aguardando ${waitTime / 1000} segundos...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Tentar novamente o mesmo lote
              continue;
            } else {
              console.log(`❌ Máximo de tentativas atingido para o lote (${maxRetries}). Pulando lote...`);
              batchProcessed = true;
              results.errors += batch.length;
            }
          } else {
            console.error('❌ Erro no lote:', error.message);
            batchProcessed = true;
            results.errors += batch.length;
          }
        }
      }
    }

    return results;
  }

  /**
   * Get all existing order IDs from Supabase for comparison
   */
  async getExistingOrderIds() {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('pedido_id');

      if (error) {
        throw error;
      }

      // Return a Set for fast lookup
      return new Set(data.map(order => order.pedido_id.toString()));
    } catch (error) {
      console.error('❌ Error getting existing order IDs:', error);
      return new Set(); // Return empty set on error
    }
  }

  /**
   * Check if order exists in Supabase
   */
  async checkOrderExists(pedidoId) {
    try {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('id, pedido_id, updated_at')
        .eq('pedido_id', pedidoId.toString())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking if order exists:', error);
      return null;
    }
  }

  /**
   * Check if order needs update by comparing API data with Supabase data
   */
  async checkOrderNeedsUpdate(pedidoId, apiPedidoData) {
    try {
      const { data: existingOrder, error } = await this.supabase
        .from('pedidos')
        .select('situacao, valor_total, data_prevista, nome_vendedor, itens_json, updated_at')
        .eq('pedido_id', pedidoId.toString())
        .single();

      if (error) {
        console.error('❌ Error fetching existing order for comparison:', error);
        return true; // If we can't fetch, assume it needs update
      }

      if (!existingOrder) {
        return true; // Order doesn't exist, needs to be created
      }

      // Compare critical fields that might change
      const apiSituacao = apiPedidoData.situacao || 'Não informado';
      const apiValorTotal = this.extractValorTotal(apiPedidoData);
      const apiDataPrevista = apiPedidoData.data_prevista ? this.formatDateToISO(apiPedidoData.data_prevista) : null;
      const apiNomeVendedor = apiPedidoData.nome_vendedor || 'Não informado';

      // Debug: Mostrar comparação detalhada
      console.log(`🔍 Comparando pedido ${pedidoId}:`, {
        situacao: { supabase: existingOrder.situacao, api: apiSituacao },
        valor_total: { supabase: existingOrder.valor_total, api: apiValorTotal },
        data_prevista: { supabase: existingOrder.data_prevista, api: apiDataPrevista },
        nome_vendedor: { supabase: existingOrder.nome_vendedor, api: apiNomeVendedor }
      });

      // Check if any critical field has changed
      const situacaoChanged = existingOrder.situacao !== apiSituacao;
      const valorChanged = Math.abs((existingOrder.valor_total || 0) - (apiValorTotal || 0)) > 0.01; // Allow for small floating point differences
      const dataPrevistaChanged = existingOrder.data_prevista !== apiDataPrevista;
      const vendedorChanged = existingOrder.nome_vendedor !== apiNomeVendedor;

      if (situacaoChanged || valorChanged || dataPrevistaChanged || vendedorChanged) {
        console.log(`🔄 Order ${pedidoId} has changes:`, {
          situacao: { old: existingOrder.situacao, new: apiSituacao, changed: situacaoChanged },
          valor_total: { old: existingOrder.valor_total, new: apiValorTotal, changed: valorChanged },
          data_prevista: { old: existingOrder.data_prevista, new: apiDataPrevista, changed: dataPrevistaChanged },
          nome_vendedor: { old: existingOrder.nome_vendedor, new: apiNomeVendedor, changed: vendedorChanged }
        });
        return true;
      }

      return false; // No changes detected
    } catch (error) {
      console.error('❌ Error checking if order needs update:', error);
      return true; // If we can't check, assume it needs update
    }
  }

  /**
   * Extrair e validar valor total do pedido
   */
  extractValorTotal(pedidoData) {
    // Tentar diferentes campos possíveis da API
    const possibleFields = [
      pedidoData.valor,
      pedidoData.total_pedido,
      pedidoData.valor_total,
      pedidoData.total,
      pedidoData.valor_pedido
    ];
    
    for (const field of possibleFields) {
      if (field !== undefined && field !== null && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed > 0) {
          console.log(`✅ Valor total encontrado: ${parsed} (campo: ${field})`);
          return parsed;
        }
      }
    }
    
    console.warn(`⚠️ Valor total não encontrado ou inválido. Campos disponíveis:`, {
      valor: pedidoData.valor,
      total_pedido: pedidoData.total_pedido,
      valor_total: pedidoData.valor_total,
      total: pedidoData.total,
      valor_pedido: pedidoData.valor_pedido
    });
    
    return 0;
  }

  /**
   * Create new order in Supabase
   */
  async createOrderInSupabase(pedidoData, itensData) {
    try {
      // Validar dados obrigatórios
      if (!pedidoData.id) {
        throw new Error('ID do pedido é obrigatório');
      }

      if (!pedidoData.numero) {
        throw new Error('Número do pedido é obrigatório');
      }

      // Validar e formatar dados com mapeamento correto dos campos
      const pedido = {
        id: pedidoData.id,
        pedido_id: pedidoData.id, // retorno.pedidos.pedido.id
        numero: pedidoData.numero, // retorno.pedidos.pedido.numero
        nome_cliente: pedidoData.nome || pedidoData.cliente?.nome || 'Cliente não informado', // retorno.pedido.nome
        data_pedido: this.formatDateToISO(pedidoData.data_pedido), // retorno.pedidos.pedido.data_pedido
        data_pedido_pt_br: this.formatDateToPTBR(pedidoData.data_pedido), // retorno.pedidos.pedido.data_pedido
        data_prevista: pedidoData.data_prevista ? this.formatDateToISO(pedidoData.data_prevista) : null, // retorno.pedidos.pedido.data_prevista
        situacao: pedidoData.situacao || 'Não informado', // retorno.pedidos.pedido.situacao
        valor_total: this.extractValorTotal(pedidoData), // retorno.pedidos.pedido.valor
        nome_vendedor: pedidoData.nome_vendedor || 'Não informado', // retorno.pedidos.pedido.nome_vendedor
        itens_json: Array.isArray(itensData) ? itensData : [], // itens da consulta pedido.obter.php
        envio_15: this.calculateEnvio15(pedidoData.data_pedido, pedidoData.data_prevista), // calculado na aplicação
        envio_45: this.calculateEnvio45(pedidoData.data_pedido, pedidoData.data_prevista), // calculado na aplicação
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Debug: Mostrar dados que serão inseridos
      console.log(`🔍 Criando pedido ${pedido.numero} (ID: ${pedido.id})`);
      console.log(`📊 Dados: situacao=${pedido.situacao}, valor=${pedido.valor_total}, vendedor=${pedido.nome_vendedor}`);
      console.log(`🔍 Dados originais da API:`, {
        situacao_original: pedidoData.situacao,
        situacao_mapeada: pedido.situacao,
        todos_campos: pedidoData
      });

      const { error } = await this.supabase
        .from('pedidos')
        .insert([pedido]);

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar pedido: ${error.message}`);
      }

      console.log(`✅ Pedido ${pedido.numero} criado com sucesso`);

    } catch (error) {
      console.error('❌ Error creating order in Supabase:', error);
      throw error;
    }
  }

  /**
   * Update existing order in Supabase
   */
  async updateOrderInSupabase(pedidoData, itensData) {
    try {
      // Validar dados obrigatórios
      if (!pedidoData.id) {
        throw new Error('ID do pedido é obrigatório');
      }

      if (!pedidoData.numero) {
        throw new Error('Número do pedido é obrigatório');
      }

      // Atualizar com mapeamento correto dos campos
      const updates = {
        numero: pedidoData.numero, // retorno.pedidos.pedido.numero
        nome_cliente: pedidoData.nome || pedidoData.cliente?.nome || 'Cliente não informado', // retorno.pedido.nome
        data_pedido: this.formatDateToISO(pedidoData.data_pedido), // retorno.pedidos.pedido.data_pedido
        data_pedido_pt_br: this.formatDateToPTBR(pedidoData.data_pedido), // retorno.pedidos.pedido.data_pedido
        data_prevista: pedidoData.data_prevista ? this.formatDateToISO(pedidoData.data_prevista) : null, // retorno.pedidos.pedido.data_prevista
        situacao: pedidoData.situacao || 'Não informado', // retorno.pedidos.pedido.situacao
        valor_total: this.extractValorTotal(pedidoData), // retorno.pedidos.pedido.valor
        nome_vendedor: pedidoData.nome_vendedor || 'Não informado', // retorno.pedidos.pedido.nome_vendedor
        itens_json: Array.isArray(itensData) ? itensData : [], // itens da consulta pedido.obter.php
        envio_15: this.calculateEnvio15(pedidoData.data_pedido, pedidoData.data_prevista), // calculado na aplicação
        envio_45: this.calculateEnvio45(pedidoData.data_pedido, pedidoData.data_prevista), // calculado na aplicação
        updated_at: new Date().toISOString()
      };

      // Debug: Mostrar dados que serão atualizados
      console.log(`🔍 Atualizando pedido ${updates.numero} (ID: ${pedidoData.id})`);
      console.log(`📊 Dados: situacao=${updates.situacao}, valor=${updates.valor_total}, vendedor=${updates.nome_vendedor}`);
      console.log(`🔍 Dados originais da API:`, {
        situacao_original: pedidoData.situacao,
        situacao_mapeada: updates.situacao,
        todos_campos: pedidoData
      });

      const { error } = await this.supabase
        .from('pedidos')
        .update(updates)
        .eq('pedido_id', pedidoData.id.toString());

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar pedido: ${error.message}`);
      }

      console.log(`✅ Pedido ${updates.numero} atualizado com sucesso`);

    } catch (error) {
      console.error('❌ Error updating order in Supabase:', error);
      throw error;
    }
  }

  /**
   * Format date to ISO (YYYY-MM-DD)
   */
  formatDateToISO(dateString) {
    if (!dateString) return null;
    
    try {
      // Se já está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        return dateString;
      }
      
      // Se está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao formatar data para ISO:', dateString, error);
      return null;
    }
  }

  /**
   * Format date to PT-BR (DD/MM/YYYY)
   */
  formatDateToPTBR(dateString) {
    if (!dateString) return null;
    
    try {
      // Se já está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Se já está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        return dateString;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao formatar data para PT-BR:', dateString, error);
      return null;
    }
  }

  /**
   * Calculate if order has 15-day follow-up
   */
  calculateEnvio15(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate - pedidoDate) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 15;
    } catch (error) {
      console.error('Erro ao calcular envio 15:', error);
      return false;
    }
  }

  /**
   * Calculate if order has 45-day follow-up
   */
  calculateEnvio45(dataPedido, dataPrevista) {
    if (!dataPedido || !dataPrevista) return false;
    
    try {
      const pedidoDate = this.createLocalDate(dataPedido);
      const previstaDate = this.createLocalDate(dataPrevista);
      
      if (!pedidoDate || !previstaDate) return false;
      
      const diffDays = Math.ceil((previstaDate - pedidoDate) / (1000 * 60 * 60 * 24));
      
      return diffDays <= 45;
    } catch (error) {
      console.error('Erro ao calcular envio 45:', error);
      return false;
    }
  }

  /**
   * Create local date to avoid timezone issues
   */
  createLocalDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Se está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        // Criar data no fuso horário local (não UTC) - definir hora como meio-dia para evitar problemas de fuso
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      // Se está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao criar data local:', dateString, error);
      return null;
    }
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      nextSyncIn: this.intervalId ? '15 minutes' : 'Not scheduled'
    };
  }

  /**
   * Force a manual sync
   */
  async forceSync() {
    console.log('🔄 Manual sync requested...');
    await this.performSync();
  }
}

// Export singleton instance
export const realtimeSyncService = new RealtimeSyncService();
export default realtimeSyncService;
