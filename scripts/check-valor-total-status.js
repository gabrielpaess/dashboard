/**
 * Script para verificar o status atual dos valores no Supabase
 * Este script mostra estatísticas sobre os valores dos pedidos
 */

import { config } from '../src/config/environment.js';
import { createClient } from '@supabase/supabase-js';

async function checkValorTotalStatus() {
  console.log('📊 Verificando status dos valores no Supabase...\n');
  
  try {
    // Criar cliente Supabase
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // 1. Buscar todos os pedidos
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('id, numero, valor_total, situacao, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    }
    
    if (!pedidos || pedidos.length === 0) {
      console.log('❌ Nenhum pedido encontrado no Supabase');
      return;
    }
    
    console.log(`📋 Total de pedidos: ${pedidos.length}`);
    
    // 2. Análise dos valores
    const valoresZero = pedidos.filter(p => p.valor_total === 0);
    const valoresPositivos = pedidos.filter(p => p.valor_total > 0);
    const valoresNulos = pedidos.filter(p => p.valor_total === null || p.valor_total === undefined);
    
    console.log(`\n💰 Análise de valores:`);
    console.log(`   ✅ Valores positivos: ${valoresPositivos.length} (${((valoresPositivos.length / pedidos.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Valores zero: ${valoresZero.length} (${((valoresZero.length / pedidos.length) * 100).toFixed(1)}%)`);
    console.log(`   ⚠️ Valores nulos: ${valoresNulos.length} (${((valoresNulos.length / pedidos.length) * 100).toFixed(1)}%)`);
    
    // 3. Estatísticas dos valores positivos
    if (valoresPositivos.length > 0) {
      const valores = valoresPositivos.map(p => p.valor_total);
      const soma = valores.reduce((a, b) => a + b, 0);
      const media = soma / valores.length;
      const min = Math.min(...valores);
      const max = Math.max(...valores);
      
      console.log(`\n📈 Estatísticas dos valores positivos:`);
      console.log(`   💰 Soma total: R$ ${soma.toFixed(2)}`);
      console.log(`   📊 Média: R$ ${media.toFixed(2)}`);
      console.log(`   📉 Menor valor: R$ ${min.toFixed(2)}`);
      console.log(`   📈 Maior valor: R$ ${max.toFixed(2)}`);
    }
    
    // 4. Análise por situação
    console.log(`\n📋 Análise por situação:`);
    const situacoes = {};
    pedidos.forEach(pedido => {
      const situacao = pedido.situacao || 'Não informado';
      if (!situacoes[situacao]) {
        situacoes[situacao] = {
          total: 0,
          comValor: 0,
          semValor: 0
        };
      }
      situacoes[situacao].total++;
      if (pedido.valor_total > 0) {
        situacoes[situacao].comValor++;
      } else {
        situacoes[situacao].semValor++;
      }
    });
    
    Object.entries(situacoes).forEach(([situacao, stats]) => {
      const percentualComValor = ((stats.comValor / stats.total) * 100).toFixed(1);
      console.log(`   ${situacao}: ${stats.comValor}/${stats.total} com valor (${percentualComValor}%)`);
    });
    
    // 5. Exemplos de pedidos com valor zero
    if (valoresZero.length > 0) {
      console.log(`\n⚠️ Exemplos de pedidos com valor zero:`);
      valoresZero.slice(0, 5).forEach(pedido => {
        console.log(`   - ${pedido.numero} (${pedido.situacao}) - Criado em: ${pedido.created_at}`);
      });
      
      if (valoresZero.length > 5) {
        console.log(`   ... e mais ${valoresZero.length - 5} pedidos`);
      }
    }
    
    // 6. Recomendações
    console.log(`\n💡 Recomendações:`);
    if (valoresZero.length > 0) {
      console.log(`   🔧 Execute o script fix-zero-valor-total.js para corrigir os ${valoresZero.length} pedidos com valor zero`);
    }
    if (valoresNulos.length > 0) {
      console.log(`   ⚠️ Verifique os ${valoresNulos.length} pedidos com valores nulos`);
    }
    if (valoresZero.length === 0 && valoresNulos.length === 0) {
      console.log(`   ✅ Todos os pedidos têm valores válidos!`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  }
}

// Executar a verificação
checkValorTotalStatus().catch(console.error);
