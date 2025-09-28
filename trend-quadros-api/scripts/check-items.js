/**
 * Script para verificar se os itens estão sendo armazenados corretamente
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

async function checkItems() {
  console.log('🔍 Verificando itens armazenados no banco de dados...\n');

  try {
    // Conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar pedidos com itens
    const result = await client.query(`
      SELECT 
        pedido_id,
        numero,
        nome_cliente,
        situacao,
        valor_total,
        itens_json,
        created_at
      FROM pedidos 
      WHERE itens_json IS NOT NULL 
        AND jsonb_array_length(itens_json) > 0
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log(`📦 Encontrados ${result.rows.length} pedidos com itens:\n`);

    result.rows.forEach((pedido, index) => {
      console.log(`${index + 1}. Pedido ${pedido.numero} - ${pedido.nome_cliente}`);
      console.log(`   Situação: ${pedido.situacao}`);
      console.log(`   Valor Total: R$ ${pedido.valor_total}`);
      console.log(`   Itens (${pedido.itens_json.length}):`);
      
      pedido.itens_json.forEach((item, itemIndex) => {
        console.log(`     ${itemIndex + 1}. ${item.descricao || 'Sem descrição'}`);
        console.log(`        Quantidade: ${item.quantidade || 0}`);
        console.log(`        Valor Unitário: R$ ${item.valor_unitario || 0}`);
        console.log(`        Valor Total: R$ ${item.valor_total || 0}`);
        console.log(`        Unidade: ${item.unidade || 'UN'}`);
        if (item.observacoes) {
          console.log(`        Observações: ${item.observacoes}`);
        }
        console.log('');
      });
      console.log('---\n');
    });

    // Estatísticas gerais
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN itens_json IS NOT NULL AND jsonb_array_length(itens_json) > 0 THEN 1 END) as pedidos_com_itens,
        SUM(CASE WHEN itens_json IS NOT NULL THEN jsonb_array_length(itens_json) ELSE 0 END) as total_itens
      FROM pedidos
    `);

    const statsData = stats.rows[0];
    console.log('📊 Estatísticas dos Itens:');
    console.log(`   Total de pedidos: ${statsData.total_pedidos}`);
    console.log(`   Pedidos com itens: ${statsData.pedidos_com_itens}`);
    console.log(`   Total de itens: ${statsData.total_itens}`);
    console.log(`   Média de itens por pedido: ${(statsData.total_itens / statsData.total_pedidos).toFixed(2)}`);

    // Verificar estrutura dos itens
    const sampleItem = await client.query(`
      SELECT itens_json 
      FROM pedidos 
      WHERE itens_json IS NOT NULL 
        AND jsonb_array_length(itens_json) > 0
      LIMIT 1
    `);

    if (sampleItem.rows.length > 0) {
      console.log('\n🔍 Estrutura de um item de exemplo:');
      console.log(JSON.stringify(sampleItem.rows[0].itens_json[0], null, 2));
    }

    client.release();
    console.log('\n✅ Verificação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao verificar itens:', error.message);
  } finally {
    await pool.end();
  }
}

checkItems();
