#!/usr/bin/env node

/**
 * Script para Testar Webhook de Sincronização
 * 
 * Este script simula chamadas de webhook para testar
 * os endpoints de sincronização antes de configurar
 * serviços externos.
 * 
 * Uso: node test-webhook.js
 */

import https from 'https';
import http from 'http';

// Configurações
const config = {
  // Substitua pela URL real do seu dashboard
  baseUrl: 'https://dashboard-zeta-three-34.vercel.app',
  endpoints: {
    daily: '/api/sync',
    manual: '/api/sync-manual'
  },
  // Configurações de teste
  testConfig: {
    timeout: 30000, // 30 segundos
    retries: 3,
    delay: 2000 // 2 segundos entre tentativas
  }
};

class WebhookTester {
  constructor() {
    this.results = {
      daily: null,
      manual: null,
      errors: []
    };
  }

  /**
   * Fazer requisição HTTP/HTTPS
   */
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        method: 'GET',
        timeout: config.testConfig.timeout,
        headers: {
          'User-Agent': 'WebhookTester/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        ...options
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData,
              raw: data
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: null,
              raw: data,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Testar endpoint com retry
   */
  async testEndpoint(endpoint, name) {
    const url = `${config.baseUrl}${endpoint}`;
    console.log(`\n🧪 Testando ${name}...`);
    console.log(`📡 URL: ${url}`);

    for (let attempt = 1; attempt <= config.testConfig.retries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${config.testConfig.retries}...`);
        
        const startTime = Date.now();
        const response = await this.makeRequest(url);
        const duration = Date.now() - startTime;

        console.log(`✅ Status: ${response.statusCode}`);
        console.log(`⏱️  Tempo: ${duration}ms`);

        if (response.statusCode === 200) {
          console.log(`📊 Resposta:`, response.data);
          return {
            success: true,
            statusCode: response.statusCode,
            duration,
            data: response.data,
            attempt
          };
        } else {
          console.log(`⚠️  Status não esperado: ${response.statusCode}`);
          console.log(`📋 Resposta:`, response.raw);
        }

      } catch (error) {
        console.log(`❌ Erro na tentativa ${attempt}: ${error.message}`);
        
        if (attempt < config.testConfig.retries) {
          console.log(`⏳ Aguardando ${config.testConfig.delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, config.testConfig.delay));
        }
      }
    }

    return {
      success: false,
      error: 'Todas as tentativas falharam'
    };
  }

  /**
   * Executar todos os testes
   */
  async runTests() {
    console.log('🚀 Iniciando testes de webhook...');
    console.log(`🌐 Base URL: ${config.baseUrl}`);
    console.log(`⏱️  Timeout: ${config.testConfig.timeout}ms`);
    console.log(`🔄 Tentativas: ${config.testConfig.retries}`);

    // Testar sincronização manual (mais rápida)
    this.results.manual = await this.testEndpoint(
      config.endpoints.manual, 
      'Sincronização Manual'
    );

    // Aguardar um pouco antes do próximo teste
    console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Testar sincronização diária (mais lenta)
    this.results.daily = await this.testEndpoint(
      config.endpoints.daily, 
      'Sincronização Diária'
    );

    // Mostrar resumo
    this.showSummary();
  }

  /**
   * Mostrar resumo dos testes
   */
  showSummary() {
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));

    // Sincronização Manual
    console.log('\n🔧 Sincronização Manual:');
    if (this.results.manual?.success) {
      console.log(`   ✅ Status: Sucesso`);
      console.log(`   📊 Status Code: ${this.results.manual.statusCode}`);
      console.log(`   ⏱️  Tempo: ${this.results.manual.duration}ms`);
      console.log(`   🔄 Tentativas: ${this.results.manual.attempt}`);
      
      if (this.results.manual.data) {
        console.log(`   📈 Pedidos Processados: ${this.results.manual.data.totalProcessed || 'N/A'}`);
        console.log(`   📦 Com Itens: ${this.results.manual.data.totalWithItems || 'N/A'}`);
        console.log(`   📄 Páginas: ${this.results.manual.data.pagesProcessed || 'N/A'}`);
      }
    } else {
      console.log(`   ❌ Status: Falha`);
      console.log(`   💥 Erro: ${this.results.manual?.error || 'Desconhecido'}`);
    }

    // Sincronização Diária
    console.log('\n📅 Sincronização Diária:');
    if (this.results.daily?.success) {
      console.log(`   ✅ Status: Sucesso`);
      console.log(`   📊 Status Code: ${this.results.daily.statusCode}`);
      console.log(`   ⏱️  Tempo: ${this.results.daily.duration}ms`);
      console.log(`   🔄 Tentativas: ${this.results.daily.attempt}`);
      
      if (this.results.daily.data) {
        console.log(`   📈 Pedidos Processados: ${this.results.daily.data.totalProcessed || 'N/A'}`);
        console.log(`   📦 Com Itens: ${this.results.daily.data.totalWithItems || 'N/A'}`);
        console.log(`   📄 Páginas: ${this.results.daily.data.pagesProcessed || 'N/A'}`);
      }
    } else {
      console.log(`   ❌ Status: Falha`);
      console.log(`   💥 Erro: ${this.results.daily?.error || 'Desconhecido'}`);
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (this.results.manual?.success) {
      console.log('   ✅ Sincronização manual funcionando - pode configurar webhook externo');
    } else {
      console.log('   ⚠️  Sincronização manual com problemas - verifique a URL e deploy');
    }

    if (this.results.daily?.success) {
      console.log('   ✅ Sincronização diária funcionando - cron job ativo');
    } else {
      console.log('   ⚠️  Sincronização diária com problemas - verifique configuração do cron');
    }

    console.log('\n🔗 PRÓXIMOS PASSOS:');
    console.log('   1. Se os testes passaram, configure um webhook externo');
    console.log('   2. Use a sincronização manual para webhooks frequentes');
    console.log('   3. Monitore os logs da Vercel para acompanhar execução');
    console.log('   4. Configure alertas para falhas de sincronização');
  }
}

// Executar testes
async function main() {
  const tester = new WebhookTester();
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error('💥 Erro durante os testes:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { WebhookTester };
