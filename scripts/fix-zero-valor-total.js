/**
 * Script para corrigir registros com valor_total = 0 no Supabase
 * Este script busca pedidos com valor zero e tenta re-sincronizá-los
 */

import { config } from '../src/config/environment.js';
import { createClient } from '@supabase/supabase-js';
import { fetchOrderDetails } from '../src/services/tinyApiService.js';

/**
 * Extrair e validar valor total do pedido
 */
function extractValorTotal(pedidoData) {
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

async function fixZeroValorTotal() {
  console.log('🔧 Iniciando correção de registros com valor_total = 0...\n');
  
  try {
    // Criar cliente Supabase
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // 1. Buscar pedidos com valor_total = 0
    console.log('📊 Buscando pedidos com valor_total = 0...');
    const pedidosComValorZero = await supabase
      .from('pedidos')
      .select('*')
      .eq('valor_total', 0)
      .order('created_at', { ascending: false })
      .limit(50); // Limitar a 50 para não sobrecarregar
    
    if (pedidosComValorZero.error) {
      throw new Error(`Erro ao buscar pedidos: ${pedidosComValorZero.error.message}`);
    }
    
    const pedidos = pedidosComValorZero.data || [];
    console.log(`📋 Encontrados ${pedidos.length} pedidos com valor_total = 0`);
    
    if (pedidos.length === 0) {
      console.log('✅ Nenhum pedido com valor zero encontrado!');
      return;
    }
    
    // 2. Obter token da API do Tiny
    const token = config.tiny.token;
    if (!token) {
      throw new Error('TINY_API_TOKEN não encontrado');
    }
    
    console.log('🔑 Token da API Tiny encontrado');
    
    // 3. Processar cada pedido
    let corrigidos = 0;
    let erros = 0;
    
    for (const pedido of pedidos) {
      try {
        console.log(`\n🔍 Processando pedido ${pedido.numero} (ID: ${pedido.pedido_id})`);
        
        // Buscar detalhes do pedido na API do Tiny
        const orderDetails = await fetchOrderDetails(token, parseInt(pedido.pedido_id));
        
        if (!orderDetails || !orderDetails.retorno || !orderDetails.retorno.pedido) {
          console.log(`⚠️ Detalhes não encontrados para pedido ${pedido.numero}`);
          erros++;
          continue;
        }
        
        const pedidoData = orderDetails.retorno.pedido;
        const itensData = pedidoData.itens || [];
        
        // Verificar se o valor foi encontrado
        const novoValor = extractValorTotal(pedidoData);
        
        if (novoValor > 0) {
          console.log(`💰 Valor encontrado: R$ ${novoValor} (anterior: R$ ${pedido.valor_total})`);
          
          // Atualizar o pedido no Supabase
          const { error } = await supabase
            .from('pedidos')
            .update({
              valor_total: novoValor,
              updated_at: new Date().toISOString()
            })
            .eq('id', pedido.id);
          
          if (error) {
            console.log(`❌ Erro ao atualizar pedido: ${error.message}`);
            erros++;
          } else {
            console.log(`✅ Pedido ${pedido.numero} atualizado com sucesso`);
            corrigidos++;
          }
        } else {
          console.log(`⚠️ Valor ainda não encontrado para pedido ${pedido.numero}`);
          erros++;
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ Erro ao processar pedido ${pedido.numero}: ${error.message}`);
        erros++;
      }
    }
    
    // 4. Relatório final
    console.log(`\n📊 Relatório de correção:`);
    console.log(`   ✅ Pedidos corrigidos: ${corrigidos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📋 Total processados: ${pedidos.length}`);
    
    if (corrigidos > 0) {
      console.log(`\n🎉 Correção concluída! ${corrigidos} pedidos foram atualizados.`);
    } else {
      console.log(`\n⚠️ Nenhum pedido foi corrigido. Verifique os logs para mais detalhes.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar a correção
fixZeroValorTotal().catch(console.error);
