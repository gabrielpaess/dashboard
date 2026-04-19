const { Pool } = require('pg');
const axios = require('axios');
const { getRollingTwoMonthTinyDateRange } = require('./tiny-date-range');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
});

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

async function generateFinalReport() {
  console.log('📊 RELATÓRIO FINAL DE SINCRONIZAÇÃO');
  console.log('=====================================\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Buscar todos os pedidos da API Tiny
    console.log('🔍 Buscando dados da Tiny API...');
    const allOrders = await fetchAllOrdersWithPagination();
    console.log(`📦 Total de pedidos na Tiny API: ${allOrders.length}\n`);
    
    // 2. Buscar estatísticas do banco
    console.log('🗄️  Analisando banco de dados...');
    const dbStats = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN situacao = 'Entregue' THEN 1 END) as entregues,
        COUNT(CASE WHEN situacao = 'Enviado' THEN 1 END) as enviados,
        COUNT(CASE WHEN situacao = 'Faturado' THEN 1 END) as faturados,
        COUNT(CASE WHEN situacao = 'Em aberto' THEN 1 END) as em_aberto,
        COUNT(CASE WHEN situacao = 'Pronto para envio' THEN 1 END) as pronto_envio,
        COUNT(CASE WHEN situacao = 'Aprovado' THEN 1 END) as aprovados,
        COUNT(CASE WHEN situacao = 'Preparando envio' THEN 1 END) as preparando_envio,
        COUNT(CASE WHEN itens_json != '[]' AND itens_json IS NOT NULL THEN 1 END) as com_itens,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as ticket_medio
      FROM pedidos
    `);
    
    const stats = dbStats.rows[0];
    console.log(`📦 Total de pedidos no banco: ${stats.total_pedidos}`);
    console.log(`💰 Valor total: R$ ${parseFloat(stats.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`🎯 Ticket médio: R$ ${parseFloat(stats.ticket_medio || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    console.log(`📦 Pedidos com itens: ${stats.com_itens} (${((stats.com_itens / stats.total_pedidos) * 100).toFixed(1)}%)\n`);
    
    // 3. Estatísticas por status
    console.log('📊 DISTRIBUIÇÃO POR STATUS:');
    console.log(`   ✅ Entregues: ${stats.entregues}`);
    console.log(`   🚚 Enviados: ${stats.enviados}`);
    console.log(`   💰 Faturados: ${stats.faturados}`);
    console.log(`   ⏳ Em aberto: ${stats.em_aberto}`);
    console.log(`   📦 Pronto para envio: ${stats.pronto_envio}`);
    console.log(`   ✅ Aprovados: ${stats.aprovados}`);
    console.log(`   🔧 Preparando envio: ${stats.preparando_envio}\n`);
    
    // 4. Estatísticas por vendedor
    console.log('👥 DISTRIBUIÇÃO POR VENDEDOR:');
    const vendedorStats = await client.query(`
      SELECT 
        nome_vendedor,
        COUNT(*) as total_pedidos,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as ticket_medio
      FROM pedidos 
      GROUP BY nome_vendedor 
      ORDER BY total_pedidos DESC
    `);
    
    vendedorStats.rows.forEach(vendedor => {
      console.log(`   ${vendedor.nome_vendedor || 'Não informado'}:`);
      console.log(`     📦 Pedidos: ${vendedor.total_pedidos}`);
      console.log(`     💰 Valor: R$ ${parseFloat(vendedor.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
      console.log(`     🎯 Ticket médio: R$ ${parseFloat(vendedor.ticket_medio || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    });
    
    console.log('\n');
    
    // 5. Comparação com Tiny API
    console.log('🔄 COMPARAÇÃO COM TINY API:');
    const apiStatusCounts = {};
    allOrders.forEach(order => {
      const status = order.pedido.situacao;
      apiStatusCounts[status] = (apiStatusCounts[status] || 0) + 1;
    });
    
    console.log('   Tiny API vs Banco de Dados:');
    Object.entries(apiStatusCounts).forEach(([status, count]) => {
      const dbCount = stats[status.toLowerCase().replace(' ', '_')] || 0;
      const diff = count - dbCount;
      const statusIcon = getStatusIcon(status);
      console.log(`   ${statusIcon} ${status}: ${count} (API) vs ${dbCount} (DB) ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : '✅'}`);
    });
    
    // 6. Resumo final
    console.log('\n📋 RESUMO FINAL:');
    const missingOrders = allOrders.length - stats.total_pedidos;
    if (missingOrders === 0) {
      console.log('✅ Sincronização perfeita! Todos os pedidos ativos estão no banco.');
    } else if (missingOrders > 0) {
      console.log(`⚠️  Faltam ${missingOrders} pedidos no banco (provavelmente cancelados).`);
    } else {
      console.log(`ℹ️  Banco tem ${Math.abs(missingOrders)} pedidos a mais que a API.`);
    }
    
    console.log(`📦 Total de pedidos ativos sincronizados: ${stats.total_pedidos}`);
    console.log(`📦 Pedidos com itens completos: ${stats.com_itens} (${((stats.com_itens / stats.total_pedidos) * 100).toFixed(1)}%)`);
    console.log(`💰 Valor total dos pedidos: R$ ${parseFloat(stats.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

function getStatusIcon(status) {
  const icons = {
    'Entregue': '✅',
    'Enviado': '🚚',
    'Faturado': '💰',
    'Em aberto': '⏳',
    'Pronto para envio': '📦',
    'Aprovado': '✅',
    'Preparando envio': '🔧',
    'Cancelado': '❌'
  };
  return icons[status] || '📋';
}

async function fetchAllOrdersWithPagination() {
  const allOrders = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const range = getRollingTwoMonthTinyDateRange();
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      formato: 'json',
      dataInicial: range.dataInicial,
      dataFinal: range.dataFinal,
      registrosPorPagina: '100',
      pagina: currentPage.toString()
    });

    try {
      const response = await axios.post(TINY_API_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'Erro') {
          const errorMessage = response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido da API Tiny';
          throw new Error(`Tiny API error: ${errorMessage}`);
        }

        const orders = response.data.retorno.pedidos || [];
        allOrders.push(...orders);
        
        totalPages = response.data.retorno.numero_paginas || 1;
        
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        hasMorePages = false;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${currentPage}:`, error.message);
      hasMorePages = false;
    }
  }

  return allOrders;
}

generateFinalReport();
