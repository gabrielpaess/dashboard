const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'meus_pedidos',
  user: process.env.DB_USER || 'api_user',
  password: process.env.DB_PASSWORD || 'Pontoplacas25-',
});

async function testDatabaseConnection() {
  console.log('🗄️ Testando conexão com o banco de dados...\n');

  try {
    // Teste 1: Conexão básica
    console.log('1️⃣ Testando conexão básica...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');

    // Teste 2: Verificar tabelas
    console.log('2️⃣ Verificando tabelas...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('✅ Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    console.log('');

    // Teste 3: Contar pedidos
    console.log('3️⃣ Contando pedidos...');
    const pedidosCountQuery = 'SELECT COUNT(*) as total FROM pedidos';
    const pedidosResult = await client.query(pedidosCountQuery);
    console.log(`✅ Total de pedidos: ${pedidosResult.rows[0].total}`);
    console.log('');

    // Teste 4: Verificar usuários
    console.log('4️⃣ Verificando usuários...');
    const usuariosQuery = 'SELECT id, nome, email, nivel, ativo FROM usuarios ORDER BY id';
    const usuariosResult = await client.query(usuariosQuery);
    console.log('✅ Usuários encontrados:', usuariosResult.rows.length);
    usuariosResult.rows.forEach(user => {
      console.log(`   - ${user.nome} (${user.email}) - ${user.nivel} - ${user.ativo ? 'Ativo' : 'Inativo'}`);
    });
    console.log('');

    // Teste 5: Amostra de pedidos
    console.log('5️⃣ Amostra de pedidos...');
    const sampleQuery = `
      SELECT numero, situacao, nome_cliente, valor_total, data_pedido 
      FROM pedidos 
      ORDER BY id DESC 
      LIMIT 5
    `;
    const sampleResult = await client.query(sampleQuery);
    console.log('✅ Amostra de pedidos:');
    sampleResult.rows.forEach(pedido => {
      console.log(`   - Pedido ${pedido.numero}: ${pedido.situacao} - ${pedido.nome_cliente} - R$ ${pedido.valor_total}`);
    });
    console.log('');

    // Teste 6: Estatísticas por situação
    console.log('6️⃣ Estatísticas por situação...');
    const statsQuery = `
      SELECT situacao, COUNT(*) as total, SUM(valor_total) as valor_total
      FROM pedidos 
      GROUP BY situacao 
      ORDER BY total DESC
    `;
    const statsResult = await client.query(statsQuery);
    console.log('✅ Estatísticas por situação:');
    statsResult.rows.forEach(stat => {
      console.log(`   - ${stat.situacao}: ${stat.total} pedidos - R$ ${parseFloat(stat.valor_total || 0).toFixed(2)}`);
    });
    console.log('');

    // Teste 7: Pedidos da semana atual
    console.log('7️⃣ Pedidos da semana atual...');
    const weeklyQuery = `
      SELECT situacao, COUNT(*) as total
      FROM pedidos 
      WHERE data_pedido >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY situacao 
      ORDER BY total DESC
    `;
    const weeklyResult = await client.query(weeklyQuery);
    console.log('✅ Pedidos da semana atual:');
    weeklyResult.rows.forEach(stat => {
      console.log(`   - ${stat.situacao}: ${stat.total} pedidos`);
    });
    console.log('');

    client.release();

    console.log('🎉 Todos os testes do banco passaram com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Banco: ${process.env.DB_NAME || 'meus_pedidos'}`);
    console.log(`   - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   - Porta: ${process.env.DB_PORT || 5432}`);
    console.log(`   - Usuário: ${process.env.DB_USER || 'api_user'}`);
    console.log(`   - Tabelas: ${tablesResult.rows.length} encontradas`);
    console.log(`   - Pedidos: ${pedidosResult.rows[0].total} no total`);
    console.log(`   - Usuários: ${usuariosResult.rows.length} cadastrados`);

  } catch (error) {
    console.error('❌ Erro no teste do banco:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar se o PostgreSQL está rodando');
    console.log('   2. Verificar as credenciais no arquivo .env');
    console.log('   3. Verificar se o banco "meus_pedidos" existe');
    console.log('   4. Verificar se o usuário "api_user" tem permissões');
    console.log('   5. Executar as migrações: npm run migrate');
  } finally {
    await pool.end();
  }
}

// Executar testes
testDatabaseConnection();



