/**
 * Script para validar dados do Supabase com base na resposta da API Tiny
 * Valida pedidos do período 15/09/2025 a 18/09/2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de referência da API Tiny
const apiData = {
  "retorno": {
    "status_processamento": "3",
    "status": "OK",
    "pagina": 1,
    "numero_paginas": 1,
    "pedidos": [
      {
        "pedido": {
          "id": "764179697",
          "numero": "100",
          "numero_ecommerce": null,
          "data_pedido": "15/09/2025",
          "data_prevista": "16/09/2025",
          "nome": "Robson Luiz",
          "valor": 496.8,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Enviado",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764657201",
          "numero": "105",
          "numero_ecommerce": null,
          "data_pedido": "15/09/2025",
          "data_prevista": "22/09/2025",
          "nome": "Bruno Santos Silva de Souza",
          "valor": 374.81,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Em aberto",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764578871",
          "numero": "102",
          "numero_ecommerce": null,
          "data_pedido": "16/09/2025",
          "data_prevista": "22/09/2025",
          "nome": "Cristiano Luis Ladik",
          "valor": 1866.48,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Em aberto",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764711135",
          "numero": "106",
          "numero_ecommerce": null,
          "data_pedido": "16/09/2025",
          "data_prevista": "22/09/2025",
          "nome": "Ramon Moser",
          "valor": 112.9,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Em aberto",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764567121",
          "numero": "101",
          "numero_ecommerce": null,
          "data_pedido": "17/09/2025",
          "data_prevista": "24/09/2025",
          "nome": "Alexandre Morais de Borba Rosa",
          "valor": 720.33,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Em aberto",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764587386",
          "numero": "103",
          "numero_ecommerce": null,
          "data_pedido": "17/09/2025",
          "data_prevista": "19/09/2025",
          "nome": "Leandro Fernandes Costa",
          "valor": 1,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Preparando envio",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      },
      {
        "pedido": {
          "id": "764653473",
          "numero": "104",
          "numero_ecommerce": null,
          "data_pedido": "17/09/2025",
          "data_prevista": "24/09/2025",
          "nome": "Victor Yuudi Suzuki",
          "valor": 214.2,
          "id_vendedor": "756611718",
          "nome_vendedor": "Junior Farias",
          "situacao": "Em aberto",
          "codigo_rastreamento": "",
          "url_rastreamento": ""
        }
      }
    ]
  }
};

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
function convertDateToISO(dateString) {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Função para buscar pedidos no Supabase
async function getSupabaseOrders() {
  try {
    console.log('🔍 Buscando pedidos no Supabase para o período 15/09/2025 a 18/09/2025...');
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('data_pedido', '2025-09-15')
      .lte('data_pedido', '2025-09-18')
      .order('data_pedido', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`📊 Encontrados ${data.length} pedidos no Supabase para o período`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos no Supabase:', error);
    return [];
  }
}

// Função para comparar dados
function compareData(apiPedido, supabasePedido) {
  const differences = [];
  
  // Mapear campos da API para Supabase
  const fieldMappings = {
    'id': 'pedido_id',
    'numero': 'numero',
    'nome': 'nome_cliente',
    'valor': 'valor_total',
    'situacao': 'situacao',
    'nome_vendedor': 'nome_vendedor',
    'data_pedido': 'data_pedido',
    'data_prevista': 'data_prevista'
  };

  // Verificar cada campo
  Object.entries(fieldMappings).forEach(([apiField, supabaseField]) => {
    const apiValue = apiPedido[apiField];
    const supabaseValue = supabasePedido[supabaseField];
    
    // Converter valores para comparação
    let expectedValue = apiValue;
    if (apiField === 'data_pedido' || apiField === 'data_prevista') {
      expectedValue = convertDateToISO(apiValue);
    }
    
    if (expectedValue !== supabaseValue) {
      differences.push({
        field: apiField,
        apiValue: apiValue,
        supabaseValue: supabaseValue,
        expected: expectedValue
      });
    }
  });

  return differences;
}

// Função principal de validação
async function validateData() {
  console.log('🚀 Iniciando validação de dados...\n');
  
  // Buscar dados do Supabase
  const supabaseOrders = await getSupabaseOrders();
  
  if (supabaseOrders.length === 0) {
    console.log('❌ Nenhum pedido encontrado no Supabase para o período especificado');
    return;
  }

  // Extrair pedidos da API
  const apiOrders = apiData.retorno.pedidos.map(item => item.pedido);
  
  console.log(`📋 Comparando ${apiOrders.length} pedidos da API com ${supabaseOrders.length} pedidos do Supabase\n`);

  // Criar mapa de pedidos do Supabase por ID
  const supabaseMap = new Map();
  supabaseOrders.forEach(order => {
    supabaseMap.set(order.pedido_id, order);
  });

  let totalDifferences = 0;
  let missingInSupabase = 0;
  let extraInSupabase = 0;

  // Verificar pedidos da API
  console.log('🔍 VALIDAÇÃO DOS PEDIDOS DA API:\n');
  apiOrders.forEach((apiPedido, index) => {
    console.log(`\n📦 Pedido ${index + 1}: ${apiPedido.numero} (ID: ${apiPedido.id})`);
    console.log(`   Cliente: ${apiPedido.nome}`);
    console.log(`   Data: ${apiPedido.data_pedido} | Prevista: ${apiPedido.data_prevista}`);
    console.log(`   Situação: ${apiPedido.situacao} | Valor: R$ ${apiPedido.valor}`);
    
    const supabasePedido = supabaseMap.get(apiPedido.id);
    
    if (!supabasePedido) {
      console.log('   ❌ PEDIDO NÃO ENCONTRADO NO SUPABASE');
      missingInSupabase++;
    } else {
      const differences = compareData(apiPedido, supabasePedido);
      
      if (differences.length === 0) {
        console.log('   ✅ DADOS CORRETOS');
      } else {
        console.log('   ⚠️ DIFERENÇAS ENCONTRADAS:');
        differences.forEach(diff => {
          console.log(`      - ${diff.field}: API="${diff.apiValue}" | Supabase="${diff.supabaseValue}" | Esperado="${diff.expected}"`);
        });
        totalDifferences += differences.length;
      }
      
      // Remover do mapa para identificar extras
      supabaseMap.delete(apiPedido.id);
    }
  });

  // Verificar pedidos extras no Supabase
  if (supabaseMap.size > 0) {
    console.log('\n🔍 PEDIDOS EXTRAS NO SUPABASE:\n');
    supabaseMap.forEach((pedido, id) => {
      console.log(`📦 Pedido Extra: ${pedido.numero} (ID: ${id})`);
      console.log(`   Cliente: ${pedido.nome_cliente}`);
      console.log(`   Data: ${pedido.data_pedido} | Prevista: ${pedido.data_prevista}`);
      console.log(`   Situação: ${pedido.situacao} | Valor: R$ ${pedido.valor_total}`);
      extraInSupabase++;
    });
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE VALIDAÇÃO');
  console.log('='.repeat(60));
  console.log(`📋 Pedidos na API: ${apiOrders.length}`);
  console.log(`📋 Pedidos no Supabase: ${supabaseOrders.length}`);
  console.log(`❌ Pedidos faltando no Supabase: ${missingInSupabase}`);
  console.log(`➕ Pedidos extras no Supabase: ${extraInSupabase}`);
  console.log(`⚠️ Total de diferenças encontradas: ${totalDifferences}`);
  
  if (missingInSupabase === 0 && extraInSupabase === 0 && totalDifferences === 0) {
    console.log('\n✅ VALIDAÇÃO CONCLUÍDA: Todos os dados estão corretos!');
  } else {
    console.log('\n❌ VALIDAÇÃO CONCLUÍDA: Foram encontradas inconsistências.');
  }
}

// Executar validação
validateData().catch(console.error);
