#!/usr/bin/env node

/**
 * Script para verificar o status do dashboard e sincronização
 */

import { config } from '../src/config/environment.js';
import { createClient } from '@supabase/supabase-js';
import { realtimeSyncService } from '../src/services/realtimeSyncService.js';

console.log('🔍 Verificando status do dashboard...\n');

async function checkDashboardStatus() {
  try {
    // 1. Verificar configuração
    console.log('📋 Configuração:');
    console.log(`  Supabase URL: ${config.supabase.url ? '✅' : '❌'}`);
    console.log(`  Supabase Key: ${config.supabase.anonKey ? '✅' : '❌'}`);
    console.log(`  Tiny Token: ${config.tiny.token ? '✅' : '❌'}\n`);

    // 2. Verificar conexão com Supabase
    console.log('🔗 Testando conexão com Supabase...');
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Erro na conexão: ${error.message}`);
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
    }

    // 3. Verificar dados no Supabase
    console.log('\n📊 Verificando dados no Supabase...');
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, numero, valor_total, situacao, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pedidosError) {
      console.log(`❌ Erro ao buscar pedidos: ${pedidosError.message}`);
    } else {
      console.log(`✅ Encontrados ${pedidosData.length} pedidos (mostrando últimos 10)`);
      pedidosData.forEach(pedido => {
        console.log(`  - ${pedido.numero}: R$ ${pedido.valor_total} (${pedido.situacao})`);
      });
    }

    // 4. Verificar se o serviço de sync está rodando
    console.log('\n🔄 Verificando serviço de sincronização...');
    const stats = realtimeSyncService.getStats();
    console.log(`  Status: ${stats.isRunning ? '✅ Rodando' : '❌ Parado'}`);
    console.log(`  Total de syncs: ${stats.totalSyncs}`);
    console.log(`  Novos pedidos: ${stats.newOrders}`);
    console.log(`  Pedidos atualizados: ${stats.updatedOrders}`);
    console.log(`  Erros: ${stats.errors}`);
    console.log(`  Última sincronização: ${stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Nunca'}`);

    // 5. Verificar se a porta 5173 está ativa
    console.log('\n🌐 Verificando servidor web...');
    try {
      const response = await fetch('http://localhost:5173');
      if (response.ok) {
        console.log('✅ Servidor web está rodando na porta 5173');
        console.log('🔗 Acesse: http://localhost:5173');
      } else {
        console.log('⚠️ Servidor web respondeu com status:', response.status);
      }
    } catch (error) {
      console.log('❌ Servidor web não está rodando na porta 5173');
      console.log('💡 Execute: npm run start:full');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkDashboardStatus();
