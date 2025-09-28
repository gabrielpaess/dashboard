/**
 * Script para verificar se a sincronização foi bem-sucedida
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
});

async function checkSyncStatus() {
  console.log('🔍 Verificando status da sincronização...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Estatísticas gerais
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN itens_json IS NOT NULL AND jsonb_array_length(itens_json) > 0 THEN 1 END) as pedidos_com_itens,
        COUNT(CASE WHEN itens_json IS NULL OR itens_json = '[]'::jsonb OR jsonb_array_length(itens_json) = 0 THEN 1 END) as pedidos_sem_itens
      FROM pedidos
    `);

    const data = stats.rows[0];
    console.log('📊 Estatísticas Gerais:');
    console.log(`   Total de pedidos: ${data.total_pedidos}`);
    console.log(`   Com itens: ${data.pedidos_com_itens}`);
    console.log(`   Sem itens: ${data.pedidos_sem_itens}`);
    console.log(`   Percentual com itens: ${((data.pedidos_com_itens / data.total_pedidos) * 100).toFixed(1)}%`);

    // Verificar alguns pedidos com itens
    const sampleOrders = await client.query(`
      SELECT 
        pedido_id, numero, nome_cliente, situacao, valor_total,
        jsonb_array_length(itens_json) as quantidade_itens,
        itens_json
      FROM pedidos 
      WHERE itens_json IS NOT NULL 
        AND jsonb_array_length(itens_json) > 0
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`\n📦 Exemplos de pedidos com itens (${sampleOrders.rows.length} mostrados):`);
    
    sampleOrders.rows.forEach((pedido, index) => {
      console.log(`\n${index + 1}. Pedido ${pedido.numero} - ${pedido.nome_cliente}`);
      console.log(`   Situação: ${pedido.situacao}`);
      console.log(`   Valor Total: R$ ${pedido.valor_total}`);
      console.log(`   Quantidade de itens: ${pedido.quantidade_itens}`);
      
      // Mostrar alguns itens
      const itens = pedido.itens_json.slice(0, 3); // Mostrar apenas os 3 primeiros
      itens.forEach((item, itemIndex) => {
        console.log(`   Item ${itemIndex + 1}: ${item.descricao}`);
        console.log(`     Quantidade: ${item.quantidade} | Valor: R$ ${item.valor_unitario}`);
      });
      
      if (pedido.itens_json.length > 3) {
        console.log(`   ... e mais ${pedido.itens_json.length - 3} itens`);
      }
    });

    // Verificar se há pedidos sem itens
    const emptyOrders = await client.query(`
      SELECT pedido_id, numero, nome_cliente, situacao
      FROM pedidos 
      WHERE itens_json IS NULL 
         OR itens_json = '[]'::jsonb
         OR jsonb_array_length(itens_json) = 0
      LIMIT 5
    `);

    if (emptyOrders.rows.length > 0) {
      console.log(`\n⚠️  Pedidos sem itens encontrados (${emptyOrders.rows.length} mostrados):`);
      emptyOrders.rows.forEach((pedido, index) => {
        console.log(`   ${index + 1}. Pedido ${pedido.numero} - ${pedido.nome_cliente} (${pedido.situacao})`);
      });
    } else {
      console.log(`\n✅ Todos os pedidos possuem itens!`);
    }

    // Estatísticas por situação
    const situacaoStats = await client.query(`
      SELECT 
        situacao,
        COUNT(*) as total,
        COUNT(CASE WHEN itens_json IS NOT NULL AND jsonb_array_length(itens_json) > 0 THEN 1 END) as com_itens
      FROM pedidos
      GROUP BY situacao
      ORDER BY total DESC
    `);

    console.log(`\n📈 Estatísticas por Situação:`);
    situacaoStats.rows.forEach(stat => {
      const percentual = ((stat.com_itens / stat.total) * 100).toFixed(1);
      console.log(`   ${stat.situacao}: ${stat.com_itens}/${stat.total} (${percentual}%)`);
    });

    // Verificar estrutura de um item
    const sampleItem = await client.query(`
      SELECT itens_json 
      FROM pedidos 
      WHERE itens_json IS NOT NULL 
        AND jsonb_array_length(itens_json) > 0
      LIMIT 1
    `);

    if (sampleItem.rows.length > 0) {
      console.log(`\n🔍 Estrutura de um item de exemplo:`);
      console.log(JSON.stringify(sampleItem.rows[0].itens_json[0], null, 2));
    }

    client.release();

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Verificação de Status da Sincronização\n');
  await checkSyncStatus();
  console.log('\n✅ Verificação concluída!');
}

main();
