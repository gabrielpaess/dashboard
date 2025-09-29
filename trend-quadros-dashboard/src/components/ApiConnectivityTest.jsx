import React, { useState, useEffect } from 'react';
import { nestjsApiClient } from '../services';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const ApiConnectivityTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // Test 1: Health Check
      console.log('🔍 Testando health check...');
      const healthResponse = await fetch(`${nestjsApiClient.baseURL}/health`);
      const healthData = await healthResponse.json();
      results.health = {
        success: healthResponse.ok,
        data: healthData,
        error: healthResponse.ok ? null : `HTTP ${healthResponse.status}`
      };
    } catch (error) {
      results.health = {
        success: false,
        data: null,
        error: error.message
      };
    }

    try {
      // Test 2: Orders API
      console.log('🔍 Testando API de pedidos...');
      const ordersResponse = await nestjsApiClient.get('/orders');
      results.orders = {
        success: ordersResponse.success,
        data: ordersResponse.data,
        error: ordersResponse.success ? null : ordersResponse.error
      };
    } catch (error) {
      results.orders = {
        success: false,
        data: null,
        error: error.message
      };
    }

    try {
      // Test 3: Dashboard API
      console.log('🔍 Testando API de dashboard...');
      const dashboardResponse = await nestjsApiClient.get('/dashboard/overview');
      results.dashboard = {
        success: dashboardResponse.success,
        data: dashboardResponse.data,
        error: dashboardResponse.success ? null : dashboardResponse.error
      };
    } catch (error) {
      results.dashboard = {
        success: false,
        data: null,
        error: error.message
      };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Teste de Conectividade da API</CardTitle>
        <CardDescription>
          Verificando se o frontend consegue se comunicar com a API NestJS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? 'Testando...' : 'Executar Testes'}
          </Button>
          <div className="text-sm text-gray-600">
            API URL: {nestjsApiClient.baseURL}
          </div>
        </div>

        <div className="grid gap-4">
          {/* Health Check */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2">
              {getStatusIcon(testResults.health?.success)} Health Check
            </h3>
            <p className="text-sm text-gray-600">
              Endpoint: {nestjsApiClient.baseURL}/health
            </p>
            {testResults.health && (
              <div className="mt-2">
                <p className={`text-sm ${getStatusColor(testResults.health.success)}`}>
                  {testResults.health.success ? 'Conectado com sucesso' : testResults.health.error}
                </p>
                {testResults.health.data && (
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(testResults.health.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Orders API */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2">
              {getStatusIcon(testResults.orders?.success)} API de Pedidos
            </h3>
            <p className="text-sm text-gray-600">
              Endpoint: {nestjsApiClient.baseURL}/api/orders
            </p>
            {testResults.orders && (
              <div className="mt-2">
                <p className={`text-sm ${getStatusColor(testResults.orders.success)}`}>
                  {testResults.orders.success 
                    ? `Conectado com sucesso (${Array.isArray(testResults.orders.data) ? testResults.orders.data.length : 'N/A'} pedidos)`
                    : testResults.orders.error
                  }
                </p>
                {testResults.orders.data && Array.isArray(testResults.orders.data) && testResults.orders.data.length > 0 && (
                  <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                    <p>Primeiro pedido:</p>
                    <pre className="overflow-auto">
                      {JSON.stringify(testResults.orders.data[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dashboard API */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2">
              {getStatusIcon(testResults.dashboard?.success)} API de Dashboard
            </h3>
            <p className="text-sm text-gray-600">
              Endpoint: {nestjsApiClient.baseURL}/api/dashboard/overview
            </p>
            {testResults.dashboard && (
              <div className="mt-2">
                <p className={`text-sm ${getStatusColor(testResults.dashboard.success)}`}>
                  {testResults.dashboard.success ? 'Conectado com sucesso' : testResults.dashboard.error}
                </p>
                {testResults.dashboard.data && (
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(testResults.dashboard.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">📊 Resumo dos Testes</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Health Check:</span>
              <span className={`ml-2 ${getStatusColor(testResults.health?.success)}`}>
                {testResults.health?.success ? 'OK' : 'FALHOU'}
              </span>
            </div>
            <div>
              <span className="font-medium">Pedidos:</span>
              <span className={`ml-2 ${getStatusColor(testResults.orders?.success)}`}>
                {testResults.orders?.success ? 'OK' : 'FALHOU'}
              </span>
            </div>
            <div>
              <span className="font-medium">Dashboard:</span>
              <span className={`ml-2 ${getStatusColor(testResults.dashboard?.success)}`}>
                {testResults.dashboard?.success ? 'OK' : 'FALHOU'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiConnectivityTest;
