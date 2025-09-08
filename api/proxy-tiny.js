export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, ...queryParams } = req.query;
    
    // Verificar se o token existe
    if (!token) {
      return res.status(400).json({ error: 'Token da API Tiny não fornecido' });
    }

    // Construir URL da API Tiny
    const tinyApiUrl = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
    const url = new URL(tinyApiUrl);
    
    // Adicionar parâmetros da query
    Object.keys(queryParams).forEach(key => {
      url.searchParams.append(key, queryParams[key]);
    });
    url.searchParams.append('token', token);
    url.searchParams.append('formato', 'json');

    console.log('🔄 Proxy Vercel - Fazendo requisição para:', url.toString());

    // Fazer requisição para API Tiny
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Erro na API Tiny:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `API Tiny retornou erro: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    console.log('✅ Proxy Vercel - Resposta recebida da API Tiny:', {
      status: data.retorno?.status,
      totalPedidos: data.retorno?.pedidos?.length || 0
    });

    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Erro no proxy Vercel:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
