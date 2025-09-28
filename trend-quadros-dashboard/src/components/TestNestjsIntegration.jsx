/**
 * Componente para testar a integração com a API NestJS
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, RefreshCw, Database, Activity } from 'lucide-react';
import { nestjsDashboardService } from '../services';

const TestNestjsIntegration = () => {
  const [tests, setTests] = useState({
    apiConnection: { status: 'pending', message: 'Testando conexão...' },
    overview: { status: 'pending', message: 'Testando overview...' },
    sales: { status: 'pending', message: 'Testando vendas...' },
    production: { status: 'pending', message: 'Testando produção...' },
    afterSales: { status: 'pending', message: 'Testando pós-venda...' },
    sync: { status: 'pending', message: 'Testando sincronização...' }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState('pending');

  const updateTest = (testName, status, message) => {
    setTests(prev => ({
      ...prev,
      [testName]: { status, message }
    }));
  };

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');

    // Reset all tests
    Object.keys(tests).forEach(testName => {
      updateTest(testName, 'pending', 'Aguardando...');
    });

    try {
      // Test 1: API Connection
      updateTest('apiConnection', 'running', 'Verificando conexão...');
      const isOnline = await nestjsDashboardService.isOnline();
      updateTest('apiConnection', isOnline ? 'success' : 'error', 
        isOnline ? 'API online' : 'API offline');

      if (!isOnline) {
        setOverallStatus('error');
        setIsRunning(false);
        return;
      }

      // Test 2: Overview
      updateTest('overview', 'running', 'Carregando overview...');
      const overviewResponse = await nestjsDashboardService.getOverview();
      updateTest('overview', overviewResponse.success ? 'success' : 'error',
        overviewResponse.success ? `Overview carregado (${overviewResponse.data?.totalPedidos || 0} pedidos)` : overviewResponse.error);

      // Test 3: Sales
      updateTest('sales', 'running', 'Carregando vendas...');
      const salesResponse = await nestjsDashboardService.getSales();
      updateTest('sales', salesResponse.success ? 'success' : 'error',
        salesResponse.success ? 'Dados de vendas carregados' : salesResponse.error);

      // Test 4: Production
      updateTest('production', 'running', 'Carregando produção...');
      const productionResponse = await nestjsDashboardService.getProduction();
      updateTest('production', productionResponse.success ? 'success' : 'error',
        productionResponse.success ? 'Dados de produção carregados' : productionResponse.error);

      // Test 5: After Sales
      updateTest('afterSales', 'running', 'Carregando pós-venda...');
      const afterSalesResponse = await nestjsDashboardService.getAfterSales();
      updateTest('afterSales', afterSalesResponse.success ? 'success' : 'error',
        afterSalesResponse.success ? 'Dados de pós-venda carregados' : afterSalesResponse.error);

      // Test 6: Sync Status
      updateTest('sync', 'running', 'Verificando sincronização...');
      const syncResponse = await nestjsDashboardService.getSyncStatus();
      updateTest('sync', syncResponse.success ? 'success' : 'error',
        syncResponse.success ? 'Status de sincronização obtido' : syncResponse.error);

      // Determine overall status
      const allTests = Object.values(tests);
      const hasErrors = allTests.some(test => test.status === 'error');
      setOverallStatus(hasErrors ? 'error' : 'success');

    } catch (error) {
      console.error('Erro durante os testes:', error);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'running':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teste de Integração NestJS</h2>
              <p className="text-gray-600">Verificando conectividade e funcionalidades da API</p>
            </div>
          </div>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Testando...' : 'Executar Testes'}</span>
          </button>
        </div>

        {/* Overall Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Status Geral</h3>
              <p className={`text-sm ${getStatusColor(overallStatus)}`}>
                {overallStatus === 'success' && 'Todos os testes passaram com sucesso!'}
                {overallStatus === 'error' && 'Alguns testes falharam. Verifique os detalhes abaixo.'}
                {overallStatus === 'running' && 'Executando testes...'}
                {overallStatus === 'pending' && 'Aguardando execução dos testes...'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {Object.entries(tests).map(([testName, test]) => (
            <motion.div
              key={testName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className={`text-sm ${getStatusColor(test.status)}`}>
                    {test.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* API Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Informações da API</h3>
          <div className="text-sm text-blue-800">
            <p><strong>URL Base:</strong> http://localhost:3001</p>
            <p><strong>Endpoints:</strong> /dashboard/overview, /dashboard/sales, /dashboard/production, /dashboard/after-sales</p>
            <p><strong>Status:</strong> {overallStatus === 'success' ? 'Conectado' : 'Desconectado'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestNestjsIntegration;
