import React from 'react';
import { useNestjsDashboard } from '../hooks/useNestjsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Badge } from 'ui/badge';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const NestjsDashboardTest = () => {
  const { data, loading, error, lastFetched, refetch } = useNestjsDashboard();

  const getStatusIcon = (success, loading) => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success, loading) => {
    if (loading) return <span className="px-2 py-1 bg-gray-200 rounded text-xs">Carregando...</span>;
    if (success) return <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">OK</span>;
    return <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">Erro</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teste de Integração - API NestJS</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {lastFetched && (
            <span className="text-sm text-gray-500">
              Última atualização: {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro na API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overview Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Overview
              {getStatusIcon(!!data.overview, loading)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(!!data.overview, loading)}
              {data.overview && (
                <div className="text-xs text-gray-600">
                  <p>Total Pedidos: {data.overview.totalPedidos}</p>
                  <p>Pedidos Ativos: {data.overview.pedidosAtivos}</p>
                  <p>Receita: R$ {data.overview.receitaTotal?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Vendas
              {getStatusIcon(!!data.sales, loading)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(!!data.sales, loading)}
              {data.sales && (
                <div className="text-xs text-gray-600">
                  <p>Diário: R$ {data.sales.daily?.current?.toLocaleString()}</p>
                  <p>Semanal: R$ {data.sales.weekly?.current?.toLocaleString()}</p>
                  <p>Mensal: R$ {data.sales.monthly?.current?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Production Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Produção
              {getStatusIcon(!!data.production, loading)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(!!data.production, loading)}
              {data.production && (
                <div className="text-xs text-gray-600">
                  <p>WIP Total: {data.production.wip?.totalItens}</p>
                  <p>Pedidos WIP: {data.production.wip?.totalPedidos}</p>
                  <p>Em Produção: {data.production.itemsInProduction}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* After Sales Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Pós-Venda
              {getStatusIcon(!!data.afterSales, loading)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(!!data.afterSales, loading)}
              {data.afterSales && (
                <div className="text-xs text-gray-600">
                  <p>Pedidos: {data.afterSales.orders?.length}</p>
                  <p>Alertas 15d: {data.afterSales.alerts?.total15DayAlerts}</p>
                  <p>Alertas 45d: {data.afterSales.alerts?.total45DayAlerts}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Detalhados */}
      {data.overview && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Detalhados - Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(data.overview, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {data.sales && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Detalhados - Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(data.sales, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NestjsDashboardTest;
